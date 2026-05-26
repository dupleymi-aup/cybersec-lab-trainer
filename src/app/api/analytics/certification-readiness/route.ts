import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { isAchievementUnlocked } from '@/lib/data/achievements-data';
import type { Prisma } from '@prisma/client';

const MODULE_IDS = ['owasp', 'sql-injection', 'xss', 'csrf', 'auth', 'secure-coding', 'tools', 'security-headers', 'idor', 'ssrf'];
const TOTAL_MODULES = MODULE_IDS.length;
const ALL_QUIZ_CATEGORIES = ['sql', 'xss', 'csrf', 'auth', 'general', 'owasp', 'coding', 'network', 'social'];
const CATEGORY_NAMES: Record<string, string> = {
  sql: 'SQL-инъекции',
  xss: 'XSS-атаки',
  csrf: 'CSRF-атаки',
  auth: 'Аутентификация',
  general: 'Общие',
  owasp: 'OWASP Top 10',
  coding: 'Безопасное кодирование',
  network: 'Сети',
  social: 'Социальная инженерия',
};

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const groupId = searchParams.get('groupId');

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const userFilter: Prisma.UserWhereInput = { role: 'student' };
  if (groupId) userFilter.group = groupId;

  const students = await prisma.user.findMany({
    where: userFilter,
    select: { id: true, fullName: true, email: true, group: true },
  });

  const studentIds = students.map((s) => s.id);

  const progress = await prisma.progress.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, moduleId: true, completed: true, score: true, sqlLevels: true, xssLevels: true, csrfSteps: true, secureCodingAnswers: true, studiedOwaspItems: true },
  });

  const quizResults = await prisma.quizResult.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, quizId: true, percentage: true },
  });

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: { in: studentIds }, attemptedAt: { gte: since } },
    select: { userId: true, category: true, correct: true },
  });

  const tierThresholds = {
    ready: 75,
    almost: 55,
    needsWork: 35,
  };

  interface CertificationStudent {
    userId: string;
    fullName: string | null;
    email: string;
    group: string | null;
    readinessScore: number;
    readinessTier: string;
    categoryReadiness: Array<{ category: string; score: number; ready: boolean }>;
    modulesCompleted: number;
    totalModules: number;
    achievements: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }

  const studentsData: CertificationStudent[] = [];

  for (const student of students) {
    const studentProgress = progress.filter((p) => p.userId === student.id);
    const studentQuizResults = quizResults.filter((q) => q.userId === student.id);
    const studentQuizAttempts = quizAttempts.filter((q) => q.userId === student.id);

    // Modules completed
    const modulesCompleted = studentProgress.filter((p) => p.completed).length;

    // Quiz category scores
    const categoryScores: Record<string, number[]> = {};
    for (const cat of ALL_QUIZ_CATEGORIES) categoryScores[cat] = [];
    for (const attempt of studentQuizAttempts) {
      if (categoryScores[attempt.category]) {
        categoryScores[attempt.category].push(attempt.correct ? 100 : 0);
      }
    }
    // Also use quizResults for categories
    for (const qr of studentQuizResults) {
      const cat = qr.quizId;
      if (categoryScores[cat] !== undefined) {
        categoryScores[cat].push(qr.percentage);
      }
    }

    // Category readiness
    const categoryReadiness = ALL_QUIZ_CATEGORIES.map((cat) => {
      const scores = categoryScores[cat];
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
      return { category: CATEGORY_NAMES[cat] || cat, score: avg, ready: avg >= 60 };
    });

    // Achievements count
    const completedModuleIds = studentProgress.filter((p) => p.completed).map((p) => p.moduleId);
    const quizState: Record<string, number> = {};
    for (const qr of studentQuizResults) {
      quizState[qr.quizId] = qr.percentage;
    }
    let achievementCount = 0;
    const achievements = ['first-steps', 'sql-master', 'xss-hunter', 'security-guard', 'auth-expert', 'code-reviewer', 'quiz-master', 'quiz-perfect', 'crypto-ninja', 'full-completion', 'csrf-shield', 'owasp-half', 'quiz-all', 'crypto-explorer', 'coding-pro', 'headers-guard', 'coding-master', 'network-ninja', 'social-engineer', 'all-headers-correct'];
    for (const achId of achievements) {
      if (isAchievementUnlocked(achId, completedModuleIds, [], quizState)) achievementCount++;
    }

    // Readiness score calculation
    const moduleScore = (modulesCompleted / TOTAL_MODULES) * 35;
    const avgCategoryScore = categoryReadiness.length > 0
      ? categoryReadiness.reduce((sum, c) => sum + c.score, 0) / categoryReadiness.length
      : 0;
    const quizScoreComponent = (avgCategoryScore / 100) * 35;
    const achievementComponent = Math.min(15, (achievementCount / 10) * 15);
    const engagementComponent = studentQuizAttempts.length > 0 ? Math.min(15, 15) : 0;

    const readinessScore = Math.round(moduleScore + quizScoreComponent + achievementComponent + engagementComponent);

    let readinessTier: 'ready' | 'almost' | 'needs-work' | 'not-ready';
    if (readinessScore >= tierThresholds.ready) readinessTier = 'ready';
    else if (readinessScore >= tierThresholds.almost) readinessTier = 'almost';
    else if (readinessScore >= tierThresholds.needsWork) readinessTier = 'needs-work';
    else readinessTier = 'not-ready';

    // Strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    for (const cat of categoryReadiness) {
      if (cat.ready) strengths.push(cat.category);
      else weaknesses.push(cat.category);
    }
    if (modulesCompleted >= TOTAL_MODULES) strengths.push('Все модули завершены');
    if (modulesCompleted < 5) weaknesses.push('Мало завершённых модулей');

    // Generate recommendations
    for (const cat of categoryReadiness) {
      if (!cat.ready) recommendations.push(`Повторите категорию "${cat.category}" (текущий балл: ${cat.score}%)`);
    }
    if (modulesCompleted < TOTAL_MODULES) recommendations.push(`Завершите оставшиеся ${TOTAL_MODULES - modulesCompleted} модулей`);
    if (recommendations.length === 0) recommendations.push('Отличная подготовка! Рекомендуется повторное прохождение квизов для закрепления');

    studentsData.push({
      userId: student.id,
      fullName: student.fullName,
      email: student.email,
      group: student.group,
      readinessScore,
      readinessTier,
      categoryReadiness,
      modulesCompleted,
      totalModules: TOTAL_MODULES,
      achievements: achievementCount,
      strengths,
      weaknesses,
      recommendations,
    });
  }

  // Sort by readiness score descending
  studentsData.sort((a, b) => b.readinessScore - a.readinessScore);

  const summary = {
    ready: studentsData.filter((s) => s.readinessTier === 'ready').length,
    almost: studentsData.filter((s) => s.readinessTier === 'almost').length,
    needsWork: studentsData.filter((s) => s.readinessTier === 'needs-work').length,
    notReady: studentsData.filter((s) => s.readinessTier === 'not-ready').length,
    avgReadinessScore: studentsData.length > 0
      ? Math.round(studentsData.reduce((sum, s) => sum + s.readinessScore, 0) / studentsData.length * 10) / 10
      : 0,
  };

  return NextResponse.json({ students: studentsData, summary });
}
