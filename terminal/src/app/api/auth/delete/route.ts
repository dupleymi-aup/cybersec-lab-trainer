import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { verifyPassword } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api-error-handler';

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  // Rate limit: 3 deletion attempts per hour per user
  const rateKey = `account-delete-${auth.id}`;
  const rateResult = checkRateLimit(rateKey, 3, 3600_000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток удаления. Подождите', retryAfter: rateResult.retryAfter },
      { status: 429 }
    );
  }

  // Also rate limit by IP
  const ipRateKey = `account-delete-ip-${getClientIp(request)}`;
  const ipRateResult = checkRateLimit(ipRateKey, 5, 3600_000);
  if (!ipRateResult.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Подождите', retryAfter: ipRateResult.retryAfter },
      { status: 429 }
    );
  }

  // Require password confirmation to prevent deletion via stolen tokens
  const body = await request.json();
  const { currentPassword } = body;

  if (!currentPassword) {
    return NextResponse.json({ error: 'Требуется подтверждение пароля' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) return unauthorized();

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: auth.id } });

  return NextResponse.json({ success: true });
});
