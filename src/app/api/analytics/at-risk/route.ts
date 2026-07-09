import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'teacher')) return forbidden();

    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams);
    const inactivityDays = parseInt(searchParams.get('inactivityDays') || '7', 10);
    const minScore = parseInt(searchParams.get('minScore') || '50', 10);
    const minModules = parseInt(searchParams.get('minModules') || '2', 10);
    const groupId = searchParams.get('groupId');
    const userWhere = groupId ? { role: 'student' as const, group: groupId } : { role: 'student' as const };

    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const students = await getPrisma().user.findMany({
      where: userWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        group: true,
        course: true,
        university: true,
        lastLoginAt: true,
      },
    });

    const studentIds = students.map((s) => s.id);
    const totalStudents = students.length;

    const progressRecords = await getPrisma().progress.findMany({
      where: { userId: { in: studentIds } },
      select: {
        userId: true,
        moduleId: true,
        completed: true,
        score: true,
        updatedAt: true,
      },
    });

    const quizResults = await getPrisma().quizResult.findMany({
      where: { userId: { in: studentIds }, updatedAt: { gte: since } },
      select: { userId: true, percentage: true, updatedAt: true },
    });

    const quizAttempts = await getPrisma().quizAttempt.findMany({
      where: { userId: { in: studentIds }, attemptedAt: { gte: since } },
      select: { userId: true, correct: true, attemptedAt: true },
    });

    const atRiskStudents: Array<{
      userId: string;
      fullName: string;
      email: string;
      group: string;
      course: string;
      university: string;
      riskScore: number;
      reasons: string[];
      lastActiveDays: number;
      modulesCompleted: number;
      avgQuizScore: number;
      quizAttempts: number;
      trend: 'improving' | 'declining' | 'stable';
    }> = [];

    // Pre-index records by userId for O(1) lookups
    const progressByUser = new Map<string, typeof progressRecords>();
    const quizByUser = new Map<string, typeof quizResults>();
    const attemptsByUser = new Map<string, typeof quizAttempts>();

    for (const p of progressRecords) {
      if (!progressByUser.has(p.userId)) progressByUser.set(p.userId, []);
      progressByUser.get(p.userId)?.push(p);
    }
    for (const q of quizResults) {
      if (!quizByUser.has(q.userId)) quizByUser.set(q.userId, []);
      quizByUser.get(q.userId)?.push(q);
    }
    for (const q of quizAttempts) {
      if (!attemptsByUser.has(q.userId)) attemptsByUser.set(q.userId, []);
      attemptsByUser.get(q.userId)?.push(q);
    }

    for (const student of students) {
      const studentProgress = progressByUser.get(student.id) || [];
      const studentQuizResults = quizByUser.get(student.id) || [];
      const studentQuizAttempts = attemptsByUser.get(student.id) || [];

      const modulesCompleted = studentProgress.filter((p) => p.completed).length;
      const avgQuizScore =
        studentQuizResults.length > 0
          ? Math.round(
              (studentQuizResults.reduce((sum, q) => sum + q.percentage, 0) / studentQuizResults.length) * 10,
            ) / 10
          : 0;

      // Days since last activity
      const lastActivityDate = student.lastLoginAt
        ? new Date(
            Math.max(
              student.lastLoginAt.getTime(),
              ...studentProgress.map((p) => p.updatedAt.getTime()),
              ...studentQuizResults.map((q) => q.updatedAt.getTime()),
            ),
          )
        : null;
      const lastActiveDays = lastActivityDate
        ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      // Trend calculation: compare last 2 weeks vs previous 2 weeks
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const recentActivity = studentQuizResults.filter((q) => q.updatedAt >= twoWeeksAgo).length;
      const previousActivity = studentQuizResults.filter(
        (q) => q.updatedAt >= fourWeeksAgo && q.updatedAt < twoWeeksAgo,
      ).length;
      const recentScores = studentQuizResults.filter((q) => q.updatedAt >= twoWeeksAgo).map((q) => q.percentage);
      const previousScores = studentQuizResults
        .filter((q) => q.updatedAt >= fourWeeksAgo && q.updatedAt < twoWeeksAgo)
        .map((q) => q.percentage);
      const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
      const previousAvg =
        previousScores.length > 0 ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length : 0;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recentAvg > previousAvg + 5 || recentActivity > previousActivity + 2) trend = 'improving';
      else if (recentAvg < previousAvg - 5 || (recentActivity < previousActivity - 2 && previousActivity > 0))
        trend = 'declining';

      // Risk score calculation (0-100, higher = more at risk)
      let riskScore = 0;
      const reasons: string[] = [];

      // Inactivity factor (up to 35 points)
      if (lastActiveDays > inactivityDays) {
        const inactivityScore = Math.min(35, Math.round((lastActiveDays / 30) * 35));
        riskScore += inactivityScore;
        reasons.push(`Неактивен ${lastActiveDays} дн.`);
      }

      // Quiz performance factor (up to 25 points)
      if (studentQuizResults.length > 0 && avgQuizScore < minScore) {
        const scoreRisk = Math.round(((minScore - avgQuizScore) / minScore) * 25);
        riskScore += scoreRisk;
        reasons.push(`Ср. балл квизов ${avgQuizScore}%`);
      } else if (studentQuizResults.length === 0 && days > 7) {
        riskScore += 15;
        reasons.push('Нет попыток квизов');
      }

      // Module completion factor (up to 25 points)
      if (modulesCompleted < minModules) {
        const moduleRisk = Math.round(((minModules - modulesCompleted) / minModules) * 25);
        riskScore += moduleRisk;
        reasons.push(`Завершено модулей: ${modulesCompleted}`);
      }

      // Trend factor (up to 15 points)
      if (trend === 'declining') {
        riskScore += 15;
        reasons.push('Снижающийся тренд');
      }

      riskScore = Math.min(100, riskScore);

      if (riskScore >= 30) {
        atRiskStudents.push({
          userId: student.id,
          fullName: student.fullName,
          email: student.email,
          group: student.group,
          course: student.course,
          university: student.university,
          riskScore,
          reasons,
          lastActiveDays,
          modulesCompleted,
          avgQuizScore,
          quizAttempts: studentQuizAttempts.length,
          trend,
        });
      }
    }

    // Sort by risk score descending
    atRiskStudents.sort((a, b) => b.riskScore - a.riskScore);

    const criticalCount = atRiskStudents.filter((s) => s.riskScore >= 70).length;

    return NextResponse.json({
      atRiskStudents,
      summary: {
        totalStudents,
        atRiskCount: atRiskStudents.length,
        atRiskPercentage: totalStudents > 0 ? Math.round((atRiskStudents.length / totalStudents) * 10000) / 100 : 0,
        criticalCount,
      },
    });
  } catch (error) {
    console.error('At-risk students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
