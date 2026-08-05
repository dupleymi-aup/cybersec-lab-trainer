import { NextRequest, NextResponse } from 'next/server';
import { runScheduledReports } from '@/lib/report-runner';
import { authenticate } from '@/lib/api-middleware';
import { timingSafeEqual } from 'node:crypto';
import { logger } from '@/lib/logger';

async function handleRun(request: NextRequest) {
  // Verify cron secret (timing-safe) or fall back to teacher/admin authentication
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET || '';

  const isCronValid =
    cronSecret && expectedSecret ? timingSafeEqual(Buffer.from(cronSecret), Buffer.from(expectedSecret)) : false;

  if (!isCronValid) {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (auth.role !== 'teacher' && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const results = await runScheduledReports(new Date());
    return NextResponse.json({ ...results, success: true });
  } catch (error: unknown) {
    logger.error('Scheduled report run failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Scheduled report run failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRun(request);
}

export async function POST(request: NextRequest) {
  return handleRun(request);
}

export const maxDuration = 120;
