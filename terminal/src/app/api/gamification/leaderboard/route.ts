import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { getRank } from '@/lib/xp-utils';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const group = searchParams.get('group');

  const where: Record<string, unknown> = {
    role: 'student',
    isBlocked: false,
  };

  if (group) {
    where.group = group;
  }

  // For timeframe filtering, we would use lastActivityAt but for simplicity show all-time
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [
        { xp: 'desc' },
        { level: 'desc' },
      ],
      take: Math.min(limit, 100),
      select: {
        id: true,
        fullName: true,
        group: true,
        xp: true,
        level: true,
        streak: true,
        lastActivityAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const leaderboard = users.map((u, index) => ({
    position: index + 1,
    id: u.id,
    fullName: u.fullName,
    group: u.group,
    xp: u.xp,
    level: u.level,
    rankTitle: getRank(u.level),
    streak: u.streak,
    lastActivityAt: u.lastActivityAt,
    isCurrentUser: u.id === auth.id,
  }));

  // Get user's own rank if not in top list
  let userRank = leaderboard.find((u) => u.isCurrentUser);
  if (!userRank) {
    const [ownUser] = await prisma.user.findMany({
      where: { id: auth.id, role: 'student', isBlocked: false },
      select: { xp: true, level: true, streak: true },
    });
    if (ownUser) {
      const ownLevel = getRank(ownUser.level);
      userRank = {
        position: -1,
        id: auth.id,
        fullName: auth.fullName || 'You',
        group: auth.group || '',
        xp: ownUser.xp,
        level: ownUser.level,
        rankTitle: ownLevel,
        streak: ownUser.streak,
        lastActivityAt: null,
        isCurrentUser: true,
      };
    }
  }

  return NextResponse.json({
    leaderboard,
    currentUser: userRank,
    total,
  });
}
