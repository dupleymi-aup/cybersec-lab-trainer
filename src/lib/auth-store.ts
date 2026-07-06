import { create } from "zustand";
import { persist } from "zustand/middleware";
import { validateEmail, validatePhone, validatePassword } from "./auth-utils";
import { logger } from "@/lib/logger";

import type {
  UserRole,
  User,
  LoginActivityEntry,
  AuditAction,
  AuditLogEntry,
  TrendPoint,
  QuizQuestionStat,
  AchievementStat,
  AdminSummary,
  HeatmapData,
  ModulePerformance,
  ProgressDynamicsDay,
  AtRiskStudent,
  GroupComparisonDimension,
  QuizCategoryStat,
  ComprehensiveSummary,
  StudentPerformanceData,
  StudentComparisonData,
  GradebookData,
  LearningPathEntry,
  EngagementData,
  QuizTrajectoryPoint,
  CohortAnalysisData,
  QuizAttemptData,
  CompetencyRadarData,
  WeaknessAnalysis,
  PredictiveAnalyticsData,
  PredictiveInsight,
  Announcement,
  ModuleSettings,
  ModuleDeepDiveData,
  CertificationReadinessData,
  LearningVelocityData,
  QuizSessionData,
  GroupDynamicsData,
  LoginPatternsData,
  QuizDifficultyData,
  QuizRetryData,
  ErrorPatternsData,
  PredictiveRiskData,
  ScheduledReport,
} from "./auth-types";

import {
  getProgressTrends,
  getQuizQuestionAnalytics,
  getAchievementAnalytics,
  getAdminSummary,
  getActivityHeatmap,
  saveProgressSnapshot,
  saveQuizAttempts,
  getModulePerformance,
  getProgressDynamics,
  getAtRiskStudents,
  getGroupComparison,
  getQuizCategoryAnalytics,
  getComprehensiveSummary,
  getStudentPerformance,
  getStudentComparison,
  getGradebook,
  getEngagementAnalytics,
  getLearningPathAnalytics,
  getQuizTrajectory,
  getCohortAnalysis,
  getModuleDeepDive,
  getCertificationReadiness,
  getLearningVelocity,
  getQuizSessionAnalytics,
  getGroupDynamics,
  getLoginPatterns,
  getQuizRetryAnalytics,
  getErrorPatternsAnalytics,
  getPredictiveRisk,
} from "./analytics-api";
import { getCsrfHeaders } from "./csrf-client";

export type {
  UserRole,
  User,
  LoginActivityEntry,
  AuditAction,
  AuditLogEntry,
  TrendPoint,
  QuizQuestionStat,
  AchievementStat,
  AdminSummary,
  HeatmapData,
  ModulePerformance,
  ProgressDynamicsDay,
  AtRiskStudent,
  GroupComparisonDimension,
  QuizCategoryStat,
  ComprehensiveSummary,
  StudentPerformanceData,
  StudentComparisonData,
  GradebookData,
  LearningPathEntry,
  EngagementData,
  QuizTrajectoryPoint,
  CohortAnalysisData,
  QuizAttemptData,
  CompetencyRadarData,
  WeaknessAnalysis,
  PredictiveAnalyticsData,
  PredictiveInsight,
  Announcement,
  ModuleSettings,
  ModuleDeepDiveData,
  CertificationReadinessData,
  LearningVelocityData,
  QuizSessionData,
  GroupDynamicsData,
  LoginPatternsData,
  QuizDifficultyData,
  QuizRetryData,
  ErrorPatternsData,
  PredictiveRiskData,
  ScheduledReport,
};

import {
  hasRole,
  hasPermission,
  getRoleLabel,
  getRoleDescription,
} from "./auth-types";

export { hasRole, hasPermission, getRoleLabel, getRoleDescription };

// ─── API helpers ──────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  // Auth is now handled via httpOnly cookies sent automatically by the browser
  return { "Content-Type": "application/json" };
}

async function apiFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
        ...getCsrfHeaders(),
      },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Exported helper functions (used by AdminPanel, TeacherPanel, etc.) ──

export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await apiFetch("/api/users");
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("getAllUsers failed", { error: e });
    return [];
  }
}

export async function changeUserRole(
  userId: string,
  newRole: UserRole,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("changeUserRole failed", { error: e });
    return { success: false, error: "Network error" };
  }
}

export async function deleteUser(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("deleteUser failed", { error: e });
    return { success: false, error: "Network error" };
  }
}

