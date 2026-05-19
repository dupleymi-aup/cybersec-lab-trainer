import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

// GET /api/users/[id] - get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, phone: true, fullName: true,
      group: true, course: true, university: true, avatar: true,
      bio: true, role: true, createdAt: true, lastLoginAt: true,
      loginCount: true, isBlocked: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  });
}

// PUT /api/users/[id] - update user (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { id } = await params;
  const body = await request.json();
  const { fullName, phone, group, course, university, avatar, bio, role } = body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(group !== undefined && { group }),
      ...(course !== undefined && { course }),
      ...(university !== undefined && { university }),
      ...(avatar !== undefined && { avatar }),
      ...(bio !== undefined && { bio }),
      ...(role && { role }),
    },
  });

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
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { id } = await params;
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
