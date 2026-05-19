import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, requireRole } from '@/lib/api-middleware';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

interface RetentionWeeks {
  week1: number;
  week2: number;
  week4: number;
  week8: number;
  week12: number;
}

/**
 * Calculate retention for a single student based on their registration date.
 * A student is "active" in a retention week if they have any progress or quiz
 * activity within that week's window (measured from their registration date).
 */
function calculateStudentRetention(
  registrationDate: Date,
  progressDates: Date[],
  quizDates: Date[]
): RetentionWeeks {
  const allActivityDates = [...progressDates, ...quizDates];
  const weeks = [1, 2, 4, 8, 12] as const;
  const results: RetentionWeeks = { week1: 0, week2: 0, week4: 0, week8: 0, week12: 0 };

  for (const weekNum of weeks) {
    const weekStart = new Date(registrationDate.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const isActive = allActivityDates.some(
      (d) => d >= weekStart && d < weekEnd
    );

    const key = `week${weekNum}` as keyof RetentionWeeks;
    results[key] = isActive ? 1 : 0;
  }

  return results;
}

/**
 * Format a year-month string like "2024-01" into a Russian label like "Январь 2024".
 */
function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return unauthorized();

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId') || '';

  // Fetch students filtered by group if specified
  const students = await prisma.user.findMany({
    where: {
      role: 'student',
      ...(groupId ? { group: groupId } : {}),
    },
    select: { id: true, createdAt: true },
  });

  if (students.length === 0) {
    return NextResponse.json({ cohorts: [], overallRetention: { week1: 0, week2: 0, week4: 0, week8: 0, week12: 0 } });
  }

  const studentIds = students.map((s) => s.id);

  // Fetch all progress records for these students
  const progressRecords = await prisma.progress.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, updatedAt: true },
  });

  // Fetch all quiz results for these students
  const quizResults = await prisma.quizResult.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, createdAt: true, updatedAt: true },
  });

  // Fetch quiz attempts for additional activity signals
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, attemptedAt: true },
  });

  // Build per-user activity date maps
  const progressByUser = new Map<string, Date[]>();
  for (const p of progressRecords) {
    const dates = progressByUser.get(p.userId) || [];
    dates.push(new Date(p.updatedAt));
    progressByUser.set(p.userId, dates);
  }

  const quizByUser = new Map<string, Date[]>();
  for (const q of quizResults) {
    const dates = quizByUser.get(q.userId) || [];
    dates.push(new Date(q.createdAt));
    dates.push(new Date(q.updatedAt));
    quizByUser.set(q.userId, dates);
  }

  const attemptsByUser = new Map<string, Date[]>();
  for (const a of quizAttempts) {
    const dates = attemptsByUser.get(a.userId) || [];
    dates.push(new Date(a.attemptedAt));
    attemptsByUser.set(a.userId, dates);
  }

  // Group students by registration month (YYYY-MM)
  const cohortMap = new Map<string, Array<{ id: string; registrationDate: Date }>>();
  for (const student of students) {
    const regDate = new Date(student.createdAt);
    const ym = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}`;
    const cohort = cohortMap.get(ym) || [];
    cohort.push({ id: student.id, registrationDate: regDate });
    cohortMap.set(ym, cohort);
  }

  // Sort cohort keys chronologically
  const sortedCohortKeys = Array.from(cohortMap.keys()).sort();

  // Calculate retention for each cohort
  const cohorts = sortedCohortKeys.map((ym) => {
    const cohortStudents = cohortMap.get(ym)!;
    const totalStudents = cohortStudents.length;

    // Aggregate retention across all students in this cohort
    const aggregateRetention: RetentionWeeks = { week1: 0, week2: 0, week4: 0, week8: 0, week12: 0 };

    for (const student of cohortStudents) {
      const progressDates = progressByUser.get(student.id) || [];
      const quizDates = [
        ...(quizByUser.get(student.id) || []),
        ...(attemptsByUser.get(student.id) || []),
      ];

      const retention = calculateStudentRetention(student.registrationDate, progressDates, quizDates);

      aggregateRetention.week1 += retention.week1;
      aggregateRetention.week2 += retention.week2;
      aggregateRetention.week4 += retention.week4;
      aggregateRetention.week8 += retention.week8;
      aggregateRetention.week12 += retention.week12;
    }

    // Convert counts to percentages
    const retentionPercentages: RetentionWeeks = {
      week1: totalStudents > 0 ? Math.round((aggregateRetention.week1 / totalStudents) * 10000) / 100 : 0,
      week2: totalStudents > 0 ? Math.round((aggregateRetention.week2 / totalStudents) * 10000) / 100 : 0,
      week4: totalStudents > 0 ? Math.round((aggregateRetention.week4 / totalStudents) * 10000) / 100 : 0,
      week8: totalStudents > 0 ? Math.round((aggregateRetention.week8 / totalStudents) * 10000) / 100 : 0,
      week12: totalStudents > 0 ? Math.round((aggregateRetention.week12 / totalStudents) * 10000) / 100 : 0,
    };

    return {
      month: formatMonthLabel(ym),
      monthKey: ym,
      totalStudents,
      retention: retentionPercentages,
    };
  });

  // Calculate overall retention across all cohorts
  const overallAggregate: RetentionWeeks = { week1: 0, week2: 0, week4: 0, week8: 0, week12: 0 };
  for (const cohort of cohorts) {
    const w1 = (cohort.retention.week1 / 100) * cohort.totalStudents;
    const w2 = (cohort.retention.week2 / 100) * cohort.totalStudents;
    const w4 = (cohort.retention.week4 / 100) * cohort.totalStudents;
    const w8 = (cohort.retention.week8 / 100) * cohort.totalStudents;
    const w12 = (cohort.retention.week12 / 100) * cohort.totalStudents;

    overallAggregate.week1 += w1;
    overallAggregate.week2 += w2;
    overallAggregate.week4 += w4;
    overallAggregate.week8 += w8;
    overallAggregate.week12 += w12;
  }

  const totalStudentsAll = cohorts.reduce((sum, c) => sum + c.totalStudents, 0);
  const overallRetention: RetentionWeeks = {
    week1: totalStudentsAll > 0 ? Math.round((overallAggregate.week1 / totalStudentsAll) * 10000) / 100 : 0,
    week2: totalStudentsAll > 0 ? Math.round((overallAggregate.week2 / totalStudentsAll) * 10000) / 100 : 0,
    week4: totalStudentsAll > 0 ? Math.round((overallAggregate.week4 / totalStudentsAll) * 10000) / 100 : 0,
    week8: totalStudentsAll > 0 ? Math.round((overallAggregate.week8 / totalStudentsAll) * 10000) / 100 : 0,
    week12: totalStudentsAll > 0 ? Math.round((overallAggregate.week12 / totalStudentsAll) * 10000) / 100 : 0,
  };

  return NextResponse.json({ cohorts, overallRetention });
}
