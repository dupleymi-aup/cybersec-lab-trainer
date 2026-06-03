import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireCapability } from '@/lib/api-middleware';
import { generateGradebookCSV } from '@/lib/export-utils';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireCapability(auth, 'grades:export')) return forbidden();

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId') || undefined;

  const users = await prisma.user.findMany({
    where: groupId ? { group: groupId, role: 'student' } : { role: 'student' },
    select: {
      id: true,
      fullName: true,
      email: true,
      group: true,
    },
  });

  const userIds = users.map(u => u.id);

  const progressRecords = await prisma.progress.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, completed: true, updatedAt: true },
  });

  const quizRecords = await prisma.quizResult.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, percentage: true, updatedAt: true },
  });

  const progressByUser = new Map<string, typeof progressRecords>();
  for (const p of progressRecords) {
    const existing = progressByUser.get(p.userId) || [];
    existing.push(p);
    progressByUser.set(p.userId, existing);
  }

  const quizByUser = new Map<string, typeof quizRecords>();
  for (const q of quizRecords) {
    const existing = quizByUser.get(q.userId) || [];
    existing.push(q);
    quizByUser.set(q.userId, existing);
  }

  const students = users.map(user => {
    const userProgress = progressByUser.get(user.id) || [];
    const userQuizzes = quizByUser.get(user.id) || [];

    const modulesCompleted = userProgress.filter(p => p.completed).length;
    const quizCount = userQuizzes.length;
    const avgScore = userQuizzes.length > 0
      ? userQuizzes.reduce((sum, q) => sum + q.percentage, 0) / userQuizzes.length
      : 0;

    const lastProgressDate = userProgress.length > 0
      ? new Date(Math.max(...userProgress.map(p => p.updatedAt.getTime())))
      : null;
    const lastQuizDate = userQuizzes.length > 0
      ? new Date(Math.max(...userQuizzes.map(q => q.updatedAt.getTime())))
      : null;

    let lastActive = 'N/A';
    if (lastProgressDate && lastQuizDate) {
      lastActive = lastProgressDate > lastQuizDate
        ? lastProgressDate.toISOString().slice(0, 10)
        : lastQuizDate.toISOString().slice(0, 10);
    } else if (lastProgressDate) {
      lastActive = lastProgressDate.toISOString().slice(0, 10);
    } else if (lastQuizDate) {
      lastActive = lastQuizDate.toISOString().slice(0, 10);
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      group: user.group,
      modulesCompleted,
      quizCount,
      avgScore,
      lastActive,
    };
  });

  const csv = generateGradebookCSV(students, []);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gradebook.csv"',
    },
  });
}
