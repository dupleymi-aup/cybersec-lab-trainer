import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { id } = await params;
  const body = await request.json();
  const { isBlocked } = body;

  if (typeof isBlocked !== 'boolean') {
    return NextResponse.json({ error: 'isBlocked must be boolean' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isBlocked },
  });

  return NextResponse.json({
    success: true,
    user: { ...user, createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() },
  });
}
