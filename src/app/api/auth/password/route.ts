import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { hashPassword, verifyPassword, validatePassword } from '@/lib/auth-utils';
import { passwordChangeSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

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
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    const user = await getPrisma().user.findUnique({ where: { id: auth.id } });
    if (!user) return unauthorized();

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json({ error: 'New password must differ from current password' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await getPrisma().user.update({
      where: { id: auth.id },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 }, // Revoke all existing tokens
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to change password', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
