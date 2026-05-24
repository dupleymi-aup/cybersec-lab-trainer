import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, checkRateLimit } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  // Rate limit: 10 quiz submissions per 5 minutes per user
  const rateKey = `quiz-submit-${auth.id}`;
  const rateResult = checkRateLimit(rateKey, 10, 5 * 60 * 1000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Подождите', retryAfter: rateResult.retryAfter },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { quizId, score, total, attempts } = body;

  // Mode 1: Save quiz result (score/total) — backward compatible
  if (quizId && score !== undefined && total !== undefined) {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const result = await prisma.quizResult.upsert({
      where: { userId_quizId: { userId: auth.id, quizId } },
      create: {
        id: crypto.randomUUID(),
        userId: auth.id,
        quizId,
        score,
        total,
        percentage,
      },
      update: { score, total, percentage },
    });

    // If attempts are also provided, save them
    if (Array.isArray(attempts) && attempts.length > 0) {
      await saveQuizAttempts(auth.id, quizId, attempts);
    }

    return NextResponse.json({ success: true, result });
  }

  // Mode 2: Save quiz attempts only (no score/total required)
  if (quizId && Array.isArray(attempts) && attempts.length > 0) {
    await saveQuizAttempts(auth.id, quizId, attempts);
    return NextResponse.json({ success: true, count: attempts.length });
  }

  return NextResponse.json({ error: 'quizId required, plus either (score+total) or (attempts array)' }, { status: 400 });
}

async function saveQuizAttempts(userId: string, quizId: string, attempts: Array<{
  questionId: string;
  difficulty: string;
  category: string;
  correct: boolean;
}>): Promise<void> {
  // Validate and sanitize attempt records
  const validAttempts = attempts
    .filter(a => a.questionId && a.difficulty && a.category && typeof a.correct === 'boolean')
    .map(a => ({
      id: crypto.randomUUID(),
      userId,
      quizId,
      questionId: a.questionId,
      difficulty: a.difficulty,
      category: a.category,
      correct: a.correct,
    }));

  if (validAttempts.length === 0) return;

  await prisma.quizAttempt.createMany({
    data: validAttempts,
  });
}
