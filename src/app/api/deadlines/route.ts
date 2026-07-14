import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireCapability } from '@/lib/api-middleware';
import { createDeadlineSchema, type CreateDeadlineInput } from '@/lib/validations/api';
import { parseBody } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface DeadlineBody extends CreateDeadlineInput {
  group?: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const group = searchParams.get('group');

    // Teachers/admins see deadlines they created; students see deadlines for their group or all
    let where: Record<string, unknown>;
    if (auth.role === 'student') {
      const student = await getPrisma().user.findUnique({
        where: { id: auth.id },
        select: { group: true },
      });
      const groups = ['', student?.group || ''].filter(Boolean);
      where = { group: { in: groups } };
    } else {
      where = { createdBy: auth.id };
    }

    if (scope) where.scope = scope;
    if (group) where.group = group;

    const deadlines = await getPrisma().deadline.findMany({
      where,
      orderBy: { dueAt: 'asc' },
      include: {
        creator: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ deadlines });
  } catch (error) {
    logger.error('Get deadlines error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireCapability(auth, 'deadlines:create')) return forbidden();

    const bodyResult = await parseBody<DeadlineBody>(request);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;
    const parsed = createDeadlineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { scope, scopeId: scopeIdRaw, dueAt, title, description } = parsed.data;
    const scopeId = scopeIdRaw || '';
    const group = body.group || '';

    const deadline = await getPrisma().deadline.create({
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
  } catch (error) {
    logger.error('Create deadline error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
