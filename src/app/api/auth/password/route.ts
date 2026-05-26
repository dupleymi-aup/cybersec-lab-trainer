import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { hashPassword, verifyPassword, validatePassword } from '@/lib/auth-utils';
import { passwordChangeSchema } from '@/lib/validations/api';

export async function PUT(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  // Validate password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: 'Пароль не соответствует требованиям', details: passwordValidation.errors },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) return unauthorized();

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
  }

  const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
  if (isSamePassword) {
    return NextResponse.json({ error: 'Новый пароль должен отличаться от текущего' }, { status: 400 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: auth.id },
    data: {
      passwordHash: newHash,
      tokenVersion: { increment: 1 },  // Revoke all existing tokens
    },
  });

  return NextResponse.json({ success: true });
}
