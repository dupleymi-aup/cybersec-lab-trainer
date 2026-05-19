import { z } from 'zod';

// Progress save validation
export const progressSchema = z.object({
  type: z.literal('progress'),
  payload: z.object({
    moduleId: z.string().min(1, 'Module ID is required'),
    completed: z.boolean(),
    score: z.number().min(0).max(100).optional(),
  }),
});

export type ProgressInput = z.infer<typeof progressSchema>;

// Quiz results validation
export const quizResultsSchema = z.object({
  type: z.literal('quiz-answers'),
  payload: z.object({
    quizId: z.string().min(1, 'Quiz ID is required'),
    score: z.number().min(0),
    total: z.number().min(1),
  }),
});

export type QuizResultsInput = z.infer<typeof quizResultsSchema>;

// Combined API request schema
export const apiRequestSchema = z.discriminatedUnion('type', [
  progressSchema,
  quizResultsSchema,
]);

export type ApiRequest = z.infer<typeof apiRequestSchema>;

// Validation helper
export function validateApiInput(data: unknown): ApiRequest {
  return apiRequestSchema.parse(data);
}

// Auth validation schemas
export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'teacher', 'admin']),
  inviteCode: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// User update validation
export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  group: z.string().optional(),
  course: z.string().optional(),
  university: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Role change validation
export const roleChangeSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']),
});

export type RoleChangeInput = z.infer<typeof roleChangeSchema>;

// Block/unblock validation
export const blockUserSchema = z.object({
  isBlocked: z.boolean(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

// Password change validation
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// User creation validation (admin)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  group: z.string().optional(),
  course: z.string().optional(),
  university: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Audit log creation validation
export const auditLogSchema = z.object({
  action: z.string().min(1),
  targetId: z.string().min(1),
  targetName: z.string().optional(),
  details: z.string().optional(),
});

export type AuditLogInput = z.infer<typeof auditLogSchema>;

// Batch progress save validation
export const batchProgressSchema = z.object({
  progress: z.array(z.object({
    moduleId: z.string(),
    completed: z.boolean().optional(),
    score: z.number().optional(),
    sqlLevels: z.array(z.string()).optional(),
    xssLevels: z.array(z.string()).optional(),
    csrfSteps: z.array(z.number()).optional(),
    secureCodingAnswers: z.array(z.number()).optional(),
    secureCodingCorrectCount: z.number().optional(),
    studiedOwaspItems: z.array(z.string()).optional(),
    challengeScores: z.unknown().optional(),
  })).optional(),
  quizResults: z.array(z.object({
    quizId: z.string(),
    score: z.number(),
    total: z.number(),
  })).optional(),
});

export type BatchProgressInput = z.infer<typeof batchProgressSchema>;
