import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { verifyPassword } from '@/lib/auth-utils';
import { parseBody } from '@/lib/utils';
import { logger } from '@/lib/logger';

import { z } from 'zod';

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1).max(128),
});

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    // Rate limit: 3 deletion attempts per hour per user
    const rateKey = `account-delete-${auth.id}`;
    const rateResult = checkRateLimit(rateKey, 3, 3600_000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many deletion attempts. Please wait',
          retryAfter: rateResult.retryAfter,
        },
        { status: 429 },
      );
    }

    // Also rate limit by IP
    const ipRateKey = `account-delete-ip-${getClientIp(request)}`;
    const ipRateResult = checkRateLimit(ipRateKey, 5, 3600_000);
    if (!ipRateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please wait',
          retryAfter: ipRateResult.retryAfter,
        },
        { status: 429 },
      );
    }

    // Require password confirmation to prevent deletion via stolen tokens
    const bodyResult = await parseBody<z.infer<typeof deleteAccountSchema>>(request);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = deleteAccountSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { currentPassword } = parsed.data;

    const user = await getPrisma().user.findUnique({ where: { id: auth.id } });
    if (!user) return unauthorized();

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    await getPrisma().user.delete({ where: { id: auth.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Account deletion error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
