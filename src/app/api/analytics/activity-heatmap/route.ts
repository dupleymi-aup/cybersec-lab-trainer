import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
} from "@/lib/api-middleware";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, "teacher")) return forbidden();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const dateRange = searchParams.get("dateRange") || "90d";

    // Calculate date range
    const now = new Date();
    const days = dateRange === "180d" ? 180 : dateRange === "365d" ? 365 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Determine which students to query
    let studentIds: string[];
    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (targetUser.role !== "student" && auth.role !== "admin") {
        return NextResponse.json(
          { error: "Can only view student activity" },
          { status: 403 },
        );
      }
      studentIds = [userId];
    } else {
      const students = await prisma.user.findMany({
        where: { role: "student" },
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    }

    if (studentIds.length === 0) {
      return NextResponse.json({
        dailyActivity: [],
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: 0,
        })),
        weeklyActivity: Array.from({ length: 7 }, (_, i) => ({
          day: i,
          count: 0,
        })),
        totalActivities: 0,
        mostActiveDay: null,
        mostActiveHour: null,
        streakDays: 0,
      });
    }

    // Fetch LoginActivity records
    const loginActivities = await prisma.loginActivity.findMany({
      where: {
        userId: { in: studentIds },
        timestamp: { gte: cutoffDate },
      },
      select: { timestamp: true, userId: true },
    });

    // Fetch Progress records
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: cutoffDate },
      },
      select: { updatedAt: true, userId: true },
    });

    // Combine all activity timestamps
    const allActivities: {
      date: string;
      hour: number;
      dayOfWeek: number;
      userId: string;
    }[] = [];

    function getDateKey(date: Date): string {
      return date.toISOString().split("T")[0];
    }

    for (const la of loginActivities) {
      const ts = new Date(la.timestamp);
      allActivities.push({
        date: getDateKey(ts),
        hour: ts.getHours(),
        dayOfWeek: (ts.getDay() + 6) % 7, // Convert Sun=0 to Mon=0
        userId: la.userId || "",
      });
    }

    for (const p of progressRecords) {
      const ts = new Date(p.updatedAt);
      allActivities.push({
        date: getDateKey(ts),
        hour: ts.getHours(),
        dayOfWeek: (ts.getDay() + 6) % 7,
        userId: p.userId,
      });
    }

    // Daily activity
    const dailyMap = new Map<string, number>();
    for (const a of allActivities) {
      dailyMap.set(a.date, (dailyMap.get(a.date) || 0) + 1);
    }
    const dailyActivity = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Hourly activity
    const hourlyMap = new Map<number, number>();
    for (const a of allActivities) {
      hourlyMap.set(a.hour, (hourlyMap.get(a.hour) || 0) + 1);
    }
    const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyMap.get(i) || 0,
    }));

    // Weekly activity (Mon=0, Sun=6)
    const weeklyMap = new Map<number, number>();
    for (const a of allActivities) {
      weeklyMap.set(a.dayOfWeek, (weeklyMap.get(a.dayOfWeek) || 0) + 1);
    }
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      count: weeklyMap.get(i) || 0,
    }));

    // Total activities
    const totalActivities = allActivities.length;

    // Most active day
    const mostActiveDayEntry =
      dailyActivity.length > 0
        ? dailyActivity.reduce((max, curr) =>
            curr.count > max.count ? curr : max,
          )
        : null;

    // Most active hour — only if there's actual activity
    const maxHourCount = Math.max(...hourlyActivity.map((h) => h.count));
    const mostActiveHourEntry =
      maxHourCount > 0
        ? hourlyActivity.reduce((max, curr) =>
            curr.count > max.count ? curr : max,
          )
        : null;

    // Streak: count consecutive days with activity going back from today
    const activeDaysSet = new Set(dailyActivity.map((d) => d.date));
    let streakDays = 0;
    let checkDate = new Date(now);

    // Start from today, go backwards
    while (true) {
      const key = getDateKey(checkDate);
      if (activeDaysSet.has(key)) {
        streakDays++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
      // Safety limit
      if (streakDays > days) break;
    }

    return NextResponse.json({
      dailyActivity,
      hourlyActivity,
      weeklyActivity,
      totalActivities,
      mostActiveDay: mostActiveDayEntry ? mostActiveDayEntry.date : null,
      mostActiveHour: mostActiveHourEntry ? mostActiveHourEntry.hour : null,
      streakDays,
    });
  } catch (error) {
    logger.error("Activity heatmap failed", { error: String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
