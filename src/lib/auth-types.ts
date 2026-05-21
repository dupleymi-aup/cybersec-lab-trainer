export type UserRole = 'student' | 'teacher' | 'admin';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  admin: 2,
};

export function hasRole(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'student': return 'Студент';
    case 'teacher': return 'Преподаватель';
    case 'admin': return 'Администратор';
    default: return role;
  }
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  group: string;
  course: string;
  university: string;
  avatar: string;
  bio: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  isBlocked: boolean;
}

export interface LoginActivityEntry {
  timestamp: string;
  ip: string;
  userAgent: string;
  success: boolean;
  userId?: string;
  email?: string;
}

export type AuditAction =
  | 'role_change'
  | 'user_created'
  | 'user_deleted'
  | 'user_blocked'
  | 'user_unblocked'
  | 'password_reset'
  | 'impersonation_start'
  | 'impersonation_end'
  | 'user_updated'
  | 'bulk_delete'
  | 'bulk_role_change'
  | 'bulk_block'
  | 'group_renamed'
  | 'group_deleted'
  | 'group_users_reassigned';

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetId: string;
  targetName: string;
  timestamp: string;
  details: string;
}

export interface TrendPoint {
  date: string;
  modulesCompleted: number;
  avgQuizScore: number;
  activeStudents: number;
}

export interface QuizQuestionStat {
  questionId: string;
  questionText: string;
  category: string;
  difficulty: string;
  totalAttempts: number;
  correctCount: number;
  correctRate: number;
}

export interface AchievementStat {
  id: string;
  title: string;
  description: string;
  unlockedCount: number;
  totalCount: number;
  unlockRate: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
}

export interface AdminSummary {
  current: {
    totalStudents: number;
    activeStudents: number;
    activePercentage: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    totalQuizAttempts: number;
    totalLoginAttempts: number;
  };
  previous: {
    totalStudents: number;
    activeStudents: number;
    activePercentage: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    totalQuizAttempts: number;
    totalLoginAttempts: number;
  };
  trends: {
    students: 'up' | 'down' | 'stable';
    activity: 'up' | 'down' | 'stable';
    completion: 'up' | 'down' | 'stable';
    quizScore: 'up' | 'down' | 'stable';
  };
  byGroup?: Array<{ group: string; students: number; avgCompletion: number; avgQuizScore: number }>;
  byCourse?: Array<{ course: string; students: number; avgCompletion: number; avgQuizScore: number }>;
  byUniversity?: Array<{ university: string; students: number; avgCompletion: number; avgQuizScore: number }>;
}

