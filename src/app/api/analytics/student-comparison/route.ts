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
    const userIdsParam = searchParams.get('userIds');

    if (!userIdsParam) {
      return NextResponse.json({ error: 'userIds parameter is required' }, { status: 400 });
    }

    const userIds = userIdsParam.split(',').slice(0, 4); // Max 4 students
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get user profiles
    const users = await getPrisma().user.findMany({
      where: { id: { in: userIds }, role: 'student' },
      select: {
        id: true,
        fullName: true,
        email: true,
        group: true,
        avatar: true,
        lastLoginAt: true,
      },
    });

    // Get progress for all users
    const progressRecords = await getPrisma().progress.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        moduleId: true,
        completed: true,
        score: true,
        updatedAt: true,
      },
    });

    // Get quiz results
    const quizResults = await getPrisma().quizResult.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, quizId: true, percentage: true },
    });

    // Get quiz attempts
    const quizAttempts = await getPrisma().quizAttempt.findMany({
      where: { userId: { in: userIds }, attemptedAt: { gte: since } },
      select: { userId: true, category: true, correct: true },
    });

    const totalModules = 12;

    const students = users.map((user) => {
      const userProgress = progressRecords.filter((p) => p.userId === user.id);
      const userQuizResults = quizResults.filter((q) => q.userId === user.id);
      const userQuizAttempts = quizAttempts.filter((q) => q.userId === user.id);

      const modulesCompleted = userProgress.filter((p) => p.completed).length;
      const avgQuizScore =
        userQuizResults.length > 0
          ? Math.round((userQuizResults.reduce((sum, q) => sum + q.percentage, 0) / userQuizResults.length) * 10) / 10
          : 0;
      const totalQuizAttempts = userQuizAttempts.length;

      // Last active days
      const progressTimestamps = userProgress.map((p) => p.updatedAt.getTime());
      const lastActivityDate = user.lastLoginAt
        ? new Date(Math.max(user.lastLoginAt.getTime(), ...(progressTimestamps.length > 0 ? progressTimestamps : [0])))
        : null;
      const lastActiveDays = lastActivityDate
        ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      // Engagement score
      const activityFactor = Math.min(25, Math.round((Math.max(0, 30 - lastActiveDays) / 30) * 25));
      const completionFactor = Math.round((modulesCompleted / totalModules) * 25);
      const quizFactor = Math.round((avgQuizScore / 100) * 25);
      const attemptsFactor = Math.min(25, Math.round((totalQuizAttempts / 50) * 25));
      const engagementScore = activityFactor + completionFactor + quizFactor + attemptsFactor;

      // Risk score
      let riskScore = 0;
      if (lastActiveDays > 7) riskScore += Math.min(35, Math.round((lastActiveDays / 30) * 35));
      if (userQuizResults.length > 0 && avgQuizScore < 50) riskScore += Math.round(((50 - avgQuizScore) / 50) * 25);
      else if (userQuizResults.length === 0 && days > 7) riskScore += 15;
      if (modulesCompleted < 2) riskScore += Math.round(((2 - modulesCompleted) / 2) * 25);
      riskScore = Math.min(100, riskScore);

      // Module scores
      const moduleScores: Record<string, number | null> = {};
      for (const progress of userProgress) {
        moduleScores[progress.moduleId] = progress.completed ? progress.score : null;
      }

      // Category scores
      const categoryMap = new Map<string, { correct: number; total: number }>();
      for (const attempt of userQuizAttempts) {
        if (!categoryMap.has(attempt.category)) {
          categoryMap.set(attempt.category, { correct: 0, total: 0 });
        }
        const cat = categoryMap.get(attempt.category);
        if (cat) {
          cat.total++;
          if (attempt.correct) cat.correct++;
        }
      }
      const categoryScores: Record<string, number> = {};
      for (const [category, data] of categoryMap) {
        categoryScores[category] = data.total > 0 ? Math.round((data.correct / data.total) * 1000) / 10 : 0;
      }

      return {
        id: user.id,
        fullName: user.fullName,
        group: user.group,
        avatar: user.avatar,
        modulesCompleted,
        avgQuizScore,
        totalQuizAttempts,
        lastActiveDays,
        engagementScore,
        riskScore,
        moduleScores,
        categoryScores,
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Student comparison error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
