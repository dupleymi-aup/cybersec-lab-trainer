import { prisma } from '@/lib/db';

/**
 * Admin Action Types
 */
export const ADMIN_ACTION_TYPES = {
  // User management
  USER_CREATE: 'user_create',
  USER_DELETE: 'user_delete',
  USER_BLOCKED: 'user_blocked',
  USER_UNBLOCKED: 'user_unblocked',
  ROLE_CHANGE: 'role_change',
  BULK_IMPORT: 'bulk_import',
  BULK_EXPORT: 'bulk_export',
  BULK_DELETE: 'bulk_delete',
  
  // Assignments
  ASSIGNMENT_CREATE: 'assignment_create',
  ASSIGNMENT_UPDATE: 'assignment_update',
  ASSIGNMENT_DELETE: 'assignment_delete',
  ASSIGNMENT_PUBLISH: 'assignment_publish',
  
  // Deadlines
  DEADLINE_CREATE: 'deadline_create',
  DEADLINE_UPDATE: 'deadline_update',
  DEADLINE_DELETE: 'deadline_delete',
  
  // Announcements
  ANNOUNCEMENT_CREATE: 'announcement_create',
  ANNOUNCEMENT_UPDATE: 'announcement_update',
  ANNOUNCEMENT_DELETE: 'announcement_delete',
  
  // CTF Labs
  CTF_LAB_CREATE: 'ctf_lab_create',
  CTF_LAB_UPDATE: 'ctf_lab_update',
  CTF_LAB_DELETE: 'ctf_lab_delete',
  
  // Grades
  GRADE_OVERRIDE: 'grade_override',
  GRADE_SYNC: 'grade_sync',
  
  // System
  IMPERSONATION_START: 'impersonation_start',
  IMPERSONATION_STOP: 'impersonation_stop',
  SYSTEM_CONFIG_CHANGE: 'system_config_change',
} as const;

/**
 * Target Types
 */
export const TARGET_TYPES = {
  USER: 'user',
  ASSIGNMENT: 'assignment',
  DEADLINE: 'deadline',
  ANNOUNCEMENT: 'announcement',
  CTF_LAB: 'ctf_lab',
  GRADE: 'grade',
  SYSTEM: 'system',
} as const;

export type AdminActionType = typeof ADMIN_ACTION_TYPES[keyof typeof ADMIN_ACTION_TYPES];
export type TargetType = typeof TARGET_TYPES[keyof typeof TARGET_TYPES];

/**
 * Log admin action to database
 */
export async function logAdminAction(data: {
  adminId: string;
  adminName: string;
  actionType: AdminActionType;
  targetType: TargetType;
  targetId: string;
  targetName?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        actionType: data.actionType,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName || '',
        details: data.details || '',
        metadata: data.metadata ? JSON.stringify(data.metadata) : '',
        ip: data.ip || '',
        userAgent: data.userAgent || '',
      },
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Get admin action statistics
 */
export async function getAdminActionStats(adminId?: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = {
    createdAt: { gte: since },
  };

  if (adminId) {
    where.adminId = adminId;
  }

  const [total, byActionType, byTargetType] = await Promise.all([
    prisma.adminAction.count({ where }),
    prisma.adminAction.groupBy({
      by: ['actionType'],
      where,
      _count: true,
      orderBy: { _count: { actionType: 'desc' } },
    }),
    prisma.adminAction.groupBy({
      by: ['targetType'],
      where,
      _count: true,
      orderBy: { _count: { targetType: 'desc' } },
    }),
  ]);

  return {
    total,
    byActionType: byActionType.map((a: { actionType: string; _count: number }) => ({
      actionType: a.actionType,
      count: a._count,
    })),
    byTargetType: byTargetType.map((t: { targetType: string; _count: number }) => ({
      targetType: t.targetType,
      count: t._count,
    })),
  };
}

/**
 * Get recent admin actions
 */
export async function getRecentAdminActions(limit = 20) {
  return prisma.adminAction.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
