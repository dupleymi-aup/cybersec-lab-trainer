import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden } from '@/lib/api-middleware';
import { createAssignmentSchema } from '@/lib/validations/api';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const group = searchParams.get('group');
  const published = searchParams.get('published');
  const type = searchParams.get('type');

  const where: Record<string, unknown> = {};

  // Filter by published status
  if (published !== null) {
    where.published = published === 'true';
  }

  // Filter by type
  if (type) {
    where.type = type;
  }

  // Teacher sees own + published; admin sees all; student sees only published for their group
  if (auth.role === 'teacher') {
    where.OR = [
      { createdBy: auth.id },
      { published: true },
    ];
  } else if (auth.role === 'student') {
    where.published = true;
    if (group) {
      where.OR = [{ group: '' }, { group: auth.group || '' }];
    } else if (auth.group) {
      where.OR = [{ group: '' }, { group: auth.group }];
    }
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: { id: true, fullName: true, role: true },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  return NextResponse.json(assignments);
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (auth.role !== 'teacher' && auth.role !== 'admin') return forbidden();

  const body = await request.json();
  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { dueAt, ...data } = parsed.data;

  const assignment = await prisma.assignment.create({
    data: {
      ...data,
      dueAt: dueAt ? new Date(dueAt) : null,
      createdBy: auth.id,
    },
    include: {
      creator: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
