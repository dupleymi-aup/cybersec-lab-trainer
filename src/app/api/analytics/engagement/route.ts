import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const groupId = searchParams.get('groupId');

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Build user filter
  const userFilter: Prisma.UserWhereInput = { role: 'student' };
  if (groupId) userFilter.group = groupId;

  // Get students
  const students = await prisma.user.findMany({
    where: userFilter,
    select: { id: true, fullName: true },
  });

  const studentIds = students.map((s) => s.id);
  const totalStudents = students.length;

  // Get login activity for hourly patterns
  const loginActivity = await prisma.loginActivity.findMany({
    where: { userId: { in: studentIds }, timestamp: { gte: since }, success: true },
    select: { userId: true, timestamp: true },
  });

  // Get progress for activity calculation
  const progressRecords = await prisma.progress.findMany({
    where: { userId: { in: studentIds }, updatedAt: { gte: since } },
    select: { userId: true, updatedAt: true },
  });

  // Get quiz attempts
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: { in: studentIds }, attemptedAt: { gte: since } },
    select: { userId: true, attemptedAt: true },
  });

  // Calculate engagement scores for each student
  const totalModules = 12;
  const allProgress = await prisma.progress.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, completed: true },
  });

  const allQuizResults = await prisma.quizResult.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, percentage: true },
  });

  // Pre-index records by userId for O(1) lookups
  const loginByUser = new Map<string, typeof loginActivity>();
  const progressByUser = new Map<string, typeof progressRecords>();
  const attemptsByUser = new Map<string, typeof quizAttempts>();
  const completedByUser = new Map<string, number>();
  const quizResultsByUser = new Map<string, typeof allQuizResults>();

  for (const l of loginActivity) {
    if (!l.userId) continue;
    if (!loginByUser.has(l.userId)) loginByUser.set(l.userId, []);
    loginByUser.get(l.userId)!.push(l);
  }
  for (const p of progressRecords) {
    if (!progressByUser.has(p.userId)) progressByUser.set(p.userId, []);
    progressByUser.get(p.userId)!.push(p);
  }
  for (const q of quizAttempts) {
    if (!attemptsByUser.has(q.userId)) attemptsByUser.set(q.userId, []);
    attemptsByUser.get(q.userId)!.push(q);
  }
  for (const p of allProgress) {
    if (p.completed) {
      completedByUser.set(p.userId, (completedByUser.get(p.userId) || 0) + 1);
    }
  }
  for (const q of allQuizResults) {
    if (!quizResultsByUser.has(q.userId)) quizResultsByUser.set(q.userId, []);
    quizResultsByUser.get(q.userId)!.push(q);
  }

  const engagementScores: number[] = [];
  const streakData: Array<{ userId: string; fullName: string; streakDays: number }> = [];

  for (const student of students) {
    const studentLogins = loginByUser.get(student.id) || [];
    const studentProgress = progressByUser.get(student.id) || [];
    const studentQuizzes = attemptsByUser.get(student.id) || [];
    const studentCompletedModules = completedByUser.get(student.id) || 0;
    const studentQuizResults = quizResultsByUser.get(student.id) || [];

    const avgQuizScore = studentQuizResults.length > 0
      ? studentQuizResults.reduce((sum, q) => sum + q.percentage, 0) / studentQuizResults.length
      : 0;

    // Calculate last active days
    const allDates = [
      ...studentLogins.map((l) => l.timestamp.getTime()),
      ...studentProgress.map((p) => p.updatedAt.getTime()),
      ...studentQuizzes.map((q) => q.attemptedAt.getTime()),
    ];
    const lastActiveDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : null;
    const lastActiveDays = lastActiveDate ? Math.floor((now.getTime() - lastActiveDate.getTime()) / (24 * 60 * 60 * 1000)) : 999;

    // Engagement score — sum factors first, then round once to avoid accumulated errors
    const activityFactor = (Math.max(0, 30 - lastActiveDays) / 30) * 25;
    const completionFactor = (studentCompletedModules / totalModules) * 25;
    const quizFactor = (avgQuizScore / 100) * 25;
    const attemptsFactor = Math.min(25, (studentQuizzes.length / 50) * 25);
    const rawScore = activityFactor + completionFactor + quizFactor + attemptsFactor;
    const engagementScore = Math.min(100, Math.round(rawScore));

    engagementScores.push(engagementScore);

    // Calculate streak (consecutive active days)
    const uniqueDays = new Set(allDates.map((t) => new Date(t).toISOString().split('T')[0]));
    let streakDays = 0;
    let currentDate = new Date(now);
    const todayStr = currentDate.toISOString().split('T')[0];

    // If no activity today, start checking from yesterday
    if (!uniqueDays.has(todayStr)) {
      currentDate = new Date(currentDate.getTime() - 86400000);
    }

    while (uniqueDays.has(currentDate.toISOString().split('T')[0])) {
      streakDays++;
      currentDate = new Date(currentDate.getTime() - 86400000);
    }

    streakData.push({ userId: student.id, fullName: student.fullName, streakDays });
  }

  // Engagement score distribution
  const scoreDistribution = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ];

  for (const score of engagementScores) {
    if (score <= 20) scoreDistribution[0].count++;
    else if (score <= 40) scoreDistribution[1].count++;
    else if (score <= 60) scoreDistribution[2].count++;
    else if (score <= 80) scoreDistribution[3].count++;
    else scoreDistribution[4].count++;
  }

  // Hourly activity pattern
  const hourlyCounts = new Array(24).fill(0);
  for (const login of loginActivity) {
    hourlyCounts[login.timestamp.getHours()]++;
  }
  const hourlyActivity = hourlyCounts.map((count, hour) => ({ hour, count }));

  // Weekly activity pattern
  const weeklyCounts = new Array(7).fill(0);
  const weeklyActivityDates = new Array(7).fill(0).map(() => new Set<string>());

  for (const login of loginActivity) {
    const dayOfWeek = login.timestamp.getDay();
    weeklyCounts[dayOfWeek]++;
    weeklyActivityDates[dayOfWeek].add(login.timestamp.toISOString().split('T')[0]);
  }

  const weeklyPattern = weeklyCounts.map((count, day) => ({
    day,
    avgActivities: weeklyActivityDates[day].size > 0
      ? Math.round((count / weeklyActivityDates[day].size) * 10) / 10
      : 0,
  }));

  // Streak leaderboard (top 10)
  streakData.sort((a, b) => b.streakDays - a.streakDays);
  const streakLeaderboard = streakData.slice(0, 10);

  // Engagement trend over time (daily average logins per student)
  const engagementTrend: Array<{ date: string; avgLoginsPerStudent: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = new Date(dateStr);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayLogins = loginActivity.filter((l) => l.timestamp >= dayStart && l.timestamp < dayEnd);
    const avgLoginsPerStudent = totalStudents > 0 ? Math.round((dayLogins.length / totalStudents) * 1000) / 10 : 0;

    engagementTrend.push({ date: dateStr, avgLoginsPerStudent });
  }

  return NextResponse.json({
    scoreDistribution,
    hourlyActivity,
    weeklyPattern,
    streakLeaderboard,
    engagementTrend,
  });
  } catch (error) {
    console.error('Engagement analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
