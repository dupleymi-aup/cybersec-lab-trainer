import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

// GET /api/progress/batch?userIds=id1,id2,id3
// Fetch progress for multiple students at once (teacher/admin only)
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const userIdsParam = searchParams.get('userIds');
  if (!userIdsParam) {
    return NextResponse.json({ error: 'userIds query parameter required' }, { status: 400 });
  }

  const userIds = userIdsParam.split(',').map(id => id.trim()).filter(Boolean);
  if (userIds.length === 0) {
    return NextResponse.json({ error: 'At least one userId required' }, { status: 400 });
  }
  if (userIds.length > 200) {
    return NextResponse.json({ error: 'Maximum 200 userIds per batch request' }, { status: 400 });
  }

  // Verify scope: teachers can only fetch students in their group
  let allowedIds = userIds;
  if (auth.role !== 'admin' && auth.group) {
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: userIds }, role: 'student' },
      select: { id: true, group: true },
    });
    allowedIds = targetUsers
      .filter(u => u.group === auth.group)
      .map(u => u.id);
  } else if (auth.role === 'admin') {
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: userIds }, role: 'student' },
      select: { id: true },
    });
    allowedIds = targetUsers.map(u => u.id);
  }

  if (allowedIds.length === 0) {
    return NextResponse.json({});
  }

  // Fetch all progress and quiz results in two PRISMA queries (not per-user)
  const [allProgress, allQuizResults] = await Promise.all([
    prisma.progress.findMany({
      where: { userId: { in: allowedIds } },
    }),
    prisma.quizResult.findMany({
      where: { userId: { in: allowedIds } },
    }),
  ]);

  // Group results by userId
  const result: Record<string, {
    progress: Array<{
      moduleId: string;
      completed: boolean;
      score: number | null;
      sqlLevels: string | null;
      xssLevels: string | null;
      csrfSteps: string | null;
      secureCodingAnswers: string | null;
      secureCodingCorrectCount: number;
      studiedOwaspItems: string | null;
      challengeScores: string | null;
      updatedAt: string;
    }>;
    quizResults: Array<{
      quizId: string;
      score: number;
      total: number;
      percentage: number;
      updatedAt: string;
    }>;
  }> = {};

  for (const id of allowedIds) {
    result[id] = { progress: [], quizResults: [] };
  }

  for (const p of allProgress) {
    if (result[p.userId]) {
      result[p.userId].progress.push({
        moduleId: p.moduleId,
        completed: p.completed,
        score: p.score,
        sqlLevels: p.sqlLevels,
        xssLevels: p.xssLevels,
        csrfSteps: p.csrfSteps,
        secureCodingAnswers: p.secureCodingAnswers,
        secureCodingCorrectCount: p.secureCodingCorrectCount,
        studiedOwaspItems: p.studiedOwaspItems,
        challengeScores: p.challengeScores,
        updatedAt: p.updatedAt.toISOString(),
      });
    }
  }

  for (const q of allQuizResults) {
    if (result[q.userId]) {
      result[q.userId].quizResults.push({
        quizId: q.quizId,
        score: q.score,
        total: q.total,
        percentage: q.percentage,
        updatedAt: q.updatedAt.toISOString(),
      });
    }
  }

  return NextResponse.json(result);
}

// Batch save all progress for a user (used by sync)
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  const { progress, quizResults } = body;

  if (!progress && !quizResults) {
    return NextResponse.json({ error: 'No data to save' }, { status: 400 });
  }

  // Limit batch size to prevent DoS
  const MAX_BATCH_SIZE = 100;
  const progressArray = (progress && Array.isArray(progress) ? progress : []).slice(0, MAX_BATCH_SIZE);
  const quizArray = (quizResults && Array.isArray(quizResults) ? quizResults : []).slice(0, MAX_BATCH_SIZE);

  if (progressArray.length + quizArray.length === 0) {
    return NextResponse.json({ error: 'No data to save' }, { status: 400 });
  }

  // Wrap all operations in a transaction for atomicity
  const results = await prisma.$transaction(async (tx) => {
    let progressSaved = 0;
    let quizSaved = 0;

    // Save progress
    for (const p of progressArray) {
      await tx.progress.upsert({
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
      });
      progressSaved++;
    }

    // Save quiz results
    for (const q of quizArray) {
      const percentage = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
      await tx.quizResult.upsert({
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
      quizSaved++;
    }

    return { progressSaved, quizSaved };
  });

  return NextResponse.json({ success: true, ...results });
}
