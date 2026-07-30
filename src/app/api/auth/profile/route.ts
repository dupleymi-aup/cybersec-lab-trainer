import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { updateUserSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    const user = await getPrisma().user.findUnique({
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
  } catch (error) {
    logger.error('Failed to fetch profile', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'At least one field must be provided for update' }, { status: 400 });
    }

    const user = await getPrisma().user.update({
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
  } catch (error) {
    logger.error('Failed to update profile', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
