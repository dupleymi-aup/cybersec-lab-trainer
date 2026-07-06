import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { achievements, isAchievementUnlocked } from '@/lib/data/achievements-data';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  // Get all students, optionally filtered by group
  const students = await prisma.user.findMany({
    where: {
      role: 'student',
      ...(groupId && { group: groupId }),
    },
    select: { id: true },
  });

  const studentIds = students.map((s) => s.id);

  if (studentIds.length === 0) {
    return NextResponse.json({
      achievements: achievements.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        unlockedCount: 0,
        totalCount: 0,
        unlockRate: 0,
        rarity: 'common' as const,
      })),
    });
  }

  // Fetch all Progress records for these students
  const progressRecords = await prisma.progress.findMany({
    where: { userId: { in: studentIds } },
    select: {
      userId: true,
      moduleId: true,
      completed: true,
      score: true,
      studiedOwaspItems: true,
      secureCodingCorrectCount: true,
    },
  });

  // Fetch all QuizResult records for these students
  const quizResults = await prisma.quizResult.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, quizId: true, percentage: true },
  });

  // Build per-student achievement state
  const studentState = new Map<
    string,
    {
      completedModules: string[];
      studiedOwaspItems: string[];
      quizScores: Record<string, number>;
      secureCodingCorrectCount: number;
    }
  >();

  for (const sid of studentIds) {
    studentState.set(sid, {
      completedModules: [],
      studiedOwaspItems: [],
      quizScores: {},
      secureCodingCorrectCount: 0,
    });
  }

  for (const p of progressRecords) {
    const state = studentState.get(p.userId);
    if (!state) continue;
    if (p.completed) {
      state.completedModules.push(p.moduleId);
    }
    for (const item of p.studiedOwaspItems) {
      if (!state.studiedOwaspItems.includes(item)) {
        state.studiedOwaspItems.push(item);
      }
    }
    if (p.secureCodingCorrectCount > state.secureCodingCorrectCount) {
      state.secureCodingCorrectCount = p.secureCodingCorrectCount;
    }
  }

  for (const q of quizResults) {
    const state = studentState.get(q.userId);
    if (!state) continue;
    // Keep the highest score per quiz
    const existing = state.quizScores[q.quizId];
    if (existing === undefined || q.percentage > existing) {
      state.quizScores[q.quizId] = q.percentage;
    }
  }

  // For each achievement, count how many students have unlocked it
  const totalCount = studentIds.length;
  const result = achievements.map((achievement) => {
    let unlockedCount = 0;
    for (const sid of studentIds) {
      const state = studentState.get(sid);
      if (!state) continue;
      if (
        isAchievementUnlocked(
          achievement.id,
          state.completedModules,
          state.studiedOwaspItems,
          state.quizScores,
          state.secureCodingCorrectCount,
        )
      ) {
        unlockedCount++;
      }
    }

    const unlockRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 10000) / 100 : 0;

    // Assign rarity based on unlock rate
    let rarity: string;
    if (unlockRate > 60) rarity = 'common';
    else if (unlockRate >= 30) rarity = 'uncommon';
    else if (unlockRate >= 10) rarity = 'rare';
    else rarity = 'epic';

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      unlockedCount,
      totalCount,
      unlockRate,
      rarity,
    };
  });

  return NextResponse.json({ achievements: result });
}
