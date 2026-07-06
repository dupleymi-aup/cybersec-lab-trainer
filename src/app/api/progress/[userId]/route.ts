import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

// GET /api/progress/[userId] - Teacher view student progress (scoped to teacher's group)
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { userId } = await params;

  // Verify the target student exists and get their group
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, group: true },
  });

  if (!targetUser || targetUser.role !== 'student') {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // Teachers can only view students in their own group
  // Admins can view any student
  if (auth.role !== 'admin' && auth.group !== targetUser.group) {
    return NextResponse.json({ error: 'Access denied: student not in your group' }, { status: 403 });
  }

  const progress = await prisma.progress.findMany({
    where: { userId },
  });

  const quizResults = await prisma.quizResult.findMany({
    where: { userId },
  });

  return NextResponse.json({
    progress: progress.map((p) => ({
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
    quizResults: quizResults.map((q) => ({
      quizId: q.quizId,
      score: q.score,
      total: q.total,
      percentage: q.percentage,
      updatedAt: q.updatedAt.toISOString(),
    })),
  });
}
