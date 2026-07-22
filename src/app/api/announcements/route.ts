import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET /api/announcements - get active announcements (public access)
export async function GET(_request: NextRequest) {
  // Public endpoint - return active, non-expired announcements
  try {
    const announcements = await getPrisma().announcement.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        author: true,
        priority: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    type AnnouncementRow = { id: string; title: string; content: string; author: string; priority: string; expiresAt: Date | null; createdAt: Date };
    return NextResponse.json({
      announcements: announcements.map((a: AnnouncementRow) => ({
        ...a,
        expiresAt: a.expiresAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch announcements', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
