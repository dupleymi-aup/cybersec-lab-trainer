import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { hash } from 'bcryptjs';

/**
 * GET /api/ctf-labs/[id]
 * Get a specific CTF lab by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lab = await prisma.ctfLab.findUnique({
      where: { id: (await params).id },
      include: { tags: true },
    });

    if (!lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 });
    }

    // Hide flag for non-admin and non-submitted users
    const showFlag = auth.role === 'admin';
    const userSubmission = auth.role !== 'admin'
      ? await prisma.ctfSubmission.findFirst({
          where: { labId: lab.id, userId: auth.id, isCorrect: true },
        })
      : null;

    return NextResponse.json({
      ...lab,
      flag: showFlag || userSubmission ? lab.flag : undefined,
      isCompleted: !!userSubmission,
    });
  } catch (error) {
    console.error('GET /api/ctf-labs/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ctf-labs/[id]
 * Admin-only: Update a CTF lab
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, moduleId, difficulty, type, points, isActive, order, instructions, hint, flag, tags } = body;

    const lab = await prisma.ctfLab.update({
      where: { id: (await params).id },
      data: {
        title,
        description,
        moduleId,
        difficulty,
        type,
        points,
        isActive,
        order,
        instructions,
        hint,
        flag,
        tags: tags
          ? {
              deleteMany: {},
              create: tags.map((name: string) => ({ name })),
            }
          : undefined,
      },
      include: { tags: true },
    });

    return NextResponse.json(lab);
  } catch (error) {
    console.error('PUT /api/ctf-labs/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ctf-labs/[id]
 * Admin-only: Delete a CTF lab
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.ctfLab.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ message: 'Lab deleted' });
  } catch (error) {
    console.error('DELETE /api/ctf-labs/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ctf-labs/[id]/submit
 * Submit a flag for a CTF lab
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flag } = await request.json();
    const labId = (await params).id;

    if (!flag) {
      return NextResponse.json({ error: 'Flag is required' }, { status: 400 });
    }

    const lab = await prisma.ctfLab.findUnique({
      where: { id: labId },
    });

    if (!lab || !lab.isActive) {
      return NextResponse.json({ error: 'Lab not found or inactive' }, { status: 404 });
    }

    // Check if already completed
    const existingSubmission = await prisma.ctfSubmission.findFirst({
      where: { labId, userId: auth.id },
    });

    if (existingSubmission?.isCorrect) {
      return NextResponse.json({
        correct: true,
        message: 'Already completed!',
        xpAwarded: 0,
      });
    }

    // Get attempt count
    const attemptCount = existingSubmission
      ? existingSubmission.attempt + 1
      : 1;

    // Check flag (simple string comparison for now)
    const isCorrect = flag === lab.flag;

    if (isCorrect) {
      // Create submission
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const submission = await prisma.ctfSubmission.create({
        data: {
          labId,
          userId: auth.id,
          flag,
          isCorrect: true,
          attempt: attemptCount,
          xpAwarded: lab.points,
        },
      });

      // Award XP to user
      await prisma.user.update({
        where: { id: auth.id },
        data: { xp: { increment: lab.points } },
      });

      // Log XP
      await prisma.xpLog.create({
        data: {
          userId: auth.id,
          amount: lab.points,
          action: 'ctf_lab_complete',
        },
      });

      return NextResponse.json({
        correct: true,
        message: 'Correct! Flag accepted.',
        points: lab.points,
        attempt: attemptCount,
      });
    } else {
      // Log incorrect attempt
      await prisma.ctfSubmission.create({
        data: {
          labId,
          userId: auth.id,
          flag,
          isCorrect: false,
          attempt: attemptCount,
          xpAwarded: 0,
        },
      });

      return NextResponse.json({
        correct: false,
        message: 'Incorrect flag. Try again!',
        attempt: attemptCount,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/ctf-labs/[id]/submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
