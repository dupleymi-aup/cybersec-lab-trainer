import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { group: true, role: true },
  });
  if (!user) return unauthorized();

  // Find deadlines that apply to this user
  const applicableGroups = ['', user.group || ''].filter(Boolean);
  const deadlines = await prisma.deadline.findMany({
    where: { group: { in: applicableGroups } },
    orderBy: { dueAt: 'asc' },
  });

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Get user's progress to check completion
  const progress = await prisma.progress.findMany({
    where: { userId: auth.id },
    select: { moduleId: true, completed: true },
  });
  const completedModules = new Set(progress.filter(p => p.completed).map(p => p.moduleId));

  const quizResults = await prisma.quizResult.findMany({
    where: { userId: auth.id },
    select: { quizId: true },
  });
  const completedQuizzes = new Set(quizResults.map(q => q.quizId));

  // Filter to upcoming (within 7 days) or overdue deadlines, exclude completed
  const upcoming = deadlines
    .filter(d => {
      const due = new Date(d.dueAt);
      // Include if overdue or due within 7 days
      if (due < sevenDaysFromNow) {
        // Check if completed
        if (d.scope === 'course') {
          // Course deadline: check if all modules are done
          const allModulesCompleted = progress.length > 0 && progress.every(p => p.completed);
          return !allModulesCompleted;
        }
        if (d.scope === 'module') return !completedModules.has(d.scopeId);
        if (d.scope === 'quiz') return !completedQuizzes.has(d.scopeId);
      }
      return false;
    })
    .map(d => {
      const due = new Date(d.dueAt);
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = diffDays < 0;

      return {
        id: d.id,
        scope: d.scope,
        scopeId: d.scopeId,
        dueAt: d.dueAt,
        title: d.title,
        description: d.description,
        daysLeft: diffDays,
        isOverdue,
      };
    });

  return NextResponse.json({ upcoming });
}
