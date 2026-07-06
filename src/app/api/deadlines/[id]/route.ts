import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { updateDeadlineSchema } from '@/lib/validations/api';
import { parseBody } from '@/lib/utils';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { id } = await context.params;
  const existing = await prisma.deadline.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
  if (existing.createdBy !== auth.id && auth.role !== 'admin') return forbidden();

  const bodyResult = await parseBody(request);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data as Record<string, unknown>;
  const parsed = updateDeadlineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { dueAt, title, description, group } = parsed.data;

  const deadline = await prisma.deadline.update({
    where: { id },
    data: {
      ...(dueAt && { dueAt: new Date(dueAt) }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(group !== undefined && { group }),
    },
    include: {
      creator: { select: { fullName: true } },
    },
  });

  return NextResponse.json({ success: true, deadline });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { id } = await context.params;
  const existing = await prisma.deadline.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
  if (existing.createdBy !== auth.id && auth.role !== 'admin') return forbidden();

  await prisma.deadline.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
