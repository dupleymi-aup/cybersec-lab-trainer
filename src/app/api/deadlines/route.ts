import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const body = await request.json();
  const { scope, scopeId, dueAt, title, description, group } = body;

  if (!scope || !scopeId || !dueAt || !title) {
    return NextResponse.json({ error: 'scope, scopeId, dueAt, and title are required' }, { status: 400 });
  }

  if (!['course', 'module', 'quiz'].includes(scope)) {
    return NextResponse.json({ error: 'scope must be "course", "module", or "quiz"' }, { status: 400 });
  }

  const deadline = await prisma.deadline.create({
    data: {
      id: crypto.randomUUID(),
      scope,
      scopeId,
      dueAt: new Date(dueAt),
      title,
      description: description || '',
      group: group || '',
      createdBy: auth.id,
    },
    include: {
      creator: { select: { fullName: true } },
    },
  });

  return NextResponse.json({ success: true, deadline });
}
