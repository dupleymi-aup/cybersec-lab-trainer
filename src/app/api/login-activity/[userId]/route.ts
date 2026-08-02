import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';

// GET /api/login-activity/[userId]
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    const { userId } = await params;

    // Users can only see their own activity, teachers/admins can see any
    if (auth.id !== userId && !requireRole(auth.role, 'teacher')) {
      return forbidden();
    }

    // Teachers can only view students in their own group (admins bypass)
    if (auth.id !== userId && auth.role !== 'admin' && requireRole(auth.role, 'teacher')) {
      const targetUser = await getPrisma().user.findUnique({ where: { id: userId }, select: { group: true } });
      if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const teacher = await getPrisma().user.findUnique({ where: { id: auth.id }, select: { group: true } });
      if (!teacher || teacher.group !== targetUser.group) return forbidden();
    }

    const activities = await getPrisma().loginActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    type LoginActivityRow = { id: string; userId: string | null; email: string | null; ip: string; userAgent: string; success: boolean; timestamp: Date };
    return NextResponse.json({
      activities: activities.map((a: LoginActivityRow) => ({
        id: a.id,
        userId: a.userId,
        email: a.email,
        ip: a.ip,
        userAgent: a.userAgent,
        success: a.success,
        timestamp: a.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Login activity error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
