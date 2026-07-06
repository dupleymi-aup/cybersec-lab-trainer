import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, checkRateLimit } from '@/lib/api-middleware';
import { quizCategories } from '@/lib/data';
import { quizSubmissionSchema } from '@/lib/validations/api';
import { parseBody } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  // Rate limit: 10 quiz submissions per 5 minutes per user
  const rateKey = `quiz-submit-${auth.id}`;
  const rateResult = checkRateLimit(rateKey, 10, 5 * 60 * 1000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: 'Слишком много попыток. Подождите',
        retryAfter: rateResult.retryAfter,
      },
      { status: 429 },
    );
  }

  const bodyResult = await parseBody(request);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data as Record<string, unknown>;
  const parsed = quizSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { quizId, score, total, attempts } = parsed.data;

  // Validate quizId against known quiz categories to prevent fabricated results
  const validQuizIds = quizCategories.map((c) => c.id);
  if (!validQuizIds.includes(quizId)) {
    return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
  }

  // Mode 1: Save quiz result (score/total) — backward compatible
  if (quizId && score !== undefined && total !== undefined) {
    // Validate score cannot exceed total and both must be non-negative
    if (typeof score !== 'number' || typeof total !== 'number' || score < 0 || total <= 0) {
      return NextResponse.json({ error: 'Invalid score or total' }, { status: 400 });
    }
    if (score > total) {
      return NextResponse.json({ error: 'Score cannot exceed total' }, { status: 400 });
    }

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

  return NextResponse.json(
    { error: 'quizId required, plus either (score+total) or (attempts array)' },
    { status: 400 },
  );
}

async function saveQuizAttempts(
  userId: string,
  quizId: string,
  attempts: Array<{
    questionId: string;
    difficulty: string;
    category: string;
    correct: boolean;
  }>,
): Promise<void> {
  // Validate difficulty values and category names against known values
  const validDifficulties = ['easy', 'medium', 'hard'];
  const validCategories = quizCategories.map((c) => c.name);

  // Validate and sanitize attempt records
  const validAttempts = attempts
    .filter(
      (a) =>
        a.questionId &&
        validDifficulties.includes(a.difficulty) &&
        validCategories.includes(a.category) &&
        typeof a.correct === 'boolean',
    )
    .map((a) => ({
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
