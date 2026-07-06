import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { updateUserSchema } from '@/lib/validations/api';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
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
      loginCount: true,
      isBlocked: true,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Необходимо указать хотя бы одно поле для обновления' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.id },
    data: parsed.data,
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
