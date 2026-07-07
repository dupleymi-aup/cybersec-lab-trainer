import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, PrismaTransactionClient } from '@/lib/db';
import { authenticate, unauthorized, forbidden, checkRateLimit } from '@/lib/api-middleware';
import { getLevel, XP_REWARDS } from '@/lib/xp-utils';
import { xpActionSchema } from '@/lib/validations/api';
import { parseBody } from '@/lib/utils';

const XP_RATE_LIMIT_MAX = 20; // max XP awards per window
const XP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_DAILY_XP = 500; // cap total XP per day to prevent grinding

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (auth.role !== 'student') return forbidden();

  // Rate limit XP awards to prevent grinding
  const rateLimit = checkRateLimit(`xp:${auth.id}`, XP_RATE_LIMIT_MAX, XP_RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many XP requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  const bodyResult = await parseBody(request);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data as Record<string, unknown>;
  const parsed = xpActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { action } = parsed.data;

  // Use transaction to prevent race condition on XP + streak updates
  const result = await getPrisma()
    .$transaction(async (tx) => {
      const xpAmount =
        action === 'daily_login'
          ? await calculateDailyLoginXp(tx, auth.id)
          : (() => {
              switch (action) {
                case 'module_complete':
                  return XP_REWARDS.moduleComplete;
                case 'quiz_pass':
                  return XP_REWARDS.quizPass;
                case 'quiz_perfect':
                  return XP_REWARDS.quizPerfect;
                case 'assignment_submit':
                  return XP_REWARDS.assignmentSubmit;
                case 'assignment_passed':
                  return XP_REWARDS.assignmentPassed;
                default:
                  return -1;
              }
            })();

      if (xpAmount <= 0) {
        throw new Error('NO_XP');
      }

      // Re-check daily cap inside transaction
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const xpToday = await tx.xpLog.aggregate({
        where: { userId: auth.id, createdAt: { gte: todayStart } },
        _sum: { amount: true },
      });
      const dailyXpEarned = xpToday._sum.amount ?? 0;

      if (dailyXpEarned >= MAX_DAILY_XP || dailyXpEarned + xpAmount > MAX_DAILY_XP) {
        throw new Error('DAILY_CAP');
      }

      const user = await tx.user.update({
        where: { id: auth.id },
        data: {
          xp: { increment: xpAmount },
          lastActivityAt: new Date(),
        },
        select: { id: true, xp: true, level: true, streak: true },
      });

      await tx.xpLog.create({
        data: {
          userId: auth.id,
          amount: xpAmount,
          action,
        },
      });

      const newLevel = getLevel(user.xp);
      const leveledUp = newLevel.level > user.level;

      const updated = await tx.user.update({
        where: { id: auth.id },
        data: { level: newLevel.level },
      });

      return {
        xpAwarded: xpAmount,
        totalXp: updated.xp,
        level: updated.level,
        rank: newLevel.rank,
        leveledUp,
        newLevel: leveledUp ? newLevel.level : null,
        streak: user.streak,
      };
    })
    .catch((err) => {
      if (err instanceof Error && err.message === 'NO_XP') return null;
      if (err instanceof Error && err.message === 'DAILY_CAP') return null;
      throw err;
    });

  if (result === null && action === 'daily_login') {
    const recheck = await getPrisma().xpLog.aggregate({
      where: {
        userId: auth.id,
        createdAt: {
          gte: (() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
        },
      },
      _sum: { amount: true },
    });
    if ((recheck._sum.amount ?? 0) >= MAX_DAILY_XP) {
      return NextResponse.json(
        {
          error: 'Daily XP limit reached. Come back tomorrow!',
          maxDailyXp: MAX_DAILY_XP,
        },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: 'No XP awarded' }, { status: 400 });
  }

  if (!result) {
    return NextResponse.json({ error: 'No XP awarded' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    ...result,
  });
}

async function calculateDailyLoginXp(tx: PrismaTransactionClient, userId: string): Promise<number> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { lastActivityAt: true, streak: true },
  });

  if (!user) return XP_REWARDS.dailyLogin;

  const now = new Date();
  const last = user.lastActivityAt;

  if (!last) {
    await tx.user.update({
      where: { id: userId },
      data: { streak: 1 },
    });
    return XP_REWARDS.dailyLogin;
  }

  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 0;
  }

  if (diffDays === 1) {
    const newStreak = (user.streak || 0) + 1;
    const bonusXP = XP_REWARDS.dailyLogin + newStreak * XP_REWARDS.streakBonus;
    await tx.user.update({
      where: { id: userId },
      data: { streak: newStreak },
    });
    return bonusXP;
  }

  await tx.user.update({
    where: { id: userId },
    data: { streak: 1 },
  });
  return XP_REWARDS.dailyLogin;
}
