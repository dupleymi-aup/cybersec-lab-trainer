import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'teacher')) return forbidden();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || '';
    const days = parseDays(searchParams);
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get all incorrect quiz attempts
    const incorrectAttempts = await getPrisma().quizAttempt.findMany({
      where: { correct: false, attemptedAt: { gte: since } },
      select: {
        questionId: true,
        category: true,
        difficulty: true,
        userId: true,
        attemptedAt: true,
      },
    });

    // Get all attempts for context
    const allAttempts = await getPrisma().quizAttempt.findMany({
      where: { attemptedAt: { gte: since } },
      select: {
        questionId: true,
        category: true,
        difficulty: true,
        correct: true,
        userId: true,
        attemptedAt: true,
      },
    });

    // Get user info for group filtering
    const users = await getPrisma().user.findMany({
      select: { id: true, group: true },
    });
    const filteredUsers = new Set(users.filter((u) => !groupId || u.group === groupId).map((u) => u.id));

    // Filter attempts
    const _filteredIncorrect = incorrectAttempts.filter((a) => filteredUsers.has(a.userId));
    const filteredAll = allAttempts; // We need all for question stats

    // Calculate question-level error rates
    const questionMap = new Map<string, { total: number; incorrect: number; category: string; difficulty: string }>();
    for (const attempt of filteredAll) {
      if (!questionMap.has(attempt.questionId)) {
        questionMap.set(attempt.questionId, {
          total: 0,
          incorrect: 0,
          category: attempt.category,
          difficulty: attempt.difficulty,
        });
      }
      const q = questionMap.get(attempt.questionId);
      if (q) {
        q.total++;
        if (!attempt.correct) q.incorrect++;
      }
    }

    // Top missed questions
    const mostMissedQuestions = Array.from(questionMap.entries())
      .map(([questionId, data]) => ({
        questionId,
        category: data.category,
        difficulty: data.difficulty,
        totalAttempts: data.total,
        incorrectCount: data.incorrect,
        errorRate: data.total > 0 ? Math.round((data.incorrect / data.total) * 1000) / 10 : 0,
      }))
      .filter((q) => q.totalAttempts >= 3) // Minimum threshold
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 20);

    // Error patterns by category
    const categoryErrors = new Map<string, { total: number; incorrect: number; questions: number }>();
    for (const [, data] of questionMap) {
      if (!categoryErrors.has(data.category)) {
        categoryErrors.set(data.category, {
          total: 0,
          incorrect: 0,
          questions: 0,
        });
      }
      const cat = categoryErrors.get(data.category);
      if (cat) {
        cat.total += data.total;
        cat.incorrect += data.incorrect;
        cat.questions++;
      }
    }

    const categoryErrorRates = Array.from(categoryErrors.entries())
      .map(([category, data]) => ({
        category,
        totalAttempts: data.total,
        incorrectCount: data.incorrect,
        errorRate: data.total > 0 ? Math.round((data.incorrect / data.total) * 1000) / 10 : 0,
        uniqueQuestions: data.questions,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);

    // Error patterns by difficulty
    const difficultyErrors = new Map<string, { total: number; incorrect: number }>();
    for (const data of questionMap.values()) {
      if (!difficultyErrors.has(data.difficulty)) {
        difficultyErrors.set(data.difficulty, { total: 0, incorrect: 0 });
      }
      const d = difficultyErrors.get(data.difficulty);
      if (d) {
        d.total += data.total;
        d.incorrect += data.incorrect;
      }
    }

    const difficultyErrorRates = Array.from(difficultyErrors.entries())
      .map(([difficulty, data]) => ({
        difficulty,
        totalAttempts: data.total,
        incorrectCount: data.incorrect,
        errorRate: data.total > 0 ? Math.round((data.incorrect / data.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => a.difficulty.localeCompare(b.difficulty));

    // Error trends over time (weekly buckets)
    const weekMap = new Map<string, { total: number; incorrect: number }>();
    for (const attempt of allAttempts) {
      const attemptDate = new Date(attempt.attemptedAt);
      const weekStart = new Date(attemptDate);
      weekStart.setDate(attemptDate.getDate() - attemptDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { total: 0, incorrect: 0 });
      }
      const week = weekMap.get(weekKey);
      if (week) {
        week.total++;
        if (!attempt.correct) week.incorrect++;
      }
    }

    const errorTrends = Array.from(weekMap.entries())
      .map(([week, data]) => ({
        week,
        totalAttempts: data.total,
        incorrectCount: data.incorrect,
        errorRate: data.total > 0 ? Math.round((data.incorrect / data.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({
      mostMissedQuestions,
      categoryErrorRates,
      difficultyErrorRates,
      errorTrends,
    });
  } catch (error) {
    logger.error('Error patterns error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
