import { prisma } from '@/lib/db';

export interface CtfLabWithStats {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  difficulty: string;
  type: string;
  points: number;
  isActive: boolean;
  order: number;
  instructions: string;
  hint: string;
  tags: { id: string; name: string }[];
  submissionsCount: number;
  completionRate: number;
}

export async function getCtfLabsWithStats(moduleId?: string): Promise<CtfLabWithStats[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };
  if (moduleId) {
    where.moduleId = moduleId;
  }

  const labs = await prisma.ctfLab.findMany({
    where,
    include: { tags: true },
    orderBy: { order: 'asc' },
  });

  const labsWithStats = await Promise.all(
    labs.map(async (lab) => {
      const [submissionsCount, correctSubmissions] = await Promise.all([
        prisma.ctfSubmission.count({ where: { labId: lab.id } }),
        prisma.ctfSubmission.count({
          where: { labId: lab.id, isCorrect: true },
        }),
      ]);

      const completionRate = submissionsCount > 0
        ? Math.round((correctSubmissions / submissionsCount) * 100)
        : 0;

      return {
        ...lab,
        submissionsCount,
        completionRate,
      } as CtfLabWithStats;
    })
  );

  return labsWithStats;
}

export async function getLabWithCompletion(labId: string, userId: string) {
  const lab = await prisma.ctfLab.findUnique({
    where: { id: labId },
    include: { tags: true },
  });

  if (!lab) return null;

  const submission = await prisma.ctfSubmission.findFirst({
    where: { labId, userId, isCorrect: true },
  });

  return {
    ...lab,
    isCompleted: !!submission,
    submission,
  };
}

export async function getStudentCtfStats(userId: string) {
  const [completed, total, xpEarned] = await Promise.all([
    prisma.ctfSubmission.count({
      where: { userId, isCorrect: true },
    }),
    prisma.ctfLab.count({ where: { isActive: true } }),
    prisma.xpLog.aggregate({
      where: { userId, action: 'ctf_lab_complete' },
      _sum: { amount: true },
    }),
  ]);

  return {
    completed,
    total,
    xpEarned: xpEarned._sum.amount || 0,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
