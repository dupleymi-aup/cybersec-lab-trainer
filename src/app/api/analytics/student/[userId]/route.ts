import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  const resolvedParams = await params;
  // Teacher+ can view any student, or user can view their own report
  if (!requireRole(auth.role, 'teacher') && auth.id !== resolvedParams.userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const userId = resolvedParams.userId;

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, fullName: true, email: true, group: true, course: true,
      university: true, avatar: true, role: true, createdAt: true,
      lastLoginAt: true, loginCount: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get module progress
  const progressRecords = await prisma.progress.findMany({
    where: { userId },
    select: { moduleId: true, completed: true, score: true, updatedAt: true },
  });

  // Get quiz results
  const quizResults = await prisma.quizResult.findMany({
    where: { userId },
    select: { quizId: true, score: true, total: true, percentage: true, createdAt: true, updatedAt: true },
  });

  // Get quiz attempts with category info
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId, attemptedAt: { gte: since } },
    select: { category: true, correct: true, attemptedAt: true },
  });

  // Get recent login activity
  const loginActivity = await prisma.loginActivity.findMany({
    where: { userId, timestamp: { gte: since } },
    select: { timestamp: true, success: true },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  // Get progress snapshots for timeline
  const snapshots = await prisma.progressSnapshot.findMany({
    where: { userId, recordedAt: { gte: since } },
    select: { moduleId: true, score: true, completed: true, recordedAt: true },
    orderBy: { recordedAt: 'asc' },
  });

  // Calculate KPIs
  const totalModules = 12; // Total number of modules in the system
  const modulesCompleted = progressRecords.filter((p) => p.completed).length;
  const avgQuizScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((sum, q) => sum + q.percentage, 0) / quizResults.length * 10) / 10
    : 0;
  const totalQuizAttempts = quizAttempts.length;

  // Last active days
  const lastActivityDate = user.lastLoginAt
    ? new Date(Math.max(
        user.lastLoginAt.getTime(),
        ...progressRecords.map((p) => p.updatedAt.getTime()),
        ...quizResults.map((q) => q.updatedAt.getTime()),
      ))
    : null;
  const lastActiveDays = lastActivityDate ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000)) : 999;

  // Engagement score (0-100)
  const activityFactor = Math.min(25, Math.round((Math.max(0, 30 - lastActiveDays) / 30) * 25));
  const completionFactor = Math.round((modulesCompleted / totalModules) * 25);
  const quizFactor = Math.round((avgQuizScore / 100) * 25);
  const attemptsFactor = Math.min(25, Math.round((totalQuizAttempts / 50) * 25));
  const engagementScore = activityFactor + completionFactor + quizFactor + attemptsFactor;

  // Risk score (reuse at-risk calculation logic)
  let riskScore = 0;
  if (lastActiveDays > 7) {
    riskScore += Math.min(35, Math.round((lastActiveDays / 30) * 35));
  }
  if (quizResults.length > 0 && avgQuizScore < 50) {
    riskScore += Math.round(((50 - avgQuizScore) / 50) * 25);
  } else if (quizResults.length === 0 && days > 7) {
    riskScore += 15;
  }
  if (modulesCompleted < 2) {
    riskScore += Math.round(((2 - modulesCompleted) / 2) * 25);
  }
  riskScore = Math.min(100, riskScore);

  // Category breakdown
  const categoryMap = new Map<string, { attempts: number; correct: number; scores: number[] }>();
  for (const attempt of quizAttempts) {
    if (!categoryMap.has(attempt.category)) {
      categoryMap.set(attempt.category, { attempts: 0, correct: 0, scores: [] });
    }
    const cat = categoryMap.get(attempt.category)!;
    cat.attempts++;
    if (attempt.correct) cat.correct++;
  }
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    attempts: data.attempts,
    correctRate: data.attempts > 0 ? Math.round((data.correct / data.attempts) * 1000) / 10 : 0,
    avgScore: 0, // Would need quiz result mapping for accurate scores
  }));

  // Activity timeline (combine login + progress + quiz events)
  const activityTimeline: Array<{ date: string; type: string; details: string }> = [];

  for (const login of loginActivity.slice(0, 20)) {
    activityTimeline.push({
      date: login.timestamp.toISOString(),
      type: 'login',
      details: login.success ? 'Успешный вход' : 'Неудачная попытка входа',
    });
  }

  for (const snapshot of snapshots.slice(-20)) {
    activityTimeline.push({
      date: snapshot.recordedAt.toISOString(),
      type: snapshot.completed ? 'module_completed' : 'progress_update',
      details: `Модуль ${snapshot.moduleId}${snapshot.score !== null ? ` (${snapshot.score}%)` : ''}`,
    });
  }

  activityTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Achievements (placeholder - would need achievement system integration)
  const achievements = [
    { id: 'first_login', title: 'Первый вход', description: 'Войти в систему', unlocked: user.loginCount > 0, unlockedAt: user.createdAt.toISOString() },
    { id: 'first_module', title: 'Первый модуль', description: 'Завершить первый модуль', unlocked: modulesCompleted >= 1, unlockedAt: modulesCompleted >= 1 ? progressRecords.find((p) => p.completed)?.updatedAt.toISOString() ?? null : null },
    { id: 'five_modules', title: 'Пять модулей', description: 'Завершить 5 модулей', unlocked: modulesCompleted >= 5, unlockedAt: null },
    { id: 'quiz_master', title: 'Мастер квизов', description: 'Набрать 90%+ во всех квизах', unlocked: quizResults.length > 0 && quizResults.every((q) => q.percentage >= 90), unlockedAt: null },
    { id: 'active_learner', title: 'Активный студент', description: 'Активность 7 дней подряд', unlocked: lastActiveDays <= 7, unlockedAt: null },
  ];

  return NextResponse.json({
    profile: user,
    kpis: {
      modulesCompleted,
      totalModules,
      avgQuizScore,
      totalQuizAttempts,
      lastActiveDays,
      engagementScore,
      riskScore,
    },
    moduleProgress: progressRecords.map((p) => ({
      moduleId: p.moduleId,
      moduleName: p.moduleId, // Would need module name lookup
      completed: p.completed,
      score: p.score,
      updatedAt: p.updatedAt.toISOString(),
    })),
    quizResults: quizResults.map((q) => ({
      quizId: q.quizId,
      score: q.score,
      total: q.total,
      percentage: q.percentage,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    })),
    categoryBreakdown,
    activityTimeline: activityTimeline.slice(0, 30),
    achievements,
  });
}
