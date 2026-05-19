import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

// GET /api/progress/[userId] - Teacher view student progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { userId } = await params;

  const progress = await prisma.progress.findMany({
    where: { userId },
  });

  const quizResults = await prisma.quizResult.findMany({
    where: { userId },
  });

  return NextResponse.json({
    progress: progress.map(p => ({
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
    })),
    quizResults: quizResults.map(q => ({
      quizId: q.quizId,
      score: q.score,
      total: q.total,
      percentage: q.percentage,
      updatedAt: q.updatedAt.toISOString(),
    })),
  });
}
