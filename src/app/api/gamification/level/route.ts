import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';
import { getLevel, getXpForNextLevel, getRank } from '@/lib/xp-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    const user = await getPrisma().user.findUnique({
      where: { id: auth.id },
      select: { xp: true, level: true, streak: true, lastActivityAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const computed = getLevel(user.xp);
    const progress = getXpForNextLevel(user.xp);

    return NextResponse.json({
      xp: user.xp,
      level: user.level,
      rank: getRank(user.level),
      computedLevel: computed.level,
      computedRank: computed.rank,
      streak: user.streak,
      lastActivityAt: user.lastActivityAt,
      progressToNext: {
        current: progress.current,
        needed: progress.needed,
        nextLevel: progress.nextLevel,
        percentage:
          progress.needed > 0 ? Math.round((progress.current / (progress.current + progress.needed)) * 100) : 100,
      },
    });
  } catch (error) {
    console.error('Level info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
