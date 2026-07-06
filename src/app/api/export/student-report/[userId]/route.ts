import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { generateStudentReportCSV } from '@/lib/export-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const { userId } = await params;

  // Teacher+ role or user viewing their own report
  if (auth.id !== userId && !requireRole(auth.role, 'teacher')) {
    return forbidden();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      group: true,
      course: true,
      university: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const progress = await prisma.progress.findMany({
    where: { userId },
    select: { moduleId: true, completed: true, score: true },
  });

  const quizResults = await prisma.quizResult.findMany({
    where: { userId },
    select: { quizId: true, score: true, total: true, percentage: true },
  });

  const csv = generateStudentReportCSV(
    {
      fullName: user.fullName,
      email: user.email,
      group: user.group,
      course: user.course,
      university: user.university,
    },
    progress.map((p) => ({
      moduleId: p.moduleId,
      completed: p.completed,
      score: p.score,
    })),
    quizResults.map((q) => ({
      quizId: q.quizId,
      score: q.score,
      total: q.total,
      percentage: q.percentage,
    })),
  );

  const safeName =
    user.fullName
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_') || userId;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="student-report-${safeName}.csv"`,
    },
  });
}
