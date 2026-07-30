import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { createScheduledReportSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  try {
    const reports = await getPrisma().scheduledReport.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: unknown) {
    logger.error('Failed to load scheduled reports', { error: String(error) });
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  try {
    const body = await request.json();
    const parsed = createScheduledReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { reportType, frequency, dayOfWeek, dayOfMonth, email, groupId, days } = parsed.data;

    const report = await getPrisma().scheduledReport.create({
      data: {
        userId: auth.id,
        reportType,
        frequency,
        dayOfWeek: dayOfWeek ?? null,
        dayOfMonth: dayOfMonth ?? null,
        email: email || '',
        groupId: groupId || '',
        days: days || 30,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    logger.error('Failed to create scheduled report', { error: String(error) });
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
