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
  const promises: Promise<void>[] = [];

  // Build progress operations
  if (progress && Array.isArray(progress)) {
    for (const p of progress) {
      promises.push(
        prisma.progress.upsert({
          where: { userId_moduleId: { userId: auth.id, moduleId: p.moduleId } },
          create: {
            id: crypto.randomUUID(),
            userId: auth.id,
            moduleId: p.moduleId,
            completed: p.completed || false,
            score: p.score,
            sqlLevels: Array.isArray(p.sqlLevels) ? JSON.stringify(p.sqlLevels) : (p.sqlLevels || ''),
            xssLevels: Array.isArray(p.xssLevels) ? JSON.stringify(p.xssLevels) : (p.xssLevels || ''),
            csrfSteps: Array.isArray(p.csrfSteps) ? JSON.stringify(p.csrfSteps) : (p.csrfSteps || ''),
            csrfChallengeScores: Array.isArray(p.csrfChallengeScores) ? JSON.stringify(p.csrfChallengeScores) : (p.csrfChallengeScores || ''),
            secureCodingAnswers: Array.isArray(p.secureCodingAnswers) ? JSON.stringify(p.secureCodingAnswers) : (p.secureCodingAnswers || ''),
            secureCodingCorrectCount: p.secureCodingCorrectCount || 0,
            studiedOwaspItems: Array.isArray(p.studiedOwaspItems) ? JSON.stringify(p.studiedOwaspItems) : (p.studiedOwaspItems || ''),
            challengeScores: p.challengeScores ? JSON.stringify(p.challengeScores) : undefined,
          },
          update: {
            ...(p.completed !== undefined && { completed: p.completed }),
            ...(p.score !== undefined && { score: p.score }),
            ...(p.sqlLevels && { sqlLevels: Array.isArray(p.sqlLevels) ? JSON.stringify(p.sqlLevels) : p.sqlLevels }),
            ...(p.xssLevels && { xssLevels: Array.isArray(p.xssLevels) ? JSON.stringify(p.xssLevels) : p.xssLevels }),
            ...(p.csrfSteps && { csrfSteps: Array.isArray(p.csrfSteps) ? JSON.stringify(p.csrfSteps) : p.csrfSteps }),
            ...(p.csrfChallengeScores && { csrfChallengeScores: Array.isArray(p.csrfChallengeScores) ? JSON.stringify(p.csrfChallengeScores) : p.csrfChallengeScores }),
            ...(p.secureCodingAnswers && { secureCodingAnswers: Array.isArray(p.secureCodingAnswers) ? JSON.stringify(p.secureCodingAnswers) : p.secureCodingAnswers }),
            ...(p.secureCodingCorrectCount !== undefined && { secureCodingCorrectCount: p.secureCodingCorrectCount }),
            ...(p.studiedOwaspItems && { studiedOwaspItems: Array.isArray(p.studiedOwaspItems) ? JSON.stringify(p.studiedOwaspItems) : p.studiedOwaspItems }),
            ...(p.challengeScores !== undefined && { challengeScores: typeof p.challengeScores === 'object' ? JSON.stringify(p.challengeScores) : p.challengeScores }),
          },
        }).then(() => { results.progressSaved++; })
      );
    }
  }

  // Build quiz operations
  if (quizResults && Array.isArray(quizResults)) {
    for (const q of quizResults) {
      const percentage = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
      promises.push(
        prisma.quizResult.upsert({
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
        }).then(() => { results.quizSaved++; })
      );
    }
  }

  if (promises.length === 0) {
    return NextResponse.json({ error: 'No data to save' }, { status: 400 });
  }

  await Promise.all(promises);
  return NextResponse.json({ success: true, ...results });
}