export interface HeatmapData {
  dailyActivity: Array<{ date: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  weeklyActivity: Array<{ day: number; count: number }>;
  totalActivities: number;
  mostActiveDay: string;
  mostActiveHour: number;
  streakDays: number;
}

export interface ModulePerformance {
  moduleId: string;
  moduleName: string;
  totalStudents: number;
  completedCount: number;
  completionRate: number;
  avgScore: number;
  avgScoreForCompleted: number;
  difficultyIndex: number;
}

export interface ProgressDynamicsDay {
  date: string;
  modulesCompleted: number;
  modulesStarted: number;
  quizAttempts: number;
  avgQuizScore: number;
  activeStudents: number;
  newCompletions: number;
}

export interface AtRiskStudent {
  userId: string;
  fullName: string;
  email: string;
  group: string;
  course: string;
  university: string;
  riskScore: number;
  reasons: string[];
  lastActiveDays: number;
  modulesCompleted: number;
  avgQuizScore: number;
  quizAttempts: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface GroupComparisonDimension {
  name: string;
  studentCount: number;
  activeStudents: number;
  activeRate: number;
  avgModulesCompleted: number;
  avgCompletionRate: number;
  avgQuizScore: number;
  totalQuizAttempts: number;
  achievementRate: number;
  topModule: string;
  weakestModule: string;
}

export interface QuizCategoryStat {
  categoryId: string;
  categoryName: string;
  totalAttempts: number;
  uniqueStudents: number;
  avgScore: number;
  passRate: number;
  questionStats: Array<{
    questionId: string;
    questionText: string;
    attempts: number;
    correctRate: number;
    difficulty: string;
  }>;
}

export interface ComprehensiveSummary {
  kpis: {
    totalStudents: number;
    activeStudents: number;
    activePercentage: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    totalModulesCompleted: number;
    totalQuizAttempts: number;
    engagementScore: number;
  };
  trends: {
    students: 'up' | 'down' | 'stable';
    activity: 'up' | 'down' | 'stable';
    completion: 'up' | 'down' | 'stable';
    quizScore: 'up' | 'down' | 'stable';
  };
  previousKpis: {
    totalStudents: number;
    activeStudents: number;
    activePercentage: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    totalModulesCompleted: number;
    totalQuizAttempts: number;
    engagementScore: number;
  };
  moduleDistribution: Array<{ moduleId: string; moduleName: string; completionRate: number; avgScore: number }>;
  scoreDistribution: { excellent: number; good: number; average: number; poor: number; notAttempted: number };
  topPerformers: Array<{ userId: string; fullName: string; group: string; score: number }>;
  recentActivity: Array<{ type: string; userId: string; fullName: string; timestamp: string; details: string }>;
}

export interface StudentPerformanceData {
  profile: {
    id: string; fullName: string; email: string; group: string; course: string;
    university: string; avatar: string; role: string; createdAt: string;
    lastLoginAt: string | null; loginCount: number;
  };
  kpis: {
    modulesCompleted: number; totalModules: number; avgQuizScore: number;
    totalQuizAttempts: number; lastActiveDays: number; engagementScore: number; riskScore: number;
  };
  moduleProgress: Array<{ moduleId: string; moduleName: string; completed: boolean; score: number | null; updatedAt: string }>;
  quizResults: Array<{ quizId: string; score: number; total: number; percentage: number; createdAt: string; updatedAt: string }>;
  categoryBreakdown: Array<{ category: string; attempts: number; correctRate: number; avgScore: number }>;
  activityTimeline: Array<{ date: string; type: string; details: string }>;
  achievements: Array<{ id: string; title: string; description: string; unlocked: boolean; unlockedAt: string | null }>;
  moduleCompletionTimeline: Array<{ date: string; moduleId: string; score: number | null; completed: boolean }>;
  quizCategoryTrajectory: Array<{ week: string; category: string; avgScore: number; attempts: number }>;
  loginActivityTimeline: Array<{ date: string; count: number; successCount: number }>;
  skillsGap: Array<{ moduleId: string; studentScore: number; cohortAvg: number; gap: number; severity: 'low' | 'medium' | 'high' }>;
  recommendations: Array<{ type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }>;
}

export interface StudentComparisonData {
  students: Array<{
    id: string; fullName: string; group: string; avatar: string;
    modulesCompleted: number; avgQuizScore: number; totalQuizAttempts: number;
    lastActiveDays: number; engagementScore: number; riskScore: number;
    moduleScores: Record<string, number | null>;
    categoryScores: Record<string, number>;
  }>;
}

export interface GradebookData {
  students: Array<{
    id: string; fullName: string; email: string; group: string;
    moduleScores: Record<string, { completed: boolean; score: number | null }>;
    avgQuizScore: number; lastActive: string | null;
  }>;
  modules: Array<{ moduleId: string; moduleName: string }>;
}

export interface LearningPathEntry {
  moduleId: string;
  moduleName: string;
  completedCount: number;
  percentage: number;
}

export interface EngagementData {
  scoreDistribution: Array<{ range: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  weeklyPattern: Array<{ day: number; avgActivities: number }>;
  streakLeaderboard: Array<{ userId: string; fullName: string; streakDays: number }>;
  engagementTrend: Array<{ date: string; avgScore: number }>;
}

export interface QuizTrajectoryPoint {
  week: string;
  category: string;
  avgScore: number;
  attempts: number;
}

export interface QuizAttemptData {
  questionId: string;
  difficulty: string;
  category: string;
  correct: boolean;
}

export interface CohortRetentionData {
  week1: number;
  week2: number;
  week4: number;
  week8: number;
  week12: number;
}

export interface CohortData {
  month: string;
  monthKey: string;
  totalStudents: number;
  retention: CohortRetentionData;
}

export interface CohortAnalysisData {
  cohorts: CohortData[];
  overallRetention: CohortRetentionData;
}

export interface CompetencyRadarData {
  categories: Array<{
    name: string;
    studentAvg: number;
    groupAvg?: number;
    maxScore: number;
  }>;
  studentName?: string;
}

export interface WeaknessAnalysis {
  weaknesses: Array<{
    topic: string;
    category: string;
    score: number;
    studentCount: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendedActions: string[];
  }>;
  summary: {
    totalWeaknesses: number;
    criticalCount: number;
    highCount: number;
    mostAffectedCategory: string;
    topPriorityTopic: string;
  };
}

export interface PredictiveInsight {
  metric: string;
  currentValue: number;
  predictedValue: number;
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  daysAhead: number;
}

export interface PredictiveAnalyticsData {
  insights: PredictiveInsight[];
  atRiskTrend: Array<{ date: string; predicted: number; actual?: number }>;
  completionForecast: Array<{ date: string; predicted: number; lower: number; upper: number }>;
  recommendations: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  expiresAt?: string;
  priority: 'low' | 'normal' | 'high';
  active: boolean;
}

export interface ModuleSettings {
  moduleId: string;
  enabled: boolean;
  order: number;
  required: boolean;
  minScore?: number;
}

// ─── Module Deep-Dive ────────────────────────────────────────

export interface ModuleLevelProgress {
  level: number;
  started: number;
  completed: number;
  completionRate: number;
}

export interface ModuleDeepDiveData {
  moduleId: string;
  moduleName: string;
  levels: ModuleLevelProgress[];
  challengeScores: { range: string; count: number }[];
  totalStudents: number;
  avgScore: number;
  completionRate: number;
  studiedItemsCoverage?: Array<{ item: string; studiedCount: number; studiedRate: number }>;
  secureCodingDistribution?: { correctRange: string; count: number }[];
}

// ─── Certification Readiness ─────────────────────────────────

export interface CertificationCategoryReadiness {
  category: string;
  score: number;
  ready: boolean;
}

export interface CertificationStudentData {
  userId: string;
  fullName: string;
  email: string;
  group: string;
  readinessScore: number;
  readinessTier: 'ready' | 'almost' | 'needs-work' | 'not-ready';
  categoryReadiness: CertificationCategoryReadiness[];
  modulesCompleted: number;
  totalModules: number;
  achievements: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface CertificationReadinessData {
  students: CertificationStudentData[];
  summary: {
    ready: number;
    almost: number;
    needsWork: number;
    notReady: number;
    avgReadinessScore: number;
  };
}

// ─── Learning Velocity ───────────────────────────────────────

export interface StudentVelocity {
  userId: string;
  fullName: string;
  group: string;
  modulesCompleted: number;
  avgDaysPerModule: number;
  firstModuleDate: string;
  lastModuleDate: string;
  scoreImprovement: number;
  velocityScore: number;
}

export interface LearningVelocityData {
  studentVelocities: StudentVelocity[];
  velocityDistribution: { range: string; count: number }[];
  avgVelocityByGroup: { group: string; avgDaysPerModule: number; avgScoreImprovement: number }[];
  velocityOverTime: { week: string; avgDaysPerModule: number; avgScoreImprovement: number }[];
}

// ─── Quiz Session Analytics ──────────────────────────────────

export interface QuizSessionData {
  categoryTiming: { category: string; avgDuration: number; medianDuration: number; attemptCount: number }[];
  rushedQuizzes: { userId: string; fullName: string; category: string; duration: number; score: number; percentage: number; questionCount: number }[];
  timeVsPerformance: { durationBucket: string; avgPercentage: number; attemptCount: number }[];
  hourlyPerformance: { hour: number; avgPercentage: number; attemptCount: number }[];
  weekdayVsWeekend: { dayType: 'weekday' | 'weekend'; avgPercentage: number; attemptCount: number; avgDuration: number }[];
}

// ─── Group Dynamics ──────────────────────────────────────────

export interface GroupActivityWeek {
  week: string;
  activeStudents: number;
  modulesCompleted: number;
  quizAttempts: number;
}

export interface GroupDynamicsEntry {
  groupName: string;
  studentCount: number;
  activityTimeline: GroupActivityWeek[];
  performanceVariance: number;
  peerInfluenceScore: number;
  newMemberIntegrationDays: number;
  healthScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface GroupDynamicsData {
  groups: GroupDynamicsEntry[];
  overallTrends: { week: string; avgHealthScore: number; totalActive: number }[];
}

// ─── Login Patterns ──────────────────────────────────────────

export interface LoginFrequencyEntry {
  userId: string;
  fullName: string;
  group: string;
  loginCount: number;
  lastLogin: string;
  successRate: number;
}

export interface LoginPatternsData {
  loginFrequency: LoginFrequencyEntry[];
  failedLogins: { userId: string; fullName: string; count: number; recentAttempts: { timestamp: string; ip: string }[] }[];
  dormantAccounts: { userId: string; fullName: string; group: string; lastLogin: string; daysInactive: number }[];
  hourlyDistribution: { hour: number; loginCount: number }[];
  dailyDistribution: { day: string; loginCount: number }[];
}
