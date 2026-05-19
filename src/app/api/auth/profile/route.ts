import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: {
      id: true, email: true, phone: true, fullName: true,
      group: true, course: true, university: true, avatar: true,
      bio: true, role: true, createdAt: true, lastLoginAt: true,
      loginCount: true, isBlocked: true,
    },
  });

  if (!user) return unauthorized();

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  const { fullName, phone, group, course, university, avatar, bio } = body;

  const user = await prisma.user.update({
    where: { id: auth.id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(group !== undefined && { group }),
      ...(course !== undefined && { course }),
      ...(university !== undefined && { university }),
      ...(avatar !== undefined && { avatar }),
      ...(bio !== undefined && { bio }),
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
