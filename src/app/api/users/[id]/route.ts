import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
  checkRateLimit,
  getClientIp,
} from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { validateUuid } from "@/lib/validate-uuid";

// GET /api/users/[id] - get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "teacher")) return forbidden();

  const isAdmin = auth.role === "admin";
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      group: true,
      course: true,
      university: true,
      avatar: true,
      bio: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      ...(isAdmin && { loginCount: true, isBlocked: true }),
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  });
}

// PUT /api/users/[id] - update user (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "admin")) return forbidden();

  const { id } = await params;

  // Validate UUID format
  if (!validateUuid(id)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { fullName, phone, group, course, university, avatar, bio, role } =
    body;

  // Validate role if provided
  if (role !== undefined && !["student", "teacher", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent self-role-change
  if (id === auth.id && role !== undefined) {
    return NextResponse.json(
      { error: "Нельзя изменить свою роль через этот endpoint" },
      { status: 403 },
    );
  }

  // Validate phone format if provided
  if (phone !== undefined) {
    const { validatePhone } = await import("@/lib/auth-utils");
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: "Неверный формат телефона" },
        { status: 400 },
      );
    }
  }

  // Validate email format if provided
  if (body.email !== undefined) {
    const { validateEmail } = await import("@/lib/auth-utils");
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: "Неверный формат email" },
        { status: 400 },
      );
    }

    // Check for duplicate email
    const existing = await prisma.user.findFirst({
      where: { email: body.email, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email уже используется" },
        { status: 409 },
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(group !== undefined && { group }),
      ...(course !== undefined && { course }),
      ...(university !== undefined && { university }),
      ...(avatar !== undefined && { avatar }),
      ...(bio !== undefined && { bio }),
      ...(role !== undefined && { role }),
      ...(body.email !== undefined && { email: body.email }),
      ...(role !== undefined && { tokenVersion: { increment: 1 } }), // Revoke tokens on role change
    },
  });

  // Audit log the user update
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    const appliedFields = [
      ...(fullName !== undefined ? ["fullName"] : []),
      ...(phone !== undefined ? ["phone"] : []),
      ...(group !== undefined ? ["group"] : []),
      ...(course !== undefined ? ["course"] : []),
      ...(university !== undefined ? ["university"] : []),
      ...(avatar !== undefined ? ["avatar"] : []),
      ...(bio !== undefined ? ["bio"] : []),
      ...(role !== undefined ? ["role"] : []),
      ...(body.email !== undefined ? ["email"] : []),
    ];
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || "Unknown",
        action: "user_update",
        targetId: id,
        targetName: user.fullName || user.email,
        details: `Admin ${auth.id} updated user ${user.email}: ${appliedFields.join(", ") || "none"} [IP: ${ip}]`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("Audit logging failed", { error });
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      group: user.group,
      course: user.course,
      university: user.university,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      loginCount: user.loginCount,
      isBlocked: user.isBlocked,
    },
  });
}

// DELETE /api/users/[id] - delete user (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "admin")) return forbidden();

  // Rate limit: 10 deletions per minute per admin
  const rateLimit = checkRateLimit(`delete:${auth.id}`, 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rateLimit.retryAfter },
      { status: 429 },
    );
  }

  const { id } = await params;

  // Validate UUID format
  if (!validateUuid(id)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 },
    );
  }

  // Prevent self-deletion
  if (id === auth.id) {
    return NextResponse.json(
      { error: "Нельзя удалить свой аккаунт через этот endpoint" },
      { status: 403 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  // Audit log the deletion
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || "Unknown",
        action: "user_deleted",
        targetId: id,
        targetName: user.fullName || user.email,
        details: `Admin ${auth.id} deleted user ${user.email} (role: ${user.role}) [IP: ${ip}]`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("Audit logging failed", { error });
    }
  }

  return NextResponse.json({ success: true });
}
