import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';

export async function PUT(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) return unauthorized();

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: auth.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ success: true });
}
