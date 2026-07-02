import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
} from "@/lib/api-middleware";

const LEARNING_PATH: Array<{ id: string; name: string }> = [
  { id: "owasp-top-10", name: "OWASP Top 10" },
  { id: "sql-injection", name: "SQL Injection" },
  { id: "xss-attacks", name: "XSS Attacks" },
  { id: "csrf-attacks", name: "CSRF Attacks" },
  { id: "auth-security", name: "Authentication Security" },
  { id: "security-headers", name: "Security Headers" },
  { id: "secure-coding", name: "Secure Coding" },
  { id: "tools-lab", name: "Tools Lab" },
];

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "teacher")) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const groupId = searchParams.get("groupId") || undefined;

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const studentWhere: Record<string, unknown> = { role: "student" };
  if (groupId) studentWhere.group = groupId;

  const students = await prisma.user.findMany({
    where: studentWhere,
    select: { id: true },
  });

  const studentIds = students.map((s) => s.id);
  const totalStudents = students.length;

  const progressRecords = await prisma.progress.findMany({
    where: {
      userId: { in: studentIds },
      moduleId: { in: LEARNING_PATH.map((m) => m.id) },
      completed: true,
      updatedAt: { gte: since },
    },
    select: { userId: true, moduleId: true },
  });

  const completedByModule = new Map<string, Set<string>>();
  for (const m of LEARNING_PATH) {
    completedByModule.set(m.id, new Set());
  }

  for (const record of progressRecords) {
    const moduleSet = completedByModule.get(record.moduleId);
    if (moduleSet) {
      moduleSet.add(record.userId);
    }
  }

  const path = LEARNING_PATH.map((module) => {
    const completedCount = completedByModule.get(module.id)?.size || 0;
    const percentage =
      totalStudents > 0
        ? Math.round((completedCount / totalStudents) * 10000) / 100
        : 0;
    return {
      moduleId: module.id,
      moduleName: module.name,
      completedCount,
      percentage,
    };
  });

  return NextResponse.json({ path, totalStudents });
}