export async function createUser(
  data: {
    email: string;
    phone: string;
    fullName: string;
    role: UserRole;
    group: string;
    course: string;
    university: string;
    inviteCode?: string;
  },
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!data.fullName.trim()) return { success: false, error: "Введите имя" };
  if (!validateEmail(data.email))
    return { success: false, error: "Неверный email" };
  if (!validatePhone(data.phone))
    return { success: false, error: "Неверный телефон" };

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid)
    return { success: false, error: pwCheck.errors.join(", ") };

  try {
    const res = await apiFetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ ...data, password }),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("createUser failed", { error: e });
    return { success: false, error: "Network error" };
  }
}

export async function updateUser(
  userId: string,
  data: Partial<
    Pick<
      User,
      "fullName" | "email" | "phone" | "group" | "course" | "university" | "bio"
    >
  >,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("updateUser failed", { error: e });
    return { success: false, error: "Network error" };
  }
}

export async function toggleUserBlock(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return { success: false, error: "Не авторизован" };
    if (currentUser.id === userId)
      return { success: false, error: "Нельзя заблокировать себя" };

    // Get current state first
    const users = await getAllUsers();
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, error: "Пользователь не найден" };

    const res = await apiFetch(`/api/users/${userId}/block`, {
      method: "PUT",
      body: JSON.stringify({ isBlocked: !targetUser.isBlocked }),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("toggleUserBlock failed", { error: e });
    return { success: false, error: "Network error" };
  }
}

export async function bulkDeleteUsers(
  userIds: string[],
  currentUserId: string,
): Promise<{ success: boolean; error?: string; count: number }> {
  if (userIds.includes(currentUserId))
    return { success: false, error: "Нельзя удалить себя", count: 0 };
  const results = await Promise.allSettled(userIds.map((id) => deleteUser(id)));
  const count = results.filter(
    (r) => r.status === "fulfilled" && r.value.success,
  ).length;
  return { success: count > 0, count };
}

export async function bulkChangeRole(
  userIds: string[],
  newRole: UserRole,
): Promise<{ success: boolean; error?: string; count: number }> {
  const results = await Promise.allSettled(
    userIds.map((id) => changeUserRole(id, newRole)),
  );
  const count = results.filter(
    (r) => r.status === "fulfilled" && r.value.success,
  ).length;
  return { success: count > 0, count };
}

export async function bulkToggleBlock(
  userIds: string[],
  currentUserId: string,
  _blocked: boolean,
): Promise<{ success: boolean; error?: string; count: number }> {
  const action = _blocked ? "заблокировать" : "разблокировать";
  if (userIds.includes(currentUserId))
    return { success: false, error: `Нельзя ${action} себя`, count: 0 };
  const results = await Promise.allSettled(
    userIds
      .filter((id) => id !== currentUserId)
      .map((id) => toggleUserBlock(id)),
  );
  const count = results.filter(
    (r) => r.status === "fulfilled" && r.value.success,
  ).length;
  return { success: count > 0, count };
}

