import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';

// Batch save all progress for a user (used by sync)
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  const { progress, quizResults } = body;

  if (!progress && !quizResults) {
    return NextResponse.json({ error: 'No data to save' }, { status: 400 });
  }

  const results = { progressSaved: 0, quizSaved: 0 };

  // Save progress
  if (progress && Array.isArray(progress)) {
    for (const p of progress) {
      await prisma.progress.upsert({
        where: { userId_moduleId: { userId: auth.id, moduleId: p.moduleId } },
        create: {
          id: crypto.randomUUID(),
          userId: auth.id,
          moduleId: p.moduleId,
          completed: p.completed || false,
          score: p.score,
          sqlLevels: p.sqlLevels || [],
          xssLevels: p.xssLevels || [],
          csrfSteps: p.csrfSteps || [],
          secureCodingAnswers: p.secureCodingAnswers || [],
          secureCodingCorrectCount: p.secureCodingCorrectCount || 0,
          studiedOwaspItems: p.studiedOwaspItems || [],
          challengeScores: p.challengeScores,
        },
        update: {
          ...(p.completed !== undefined && { completed: p.completed }),
          ...(p.score !== undefined && { score: p.score }),
          ...(p.sqlLevels && { sqlLevels: p.sqlLevels }),
          ...(p.xssLevels && { xssLevels: p.xssLevels }),
          ...(p.csrfSteps && { csrfSteps: p.csrfSteps }),
          ...(p.secureCodingAnswers && { secureCodingAnswers: p.secureCodingAnswers }),
          ...(p.secureCodingCorrectCount !== undefined && { secureCodingCorrectCount: p.secureCodingCorrectCount }),
          ...(p.studiedOwaspItems && { studiedOwaspItems: p.studiedOwaspItems }),
          ...(p.challengeScores !== undefined && { challengeScores: p.challengeScores }),
        },
      });
      results.progressSaved++;
    }
  }

  // Save quiz results
  if (quizResults && Array.isArray(quizResults)) {
    for (const q of quizResults) {
      const percentage = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
      await prisma.quizResult.upsert({
        where: { userId_quizId: { userId: auth.id, quizId: q.quizId } },
        create: {
          id: crypto.randomUUID(),
          userId: auth.id,
          quizId: q.quizId,
          score: q.score,
          total: q.total,
          percentage,
        },
        update: {
          ...(q.score !== undefined && { score: q.score }),
          ...(q.total !== undefined && { total: q.total }),
          ...(percentage !== undefined && { percentage }),
        },
      });
      results.quizSaved++;
    }
  }

  return NextResponse.json({ success: true, ...results });
}
