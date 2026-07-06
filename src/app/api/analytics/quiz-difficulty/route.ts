import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
} from "@/lib/api-middleware";
import { parseDays } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "teacher")) return forbidden();

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId") || "";
  const days = parseDays(searchParams);
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Get users for group filtering
  const users = await prisma.user.findMany({
    select: { id: true, group: true, fullName: true },
  });
  const filteredUserIds = new Set(
    users.filter((u) => !groupId || u.group === groupId).map((u) => u.id),
  );

  // Get all quiz attempts in period
  const allAttempts = await prisma.quizAttempt.findMany({
    where: { attemptedAt: { gte: since } },
    select: {
      userId: true,
      category: true,
      difficulty: true,
      correct: true,
      attemptedAt: true,
    },
  });

  const attempts = allAttempts.filter((a) => filteredUserIds.has(a.userId));

  // ─── Difficulty Breakdown ───
  const diffMap = new Map<
    string,
    { total: number; correct: number; students: Set<string> }
  >();
  for (const attempt of attempts) {
    if (!diffMap.has(attempt.difficulty)) {
      diffMap.set(attempt.difficulty, {
        total: 0,
        correct: 0,
        students: new Set(),
      });
    }
    const d = diffMap.get(attempt.difficulty);
    if (d) {
      d.total++;
      if (attempt.correct) d.correct++;
      d.students.add(attempt.userId);
    }
  }

  const difficultyBreakdown = Array.from(diffMap.entries())
    .map(([difficulty, data]) => ({
      difficulty,
      totalAttempts: data.total,
      correctCount: data.correct,
      correctRate:
        data.total > 0
          ? Math.round((data.correct / data.total) * 1000) / 10
          : 0,
      uniqueStudents: data.students.size,
    }))
    .sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2 };
      return (
        (order[a.difficulty as keyof typeof order] ?? 3) -
        (order[b.difficulty as keyof typeof order] ?? 3)
      );
    });

  // ─── Category × Difficulty Cross-Tab ───
  const catDiffMap = new Map<string, { total: number; correct: number }>();
  for (const attempt of attempts) {
    const key = `${attempt.category}|${attempt.difficulty}`;
    if (!catDiffMap.has(key)) catDiffMap.set(key, { total: 0, correct: 0 });
    const entry = catDiffMap.get(key);
    if (entry) {
      entry.total++;
      if (attempt.correct) entry.correct++;
    }
  }

  const categoryByDifficulty = Array.from(catDiffMap.entries())
    .map(([key, data]) => {
      const [category, difficulty] = key.split("|");
      return {
        category,
        difficulty,
        totalAttempts: data.total,
        correctRate:
          data.total > 0
            ? Math.round((data.correct / data.total) * 1000) / 10
            : 0,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));

  // ─── Student Performance by Difficulty ───
  const studentDiffMap = new Map<
    string,
    Record<string, { total: number; correct: number }>
  >();
  for (const attempt of attempts) {
    if (!studentDiffMap.has(attempt.userId)) {
      studentDiffMap.set(attempt.userId, {
        easy: { total: 0, correct: 0 },
        medium: { total: 0, correct: 0 },
        hard: { total: 0, correct: 0 },
      });
    }
    const studentDiffs = studentDiffMap.get(attempt.userId);
    if (!studentDiffs) continue;
    if (!studentDiffs[attempt.difficulty])
      studentDiffs[attempt.difficulty] = { total: 0, correct: 0 };
    studentDiffs[attempt.difficulty].total++;
    if (attempt.correct) studentDiffs[attempt.difficulty].correct++;
  }

  const userMap = new Map(users.map((u) => [u.id, u.fullName]));
  const studentPerformanceByDifficulty = Array.from(studentDiffMap.entries())
    .map(([userId, diffs]) => ({
      userId,
      fullName: userMap.get(userId) || userId,
      easyRate:
        diffs.easy?.total > 0
          ? Math.round((diffs.easy.correct / diffs.easy.total) * 1000) / 10
          : 0,
      mediumRate:
        diffs.medium?.total > 0
          ? Math.round((diffs.medium.correct / diffs.medium.total) * 1000) / 10
          : 0,
      hardRate:
        diffs.hard?.total > 0
          ? Math.round((diffs.hard.correct / diffs.hard.total) * 1000) / 10
          : 0,
      totalAttempts:
        (diffs.easy?.total || 0) +
        (diffs.medium?.total || 0) +
        (diffs.hard?.total || 0),
    }))
    .sort((a, b) => b.hardRate - a.hardRate)
    .slice(0, 50);

  // ─── Trend by Difficulty (weekly buckets) ───
  const weekMap = new Map<
    string,
    {
      easy: { total: number; correct: number };
      medium: { total: number; correct: number };
      hard: { total: number; correct: number };
    }
  >();
  for (const attempt of attempts) {
    const weekStart = new Date(attempt.attemptedAt);
    weekStart.setDate(
      attempt.attemptedAt.getDate() - attempt.attemptedAt.getDay(),
    );
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        easy: { total: 0, correct: 0 },
        medium: { total: 0, correct: 0 },
        hard: { total: 0, correct: 0 },
      });
    }
    const week = weekMap.get(weekKey);
    if (week) {
      const diff = week[attempt.difficulty as keyof typeof week];
      if (diff) {
        diff.total++;
        if (attempt.correct) diff.correct++;
      }
    }
  }

  const trendByDifficulty = Array.from(weekMap.entries())
    .map(([week, diffs]) => ({
      week,
      easy:
        diffs.easy.total > 0
          ? Math.round((diffs.easy.correct / diffs.easy.total) * 1000) / 10
          : 0,
      medium:
        diffs.medium.total > 0
          ? Math.round((diffs.medium.correct / diffs.medium.total) * 1000) / 10
          : 0,
      hard:
        diffs.hard.total > 0
          ? Math.round((diffs.hard.correct / diffs.hard.total) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return NextResponse.json({
    difficultyBreakdown,
    categoryByDifficulty,
    studentPerformanceByDifficulty,
    trendByDifficulty,
  });
}
