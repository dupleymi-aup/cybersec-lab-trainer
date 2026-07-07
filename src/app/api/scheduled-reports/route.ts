import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
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
    return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  try {
    const body = await request.json();
    const { reportType, frequency, dayOfWeek, dayOfMonth, email, groupId, days } = body;

    if (!reportType || !frequency) {
      return NextResponse.json({ success: false, error: 'reportType и frequency обязательны' }, { status: 400 });
    }

    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        {
          success: false,
          error: 'frequency должен быть daily, weekly или monthly',
        },
        { status: 400 },
      );
    }

    if (frequency === 'weekly' && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json({ success: false, error: 'dayOfWeek должен быть 0-6 для weekly' }, { status: 400 });
    }

    if (frequency === 'monthly' && (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31)) {
      return NextResponse.json({ success: false, error: 'dayOfMonth должен быть 1-31 для monthly' }, { status: 400 });
    }

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
    return NextResponse.json({ success: false, error: 'Failed to create report' }, { status: 500 });
  }
}
