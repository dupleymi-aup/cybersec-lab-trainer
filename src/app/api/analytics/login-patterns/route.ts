import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const _DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'teacher')) return forbidden();

    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams);
    const groupId = searchParams.get('groupId');

    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const userFilter: Prisma.UserWhereInput = { role: 'student' };
    if (groupId) userFilter.group = groupId;

    const students = await getPrisma().user.findMany({
      where: userFilter,
      select: {
        id: true,
        fullName: true,
        group: true,
        lastLoginAt: true,
        loginCount: true,
      },
    });

    type StudentRow = { id: string; fullName: string; group: string; lastLoginAt: Date | null; loginCount: number };
    type LoginActivityRow = { userId: string | null; success: boolean; ip: string; timestamp: Date };

    const studentIds = students.map((s: StudentRow) => s.id);

    const loginActivities = await getPrisma().loginActivity.findMany({
      where: { userId: { in: studentIds }, timestamp: { gte: since } },
      select: { userId: true, success: true, ip: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
    });

    const loginFrequency = students
      .map((s: StudentRow) => {
        const userLogins = loginActivities.filter((l: LoginActivityRow) => l.userId === s.id);
        const successCount = userLogins.filter((l: LoginActivityRow) => l.success).length;
        const totalCount = userLogins.length;
        const lastLogin = s.lastLoginAt ? s.lastLoginAt.toISOString() : '';
        return {
          userId: s.id,
          fullName: s.fullName,
          group: s.group,
          loginCount: totalCount,
          lastLogin,
          successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 10000) / 100 : 0,
        };
      })
      .sort((a: { loginCount: number }, b: { loginCount: number }) => b.loginCount - a.loginCount);

    const failedMap = new Map<
      string,
      {
        fullName: string;
        count: number;
        recentAttempts: { timestamp: string; ip: string }[];
      }
    >();
    for (const activity of loginActivities) {
      if (!activity.success && activity.userId) {
        const student = students.find((s: StudentRow) => s.id === activity.userId);
        if (!student) continue;
        if (!failedMap.has(activity.userId)) {
          failedMap.set(activity.userId, {
            fullName: student.fullName,
            count: 0,
            recentAttempts: [],
          });
        }
        const entry = failedMap.get(activity.userId);
        if (entry) {
          entry.count++;
          if (entry.recentAttempts.length < 5) {
            entry.recentAttempts.push({
              timestamp: activity.timestamp.toISOString(),
              ip: activity.ip,
            });
          }
        }
      }
    }
    const failedLogins = Array.from(failedMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .filter((f) => f.count >= 2)
      .sort((a, b) => b.count - a.count);

    const activeUserIds = new Set(loginActivities.map((l: LoginActivityRow) => l.userId));
    const dormantAccounts = students
      .filter((s: StudentRow) => !activeUserIds.has(s.id) && s.lastLoginAt)
      .map((s: StudentRow) => {
        const lastLogin = s.lastLoginAt ?? new Date(0);
        const daysInactive = Math.floor((now.getTime() - lastLogin.getTime()) / (24 * 60 * 60 * 1000));
        return {
          userId: s.id,
          fullName: s.fullName,
          group: s.group,
          lastLogin: lastLogin.toISOString(),
          daysInactive,
        };
      })
      .sort((a: { daysInactive: number }, b: { daysInactive: number }) => b.daysInactive - a.daysInactive)
      .slice(0, 50);

    const hourlyCounts = new Array(24).fill(0);
    for (const activity of loginActivities) {
      hourlyCounts[activity.timestamp.getHours()]++;
    }
    const hourlyDistribution = hourlyCounts.map((count, hour) => ({
      hour,
      loginCount: count,
    }));

    const dailyCounts = new Map<string, number>();
    for (const activity of loginActivities) {
      const dayKey = activity.timestamp.toISOString().split('T')[0];
      dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);
    }
    const dailyDistribution = Array.from(dailyCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, loginCount: count }));

    return NextResponse.json({
      loginFrequency,
      failedLogins,
      dormantAccounts,
      hourlyDistribution,
      dailyDistribution,
    });
  } catch (error) {
    logger.error('Login patterns error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
