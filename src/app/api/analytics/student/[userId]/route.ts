import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticate, unauthorized, requireRole } from "@/lib/api-middleware";
import { getModuleName } from "@/lib/module-names";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  const resolvedParams = await params;
  // Teacher+ can view any student, or user can view their own report
  if (!requireRole(auth.role, "teacher") && auth.id !== resolvedParams.userId)
    return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const userId = resolvedParams.userId;

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      group: true,
      course: true,
      university: true,
      avatar: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      loginCount: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get module progress
  const progressRecords = await prisma.progress.findMany({
    where: { userId },
    select: { moduleId: true, completed: true, score: true, updatedAt: true },
  });

  // Get quiz results
  const quizResults = await prisma.quizResult.findMany({
    where: { userId },
    select: {
      quizId: true,
      score: true,
      total: true,
      percentage: true,
      createdAt: true,
      updatedAt: true,
    },
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
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  // Get progress snapshots for timeline
  const snapshots = await prisma.progressSnapshot.findMany({
    where: { userId },
    select: { moduleId: true, score: true, completed: true, recordedAt: true },
    orderBy: { recordedAt: "asc" },
  });

  // Calculate KPIs
  const totalModules = 12; // Total number of modules in the system
  const modulesCompleted = progressRecords.filter((p) => p.completed).length;
  const avgQuizScore =
    quizResults.length > 0
      ? Math.round(
          (quizResults.reduce((sum, q) => sum + q.percentage, 0) /
            quizResults.length) *
            10,
        ) / 10
      : 0;
  const totalQuizAttempts = quizAttempts.length;

  // Last active days
  const progressTimestamps = progressRecords.map((p) => p.updatedAt.getTime());
  const quizTimestamps = quizResults.map((q) => q.updatedAt.getTime());
  const lastActivityDate = user.lastLoginAt
    ? new Date(
        Math.max(
          user.lastLoginAt.getTime(),
          ...(progressTimestamps.length > 0 ? progressTimestamps : [0]),
          ...(quizTimestamps.length > 0 ? quizTimestamps : [0]),
        ),
      )
    : null;
  const lastActiveDays = lastActivityDate
    ? Math.floor(
        (now.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000),
      )
    : 999;

  // Engagement score (0-100)
  const activityFactor = Math.min(
    25,
    Math.round((Math.max(0, 30 - lastActiveDays) / 30) * 25),
  );
  const completionFactor = Math.round((modulesCompleted / totalModules) * 25);
  const quizFactor = Math.round((avgQuizScore / 100) * 25);
  const attemptsFactor = Math.min(
    25,
    Math.round((totalQuizAttempts / 50) * 25),
  );
  const engagementScore =
    activityFactor + completionFactor + quizFactor + attemptsFactor;

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
  const categoryMap = new Map<
    string,
    { attempts: number; correct: number; scores: number[] }
  >();
  for (const attempt of quizAttempts) {
    if (!categoryMap.has(attempt.category)) {
      categoryMap.set(attempt.category, {
        attempts: 0,
        correct: 0,
        scores: [],
      });
    }
    const cat = categoryMap.get(attempt.category);
    if (cat) {
      cat.attempts++;
      if (attempt.correct) cat.correct++;
    }
  }
  const categoryBreakdown = Array.from(categoryMap.entries()).map(
    ([category, data]) => {
      const correctRate =
        data.attempts > 0
          ? Math.round((data.correct / data.attempts) * 1000) / 10
          : 0;
      return {
        category,
        attempts: data.attempts,
        correctRate,
        avgScore: correctRate,
      };
    },
  );

  // ─── Module Completion Timeline ───
  const moduleCompletionTimeline = progressRecords
    .filter((p) => p.completed || p.score !== null)
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .map((p) => ({
      date: p.updatedAt.toISOString().split("T")[0],
      moduleId: p.moduleId,
      score: p.score,
      completed: p.completed,
    }));

  // Also include snapshot data for more granular timeline
  const snapshotMap = new Map<
    string,
    { score: number; completed: boolean; date: string }
  >();
  for (const snap of snapshots) {
    const key = `${snap.moduleId}-${snap.recordedAt.toISOString().split("T")[0]}`;
    const existing = snapshotMap.get(key);
    if (!existing || snap.recordedAt > new Date(existing.date)) {
      snapshotMap.set(key, {
        score: snap.score,
        completed: snap.completed,
        date: snap.recordedAt.toISOString().split("T")[0],
      });
    }
  }

  // ─── Quiz Category Trajectory (weekly buckets) ───
  const allQuizAttempts = await prisma.quizAttempt.findMany({
    where: { userId },
    select: { category: true, correct: true, attemptedAt: true },
    orderBy: { attemptedAt: "asc" },
  });

  const weekBuckets = new Map<
    string,
    Map<string, { correct: number; total: number }>
  >();
  for (const attempt of allQuizAttempts) {
    const attemptDate = new Date(attempt.attemptedAt);
    const weekStart = new Date(attemptDate);
    weekStart.setDate(attemptDate.getDate() - attemptDate.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weekBuckets.has(weekKey)) {
      weekBuckets.set(weekKey, new Map());
    }
    const weekData = weekBuckets.get(weekKey);
    if (!weekData) continue;
    if (!weekData.has(attempt.category)) {
      weekData.set(attempt.category, { correct: 0, total: 0 });
    }
    const catData = weekData.get(attempt.category);
    if (catData) {
      catData.total++;
      if (attempt.correct) catData.correct++;
    }
  }

  const quizCategoryTrajectory: Array<{
    week: string;
    category: string;
    avgScore: number;
    attempts: number;
  }> = [];
  for (const [week, categories] of weekBuckets) {
    for (const [category, data] of categories) {
      quizCategoryTrajectory.push({
        week,
        category,
        avgScore: Math.round((data.correct / data.total) * 1000) / 10,
        attempts: data.total,
      });
    }
  }
  quizCategoryTrajectory.sort((a, b) => a.week.localeCompare(b.week));

  // ─── Login Activity Timeline (daily aggregation) ───
  const allLoginActivity = await prisma.loginActivity.findMany({
    where: { userId },
    select: { timestamp: true, success: true },
    orderBy: { timestamp: "asc" },
  });

  const loginDayMap = new Map<string, { total: number; success: number }>();
  for (const login of allLoginActivity) {
    const dayKey = login.timestamp.toISOString().split("T")[0];
    if (!loginDayMap.has(dayKey)) {
      loginDayMap.set(dayKey, { total: 0, success: 0 });
    }
    const dayData = loginDayMap.get(dayKey);
    if (dayData) {
      dayData.total++;
      if (login.success) dayData.success++;
    }
  }

  const loginActivityTimeline = Array.from(loginDayMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.total,
      successCount: data.success,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ─── Skills Gap Analysis ───
  // Get cohort averages for comparison (same group for meaningful comparison)
  const cohortUserIds = user.group
    ? (
        await prisma.user.findMany({
          where: { group: user.group },
          select: { id: true },
        })
      ).map((u) => u.id)
    : [];
  const allUserProgress =
    cohortUserIds.length > 0
      ? await prisma.progress.findMany({
          where: { userId: { in: cohortUserIds } },
          select: { moduleId: true, score: true, completed: true },
        })
      : [];

  const cohortModuleAverages = new Map<
    string,
    {
      totalScore: number;
      count: number;
      completedCount: number;
      totalCount: number;
    }
  >();
  for (const p of allUserProgress) {
    if (!cohortModuleAverages.has(p.moduleId)) {
      cohortModuleAverages.set(p.moduleId, {
        totalScore: 0,
        count: 0,
        completedCount: 0,
        totalCount: 0,
      });
    }
    const avg = cohortModuleAverages.get(p.moduleId);
    if (avg) {
      avg.totalCount++;
      if (p.completed) avg.completedCount++;
      if (p.score !== null) {
        avg.totalScore += p.score;
        avg.count++;
      }
    }
  }

  const studentModuleScores = new Map<string, number>();
  for (const p of progressRecords) {
    if (p.score !== null) {
      studentModuleScores.set(p.moduleId, p.score);
    }
  }

  const skillsGap = Array.from(cohortModuleAverages.entries()).map(
    ([moduleId, avg]) => {
      const cohortAvg =
        avg.count > 0 ? Math.round((avg.totalScore / avg.count) * 10) / 10 : 0;
      const studentScore = studentModuleScores.get(moduleId) ?? 0;
      const gap = Math.round((studentScore - cohortAvg) * 10) / 10;
      const severity = gap < -20 ? "high" : gap < -10 ? "medium" : "low";
      return { moduleId, studentScore, cohortAvg, gap, severity };
    },
  );

  // Category-level gap analysis (same cohort scope)
  const allQuizAttemptsForCohort =
    cohortUserIds.length > 0
      ? await prisma.quizAttempt.findMany({
          where: { userId: { in: cohortUserIds } },
          select: { category: true, correct: true },
        })
      : [];

  const cohortCategoryAverages = new Map<
    string,
    { correct: number; total: number }
  >();
  for (const a of allQuizAttemptsForCohort) {
    if (!cohortCategoryAverages.has(a.category)) {
      cohortCategoryAverages.set(a.category, { correct: 0, total: 0 });
    }
    const cat = cohortCategoryAverages.get(a.category);
    if (cat) {
      cat.total++;
      if (a.correct) cat.correct++;
    }
  }

  const studentCategoryMap = new Map<
    string,
    { correct: number; total: number }
  >();
  for (const a of quizAttempts) {
    if (!studentCategoryMap.has(a.category)) {
      studentCategoryMap.set(a.category, { correct: 0, total: 0 });
    }
    const cat = studentCategoryMap.get(a.category);
    if (cat) {
      cat.total++;
      if (a.correct) cat.correct++;
    }
  }

  // Add category gaps to skillsGap array
  for (const [category, cohortData] of cohortCategoryAverages) {
    const cohortRate =
      cohortData.total > 0
        ? Math.round((cohortData.correct / cohortData.total) * 1000) / 10
        : 0;
    const studentData = studentCategoryMap.get(category);
    const studentRate =
      studentData && studentData.total > 0
        ? Math.round((studentData.correct / studentData.total) * 1000) / 10
        : 0;
    const gap = Math.round((studentRate - cohortRate) * 10) / 10;
    const severity = gap < -20 ? "high" : gap < -10 ? "medium" : "low";
    skillsGap.push({
      moduleId: `category:${category}`,
      studentScore: studentRate,
      cohortAvg: cohortRate,
      gap,
      severity,
    });
  }

  // ─── Personalized Recommendations ───
  const recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }> = [];

  // Module-based recommendations
  for (const gap of skillsGap.filter(
    (g) => !g.moduleId.startsWith("category:"),
  )) {
    if (gap.severity === "high") {
      recommendations.push({
        type: "module",
        title: `Повторите модуль "${gap.moduleId}"`,
        description: `Ваш результат (${gap.studentScore}%) значительно ниже среднего (${gap.cohortAvg}%). Рекомендуется повторное изучение материала.`,
        priority: "high",
      });
    } else if (gap.severity === "medium" && gap.studentScore < 60) {
      recommendations.push({
        type: "module",
        title: `Закрепите модуль "${gap.moduleId}"`,
        description: `Ваш результат (${gap.studentScore}%) ниже среднего (${gap.cohortAvg}%). Рекомендуется дополнительная практика.`,
        priority: "medium",
      });
    }
  }

  // Category-based recommendations
  for (const gap of skillsGap.filter((g) =>
    g.moduleId.startsWith("category:"),
  )) {
    const category = gap.moduleId.replace("category:", "");
    if (gap.severity === "high") {
      recommendations.push({
        type: "quiz",
        title: `Изучите тему "${category}"`,
        description: `Правильных ответов: ${gap.studentScore}%, средний по группе: ${gap.cohortAvg}%. Рекомендуется повторить теорию.`,
        priority: "high",
      });
    }
  }

  // Completion-based recommendations
  if (modulesCompleted < totalModules * 0.5) {
    const remainingModules = totalModules - modulesCompleted;
    recommendations.push({
      type: "practice",
      title: "Ускорьте прохождение модулей",
      description: `Завершено ${modulesCompleted} из ${totalModules} модулей. Осталось ${remainingModules}. Рекомендуется заниматься регулярно.`,
      priority: modulesCompleted === 0 ? "high" : "medium",
    });
  }

  // Login-based recommendations
  if (lastActiveDays > 7) {
    recommendations.push({
      type: "practice",
      title: "Вернитесь к обучению",
      description: `Последняя активность была ${lastActiveDays} дней назад. Регулярные занятия улучшают усвоение материала.`,
      priority: lastActiveDays > 14 ? "high" : "medium",
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort(
    (a, b) =>
      (priorityOrder as Record<string, number>)[a.priority] -
      (priorityOrder as Record<string, number>)[b.priority],
  );

  // Activity timeline (combine login + progress + quiz events)
  const activityTimeline: Array<{
    date: string;
    type: string;
    details: string;
  }> = [];

  for (const login of loginActivity.slice(0, 20)) {
    activityTimeline.push({
      date: login.timestamp.toISOString(),
      type: "login",
      details: login.success ? "Успешный вход" : "Неудачная попытка входа",
    });
  }

  for (const snapshot of snapshots.slice(-20)) {
    activityTimeline.push({
      date: snapshot.recordedAt.toISOString(),
      type: snapshot.completed ? "module_completed" : "progress_update",
      details: `Модуль ${snapshot.moduleId}${snapshot.score !== null ? ` (${snapshot.score}%)` : ""}`,
    });
  }

  activityTimeline.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Achievements (placeholder - would need achievement system integration)
  const achievements = [
    {
      id: "first_login",
      title: "Первый вход",
      description: "Войти в систему",
      unlocked: user.loginCount > 0,
      unlockedAt: user.createdAt.toISOString(),
    },
    {
      id: "first_module",
      title: "Первый модуль",
      description: "Завершить первый модуль",
      unlocked: modulesCompleted >= 1,
      unlockedAt:
        modulesCompleted >= 1
          ? (progressRecords
              .find((p) => p.completed)
              ?.updatedAt.toISOString() ?? null)
          : null,
    },
    {
      id: "five_modules",
      title: "Пять модулей",
      description: "Завершить 5 модулей",
      unlocked: modulesCompleted >= 5,
      unlockedAt: null,
    },
    {
      id: "quiz_master",
      title: "Мастер квизов",
      description: "Набрать 90%+ во всех квизах",
      unlocked:
        quizResults.length > 0 && quizResults.every((q) => q.percentage >= 90),
      unlockedAt: null,
    },
    {
      id: "active_learner",
      title: "Активный студент",
      description: "Активность 7 дней подряд",
      unlocked: lastActiveDays <= 7,
      unlockedAt: null,
    },
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
      moduleName: getModuleName(p.moduleId),
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
    // New fields for enhanced student performance report
    moduleCompletionTimeline,
    quizCategoryTrajectory,
    loginActivityTimeline,
    skillsGap,
    recommendations,
  });
}
