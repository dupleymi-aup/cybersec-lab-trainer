import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

const CATEGORY_NAMES: Record<string, string> = {
  'sql': 'SQL Injection',
  'xss': 'XSS',
  'csrf': 'CSRF',
  'auth': 'Authentication',
  'general': 'General',
  'owasp': 'OWASP',
  'coding': 'Secure Coding',
  'network': 'Network Security',
  'social': 'Social Engineering',
};

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const categoryId = searchParams.get('categoryId');
  const groupId = searchParams.get('groupId');
  const userWhere = groupId ? { role: 'student' as const, group: groupId } : { role: 'student' as const };

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const students = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  });

  const studentIds = students.map((s) => s.id);

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: { in: studentIds },
      attemptedAt: { gte: since },
      ...(categoryId ? { category: categoryId } : {}),
    },
    select: { questionId: true, category: true, difficulty: true, correct: true, userId: true },
  });

  // Group by category
  const categoriesMap = new Map<string, typeof quizAttempts>();
  for (const attempt of quizAttempts) {
    const cat = attempt.category;
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
    const attempts = categoriesMap.get(cat);
    if (attempts) {
      attempts.push(attempt);
    }
  }

  const categories = Array.from(categoriesMap.entries()).map(([catId, attempts]) => {
    const uniqueStudents = new Set(attempts.map((a) => a.userId)).size;
    const correctCount = attempts.filter((a) => a.correct).length;
    const avgScore = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 10000) / 100 : 0;
    const passRate = attempts.length > 0
      ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 10000) / 100
      : 0;

    // Question-level stats
    const questionMap = new Map<string, typeof attempts>();
    for (const a of attempts) {
      if (!questionMap.has(a.questionId)) questionMap.set(a.questionId, []);
      const qAttempts = questionMap.get(a.questionId);
      if (qAttempts) {
        qAttempts.push(a);
      }
    }

    const questionStats = Array.from(questionMap.entries()).map(([questionId, qAttempts]) => {
      const qCorrect = qAttempts.filter((a) => a.correct).length;
      const correctRate = qAttempts.length > 0 ? Math.round((qCorrect / qAttempts.length) * 10000) / 100 : 0;
      const first = qAttempts[0];
      return {
        questionId,
        questionText: `${CATEGORY_NAMES[first.category] || first.category} — ${first.difficulty} #${questionId.slice(0, 8)}`,
        attempts: qAttempts.length,
        correctRate,
        difficulty: qAttempts[0]?.difficulty || 'medium',
      };
    });

    questionStats.sort((a, b) => a.correctRate - b.correctRate);

    return {
      categoryId: catId,
      categoryName: CATEGORY_NAMES[catId] || catId,
      totalAttempts: attempts.length,
      uniqueStudents,
      avgScore,
      passRate,
      questionStats: questionStats.slice(0, 10),
    };
  });

  categories.sort((a, b) => b.totalAttempts - a.totalAttempts);

  // Find hardest questions across all categories
  const allQuestionMap = new Map<string, { attempts: number; correct: number; category: string }>();
  for (const attempt of quizAttempts) {
    const existing = allQuestionMap.get(attempt.questionId);
    if (existing) {
      existing.attempts++;
      if (attempt.correct) existing.correct++;
    } else {
      allQuestionMap.set(attempt.questionId, { attempts: 1, correct: attempt.correct ? 1 : 0, category: attempt.category });
    }
  }

  const hardestQuestions = Array.from(allQuestionMap.entries())
    .map(([questionId, data]) => ({
      questionId,
      questionText: `${CATEGORY_NAMES[data.category] || data.category} #${questionId.slice(0, 8)}`,
      category: CATEGORY_NAMES[data.category] || data.category,
      correctRate: data.attempts > 0 ? Math.round((data.correct / data.attempts) * 10000) / 100 : 0,
      attempts: data.attempts,
    }))
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 15);

  return NextResponse.json({
    categories,
    hardestQuestions,
  });
}
