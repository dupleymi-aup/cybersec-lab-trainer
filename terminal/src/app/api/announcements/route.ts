import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET /api/announcements - get active announcements (public access)
export async function GET(_request: NextRequest) {
  // Public endpoint - return active, non-expired announcements
  try {
    const announcements = await prisma.announcement.findMany({
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

    return NextResponse.json({
      announcements: announcements.map(a => ({
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
