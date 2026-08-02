import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized, forbidden, generateToken, getClientIp } from '@/lib/api-middleware';
import { setAuthCookie } from '@/lib/cookie-auth';
import { getPrisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    // Only admins can stop impersonation
    if (auth.role !== 'admin') {
      return forbidden('Only administrators can stop impersonation');
    }

    // Re-issue a proper JWT for the admin with current tokenVersion from DB
    const admin = await getPrisma().user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        role: true,
        group: true,
        fullName: true,
        tokenVersion: true,
        isBlocked: true,
      },
    });

    if (!admin || admin.isBlocked) {
      return unauthorized();
    }

    const token = await generateToken(admin.id, admin.role, {
      group: admin.group ?? undefined,
      fullName: admin.fullName ?? undefined,
      tokenVersion: admin.tokenVersion,
    });

    // Audit log the end of impersonation
    try {
      const ip = getClientIp(request);
      await getPrisma().auditLog.create({
        data: {
          id: crypto.randomUUID(),
          adminId: admin.id,
          adminName: admin.fullName || admin.id,
          action: 'impersonation_stop',
          targetId: admin.id,
          targetName: admin.fullName || admin.id,
          details: `Admin ${admin.fullName || admin.id} stopped impersonation [IP: ${ip}]`,
        },
      });
    } catch (auditError) {
      logger.warn('Audit logging failed during impersonation stop', { error: String(auditError) });
    }

    const response = NextResponse.json({ success: true });
    setAuthCookie(response, token);

    logger.info('Impersonation stopped', { adminId: admin.id });

    return response;
  } catch (error) {
    logger.error('Stop impersonation failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
