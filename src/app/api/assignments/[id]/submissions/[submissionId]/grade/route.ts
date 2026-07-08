import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden } from '@/lib/api-middleware';
import { gradeSubmissionSchema } from '@/lib/validations/api';
import { parseBody } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> },
) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (auth.role !== 'teacher' && auth.role !== 'admin') return forbidden();

    const { id, submissionId } = await params;

    const assignment = await getPrisma().assignment.findUnique({
      where: { id },
      select: { id: true, createdBy: true, maxScore: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.createdBy !== auth.id && auth.role !== 'admin') {
      return forbidden();
    }

    const submission = await getPrisma().assignmentSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.assignmentId !== id) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const bodyResult = await parseBody(request);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;
    const parsed = gradeSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    if (parsed.data.score > assignment.maxScore) {
      return NextResponse.json({ error: `Score cannot exceed max score of ${assignment.maxScore}` }, { status: 400 });
    }

    const percentage = Math.round((parsed.data.score / assignment.maxScore) * 100);

    const updated = await getPrisma().assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: parsed.data.score,
        passed: parsed.data.passed,
        gradedAt: new Date(),
        gradedBy: auth.id,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      submission: updated,
      percentage,
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
