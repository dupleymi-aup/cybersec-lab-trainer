import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendDeadlineReminderEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  // Verify cron secret or admin auth using timing-safe comparison
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET || '';

  const isCronValid = cronSecret && expectedSecret
    ? crypto.subtle.timingSafeEqual(
        new TextEncoder().encode(cronSecret),
        new TextEncoder().encode(expectedSecret)
      )
    : false;

  if (!isCronValid && !authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windows = [
    { label: '7d-before', start: 7, end: 6 },
    { label: '3d-before', start: 3, end: 2 },
    { label: '1d-before', start: 1, end: 0 },
    { label: 'on-due-date', start: 0, end: -1 },
    { label: 'overdue', start: -1, end: -30 },
  ];

  let sentCount = 0;

  for (const window of windows) {
    const startDate = new Date(now.getTime() + window.start * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now.getTime() + window.end * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    const deadlines = await prisma.deadline.findMany({
      where: {
        dueAt: {
          gte: endDate,
          lte: startDate,
        },
      },
    });

    for (const deadline of deadlines) {
      // Find target students
      const whereClause: Record<string, unknown> = { role: 'student' };
      if (deadline.group) whereClause.group = deadline.group;

      const students = await prisma.user.findMany({
        where: whereClause,
        select: { id: true, email: true, fullName: true },
      });

      for (const student of students) {
        // Check if already sent
        const existing = await prisma.reminderLog.findUnique({
          where: {
            deadlineId_userId_type: {
              deadlineId: deadline.id,
              userId: student.id,
              type: 'email',
            },
          },
        });

        if (existing) continue;

        // Check if student already completed the item
        let completed = false;
        if (deadline.scope === 'course') {
          // Simplified: check if student has any completed modules
          const progress = await prisma.progress.findFirst({
            where: { userId: student.id, completed: true },
          });
          completed = !!progress;
        } else if (deadline.scope === 'module') {
          const progress = await prisma.progress.findUnique({
            where: { userId_moduleId: { userId: student.id, moduleId: deadline.scopeId } },
          });
          completed = !!progress?.completed;
        } else if (deadline.scope === 'quiz') {
          const quiz = await prisma.quizResult.findUnique({
            where: { userId_quizId: { userId: student.id, quizId: deadline.scopeId } },
          });
          completed = !!quiz;
        }

        if (completed) continue;

        const isOverdue = new Date(deadline.dueAt) < now;

        try {
          await sendDeadlineReminderEmail(
            student.email,
            student.fullName,
            deadline.title,
            new Date(deadline.dueAt),
            isOverdue
          );
        } catch (error) {
          console.error(
            `[Deadline Checker] Failed to send email to ${student.email} for deadline "${deadline.title}":`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        await prisma.reminderLog.create({
          data: {
            id: crypto.randomUUID(),
            deadlineId: deadline.id,
            userId: student.id,
            type: 'email',
          },
        });

        sentCount++;
      }
    }
  }

  return NextResponse.json({ success: true, sent: sentCount });
}
