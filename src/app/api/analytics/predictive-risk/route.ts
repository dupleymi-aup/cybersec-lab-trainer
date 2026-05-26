import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId') || '';
  const days = parseInt(searchParams.get('days') || '30', 10);
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Get all students
  const students = await prisma.user.findMany({
    where: { role: 'student', ...(groupId ? { group: groupId } : {}) },
    select: { id: true, fullName: true, group: true, lastLoginAt: true, loginCount: true },
  });

  // Get quiz results for each student
  const quizResults = await prisma.quizResult.findMany({
    where: { userId: { in: students.map((s) => s.id) }, createdAt: { gte: since } },
    select: { userId: true, percentage: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Get progress for each student
  const progress = await prisma.progress.findMany({
    where: { userId: { in: students.map((s) => s.id) }, updatedAt: { gte: since } },
    select: { userId: true, moduleId: true, completed: true, score: true, updatedAt: true },
  });

  // Get login activity
  const logins = await prisma.loginActivity.findMany({
    where: { userId: { in: students.map((s) => s.id) }, timestamp: { gte: since } },
    select: { userId: true, timestamp: true },
    orderBy: { timestamp: 'asc' },
  });

  // Compute predictive risk for each student
  interface RiskFactor {
    name: string;
    weight: number;
    score: number; // 0-100
  }

  interface StudentRisk {
    userId: string;
    fullName: string;
    group: string;
    riskScore: number; // 0-100 (higher = more risk)
    dropoutProbability: number; // 0-1
    riskFactors: RiskFactor[];
    recommendedInterventions: string[];
    predictedDropoutWeek?: number;
  }

  const studentRisks: StudentRisk[] = [];

  for (const student of students) {
    const studentQuizzes = quizResults.filter((q) => q.userId === student.id);
    const studentProgress = progress.filter((p) => p.userId === student.id);
    const studentLogins = logins.filter((l) => l.userId === student.id);

    // Factor 1: Login frequency decay (weight: 25%)
    const expectedLogins = days / 7 * 2; // Assume 2 logins per week
    const loginRatio = studentLogins.length / Math.max(expectedLogins, 1);
    const loginScore = Math.max(0, Math.min(100, Math.round((1 - loginRatio) * 100)));

    // Factor 2: Quiz score trend (weight: 25%)
    let quizScoreTrend = 50; // neutral
    if (studentQuizzes.length >= 2) {
      const midPoint = Math.floor(studentQuizzes.length / 2);
      const firstHalf = studentQuizzes.slice(0, midPoint).reduce((s, q) => s + q.percentage, 0) / midPoint;
      const secondHalf = studentQuizzes.slice(midPoint).reduce((s, q) => s + q.percentage, 0) / (studentQuizzes.length - midPoint);
      const trend = secondHalf - firstHalf; // positive = improving, negative = declining
      quizScoreTrend = Math.max(0, Math.min(100, Math.round(50 - trend)));
    }

    // Factor 3: Module completion velocity (weight: 20%)
    const completedModules = studentProgress.filter((p) => p.completed).length;
    const totalModules = 8; // Total modules in system
    const completionRatio = completedModules / totalModules;
    const completionScore = Math.max(0, Math.min(100, Math.round((1 - completionRatio) * 100)));

    // Factor 4: Days since last activity (weight: 20%)
    const daysSinceLastLogin = student.lastLoginAt
      ? Math.floor((now.getTime() - new Date(student.lastLoginAt).getTime()) / (24 * 60 * 60 * 1000))
      : days;
    const inactivityScore = Math.min(100, Math.round((daysSinceLastLogin / days) * 100));

    // Factor 5: Quiz attempt decline (weight: 10%)
    const recentQuizzes = studentQuizzes.filter((q) => {
      const daysAgo = Math.floor((now.getTime() - q.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      return daysAgo <= days / 2;
    }).length;
    const olderQuizzes = studentQuizzes.length - recentQuizzes;
    const quizDeclineRatio = olderQuizzes > 0 ? 1 - (recentQuizzes / Math.max(olderQuizzes, 1)) : 0;
    const quizDeclineScore = Math.max(0, Math.min(100, Math.round(quizDeclineRatio * 100)));

    const riskFactors: RiskFactor[] = [
      { name: 'Снижение входов', weight: 25, score: loginScore },
      { name: 'Тренд баллов квизов', weight: 25, score: quizScoreTrend },
      { name: 'Скорость завершения модулей', weight: 20, score: completionScore },
      { name: 'Дни без активности', weight: 20, score: inactivityScore },
      { name: 'Снижение попыток квизов', weight: 10, score: quizDeclineScore },
    ];

    // Weighted risk score
    const riskScore = Math.round(
      riskFactors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0)
    );

    // Dropout probability (sigmoid mapping of risk score)
    const dropoutProbability = Math.round((1 / (1 + Math.exp(-(riskScore - 50) / 15))) * 100) / 100;

    // Recommended interventions
    const interventions: string[] = [];
    if (loginScore >= 60) interventions.push('Связаться со студентом и уточнить причины отсутствия');
    if (quizScoreTrend >= 60) interventions.push('Предложить дополнительную помощь по квизам');
    if (completionScore >= 60) interventions.push('Упростить доступ к следующим модулям');
    if (inactivityScore >= 70) interventions.push('Отправить уведомление о прогрессе');
    if (quizDeclineScore >= 60) interventions.push('Предложить повторное прохождение квизов');
    if (interventions.length === 0) interventions.push('Продолжать мониторинг');

    // Predicted dropout week (if high risk)
    let predictedDropoutWeek: number | undefined;
    if (dropoutProbability > 0.6) {
      const weeksRemaining = Math.round((1 - dropoutProbability) * 12);
      predictedDropoutWeek = Math.max(1, weeksRemaining);
    }

    studentRisks.push({
      userId: student.id,
      fullName: student.fullName,
      group: student.group,
      riskScore,
      dropoutProbability,
      riskFactors,
      recommendedInterventions: interventions,
      predictedDropoutWeek,
    });
  }

  // Sort by risk score descending
  studentRisks.sort((a, b) => b.riskScore - a.riskScore);

  // Summary stats
  const highRisk = studentRisks.filter((s) => s.riskScore >= 70).length;
  const mediumRisk = studentRisks.filter((s) => s.riskScore >= 40 && s.riskScore < 70).length;
  const lowRisk = studentRisks.filter((s) => s.riskScore < 40).length;
  const avgRisk = studentRisks.length > 0 ? Math.round(studentRisks.reduce((s, r) => s + r.riskScore, 0) / studentRisks.length) : 0;

  return NextResponse.json({
    students: studentRisks,
    summary: {
      totalStudents: students.length,
      highRisk,
      mediumRisk,
      lowRisk,
      avgRisk,
    },
  });
}
