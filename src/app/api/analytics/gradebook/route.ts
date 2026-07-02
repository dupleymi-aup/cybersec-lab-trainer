import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
} from "@/lib/api-middleware";
import { getModuleName } from "@/lib/module-names";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "teacher")) return forbidden();

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const course = searchParams.get("course");
  const university = searchParams.get("university");

  // Build user filter
  const userFilter: Prisma.UserWhereInput = { role: "student" };
  if (groupId) userFilter.group = groupId;
  if (course) userFilter.course = course;
  if (university) userFilter.university = university;

  // Get students
  const students = await prisma.user.findMany({
    where: userFilter,
    select: {
      id: true,
      fullName: true,
      email: true,
      group: true,
    },
    orderBy: { fullName: "asc" },
  });

  const studentIds = students.map((s) => s.id);

  // Get progress for all students
  const progressRecords = await prisma.progress.findMany({
    where: { userId: { in: studentIds } },
    select: {
      userId: true,
      moduleId: true,
      completed: true,
      score: true,
      updatedAt: true,
    },
  });

  // Get quiz results
  const quizResults = await prisma.quizResult.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, percentage: true, updatedAt: true },
  });

  // Get unique module IDs
  const moduleIds = Array.from(new Set(progressRecords.map((p) => p.moduleId)));
  const modules = moduleIds.map((id) => ({
    moduleId: id,
    moduleName: getModuleName(id),
  }));

  // Build student data
  const studentData = students.map((student) => {
    const studentProgress = progressRecords.filter(
      (p) => p.userId === student.id,
    );
    const studentQuizResults = quizResults.filter(
      (q) => q.userId === student.id,
    );

    const avgQuizScore =
      studentQuizResults.length > 0
        ? Math.round(
            (studentQuizResults.reduce((sum, q) => sum + q.percentage, 0) /
              studentQuizResults.length) *
              10,
          ) / 10
        : 0;

    // Last active date
    const lastActivityDate =
      studentProgress.length > 0 || studentQuizResults.length > 0
        ? new Date(
            Math.max(
              ...studentProgress.map((p) => p.updatedAt.getTime()),
              ...studentQuizResults.map((q) => q.updatedAt.getTime()),
            ),
          )
        : null;

    // Module scores
    const moduleScores: Record<
      string,
      { completed: boolean; score: number | null }
    > = {};
    for (const progress of studentProgress) {
      moduleScores[progress.moduleId] = {
        completed: progress.completed,
        score: progress.score,
      };
    }

    return {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      group: student.group,
      moduleScores,
      avgQuizScore,
      lastActive: lastActivityDate ? lastActivityDate.toISOString() : null,
    };
  });

  return NextResponse.json({
    students: studentData,
    modules,
  });
}
