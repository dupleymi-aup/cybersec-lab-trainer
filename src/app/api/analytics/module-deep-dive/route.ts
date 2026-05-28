import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

const MODULE_NAMES: Record<string, string> = {
  'owasp': 'OWASP Top 10',
  'sql-injection': 'SQL-инъекции',
  'xss': 'XSS-атаки',
  'csrf': 'CSRF-атаки',
  'auth': 'Аутентификация',
  'secure-coding': 'Безопасное кодирование',
  'tools': 'Инструменты',
  'security-headers': 'Заголовки безопасности',
  'idor': 'IDOR',
  'ssrf': 'SSRF',
};

const MODULE_LEVEL_COUNTS: Record<string, number> = {
  'owasp': 10,
  'sql-injection': 11,
  'xss': 6,
  'csrf': 1,
  'auth': 5,
  'secure-coding': 25,
  'tools': 5,
  'security-headers': 5,
  'idor': 5,
  'ssrf': 5,
};

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const groupId = searchParams.get('groupId');

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const userFilter: Prisma.UserWhereInput = { role: 'student' };
  if (groupId) userFilter.group = groupId;

  const students = await prisma.user.findMany({
    where: userFilter,
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);
  const totalStudents = students.length;

  const progress = await prisma.progress.findMany({
    where: { userId: { in: studentIds }, updatedAt: { gte: since } },
    select: {
      moduleId: true,
      score: true,
      completed: true,
      sqlLevels: true,
      xssLevels: true,
      csrfSteps: true,
      secureCodingAnswers: true,
      secureCodingCorrectCount: true,
      studiedOwaspItems: true,
      challengeScores: true,
    },
  });

  const results: Array<{
    moduleId: string;
    moduleName: string;
    levels: Array<{ level: number; started: number; completed: number; completionRate: number }>;
    challengeScores: Array<{ range: string; min: number; max: number; count: number }>;
    totalStudents: number;
    avgScore: number;
    completionRate: number;
    studiedItemsCoverage?: Array<{ item: string; studiedCount: number; studiedRate: number }>;
    secureCodingDistribution?: Array<{ correctRange: string; min: number; max: number; count: number }>;
  }> = [];

  for (const [moduleId, levelCount] of Object.entries(MODULE_LEVEL_COUNTS)) {
    const moduleProgress = progress.filter((p) => p.moduleId === moduleId);
    const completedCount = moduleProgress.filter((p) => p.completed).length;
    const avgScore = moduleProgress.length > 0
      ? Math.round(moduleProgress.filter((p) => p.score != null).reduce((sum, p) => sum + (p.score ?? 0), 0) / Math.max(1, moduleProgress.filter((p) => p.score != null).length))
      : 0;

    // Level-by-level analysis
    const levels: Array<{ level: number; started: number; completed: number; completionRate: number }> = [];
    for (let level = 1; level <= levelCount; level++) {
      let startedCount = 0;
      let completedCountForLevel = 0;

      for (const p of moduleProgress) {
        let levelData: string[] = [];
        if (moduleId === 'sql-injection') levelData = p.sqlLevels ? p.sqlLevels.split(',') : [];
        else if (moduleId === 'xss') levelData = p.xssLevels ? p.xssLevels.split(',') : [];
        else if (moduleId === 'csrf') {
          const steps = p.csrfSteps ? p.csrfSteps.split(',').map(Number) : [];
          levelData = steps.map(String);
        } else if (moduleId === 'secure-coding') {
          const answers = p.secureCodingAnswers ? p.secureCodingAnswers.split(',') : [];
          if (level <= answers.length) {
            startedCount++;
            completedCountForLevel++;
            continue;
          }
        } else {
          // For other modules, use completed as level completion indicator
          if (p.completed) {
            startedCount++;
            completedCountForLevel++;
            continue;
          }
        }

        if (levelData.includes(String(level))) startedCount++;
        if (p.completed && level <= levelCount) completedCountForLevel++;
      }

      // For modules without granular levels, simplify
      if (!['sql-injection', 'xss', 'csrf', 'secure-coding'].includes(moduleId)) {
        levels.push({
          level,
          started: completedCount,
          completed: completedCount,
          completionRate: totalStudents > 0 ? Math.round((completedCount / totalStudents) * 10000) / 100 : 0,
        });
      } else {
        levels.push({
          level,
          started: startedCount,
          completed: completedCountForLevel,
          completionRate: totalStudents > 0 ? Math.round((startedCount / totalStudents) * 10000) / 100 : 0,
        });
      }
    }

    // Challenge score distribution
    const challengeRanges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];
    for (const p of moduleProgress) {
      if (p.challengeScores) {
        try {
          const scores = JSON.parse(p.challengeScores);
          const values = Object.values(scores).filter((v): v is number => typeof v === 'number');
          for (const v of values) {
            for (const r of challengeRanges) {
              if (v >= r.min && v <= r.max) { r.count++; break; }
            }
          }
        } catch (e) {
          logger.error('Module deep dive failed', { error: String(e) });
      }
    }

    // OWASP studied items coverage
    let studiedItemsCoverage: Array<{ item: string; studiedCount: number; studiedRate: number }> | undefined;
    if (moduleId === 'owasp') {
      const allItems = new Set<string>();
      const itemCounts: Record<string, number> = {};
      for (const p of moduleProgress) {
        if (p.studiedOwaspItems) {
          const items = p.studiedOwaspItems.split(',');
          for (const item of items) {
            allItems.add(item);
            itemCounts[item] = (itemCounts[item] || 0) + 1;
          }
        }
      }
      studiedItemsCoverage = Array.from(allItems).map((item) => ({
        item,
        studiedCount: itemCounts[item] || 0,
        studiedRate: totalStudents > 0 ? Math.round(((itemCounts[item] || 0) / totalStudents) * 10000) / 100 : 0,
      }));
    }

    // Secure coding distribution
    let secureCodingDistribution: Array<{ correctRange: string; min: number; max: number; count: number }> | undefined;
    if (moduleId === 'secure-coding') {
      const ranges = [
        { correctRange: '0-5', min: 0, max: 5, count: 0 },
        { correctRange: '6-10', min: 6, max: 10, count: 0 },
        { correctRange: '11-15', min: 11, max: 15, count: 0 },
        { correctRange: '16-20', min: 16, max: 20, count: 0 },
        { correctRange: '21-25', min: 21, max: 25, count: 0 },
      ];
      for (const p of moduleProgress) {
        for (const r of ranges) {
          if (p.secureCodingCorrectCount >= r.min && p.secureCodingCorrectCount <= r.max) { r.count++; break; }
        }
      }
      secureCodingDistribution = ranges;
    }

    results.push({
      moduleId,
      moduleName: MODULE_NAMES[moduleId] || moduleId,
      levels,
      challengeScores: challengeRanges,
      totalStudents,
      avgScore,
      completionRate: totalStudents > 0 ? Math.round((completedCount / totalStudents) * 10000) / 100 : 0,
      studiedItemsCoverage,
      secureCodingDistribution,
    });
  }

  return NextResponse.json({ modules: results });
}
}
