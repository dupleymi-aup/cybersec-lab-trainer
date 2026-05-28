import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden } from '@/lib/api-middleware';
import { submitAssignmentSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (auth.role !== 'student') return forbidden();

  try {
    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { submissions: { where: { userId: auth.id } } },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (!assignment.published) return forbidden();

    if (assignment.dueAt && new Date() > assignment.dueAt) {
      return NextResponse.json({ error: 'Assignment deadline has passed' }, { status: 400 });
    }

    // Check attempt limit (0 = unlimited)
    const currentAttempt = assignment._count.submissions;
    if (assignment.attempts > 0 && currentAttempt >= assignment.attempts) {
      return NextResponse.json(
        { error: `Maximum ${assignment.attempts} attempts allowed` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = submitAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const nextAttempt = currentAttempt + 1;

    // Upsert: allow resubmission within attempt limit
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_userId_attempt: {
          assignmentId: id,
          userId: auth.id,
          attempt: nextAttempt,
        },
      },
      create: {
        assignmentId: id,
        userId: auth.id,
        content: parsed.data.content,
        maxScore: assignment.maxScore,
        attempt: nextAttempt,
      },
      update: {
        content: parsed.data.content,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      submission,
      attempt: nextAttempt,
      maxAttempts: assignment.attempts === 0 ? 'unlimited' : assignment.attempts,
    });
  } catch (error) {
    logger.error('Failed to submit assignment', { error: String(error), userId: auth?.id });
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}
