import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';
import {
  createSession,
  getTodaySessions,
  getTodayTotalMs,
  getTotalStudyTimeMs,
  getWeeklyStats,
  getStreakInfo,
  getHeatmapData,
} from '@/lib/study-sessions-utils';
import { z } from 'zod';

const createSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  durationMs: z.number().int().positive('Duration must be positive'),
  pageType: z.string().min(1),
  xpEarned: z.number().int().optional(),
});

/**
 * GET /api/study-sessions
 * Get study session statistics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'today': {
        const todaySessions = await getTodaySessions(auth.id);
        const todayTotalMs = await getTodayTotalMs(auth.id);
        return NextResponse.json({
          sessions: todaySessions,
          totalMinutes: Math.floor(todayTotalMs / 60000),
        });
      }

      case 'total': {
        const totalMs = await getTotalStudyTimeMs(auth.id);
        return NextResponse.json({
          totalMinutes: Math.floor(totalMs / 60000),
        });
      }

      case 'weekly': {
        const weeks = parseInt(searchParams.get('weeks') || '4');
        const weekly = await getWeeklyStats(auth.id, weeks);
        return NextResponse.json({ weekly });
      }

      case 'streak': {
        const streak = await getStreakInfo(auth.id);
        return NextResponse.json(streak);
      }

      case 'heatmap': {
        const weeksBack = parseInt(searchParams.get('weeks') || '26');
        const heatmap = await getHeatmapData(auth.id, weeksBack);
        return NextResponse.json(heatmap);
      }

      default: {
        // Return summary
        const [totalMs2, streak2, heatmap2] = await Promise.all([
          getTotalStudyTimeMs(auth.id),
          getStreakInfo(auth.id),
          getHeatmapData(auth.id, 4),
        ]);

        return NextResponse.json({
          totalMinutes: Math.floor(totalMs2 / 60000),
          streak: streak2,
          recentHeatmap: heatmap2,
        });
      }
    }
  } catch (error) {
    console.error('GET /api/study-sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-sessions
 * Create a new study session
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createSessionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const session = await createSession({
      userId: auth.id,
      ...validated.data,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('POST /api/study-sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
