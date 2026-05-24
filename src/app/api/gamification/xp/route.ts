import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, checkRateLimit } from '@/lib/api-middleware';
import { getLevel, XP_REWARDS } from '@/lib/xp-utils';

const XP_RATE_LIMIT_MAX = 20; // max XP awards per window
const XP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (auth.role !== 'student') return forbidden();

  // Rate limit XP awards to prevent grinding
  const rateLimit = checkRateLimit(`xp:${auth.id}`, XP_RATE_LIMIT_MAX, XP_RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many XP requests', retryAfter: rateLimit.retryAfter },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { action } = body as { action: string };

  const xpAmount = action === 'daily_login'
    ? await calculateDailyLoginXp(auth.id)
    : (() => {
        switch (action) {
          case 'module_complete': return XP_REWARDS.moduleComplete;
          case 'quiz_pass': return XP_REWARDS.quizPass;
          case 'quiz_perfect': return XP_REWARDS.quizPerfect;
          case 'assignment_submit': return XP_REWARDS.assignmentSubmit;
          case 'assignment_passed': return XP_REWARDS.assignmentPassed;
          default: return -1;
        }
      })();

  if (xpAmount <= 0) {
    return NextResponse.json({ error: 'No XP awarded' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.id },
    data: {
      xp: { increment: xpAmount },
      lastActivityAt: new Date(),
    },
    select: { id: true, xp: true, level: true, streak: true },
  });

  const newLevel = getLevel(user.xp);
  const leveledUp = newLevel.level > user.level;

  const updated = await prisma.user.update({
    where: { id: auth.id },
    data: {
      level: newLevel.level,
    },
  });

  return NextResponse.json({
    success: true,
    xpAwarded: xpAmount,
    totalXp: updated.xp,
    level: updated.level,
    rank: newLevel.rank,
    leveledUp,
    newLevel: leveledUp ? newLevel.level : null,
    streak: user.streak,
  });
}

async function calculateDailyLoginXp(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActivityAt: true, streak: true },
  });

  if (!user) return XP_REWARDS.dailyLogin;

  const now = new Date();
  const last = user.lastActivityAt;

  if (!last) {
    // First activity
    await prisma.user.update({
      where: { id: userId },
      data: { streak: 1 },
    });
    return XP_REWARDS.dailyLogin;
  }

  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already logged in today — no XP
    return 0;
  }

  if (diffDays === 1) {
    // Consecutive day — increment streak
    const newStreak = (user.streak || 0) + 1;
    const bonusXP = XP_REWARDS.dailyLogin + newStreak * XP_REWARDS.streakBonus;
    await prisma.user.update({
      where: { id: userId },
      data: { streak: newStreak },
    });
    return bonusXP;
  }

  // Streak broken — reset
  await prisma.user.update({
    where: { id: userId },
    data: { streak: 1 },
  });
  return XP_REWARDS.dailyLogin;
}
