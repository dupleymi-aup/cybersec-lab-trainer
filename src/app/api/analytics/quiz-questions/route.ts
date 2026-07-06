import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { quizQuestions } from '@/lib/data/quiz-data';

// Build a lookup map for question data
const questionMap = new Map(
  quizQuestions.map((q) => [
    q.id,
    {
      questionText: q.question,
      category: q.category,
      difficulty: q.difficulty,
    },
  ]),
);

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');

  // Build filter for QuizAttempt
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;

  const attempts = await prisma.quizAttempt.findMany({
    where: where as Record<string, never>,
    select: {
      questionId: true,
      correct: true,
      category: true,
      difficulty: true,
    },
  });

  // Group by questionId
  const questionStats = new Map<
    string,
    {
      totalAttempts: number;
      correctCount: number;
      category: string;
      difficulty: string;
    }
  >();

  for (const a of attempts) {
    const key = a.questionId;
    if (!questionStats.has(key)) {
      questionStats.set(key, {
        totalAttempts: 0,
        correctCount: 0,
        category: a.category,
        difficulty: a.difficulty,
      });
    }
    const stat = questionStats.get(key);
    if (stat) {
      stat.totalAttempts++;
      if (a.correct) stat.correctCount++;
    }
  }

  // Build result with question text from quiz-data.ts
  const questions = Array.from(questionStats.entries())
    .map(([questionId, stat]) => {
      const qData = questionMap.get(questionId);
      return {
        questionId,
        questionText: qData?.questionText || questionId,
        category: qData?.category || stat.category,
        difficulty: qData?.difficulty || stat.difficulty,
        totalAttempts: stat.totalAttempts,
        correctCount: stat.correctCount,
        correctRate: stat.totalAttempts > 0 ? Math.round((stat.correctCount / stat.totalAttempts) * 10000) / 100 : 0,
      };
    })
    .sort((a, b) => a.correctRate - b.correctRate); // hardest first

  return NextResponse.json({ questions });
}
