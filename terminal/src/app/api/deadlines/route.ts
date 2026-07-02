import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireCapability } from '@/lib/api-middleware';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createDeadlineSchema } from '@/lib/validations/api';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const group = searchParams.get('group');

  // Teachers/admins see deadlines they created; students see deadlines for their group or all
  let where: Record<string, unknown>;
  if (auth.role === 'student') {
    const student = await prisma.user.findUnique({ where: { id: auth.id }, select: { group: true } });
    const groups = ['', student?.group || ''].filter(Boolean);
    where = { group: { in: groups } };
  } else {
    where = { createdBy: auth.id };
  }

  if (scope) where.scope = scope;
  if (group) where.group = group;

  const deadlines = await prisma.deadline.findMany({
    where,
    orderBy: { dueAt: 'asc' },
    include: {
      creator: { select: { fullName: true } },
    },
  });

  return NextResponse.json({ deadlines });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireCapability(auth, 'deadlines:create')) return forbidden();

  const body = await request.json();
  const parsed = createDeadlineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { scope, scopeId: scopeIdRaw, dueAt, title, description } = parsed.data;
  const scopeId = scopeIdRaw || '';
  const group = body.group || '';

  const deadline = await prisma.deadline.create({
    data: {
      id: crypto.randomUUID(),
      scope,
      scopeId,
      dueAt: new Date(dueAt),
      title,
      description,
      group,
      createdBy: auth.id,
    },
    include: {
      creator: { select: { fullName: true } },
    },
  });

  return NextResponse.json({ success: true, deadline });
});
