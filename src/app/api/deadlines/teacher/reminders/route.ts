import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const deadlineId = searchParams.get('deadlineId');
  const group = searchParams.get('group');

  let where: Record<string, unknown> = { createdBy: auth.id };
  if (deadlineId) where.id = deadlineId;

  const deadlines = await prisma.deadline.findMany({
    where,
    orderBy: { dueAt: 'asc' },
  });

  const results = [];

  for (const deadline of deadlines) {
    // Find target students
    const studentWhere: Record<string, unknown> = { role: 'student' };
    if (deadline.group) studentWhere.group = deadline.group;
    if (group) studentWhere.group = group;

    const students = await prisma.user.findMany({
      where: studentWhere,
      select: { id: true, fullName: true, email: true, group: true },
    });

    const studentStatus = [];

    for (const student of students) {
      let completed = false;
      let progressDate: string | null = null;

      if (deadline.scope === 'module') {
        const p = await prisma.progress.findUnique({
          where: { userId_moduleId: { userId: student.id, moduleId: deadline.scopeId } },
        });
        completed = !!p?.completed;
        progressDate = p?.updatedAt?.toISOString() || null;
      } else if (deadline.scope === 'quiz') {
        const q = await prisma.quizResult.findUnique({
          where: { userId_quizId: { userId: student.id, quizId: deadline.scopeId } },
        });
        completed = !!q;
        progressDate = q?.updatedAt?.toISOString() || null;
      } else if (deadline.scope === 'course') {
        const allProgress = await prisma.progress.findMany({
          where: { userId: student.id, completed: true },
        });
        completed = allProgress.length > 0;
        progressDate = allProgress.length > 0
          ? allProgress[allProgress.length - 1].updatedAt.toISOString()
          : null;
      }

      const isOverdue = new Date(deadline.dueAt) < new Date() && !completed;

      studentStatus.push({
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        group: student.group,
        completed,
        progressDate,
        isOverdue,
      });
    }

    const completedCount = studentStatus.filter(s => s.completed).length;
    const completionRate = students.length > 0
      ? Math.round((completedCount / students.length) * 100)
      : 0;

    results.push({
      deadline: {
        id: deadline.id,
        scope: deadline.scope,
        scopeId: deadline.scopeId,
        dueAt: deadline.dueAt,
        title: deadline.title,
        group: deadline.group,
      },
      totalStudents: students.length,
      completedCount,
      completionRate,
      studentStatus,
    });
  }

  return NextResponse.json({ results });
}
