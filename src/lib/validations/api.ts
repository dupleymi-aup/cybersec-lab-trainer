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
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

// Assignment creation validation
export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  type: z.enum(["quiz", "code-review", "attack", "writeup", "custom"]),
  moduleId: z.string().optional().default(""),
  content: z.string().optional().default(""),  // JSON string
  maxScore: z.number().int().min(1).max(1000).optional().default(100),
  passScore: z.number().int().min(0).max(100).optional().default(60),
  autoGrade: z.boolean().optional().default(false),
  timeLimit: z.number().int().min(1).optional(),  // minutes, undefined = no limit
  attempts: z.number().int().min(0).max(10).optional().default(1),
  group: z.string().optional().default(""),
  dueAt: z.string().datetime().optional(),  // ISO date string
  published: z.boolean().optional().default(false),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

// Assignment update validation
export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  published: z.boolean().optional(),
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

// Assignment submission validation
export const submitAssignmentSchema = z.object({
  content: z.string().min(1, "Submission content required"),  // JSON string
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;

// Grade submission validation
export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0),
  passed: z.boolean(),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
