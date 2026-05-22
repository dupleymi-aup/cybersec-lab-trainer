import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, requireRole } from '@/lib/api-middleware';

const _DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const groupId = searchParams.get('groupId');

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const userFilter: any = { role: 'student' };
  if (groupId) userFilter.group = groupId;

  const students = await prisma.user.findMany({
    where: userFilter,
    select: { id: true, fullName: true, group: true, lastLoginAt: true, loginCount: true },
  });

  const studentIds = students.map((s) => s.id);

  const loginActivities = await prisma.loginActivity.findMany({
    where: { userId: { in: studentIds }, timestamp: { gte: since } },
    select: { userId: true, success: true, ip: true, timestamp: true },
    orderBy: { timestamp: 'desc' },
  });

  // Login frequency per student
  const loginFrequency = students.map((s) => {
    const userLogins = loginActivities.filter((l) => l.userId === s.id);
    const successCount = userLogins.filter((l) => l.success).length;
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
  }).sort((a, b) => b.loginCount - a.loginCount);

  // Failed logins
  const failedMap = new Map<string, { fullName: string; count: number; recentAttempts: { timestamp: string; ip: string }[] }>();
  for (const activity of loginActivities) {
    if (!activity.success && activity.userId) {
      const student = students.find((s) => s.id === activity.userId);
      if (!student) continue;
      if (!failedMap.has(activity.userId)) {
        failedMap.set(activity.userId, { fullName: student.fullName, count: 0, recentAttempts: [] });
      }
      const entry = failedMap.get(activity.userId)!;
      entry.count++;
      if (entry.recentAttempts.length < 5) {
        entry.recentAttempts.push({ timestamp: activity.timestamp.toISOString(), ip: activity.ip });
      }
    }
  }
  const failedLogins = Array.from(failedMap.entries())
    .map(([userId, data]) => ({ userId, ...data }))
    .filter((f) => f.count >= 2)
    .sort((a, b) => b.count - a.count);

  // Dormant accounts (no login in the period)
  const activeUserIds = new Set(loginActivities.map((l) => l.userId));
  const dormantAccounts = students
    .filter((s) => !activeUserIds.has(s.id) && s.lastLoginAt)
    .map((s) => {
      const lastLogin = s.lastLoginAt!;
      const daysInactive = Math.floor((now.getTime() - lastLogin.getTime()) / (24 * 60 * 60 * 1000));
      return {
        userId: s.id,
        fullName: s.fullName,
        group: s.group,
        lastLogin: lastLogin.toISOString(),
        daysInactive,
      };
    })
    .sort((a, b) => b.daysInactive - a.daysInactive)
    .slice(0, 50);

  // Hourly distribution
  const hourlyCounts = new Array(24).fill(0);
  for (const activity of loginActivities) {
    hourlyCounts[activity.timestamp.getHours()]++;
  }
  const hourlyDistribution = hourlyCounts.map((count, hour) => ({ hour, loginCount: count }));

  // Daily distribution
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
}
