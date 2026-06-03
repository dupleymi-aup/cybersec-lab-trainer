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
  emailOrPhone: z.string().min(1, 'Email or phone is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  phone: z.string().min(10, 'Invalid phone number').max(20),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(200),
  role: z.enum(['student', 'teacher', 'admin'], { message: 'Допустимые роли: student, teacher, admin' }),
  department: z.string().optional(),
  year: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
  semester: z.enum(["1", "2"]).optional(),
  inviteCode: z.string().max(100).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// User update validation
export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  phone: z.string().min(10).max(20).optional(),
  group: z.string().max(100).optional(),
  course: z.string().max(100).optional(),
  university: z.string().max(200).optional(),
  avatar: z.string().max(500).optional(),
  bio: z.string().max(1000).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Role change validation
export const roleChangeSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin'], { message: 'Допустимые роли: student, teacher, admin' }),
});

export type RoleChangeInput = z.infer<typeof roleChangeSchema>;

// Block/unblock validation
export const blockUserSchema = z.object({
  isBlocked: z.boolean(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

// Password change validation
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required').max(128),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// User creation validation (admin)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  phone: z.string().min(10, 'Invalid phone number').max(20),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(200),
  role: z.enum(['student', 'teacher', 'admin'], { message: 'Допустимые роли: student, teacher, admin' }).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  group: z.string().max(100).optional(),
  course: z.string().max(100).optional(),
  university: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().max(500).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Audit log creation validation
export const auditLogSchema = z.object({
  action: z.string().min(1).max(100),
  targetId: z.string().min(1).max(100),
  targetName: z.string().max(200).optional(),
  details: z.string().max(2000).optional(),
});

export type AuditLogInput = z.infer<typeof auditLogSchema>;

// Batch progress save validation
export const batchProgressSchema = z.object({
  progress: z.array(z.object({
    moduleId: z.string().max(100),
    completed: z.boolean().optional(),
    score: z.number().optional(),
    sqlLevels: z.array(z.string().max(100)).optional(),
    xssLevels: z.array(z.string().max(100)).optional(),
    csrfSteps: z.array(z.number()).optional(),
    secureCodingAnswers: z.array(z.number()).optional(),
    secureCodingCorrectCount: z.number().optional(),
    studiedOwaspItems: z.array(z.string().max(100)).optional(),
    challengeScores: z.unknown().optional(),
  })).optional(),
  quizResults: z.array(z.object({
    quizId: z.string().max(100),
    score: z.number(),
    total: z.number(),
  })).optional(),
});

export type BatchProgressInput = z.infer<typeof batchProgressSchema>;

// Assignment creation validation
export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().default(""),
  type: z.enum(["quiz", "code-review", "attack", "writeup", "custom"]),
  moduleId: z.string().max(100).optional().default(""),
  content: z.string().max(50000).optional().default(""),  // JSON string
  maxScore: z.number().int().min(1).max(1000).optional().default(100),
  passScore: z.number().int().min(0).max(100).optional().default(60),
  autoGrade: z.boolean().optional().default(false),
  timeLimit: z.number().int().min(1).optional(),  // minutes, undefined = no limit
  attempts: z.number().int().min(0).max(10).optional().default(1),
  group: z.string().max(100).optional().default(""),
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
  content: z.string().min(1, "Submission content required").max(50000),  // JSON string
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;

// Grade submission validation
export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0),
  passed: z.boolean(),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;

// XP action validation
export const xpActionSchema = z.object({
  action: z.string().min(1).max(100),
  moduleId: z.string().max(100).optional(),
});

export type XPActionInput = z.infer<typeof xpActionSchema>;

// Deadline creation validation
export const createDeadlineSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  dueAt: z.string().datetime('Invalid date format'),
  description: z.string().max(1000).optional().default(''),
  scope: z.enum(['course', 'module', 'quiz']).default('course'),
  scopeId: z.string().min(1, 'Scope ID is required').max(100),
});

export type CreateDeadlineInput = z.infer<typeof createDeadlineSchema>;

// Deadline update validation
export const updateDeadlineSchema = createDeadlineSchema.partial().extend({ group: z.string().max(100).optional() });

export type UpdateDeadlineInput = z.infer<typeof updateDeadlineSchema>;

// Quiz submission validation
export const quizSubmissionSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required').max(100),
  score: z.number().int().min(0, 'Score cannot be negative'),
  total: z.number().int().min(1, 'Total must be at least 1'),
  attempts: z.number().int().min(0).max(10).optional().default(1),
  answers: z.array(z.object({
    questionId: z.string().max(100),
    selectedAnswer: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
  })).optional(),
});

export type QuizSubmissionInput = z.infer<typeof quizSubmissionSchema>;

// Recovery request validation (email only)
export const recoveryRequestSchema = z.object({
  email: z.string().email('Invalid email').max(255),
});

export type RecoveryRequestInput = z.infer<typeof recoveryRequestSchema>;

// Recovery request validation (email or phone)
export const recoveryRequestEmailPhoneSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required').max(255),
});

export type RecoveryRequestEmailPhoneInput = z.infer<typeof recoveryRequestEmailPhoneSchema>;

// Admin announcement validation
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  expiresAt: z.string().datetime().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

// CSP report validation
export const cspReportSchema = z.object({
  'csp-report': z.object({
    'document-uri': z.string().optional(),
    'violated-directive': z.string().optional(),
    'original-policy': z.string().optional(),
    'disposition': z.string().optional(),
  }).optional(),
});

// Import users validation
export const importUsersSchema = z.object({
  users: z.array(z.object({
    email: z.string().email().max(255),
    phone: z.string().min(10).max(20),
    fullName: z.string().min(2).max(200),
    role: z.enum(['student', 'teacher', 'admin']).optional(),
    password: z.string().min(8).max(128).optional(),
    group: z.string().max(100).optional(),
    course: z.string().max(100).optional(),
    university: z.string().max(200).optional(),
  })),
});

export type ImportUsersInput = z.infer<typeof importUsersSchema>;

// Password reset for admin
export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
