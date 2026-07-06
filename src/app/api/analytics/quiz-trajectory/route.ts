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
  const days = parseDays(searchParams);
  const groupId = searchParams.get("groupId") || undefined;

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Fetch students, optionally filtered by group
  const students = await prisma.user.findMany({
    where: {
      role: "student",
      ...(groupId ? { group: groupId } : {}),
    },
    select: { id: true },
  });

  const studentIds = students.map((s) => s.id);
  if (studentIds.length === 0) {
    return NextResponse.json({ trajectories: [], categories: [] });
  }

  // Fetch all quiz attempts within the time window
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId: { in: studentIds },
      attemptedAt: { gte: since },
    },
    select: {
      userId: true,
      category: true,
      correct: true,
      attemptedAt: true,
    },
    orderBy: { attemptedAt: "asc" },
  });

  // Helper: get the Monday of a given date (week bucket)
  function getWeekKey(date: Date): string {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    return monday.toISOString().slice(0, 10);
  }

  // Group attempts by (week, category, student) and compute per-student weekly scores
  const bucketMap = new Map<string, { correct: number; total: number }>();

  for (const a of attempts) {
    const week = getWeekKey(a.attemptedAt);
    const key = `${week}|${a.category}|${a.userId}`;
    const entry = bucketMap.get(key) || { correct: 0, total: 0 };
    entry.total++;
    if (a.correct) entry.correct++;
    bucketMap.set(key, entry);
  }

  // Aggregate: for each (week, category), compute average score across students
  interface TrajectoryPoint {
    week: string;
    category: string;
    totalScore: number;
    studentCount: number;
    attempts: number;
  }

  const aggMap = new Map<string, TrajectoryPoint>();

  for (const [key, bucket] of bucketMap) {
    const [week, category] = key.split("|");
    const scorePercent =
      bucket.total > 0
        ? Math.round((bucket.correct / bucket.total) * 10000) / 100
        : 0;
    const aggKey = `${week}|${category}`;
    const agg = aggMap.get(aggKey) || {
      week,
      category,
      totalScore: 0,
      studentCount: 0,
      attempts: 0,
    };
    agg.totalScore += scorePercent;
    agg.studentCount += 1;
    agg.attempts += bucket.total;
    aggMap.set(aggKey, agg);
  }

  // Build final trajectories
  const trajectories = Array.from(aggMap.values())
    .map((a) => ({
      week: a.week,
      category: a.category,
      avgScore:
        a.studentCount > 0
          ? Math.round((a.totalScore / a.studentCount) * 100) / 100
          : 0,
      attempts: a.attempts,
    }))
    .sort(
      (a, b) =>
        a.week.localeCompare(b.week) || a.category.localeCompare(b.category),
    );

  // Collect unique categories
  const categories = [...new Set(attempts.map((a) => a.category))].sort();

  return NextResponse.json({ trajectories, categories });
}
