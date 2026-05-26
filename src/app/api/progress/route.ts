import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { syncGradesToPlatform } from '@/lib/lti-utils';
import { modules } from '@/lib/data';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const progress = await prisma.progress.findMany({
    where: { userId: auth.id },
  });

  const quizResults = await prisma.quizResult.findMany({
    where: { userId: auth.id },
  });

  const completedModules: string[] = [];
  const quizScores: Record<string, number> = {};

  for (const p of progress) {
    if (p.completed) completedModules.push(p.moduleId);
  }
  for (const q of quizResults) {
    quizScores[q.quizId] = q.percentage;
  }

  // Helper to safely parse JSON strings back to arrays
  const parseJsonField = (val: string | null): unknown => {
    if (!val) return val;
    try { return JSON.parse(val); } catch { return val; }
  };

  return NextResponse.json({
    completedModules,
    quizScores,
    progress: progress.map(p => ({
      moduleId: p.moduleId,
      completed: p.completed,
      score: p.score,
      sqlLevels: parseJsonField(p.sqlLevels),
      xssLevels: parseJsonField(p.xssLevels),
      csrfSteps: parseJsonField(p.csrfSteps),
      csrfChallengeScores: parseJsonField(p.csrfChallengeScores),
      secureCodingAnswers: parseJsonField(p.secureCodingAnswers),
      secureCodingCorrectCount: p.secureCodingCorrectCount,
      studiedOwaspItems: parseJsonField(p.studiedOwaspItems),
      challengeScores: parseJsonField(p.challengeScores),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  const { moduleId, completed, score, sqlLevels, xssLevels, csrfSteps, csrfChallengeScores, secureCodingAnswers, secureCodingCorrectCount, studiedOwaspItems, challengeScores } = body;

  if (!moduleId) {
    return NextResponse.json({ error: 'Module ID required' }, { status: 400 });
  }

  // Validate score if provided - must be between 0 and 100
  if (score !== undefined && score !== null) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 100' },
        { status: 400 }
      );
    }
  }

  const progress = await prisma.progress.upsert({
    where: { userId_moduleId: { userId: auth.id, moduleId } },
    create: {
      id: crypto.randomUUID(),
      userId: auth.id,
      moduleId,
      completed: completed || false,
      score,
      sqlLevels: sqlLevels || [],
      xssLevels: xssLevels || [],
      csrfSteps: csrfSteps || [],
      csrfChallengeScores: csrfChallengeScores || [],
      secureCodingAnswers: secureCodingAnswers || [],
      secureCodingCorrectCount: secureCodingCorrectCount || 0,
      studiedOwaspItems: studiedOwaspItems || [],
      challengeScores,
    },
    update: {
      ...(completed !== undefined && { completed }),
      ...(score !== undefined && { score }),
      ...(sqlLevels && { sqlLevels }),
      ...(xssLevels && { xssLevels }),
      ...(csrfSteps && { csrfSteps }),
      ...(csrfChallengeScores && { csrfChallengeScores }),
      ...(secureCodingAnswers && { secureCodingAnswers }),
      ...(secureCodingCorrectCount !== undefined && { secureCodingCorrectCount }),
      ...(studiedOwaspItems && { studiedOwaspItems }),
      ...(challengeScores !== undefined && { challengeScores }),
    },
  });

  // Auto-sync grades to connected LTI platforms when module is completed with a score
  if (completed && score !== undefined && score !== null) {
    const activePlatforms = await prisma.ltiPlatform.findMany({
      where: { isActive: true },
    });

    const moduleInfo = modules.find((m) => m.id === moduleId);
    const label = moduleInfo ? `${moduleInfo.title}` : `Module: ${moduleId}`;

    for (const platform of activePlatforms) {
      if (!platform.privateKey) continue;

      // Fire and forget — log the result
      syncGradesToPlatform(platform.id, auth.id, moduleId, score, 100, label)
        .then((result) => {
          if (!result.success) {
            console.error(`LTI grade sync failed for ${platform.name}: ${result.error}`);
          }
        })
        .catch((err) => {
          console.error(`LTI grade sync error for ${platform.name}:`, err);
        });
    }
  }

  return NextResponse.json({ success: true, progress, autoSync: completed && score !== undefined });
}
