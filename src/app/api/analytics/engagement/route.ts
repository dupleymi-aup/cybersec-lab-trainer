import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const groupId = searchParams.get('groupId');

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Build user filter
  const userFilter: any = { role: 'student' };
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

  const engagementScores: number[] = [];
  const streakData: Array<{ userId: string; fullName: string; streakDays: number }> = [];

  for (const student of students) {
    const studentLogins = loginActivity.filter((l) => l.userId === student.id);
    const studentProgress = progressRecords.filter((p) => p.userId === student.id);
    const studentQuizzes = quizAttempts.filter((q) => q.userId === student.id);
    const studentCompletedModules = allProgress.filter((p) => p.userId === student.id && p.completed).length;
    const studentQuizResults = allQuizResults.filter((q) => q.userId === student.id);

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

    // Engagement score
    const activityFactor = Math.min(25, Math.round((Math.max(0, 30 - lastActiveDays) / 30) * 25));
    const completionFactor = Math.round((studentCompletedModules / totalModules) * 25);
    const quizFactor = Math.round((avgQuizScore / 100) * 25);
    const attemptsFactor = Math.min(25, Math.round((studentQuizzes.length / 50) * 25));
    const engagementScore = activityFactor + completionFactor + quizFactor + attemptsFactor;

    engagementScores.push(engagementScore);

    // Calculate streak (consecutive active days)
    const uniqueDays = new Set(allDates.map((t) => new Date(t).toISOString().split('T')[0]));
    let streakDays = 0;
    let currentDate = new Date(now);
    while (uniqueDays.has(currentDate.toISOString().split('T')[0])) {
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
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

  // Engagement trend over time (daily average)
  const engagementTrend: Array<{ date: string; avgScore: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = new Date(dateStr);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayLogins = loginActivity.filter((l) => l.timestamp >= dayStart && l.timestamp < dayEnd);
    const avgScore = totalStudents > 0 ? Math.round((dayLogins.length / totalStudents) * 1000) / 10 : 0;

    engagementTrend.push({ date: dateStr, avgScore });
  }

  return NextResponse.json({
    scoreDistribution,
    hourlyActivity,
    weeklyPattern,
    streakLeaderboard,
    engagementTrend,
  });
}
