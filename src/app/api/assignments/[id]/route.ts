import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireCapability } from '@/lib/api-middleware';
import { updateAssignmentSchema } from '@/lib/validations/api';
import { parseBody } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const assignment = await getPrisma().assignment.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, fullName: true, role: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Students can only see published assignments
    if (auth.role === 'student' && !assignment.published) {
      return forbidden();
    }

    return NextResponse.json(assignment);
  } catch (error) {
    logger.error('Get assignment error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireCapability(auth, 'assignments:edit')) return forbidden();

    const { id } = await params;

    const existing = await getPrisma().assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Only creator or admin can update
    if (existing.createdBy !== auth.id && auth.role !== 'admin') {
      return forbidden();
    }

    const bodyResult = await parseBody(request);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;
    const parsed = updateAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { dueAt, ...data } = parsed.data;

    const assignment = await getPrisma().assignment.update({
      where: { id },
      data: {
        ...data,
        ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
      },
      include: {
        creator: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    logger.error('Update assignment error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireCapability(auth, 'assignments:delete')) return forbidden();

    const { id } = await params;

    const existing = await getPrisma().assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (existing.createdBy !== auth.id && auth.role !== 'admin') {
      return forbidden();
    }

    await getPrisma().assignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete assignment error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
