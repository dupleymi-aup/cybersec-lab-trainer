import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/api-middleware';

// GET /api/announcements - get active announcements (any authenticated user)
export async function GET(request: NextRequest) {
  const _auth = await authenticate(request);
  // Allow unauthenticated access too (for public announcements)
  // But only return active, non-expired ones

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
}