// Audit log - now API-based
export async function addAuditLogEntry(
  adminName: string,
  action: AuditAction,
  targetId: string,
  targetName: string,
  details: string,
): Promise<void> {
  try {
    await apiFetch("/api/audit-log", {
      method: "POST",
      body: JSON.stringify({
        adminName,
        action,
        targetId,
        targetName,
        details,
      }),
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("Audit logging failed", { error: err });
    }
  }
}

export async function getAuditLogEntries(): Promise<AuditLogEntry[]> {
  try {
    const res = await apiFetch("/api/audit-log");
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("getAuditLogEntries failed", { error: e });
    return [];
  }
}

export async function clearAuditLog(
  daysOld = 90,
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - daysOld);

    // First do a dry run
    const dryRunRes = await apiFetch("/api/admin/audit-logs/clear", {
      method: "POST",
      body: JSON.stringify({
        olderThan: olderThan.toISOString(),
        dryRun: true,
      }),
    });
    if (!dryRunRes.ok) {
      const err = await dryRunRes.json();
      return { success: false, deletedCount: 0, error: err.error };
    }
    const dryRunData = await dryRunRes.json();

    // Only proceed if there are records to delete
    if (dryRunData.totalMatching === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Actually delete
    const res = await apiFetch("/api/admin/audit-logs/clear", {
      method: "POST",
      body: JSON.stringify({
        olderThan: olderThan.toISOString(),
        maxCount: 5000,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      return { success: false, deletedCount: 0, error: err.error };
    }
    const data = await res.json();
    return { success: true, deletedCount: data.deletedCount };
  } catch (err) {
    return {
      success: false,
      deletedCount: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid)
    return { success: false, error: pwCheck.errors.join(", ") };

  try {
    const res = await apiFetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("resetUserPassword failed", { error: e });
    return { success: false, error: "Network error" };
  }
}

const IMPERSONATION_KEY = "security-trainer-impersonation";

export async function startImpersonation(
  targetUserId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (targetUserId === adminId)
      return { success: false, error: "Нельзя войти как себя" };

    // Save admin user data before impersonating (so we can restore later)
    const currentUser = useAuthStore.getState().user;

    const res = await apiFetch("/api/auth/impersonate", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };

    // The server sets the impersonation token in httpOnly cookie
    if (typeof window !== "undefined") {
      localStorage.setItem(
        IMPERSONATION_KEY,
        JSON.stringify({
          isImpersonating: true,
          originalUserId: adminId,
          impersonatingUserId: targetUserId,
          startedAt: new Date().toISOString(),
          originalUserData: currentUser,
        }),
      );
    }

    useAuthStore.setState({ user: data.user, isAuthenticated: true });
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("startImpersonation failed", { error: e });
    return { success: false, error: "Network error" };
  }
}

export async function stopImpersonation(): Promise<{
  success: boolean;
  error?: string;
}> {
  const raw = localStorage.getItem(IMPERSONATION_KEY);
  if (!raw) return { success: false, error: "Нет активной имперсонации" };

  try {
    const data = JSON.parse(raw);
    if (!data.originalUserId)
      return { success: false, error: "Нет активной имперсонации" };

    const originalUserData = data.originalUserData;

    // Call server to re-issue admin JWT and set the auth cookie
    const res = await fetch("/api/auth/impersonate/stop", {
      method: "POST",
      headers: getCsrfHeaders(),
    });

    if (!res.ok) {
      // Fallback: restore from localStorage but warn that session may be invalid
      if (process.env.NODE_ENV === "development")
        logger.warn(
          "impersonate/stop failed, falling back to local restore",
        );
    }

    localStorage.removeItem(IMPERSONATION_KEY);

    const userData = originalUserData || data.originalUserData;
    if (userData) {
      useAuthStore.setState({
        user: userData,
        isAuthenticated: true,
      });
    }

    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("stopImpersonation failed", { error: e });
    return { success: false, error: "Ошибка завершения имперсонации" };
  }
}

export function getImpersonationState(): {
  isImpersonating: boolean;
  originalUserId: string | null;
  impersonatingUserId: string | null;
  startedAt: string | null;
} {
  if (typeof window === "undefined")
    return {
      isImpersonating: false,
      originalUserId: null,
      impersonatingUserId: null,
      startedAt: null,
    };
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    if (!raw)
      return {
        isImpersonating: false,
        originalUserId: null,
        impersonatingUserId: null,
        startedAt: null,
      };
    const data = JSON.parse(raw);
    return {
      isImpersonating: data.isImpersonating || false,
      originalUserId: data.originalUserId || null,
      impersonatingUserId: data.impersonatingUserId || null,
      startedAt: data.startedAt || null,
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("getImpersonationState failed", { error: e });
    return {
      isImpersonating: false,
      originalUserId: null,
      impersonatingUserId: null,
      startedAt: null,
    };
  }
}

// Group Management (operates via API user updates)
export async function getAllGroups(): Promise<string[]> {
  const users = await getAllUsers();
  return [...new Set(users.map((u) => u.group).filter(Boolean))].sort();
}

export async function renameGroup(
  oldName: string,
  newName: string,
): Promise<{ success: boolean; error?: string; count: number }> {
  if (!newName.trim())
    return {
      success: false,
      error: "Название группы не может быть пустым",
      count: 0,
    };

  const trimmedNew = newName.trim();
  const groups = await getAllGroups();
  if (groups.includes(trimmedNew) && trimmedNew !== oldName) {
    return {
      success: false,
      error: "Группа с таким названием уже существует",
      count: 0,
    };
  }

  const users = await getAllUsers();
  const usersInGroup = users.filter((u) => u.group === oldName);
  let count = 0;
  for (const u of usersInGroup) {
    const result = await updateUser(u.id, { group: trimmedNew });
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

export async function deleteGroup(
  groupName: string,
): Promise<{ success: boolean; error?: string; count: number }> {
  const users = await getAllUsers();
  const usersInGroup = users.filter((u) => u.group === groupName);
  let count = 0;
  for (const u of usersInGroup) {
    const result = await updateUser(u.id, { group: "" });
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

export async function assignUsersToGroup(
  userIds: string[],
  groupName: string,
): Promise<{ success: boolean; error?: string; count: number }> {
  if (!groupName.trim())
    return {
      success: false,
      error: "Название группы не может быть пустым",
      count: 0,
    };

  let count = 0;
  for (const id of userIds) {
    const result = await updateUser(id, { group: groupName.trim() });
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

// Get student progress for teacher panel
interface StudentProgress {
  moduleId: string;
  completed: boolean;
  score: number | null;
  sqlLevels?: unknown;
  xssLevels?: unknown;
  csrfSteps?: unknown;
  secureCodingAnswers?: unknown;
  secureCodingCorrectCount?: number;
  studiedOwaspItems?: string[];
  challengeScores?: unknown;
  updatedAt: string;
}

interface StudentQuizResult {
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  updatedAt: string;
}

export async function getStudentProgress(
  userId: string,
): Promise<{ progress: StudentProgress[]; quizResults: StudentQuizResult[] }> {
  try {
    const res = await apiFetch(`/api/progress/${userId}`);
    if (!res.ok) return { progress: [], quizResults: [] };
    return await res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("getStudentProgress failed", { error: e });
    return { progress: [], quizResults: [] };
  }
}

// Batch fetch student progress — replaces N individual API calls with one
export async function getBatchStudentProgress(
  userIds: string[],
): Promise<
  Record<
    string,
    { progress: StudentProgress[]; quizResults: StudentQuizResult[] }
  >
> {
  if (userIds.length === 0) return {};
  try {
    const res = await apiFetch(
      `/api/progress/batch?userIds=${userIds.join(",")}`,
    );
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("getBatchStudentProgress failed", { error: e });
    return {};
  }
}

// Get login activity for a user
export async function getLoginActivity(
  userId: string,
): Promise<LoginActivityEntry[]> {
  try {
    const res = await apiFetch(`/api/login-activity/${userId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.activities || [];
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("getLoginActivity failed", { error: e });
    return [];
  }
}

interface RecoveryState {
  otp: string;
  emailOrPhone: string;
  expiresAt: number;
}

// ─── Zustand Store ────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  recoveryState: RecoveryState | null;
  loginActivity: LoginActivityEntry[];

  login: (
    emailOrPhone: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; error?: string; retryAfter?: number }>;
  register: (
    data: {
      email: string;
      phone: string;
      fullName: string;
      role: UserRole;
      inviteCode?: string;
    },
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (
    oldPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  sendRecoveryOTP: (
    emailOrPhone: string,
  ) => Promise<{ success: boolean; error?: string; otp?: string }>;
  verifyRecoveryOTP: (otp: string) => Promise<boolean>;
  resetPassword: (
    otp: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (
    currentPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  clearLoginActivity: () => void;
  setUser: (user: User, token?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      recoveryState: null,
      loginActivity: [],

      login: async (emailOrPhone, password, rememberMe) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailOrPhone, password, rememberMe }),
          });
          const data = await res.json();

          if (!res.ok) {
            return {
              success: false,
              error: data.error,
              retryAfter: data.retryAfter,
            };
          }

          set({
            user: data.user,
            isAuthenticated: true,
          });

          import("./store")
            .then(({ invalidateTokenCache }) => invalidateTokenCache())
            .catch((e) => {
              if (process.env.NODE_ENV === "development")
                logger.warn("invalidateTokenCache failed", { error: e });
            });

          // Migrate anonymous progress to user
          const { migrateProgressToUser } = await import("./store");
          migrateProgressToUser(data.user.id);

          // Load user's progress from server
          const { useAppStore } = await import("./store");
          useAppStore
            .getState()
            .loadFromDatabase(data.user.id)
            .catch((e) => {
              if (process.env.NODE_ENV === "development")
                logger.warn("loadFromDatabase failed", { error: e });
            });

          return { success: true };
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("login failed", { error: e });
          return { success: false, error: "Network error" };
        }
      },

      register: async (data, password) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, password }),
          });
          const result = await res.json();

          if (!res.ok) {
            return { success: false, error: result.error };
          }

          set({
            user: result.user,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("register failed", { error: e });
          return { success: false, error: "Network error" };
        }
      },

      logout: async () => {
        import("./store")
          .then(({ invalidateTokenCache }) => invalidateTokenCache())
          .catch((e) => {
            if (process.env.NODE_ENV === "development")
              logger.warn("invalidateTokenCache failed", { error: e });
          });

        // Clear server-side httpOnly cookie
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: getCsrfHeaders(),
          });
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("logout API call failed", { error: e });
        }

        set({
          user: null,
          isAuthenticated: false,
          token: null,
          loginActivity: [],
        });
        import("./store")
          .then(({ useAppStore }) => {
            useAppStore.getState().setUserId(null);
          })
          .catch((e) => {
            if (process.env.NODE_ENV === "development")
              logger.warn("setUserId failed", { error: e });
          });
      },

      updateProfile: async (data) => {
        const { user } = get();
        if (!user) return;

        try {
          const res = await fetch("/api/auth/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...getCsrfHeaders(),
            },
            body: JSON.stringify(data),
          });

          if (res.ok) {
            const result = await res.json();
            set({ user: { ...user, ...data, ...result.user } });
          }
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("updateProfile failed", { error: e });
          // Update locally even if API fails
          set({ user: { ...user, ...data } });
        }
      },

      updatePassword: async (oldPassword, newPassword) => {
        const { user } = get();
        if (!user) return { success: false, error: "Пользователь не найден" };

        try {
          const res = await fetch("/api/auth/password", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...getCsrfHeaders(),
            },
            body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };
          return { success: true };
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("updatePassword failed", { error: e });
          return { success: false, error: "Network error" };
        }
      },

      sendRecoveryOTP: async (emailOrPhone) => {
        try {
          const res = await fetch("/api/auth/recovery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailOrPhone }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };

          set({
            recoveryState: {
              otp: "",
              emailOrPhone,
              expiresAt: Date.now() + 10 * 60 * 1000,
            },
          });
          return { success: true, otp: data.otp };
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("sendRecoveryOTP failed", { error: e });
          return { success: false, error: "Network error" };
        }
      },

      verifyRecoveryOTP: async (otp) => {
        const { recoveryState } = get();
        if (!recoveryState) return false;
        if (Date.now() > recoveryState.expiresAt) return false;

        try {
          const res = await fetch("/api/auth/recovery/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emailOrPhone: recoveryState.emailOrPhone,
              otp,
            }),
          });
          return res.ok;
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("verifyRecoveryOTP failed", { error: e });
          return false;
        }
      },

      resetPassword: async (otp, newPassword) => {
        const { recoveryState } = get();
        if (!recoveryState)
          return { success: false, error: "Сначала отправьте код" };
        if (Date.now() > recoveryState.expiresAt)
          return { success: false, error: "Код просрочен" };

        try {
          const res = await fetch("/api/auth/recovery/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emailOrPhone: recoveryState.emailOrPhone,
              newPassword,
              otp,
            }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };

          set({ recoveryState: null });
          return { success: true };
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("resetPassword failed", { error: e });
          return { success: false, error: "Network error" };
        }
      },

      deleteAccount: async (currentPassword: string) => {
        const { user } = get();
        if (!user) return { success: false, error: "Пользователь не найден" };
        if (!currentPassword)
          return { success: false, error: "Требуется подтверждение пароля" };

        try {
          const res = await fetch("/api/auth/delete", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...getCsrfHeaders(),
            },
            body: JSON.stringify({ currentPassword }),
          });
          if (!res.ok) {
            const data = await res.json();
            return { success: false, error: data.error };
          }

          set({ user: null, isAuthenticated: false, token: null });
          return { success: true };
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            logger.warn("deleteAccount failed", { error: e });
          return { success: false, error: "Network error" };
        }
      },

      clearLoginActivity: () => {
        set({ loginActivity: [] });
      },

      setUser: (user, token) => {
        set({ user, isAuthenticated: true, ...(token && { token }) });

        // Load user's progress from server
        import("./store")
          .then(({ useAppStore }) => {
            useAppStore.getState().loadFromDatabase(user.id);
          })
          .catch((e) => {
            if (process.env.NODE_ENV === "development")
              logger.warn("loadFromDatabase failed", { error: e });
          });
      },
    }),
    {
      name: "security-trainer-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // token is no longer persisted — it's stored in httpOnly cookies
      }),
    },
  ),
);

export {
  getProgressTrends,
  getQuizQuestionAnalytics,
  getAchievementAnalytics,
  getAdminSummary,
  getActivityHeatmap,
  saveProgressSnapshot,
  saveQuizAttempts,
  getModulePerformance,
  getProgressDynamics,
  getAtRiskStudents,
  getGroupComparison,
  getQuizCategoryAnalytics,
  getComprehensiveSummary,
  getStudentPerformance,
  getStudentComparison,
  getGradebook,
  getEngagementAnalytics,
  getLearningPathAnalytics,
  getQuizTrajectory,
  getCohortAnalysis,
  getModuleDeepDive,
  getCertificationReadiness,
  getLearningVelocity,
  getQuizSessionAnalytics,
  getGroupDynamics,
  getLoginPatterns,
  getQuizRetryAnalytics,
  getErrorPatternsAnalytics,
  getPredictiveRisk,
};
