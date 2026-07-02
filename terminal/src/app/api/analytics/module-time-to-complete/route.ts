import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId') || '';
  const days = parseInt(searchParams.get('days') || '30', 10);
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Get all progress records with timestamps
  const allProgress = await prisma.progress.findMany({
    where: { updatedAt: { gte: since } },
    select: { userId: true, moduleId: true, score: true, completed: true, updatedAt: true },
  });

  // Get user info for filtering and display
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, group: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));
  const filteredUsers = new Set(
    users.filter((u) => !groupId || u.group === groupId).map((u) => u.id)
  );

  // Filter progress to only include filtered users
  const progress = allProgress.filter((p) => filteredUsers.has(p.userId));

  // Build per-user module timelines
  const userModuleTimelines = new Map<string, Map<string, Date>>();
  for (const p of progress) {
    if (!userModuleTimelines.has(p.userId)) {
      userModuleTimelines.set(p.userId, new Map());
    }
    const timeline = userModuleTimelines.get(p.userId);
    if (timeline) {
      const existingDate = timeline.get(p.moduleId);
      if (!existingDate || p.updatedAt < existingDate) {
        timeline.set(p.moduleId, p.updatedAt);
      }
    }
  }

  // Also get snapshots for more granular start dates
  const snapshots = await prisma.progressSnapshot.findMany({
    where: { userId: { in: Array.from(filteredUsers) }, recordedAt: { gte: since } },
    select: { userId: true, moduleId: true, recordedAt: true },
    orderBy: { recordedAt: 'asc' },
  });

  const userModuleStarts = new Map<string, Map<string, Date>>();
  for (const snap of snapshots) {
    if (!userModuleStarts.has(snap.userId)) {
      userModuleStarts.set(snap.userId, new Map());
    }
    const starts = userModuleStarts.get(snap.userId);
    if (starts) {
      const existingDate = starts.get(snap.moduleId);
      if (!existingDate || snap.recordedAt < existingDate) {
        starts.set(snap.moduleId, snap.recordedAt);
      }
    }
  }

  // Calculate time-to-complete per module
  const moduleTimes = new Map<string, number[]>();
  const studentSpeeds = new Map<string, { userId: string; fullName: string; group: string; times: number[] }>();

  for (const [userId, completions] of userModuleTimelines) {
    const user = userMap.get(userId);
    if (!user) continue;

    const userTimes: number[] = [];

    for (const [moduleId, completionDate] of completions) {
      const progressEntry = progress.find((p) => p.userId === userId && p.moduleId === moduleId && p.completed);
      if (!progressEntry) continue;

      const startDate = userModuleStarts.get(userId)?.get(moduleId) || completionDate;
      const hours = Math.max(0.1, (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));

      if (!moduleTimes.has(moduleId)) {
        moduleTimes.set(moduleId, []);
      }
      const times = moduleTimes.get(moduleId);
      if (times) {
        times.push(hours);
      }
      userTimes.push(hours);
    }

    if (userTimes.length > 0) {
      if (!studentSpeeds.has(userId)) {
        studentSpeeds.set(userId, { userId, fullName: user.fullName, group: user.group, times: [] });
      }
      const speed = studentSpeeds.get(userId);
      if (speed) {
        speed.times.push(...userTimes);
      }
    }
  }

  // Calculate statistics per module
  function calcStats(times: number[]) {
    if (times.length === 0) return { avg: 0, median: 0, p25: 0, p75: 0, count: 0 };
    const sorted = [...times].sort((a, b) => a - b);
    const avg = Math.round(sorted.reduce((s, t) => s + t, 0) / sorted.length * 10) / 10;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const p25 = sorted[Math.floor(sorted.length * 0.25)] || 0;
    const p75 = sorted[Math.floor(sorted.length * 0.75)] || 0;
    return {
      avg: Math.round(avg * 10) / 10,
      median: Math.round(median * 10) / 10,
      p25: Math.round(p25 * 10) / 10,
      p75: Math.round(p75 * 10) / 10,
      count: sorted.length,
    };
  }

  const moduleTimeResults = Array.from(moduleTimes.entries()).map(([moduleId, times]) => {
    const stats = calcStats(times);
    return { moduleId, moduleName: moduleId, ...stats };
  }).sort((a, b) => a.avg - b.avg);

  // Student speeds
  const studentSpeedResults = Array.from(studentSpeeds.values())
    .map((s) => ({
      userId: s.userId,
      fullName: s.fullName,
      group: s.group,
      avgHoursPerModule: Math.round(s.times.reduce((a, b) => a + b, 0) / s.times.length * 10) / 10,
      modulesCompleted: s.times.length,
    }))
    .sort((a, b) => a.avgHoursPerModule - b.avgHoursPerModule);

  // Time distribution per module (buckets: 0-2h, 2-6h, 6-12h, 12-24h, 24h+)
  const timeDistribution = moduleTimeResults.map(({ moduleId, ...rest }) => {
    const times = moduleTimes.get(moduleId) || [];
    const ranges = [
      { range: '0-2ч', min: 0, max: 2, count: 0 },
      { range: '2-6ч', min: 2, max: 6, count: 0 },
      { range: '6-12ч', min: 6, max: 12, count: 0 },
      { range: '12-24ч', min: 12, max: 24, count: 0 },
      { range: '24ч+', min: 24, max: Infinity, count: 0 },
    ];
    for (const t of times) {
      for (const r of ranges) {
        if (t >= r.min && t < r.max) {
          r.count++;
          break;
        }
      }
    }
    return { moduleId, ...rest, ranges };
  });

  return NextResponse.json({
    moduleTimes: moduleTimeResults,
    studentSpeeds: studentSpeedResults.slice(0, 20),
    timeDistribution,
  });
}
