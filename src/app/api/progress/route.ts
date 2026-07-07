import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { syncGradesToPlatform } from '@/lib/lti-utils';
import { modules } from '@/lib/data';
import { logger } from '@/lib/logger';
import { parseBody } from '@/lib/utils';

interface ProgressBody {
  moduleId: string;
  completed?: boolean;
  score?: number;
  sqlLevels?: string[] | string;
  xssLevels?: string[] | string;
  csrfSteps?: number[] | string;
  csrfChallengeScores?: number[] | string;
  secureCodingAnswers?: number[] | string;
  secureCodingCorrectCount?: number;
  studiedOwaspItems?: string[] | string;
  challengeScores?: Record<string, unknown> | string;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const progress = await getPrisma().progress.findMany({
    where: { userId: auth.id },
  });

  const quizResults = await getPrisma().quizResult.findMany({
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
    try {
      return JSON.parse(val);
    } catch (e) {
logger.warn('progress parseJsonField failed', { error: e });
      return val;
    }
  };

  return NextResponse.json({
    completedModules,
    quizScores,
    progress: progress.map((p) => ({
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

  const bodyResult = await parseBody<ProgressBody>(request);
  if (!bodyResult.ok) return bodyResult.response;
  const {
    moduleId,
    completed,
    score,
    sqlLevels,
    xssLevels,
    csrfSteps,
    csrfChallengeScores,
    secureCodingAnswers,
    secureCodingCorrectCount,
    studiedOwaspItems,
    challengeScores,
  } = bodyResult.data;

  if (!moduleId) {
    return NextResponse.json({ error: 'Module ID required' }, { status: 400 });
  }

  // Validate moduleId against known modules to prevent fake progress records
  const validModuleIds = modules.map((m) => m.id);
  if (!validModuleIds.includes(moduleId)) {
    return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 });
  }

  // Validate score if provided - must be between 0 and 100
  if (score !== undefined && score !== null) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json({ error: 'Score must be between 0 and 100' }, { status: 400 });
    }
  }

  const progress = await getPrisma().progress.upsert({
    where: { userId_moduleId: { userId: auth.id, moduleId } },
    create: {
      id: crypto.randomUUID(),
      userId: auth.id,
      moduleId,
      completed: completed || false,
      ...(score !== undefined && { score }),
      sqlLevels: Array.isArray(sqlLevels) ? JSON.stringify(sqlLevels) : sqlLevels || '',
      xssLevels: Array.isArray(xssLevels) ? JSON.stringify(xssLevels) : xssLevels || '',
      csrfSteps: Array.isArray(csrfSteps) ? JSON.stringify(csrfSteps) : csrfSteps || '',
      csrfChallengeScores: Array.isArray(csrfChallengeScores)
        ? JSON.stringify(csrfChallengeScores)
        : csrfChallengeScores || '',
      secureCodingAnswers: Array.isArray(secureCodingAnswers)
        ? JSON.stringify(secureCodingAnswers)
        : secureCodingAnswers || '',
      secureCodingCorrectCount: secureCodingCorrectCount || 0,
      studiedOwaspItems: Array.isArray(studiedOwaspItems) ? JSON.stringify(studiedOwaspItems) : studiedOwaspItems || '',
      challengeScores:
        challengeScores !== undefined
          ? typeof challengeScores === 'object'
            ? JSON.stringify(challengeScores)
            : challengeScores
          : undefined,
    },
    update: {
      ...(completed !== undefined && { completed }),
      ...(score !== undefined && { score }),
      ...(sqlLevels && {
        sqlLevels: Array.isArray(sqlLevels) ? JSON.stringify(sqlLevels) : sqlLevels,
      }),
      ...(xssLevels && {
        xssLevels: Array.isArray(xssLevels) ? JSON.stringify(xssLevels) : xssLevels,
      }),
      ...(csrfSteps && {
        csrfSteps: Array.isArray(csrfSteps) ? JSON.stringify(csrfSteps) : csrfSteps,
      }),
      ...(csrfChallengeScores && {
        csrfChallengeScores: Array.isArray(csrfChallengeScores)
          ? JSON.stringify(csrfChallengeScores)
          : csrfChallengeScores,
      }),
      ...(secureCodingAnswers && {
        secureCodingAnswers: Array.isArray(secureCodingAnswers)
          ? JSON.stringify(secureCodingAnswers)
          : secureCodingAnswers,
      }),
      ...(secureCodingCorrectCount !== undefined && {
        secureCodingCorrectCount,
      }),
      ...(studiedOwaspItems && {
        studiedOwaspItems: Array.isArray(studiedOwaspItems) ? JSON.stringify(studiedOwaspItems) : studiedOwaspItems,
      }),
      ...(challengeScores !== undefined && {
        challengeScores: typeof challengeScores === 'object' ? JSON.stringify(challengeScores) : challengeScores,
      }),
    },
  });

  // Auto-sync grades to connected LTI platforms when module is completed with a score
  if (completed && score !== undefined && score !== null) {
    const activePlatforms = await getPrisma().ltiPlatform.findMany({
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
            logger.error('LTI grade sync failed', {
              platformName: platform.name,
              error: result.error,
            });
          }
        })
        .catch((err) => {
          logger.error('LTI grade sync error', {
            platformName: platform.name,
            error: String(err),
          });
        });
    }
  }

  return NextResponse.json({
    success: true,
    progress,
    autoSync: completed && score !== undefined,
  });
}
