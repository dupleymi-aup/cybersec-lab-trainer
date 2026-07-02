import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireCapability,
  checkRateLimit,
  getClientIp,
} from "@/lib/api-middleware";
import { validateUuid } from "@/lib/validate-uuid";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireCapability(auth, "users:change_role")) return forbidden();

  // Rate limit: 20 role changes per minute per admin
  const rateLimit = checkRateLimit(`role:${auth.id}`, 20, 60_000);
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

  // Prevent self-role-change
  if (id === auth.id) {
    return NextResponse.json(
      { error: "Нельзя изменить свою роль" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { role } = body;

  if (!role || !["student", "teacher", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      role,
      tokenVersion: { increment: 1 }, // Revoke all existing tokens
    },
  });

  // Audit log the role change
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || "Unknown",
        action: "role_change",
        targetId: id,
        targetName: user.fullName || user.email,
        details: `Admin ${auth.id} changed role to '${role}' for user ${user.email} [IP: ${ip}]`,
      },
    });
  } catch (error) {
    // Audit logging is best-effort
    if (process.env.NODE_ENV === "development") {
      console.warn("Audit logging failed:", error);
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
    },
  });
}
