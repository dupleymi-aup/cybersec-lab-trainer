import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || '';
    const days = parseDays(searchParams);
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get all quiz attempts grouped by user+quiz to find retries
    const attempts = await getPrisma().quizAttempt.findMany({
      where: { attemptedAt: { gte: since } },
      select: {
        userId: true,
        quizId: true,
        correct: true,
        attemptedAt: true,
        category: true,
      },
      orderBy: { attemptedAt: 'asc' },
    });

    // Get user info
    const users = await getPrisma().user.findMany({
      select: { id: true, fullName: true, group: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const filteredUsers = new Set(users.filter((u) => !groupId || u.group === groupId).map((u) => u.id));

    // Group attempts by user+quiz to find session boundaries
    const userQuizMap = new Map<string, Map<string, Array<{ correct: boolean; attemptedAt: Date; category: string }>>>();
    for (const attempt of attempts) {
      if (!filteredUsers.has(attempt.userId)) continue;

      if (!userQuizMap.has(attempt.userId)) {
        userQuizMap.set(attempt.userId, new Map());
      }
      const userQuizzes = userQuizMap.get(attempt.userId);
      if (!userQuizzes) continue;
      if (!userQuizzes.has(attempt.quizId)) {
        userQuizzes.set(attempt.quizId, []);
      }
      const attemptList = userQuizzes.get(attempt.quizId);
      if (attemptList) {
        attemptList.push({
          correct: attempt.correct,
          attemptedAt: attempt.attemptedAt,
          category: attempt.category,
        });
      }
    }

    // Calculate retry metrics per user per quiz
    interface RetryData {
      userId: string;
      fullName: string;
      group: string;
      quizId: string;
      category: string;
      attempts: number;
      firstScore: number;
      lastScore: number;
      bestScore: number;
      improvement: number;
    }

    const retryData: RetryData[] = [];
    for (const [userId, quizzes] of userQuizMap) {
      const user = userMap.get(userId);
      if (!user) continue;

      for (const [quizId, attemptList] of quizzes) {
        const totalQuestions = attemptList.length;
        const correctCount = attemptList.filter((a) => a.correct).length;
        const score = Math.round((correctCount / totalQuestions) * 100);

        // Estimate number of quiz attempts (total questions / expected questions per quiz)
        // Assuming ~10 questions per quiz on average
        const estimatedAttempts = Math.max(1, Math.ceil(totalQuestions / 10));

        retryData.push({
          userId,
          fullName: user.fullName,
          group: user.group,
          quizId,
          category: attemptList[0]?.category || '',
          attempts: estimatedAttempts,
          firstScore: score,
          lastScore: score,
          bestScore: score,
          improvement: 0,
        });
      }
    }

    // Aggregate retry stats by quiz category
    const categoryRetryMap = new Map<
      string,
      {
        totalAttempts: number;
        uniqueQuizzes: number;
        avgAttempts: number;
        avgScore: number;
        count: number;
      }
    >();
    for (const r of retryData) {
      if (!categoryRetryMap.has(r.category)) {
        categoryRetryMap.set(r.category, {
          totalAttempts: 0,
          uniqueQuizzes: 0,
          avgAttempts: 0,
          avgScore: 0,
          count: 0,
        });
      }
      const cat = categoryRetryMap.get(r.category);
      if (cat) {
        cat.totalAttempts += r.attempts;
        cat.count++;
        cat.uniqueQuizzes++;
      }
    }

    const categoryRetryStats = Array.from(categoryRetryMap.entries())
      .map(([category, data]) => ({
        category,
        totalAttempts: data.totalAttempts,
        uniqueStudents: data.count,
        avgAttemptsPerStudent: Math.round((data.totalAttempts / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.totalAttempts - a.totalAttempts);

    // Retry distribution (how many students retry 1, 2, 3+ times)
    const userRetryCounts = new Map<string, number>();
    for (const r of retryData) {
      if (!userRetryCounts.has(r.userId)) {
        userRetryCounts.set(r.userId, 0);
      }
      const currentCount = userRetryCounts.get(r.userId) ?? 0;
      userRetryCounts.set(r.userId, currentCount + (r.attempts - 1));
    }

    const retryDistribution = [
      { range: 'No retries', count: 0 },
      { range: '1 retry', count: 0 },
      { range: '2 retries', count: 0 },
      { range: '3+ retries', count: 0 },
    ];
    for (const count of userRetryCounts.values()) {
      if (count === 0) retryDistribution[0].count++;
      else if (count === 1) retryDistribution[1].count++;
      else if (count === 2) retryDistribution[2].count++;
      else retryDistribution[3].count++;
    }

    // Top retryers (students who retry most)
    const topRetryers = Array.from(userRetryCounts.entries())
      .map(([userId, count]) => {
        const user = userMap.get(userId);
        return {
          userId,
          fullName: user?.fullName || '',
          group: user?.group || '',
          retryCount: count,
        };
      })
      .sort((a, b) => b.retryCount - a.retryCount)
      .slice(0, 15);

    // Score improvement by retry attempts
    const improvementByRetries = [
      { attempts: '1 attempt', avgScore: 0, count: 0 },
      { attempts: '2 attempts', avgScore: 0, count: 0 },
      { attempts: '3+ attempts', avgScore: 0, count: 0 },
    ];

    for (const r of retryData) {
      const idx = r.attempts === 1 ? 0 : r.attempts === 2 ? 1 : 2;
      improvementByRetries[idx].avgScore += (r.firstScore + r.lastScore) / 2;
      improvementByRetries[idx].count++;
    }
    for (const item of improvementByRetries) {
      item.avgScore = item.count > 0 ? Math.round(item.avgScore / item.count) : 0;
    }

    return NextResponse.json({
      categoryRetryStats,
      retryDistribution,
      topRetryers,
      improvementByRetries,
      totalRetries: retryData.filter((r) => r.attempts > 1).length,
      totalUniqueQuizzes: retryData.length,
    });
  } catch (error) {
    logger.error('Quiz retry error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
