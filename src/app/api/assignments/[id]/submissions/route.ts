import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden } from '@/lib/api-middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (auth.role !== 'teacher' && auth.role !== 'admin') return forbidden();

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: { id: true, createdBy: true, group: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.createdBy !== auth.id && auth.role !== 'admin') {
    return forbidden();
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const graded = searchParams.get('graded');

  const where: Record<string, unknown> = { assignmentId: id };
  if (userId) where.userId = userId;
  if (graded === 'true') where.submittedAt = { not: null };
  if (graded === 'false') where.submittedAt = null;

  const submissions = await prisma.assignmentSubmission.findMany({
    where,
    include: {
      user: {
        select: { id: true, fullName: true, email: true, group: true, role: true },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return NextResponse.json(submissions);
}
