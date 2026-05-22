import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from './auth-utils';

import type {
  UserRole, User, LoginActivityEntry, AuditAction, AuditLogEntry,
  TrendPoint, QuizQuestionStat, AchievementStat, AdminSummary,
  HeatmapData, ModulePerformance, ProgressDynamicsDay, AtRiskStudent,
  GroupComparisonDimension, QuizCategoryStat, ComprehensiveSummary,
  StudentPerformanceData, StudentComparisonData, GradebookData,
  LearningPathEntry, EngagementData, QuizTrajectoryPoint,
  CohortAnalysisData, QuizAttemptData,
  CompetencyRadarData, WeaknessAnalysis, PredictiveAnalyticsData,
  PredictiveInsight, Announcement, ModuleSettings,
  ModuleDeepDiveData, CertificationReadinessData, LearningVelocityData,
  QuizSessionData, GroupDynamicsData, LoginPatternsData, QuizDifficultyData, QuizRetryData, ErrorPatternsData, PredictiveRiskData, ScheduledReport,
} from './auth-types';

import {
  getProgressTrends, getQuizQuestionAnalytics, getAchievementAnalytics,
  getAdminSummary, getActivityHeatmap, saveProgressSnapshot, saveQuizAttempts,
  getModulePerformance, getProgressDynamics, getAtRiskStudents,
  getGroupComparison, getQuizCategoryAnalytics, getComprehensiveSummary,
  getStudentPerformance, getStudentComparison, getGradebook,
  getEngagementAnalytics, getLearningPathAnalytics, getQuizTrajectory,
  getCohortAnalysis,
  getModuleDeepDive, getCertificationReadiness, getLearningVelocity,
  getQuizSessionAnalytics, getGroupDynamics, getLoginPatterns,
} from './analytics-api';

export type { UserRole, User, LoginActivityEntry, AuditAction, AuditLogEntry,
  TrendPoint, QuizQuestionStat, AchievementStat, AdminSummary,
  HeatmapData, ModulePerformance, ProgressDynamicsDay, AtRiskStudent,
  GroupComparisonDimension, QuizCategoryStat, ComprehensiveSummary,
  StudentPerformanceData, StudentComparisonData, GradebookData,
  LearningPathEntry, EngagementData, QuizTrajectoryPoint,
  CohortAnalysisData, QuizAttemptData,
  CompetencyRadarData, WeaknessAnalysis, PredictiveAnalyticsData,
  PredictiveInsight, Announcement, ModuleSettings,
  ModuleDeepDiveData, CertificationReadinessData, LearningVelocityData,
  QuizSessionData, GroupDynamicsData, LoginPatternsData, QuizDifficultyData, QuizRetryData, ErrorPatternsData, PredictiveRiskData, ScheduledReport,
};

import { hasRole, getRoleLabel } from './auth-types';

export const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || (process.env.NODE_ENV === 'development' ? 'CYBERSEC-ADMIN-2024' : '');

export function validateAdminInviteCode(code: string): boolean {
  const expected = process.env.ADMIN_INVITE_CODE || 'CYBERSEC-ADMIN-2024';
  return code.trim().toUpperCase() === expected;
}

export { hasRole, getRoleLabel };

// ─── API helpers ──────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  const { token } = useAuthStore.getState();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
}

// ─── Exported helper functions (used by AdminPanel, TeacherPanel, etc.) ──

export async function getAllUsers(): Promise<User[]> {
  const res = await apiFetch('/api/users');
  if (!res.ok) return [];
  const data = await res.json();
  return data.users || [];
}

export async function changeUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
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
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!data.fullName.trim()) return { success: false, error: 'Введите имя' };
  if (!validateEmail(data.email)) return { success: false, error: 'Неверный email' };
  if (!validatePhone(data.phone)) return { success: false, error: 'Неверный телефон' };

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) return { success: false, error: pwCheck.errors.join(', ') };

  if (data.role === 'admin' && !validateAdminInviteCode(data.inviteCode || '')) {
    return { success: false, error: 'Неверный код приглашения' };
  }

  try {
    const res = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ ...data, password }),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<User, 'fullName' | 'email' | 'phone' | 'group' | 'course' | 'university' | 'bio'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function toggleUserBlock(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return { success: false, error: 'Не авторизован' };
    if (currentUser.id === userId) return { success: false, error: 'Нельзя заблокировать себя' };

    // Get current state first
    const users = await getAllUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return { success: false, error: 'Пользователь не найден' };

    const res = await apiFetch(`/api/users/${userId}/block`, {
      method: 'PUT',
      body: JSON.stringify({ isBlocked: !targetUser.isBlocked }),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function bulkDeleteUsers(userIds: string[], currentUserId: string): Promise<{ success: boolean; error?: string; count: number }> {
  if (userIds.includes(currentUserId)) return { success: false, error: 'Нельзя удалить себя', count: 0 };
  let count = 0;
  for (const id of userIds) {
    const result = await deleteUser(id);
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

export async function bulkChangeRole(userIds: string[], newRole: UserRole): Promise<{ success: boolean; error?: string; count: number }> {
  let count = 0;
  for (const id of userIds) {
    const result = await changeUserRole(id, newRole);
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

export async function bulkToggleBlock(userIds: string[], currentUserId: string, _blocked: boolean): Promise<{ success: boolean; error?: string; count: number }> {
  if (userIds.includes(currentUserId)) return { success: false, error: 'Нельзя заблокировать себя', count: 0 };
  let count = 0;
  for (const id of userIds) {
    if (id !== currentUserId) {
      const result = await toggleUserBlock(id);
      if (result.success) count++;
    }
  }
  return { success: count > 0, count };
}

// Audit log - now API-based
export async function addAuditLogEntry(
  adminId: string,
  adminName: string,
  action: AuditAction,
  targetId: string,
  targetName: string,
  details: string
): Promise<void> {
  try {
    await apiFetch('/api/audit-log', {
      method: 'POST',
      body: JSON.stringify({ action, targetId, targetName, details }),
    });
  } catch {
    // Silently fail - audit logging is best-effort
  }
}

export async function getAuditLogEntries(): Promise<AuditLogEntry[]> {
  try {
    const res = await apiFetch('/api/audit-log');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch {
    return [];
  }
}

export async function clearAuditLog(): Promise<void> {
  // No API endpoint for clearing - just a no-op for now
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  _adminId: string
): Promise<{ success: boolean; error?: string }> {
  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) return { success: false, error: pwCheck.errors.join(', ') };

  try {
    const res = await apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

const IMPERSONATION_KEY = 'security-trainer-impersonation';
const ORIGINAL_TOKEN_KEY = 'security-trainer-original-token';

export async function startImpersonation(
  targetUserId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (targetUserId === adminId) return { success: false, error: 'Нельзя войти как себя' };

    // Store the original admin token before impersonation
    const { token: originalToken } = useAuthStore.getState();
    if (originalToken) {
      localStorage.setItem(ORIGINAL_TOKEN_KEY, originalToken);
    }

    const res = await apiFetch('/api/auth/impersonate', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };

    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({
      isImpersonating: true,
      originalUserId: adminId,
      impersonatingUserId: targetUserId,
      startedAt: new Date().toISOString(),
    }));

    useAuthStore.setState({ user: data.user, isAuthenticated: true, token: data.token });
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function stopImpersonation(): Promise<{ success: boolean; error?: string }> {
  const raw = localStorage.getItem(IMPERSONATION_KEY);
  if (!raw) return { success: false, error: 'Нет активной имперсонации' };

  try {
    const data = JSON.parse(raw);
    if (!data.originalUserId) return { success: false, error: 'Нет активной имперсонации' };

    // Restore the original admin token
    const originalToken = localStorage.getItem(ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);

    // Fetch original user data
    const res = await fetch(`/api/users/${data.originalUserId}`, {
      headers: originalToken ? { Authorization: `Bearer ${originalToken}` } : {},
    });
    if (!res.ok) return { success: false, error: 'Не удалось восстановить аккаунт' };

    const userData = await res.json();
    useAuthStore.setState({
      user: userData,
      isAuthenticated: true,
      token: originalToken,
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Ошибка завершения имперсонации' };
  }
}

export function getImpersonationState(): { isImpersonating: boolean; originalUserId: string | null; impersonatingUserId: string | null; startedAt: string | null } {
  if (typeof window === 'undefined') return { isImpersonating: false, originalUserId: null, impersonatingUserId: null, startedAt: null };
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return { isImpersonating: false, originalUserId: null, impersonatingUserId: null, startedAt: null };
    const data = JSON.parse(raw);
    return {
      isImpersonating: data.isImpersonating || false,
      originalUserId: data.originalUserId || null,
      impersonatingUserId: data.impersonatingUserId || null,
      startedAt: data.startedAt || null,
    };
  } catch {
    return { isImpersonating: false, originalUserId: null, impersonatingUserId: null, startedAt: null };
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
  _adminId: string
): Promise<{ success: boolean; error?: string; count: number }> {
  if (!newName.trim()) return { success: false, error: 'Название группы не может быть пустым', count: 0 };

  const trimmedNew = newName.trim();
  const groups = await getAllGroups();
  if (groups.includes(trimmedNew) && trimmedNew !== oldName) {
    return { success: false, error: 'Группа с таким названием уже существует', count: 0 };
  }

  const users = await getAllUsers();
  const usersInGroup = users.filter(u => u.group === oldName);
  let count = 0;
  for (const u of usersInGroup) {
    const result = await updateUser(u.id, { group: trimmedNew });
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

export async function deleteGroup(
  groupName: string,
  _adminId: string
): Promise<{ success: boolean; error?: string; count: number }> {
  const users = await getAllUsers();
  const usersInGroup = users.filter(u => u.group === groupName);
  let count = 0;
  for (const u of usersInGroup) {
    const result = await updateUser(u.id, { group: '' });
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

export async function assignUsersToGroup(
  userIds: string[],
  groupName: string,
  _adminId: string
): Promise<{ success: boolean; error?: string; count: number }> {
  if (!groupName.trim()) return { success: false, error: 'Название группы не может быть пустым', count: 0 };

  let count = 0;
  for (const id of userIds) {
    const result = await updateUser(id, { group: groupName.trim() });
    if (result.success) count++;
  }
  return { success: count > 0, count };
}

// Get student progress for teacher panel
export async function getStudentProgress(userId: string): Promise<{ progress: unknown[]; quizResults: unknown[] }> {
  try {
    const res = await apiFetch(`/api/progress/${userId}`);
    if (!res.ok) return { progress: [], quizResults: [] };
    return await res.json();
  } catch {
    return { progress: [], quizResults: [] };
  }
}

// Get login activity for a user
export async function getLoginActivity(userId: string): Promise<LoginActivityEntry[]> {
  try {
    const res = await apiFetch(`/api/login-activity/${userId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.activities || [];
  } catch {
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

  login: (emailOrPhone: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; retryAfter?: number }>;
  register: (
    data: { email: string; phone: string; fullName: string; role: UserRole; inviteCode?: string },
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendRecoveryOTP: (emailOrPhone: string) => Promise<{ success: boolean; error?: string; otp?: string }>;
  verifyRecoveryOTP: (otp: string) => Promise<boolean>;
  resetPassword: (otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
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
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            token: data.token,
          });

          // Migrate anonymous progress to user
          const { migrateProgressToUser } = await import('./store');
          migrateProgressToUser(data.user.id);

          // Load user's progress from server
          const { useAppStore } = await import('./store');
          useAppStore.getState().loadFromDatabase(data.user.id);

          return { success: true };
        } catch {
          return { success: false, error: 'Network error' };
        }
      },

      register: async (data, password) => {
        if (data.role === 'admin' && !validateAdminInviteCode(data.inviteCode || '')) {
          return { success: false, error: 'Неверный код приглашения для роли администратора' };
        }

        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, password }),
          });
          const result = await res.json();

          if (!res.ok) {
            return { success: false, error: result.error };
          }

          set({
            user: result.user,
            isAuthenticated: true,
            token: result.token,
          });

          return { success: true };
        } catch {
          return { success: false, error: 'Network error' };
        }
      },

      logout: async () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          loginActivity: [],
        });
        import('./store').then(({ useAppStore }) => {
          useAppStore.getState().setUserId(null);
        });
      },

      updateProfile: async (data) => {
        const { user, token } = get();
        if (!user) return;

        try {
          const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
          });

          if (res.ok) {
            const result = await res.json();
            set({ user: { ...user, ...data, ...result.user } });
          }
        } catch {
          // Update locally even if API fails
          set({ user: { ...user, ...data } });
        }
      },

      updatePassword: async (oldPassword, newPassword) => {
        const { user, token } = get();
        if (!user) return { success: false, error: 'Пользователь не найден' };

        try {
          const res = await fetch('/api/auth/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };
          return { success: true };
        } catch {
          return { success: false, error: 'Network error' };
        }
      },

      sendRecoveryOTP: async (emailOrPhone) => {
        try {
          const res = await fetch('/api/auth/recovery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrPhone }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };

          set({
            recoveryState: {
              otp: '',
              emailOrPhone,
              expiresAt: Date.now() + 10 * 60 * 1000,
            },
          });
          return { success: true, otp: data.otp };
        } catch {
          return { success: false, error: 'Network error' };
        }
      },

      verifyRecoveryOTP: async (otp) => {
        const { recoveryState } = get();
        if (!recoveryState) return false;
        if (Date.now() > recoveryState.expiresAt) return false;

        try {
          const users = await getAllUsers();
          const found = users.find(
            (u) =>
              u.email.toLowerCase() === recoveryState.emailOrPhone.toLowerCase() ||
              u.phone.replace(/[\s\-()]/g, '') === recoveryState.emailOrPhone.replace(/[\s\-()]/g, '')
          );
          if (!found) return false;

          const res = await fetch('/api/auth/recovery/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: found.id, otp }),
          });
          return res.ok;
        } catch {
          return false;
        }
      },

      resetPassword: async (otp, newPassword) => {
        const { recoveryState } = get();
        if (!recoveryState) return { success: false, error: 'Сначала отправьте код' };
        if (Date.now() > recoveryState.expiresAt) return { success: false, error: 'Код просрочен' };

        try {
          const users = await getAllUsers();
          const found = users.find(
            (u) =>
              u.email.toLowerCase() === recoveryState.emailOrPhone.toLowerCase() ||
              u.phone.replace(/[\s\-()]/g, '') === recoveryState.emailOrPhone.replace(/[\s\-()]/g, '')
          );
          if (!found) return { success: false, error: 'Аккаунт не найден' };

          const res = await fetch('/api/auth/recovery/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: found.id, newPassword, otp }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };

          set({ recoveryState: null });
          return { success: true };
        } catch {
          return { success: false, error: 'Network error' };
        }
      },

      deleteAccount: async () => {
        const { user, token } = get();
        if (!user) return { success: false, error: 'Пользователь не найден' };

        try {
          const res = await fetch('/api/auth/delete', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            const data = await res.json();
            return { success: false, error: data.error };
          }

          set({ user: null, isAuthenticated: false, token: null });
          return { success: true };
        } catch {
          return { success: false, error: 'Network error' };
        }
      },

      clearLoginActivity: () => {
        set({ loginActivity: [] });
      },

      setUser: (user, token) => {
        set({ user, isAuthenticated: true, ...(token && { token }) });

        // Load user's progress from server
        import('./store').then(({ useAppStore }) => {
          useAppStore.getState().loadFromDatabase(user.id);
        });
      },
    }),
    {
      name: 'security-trainer-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);

export {
  getProgressTrends, getQuizQuestionAnalytics, getAchievementAnalytics,
  getAdminSummary, getActivityHeatmap, saveProgressSnapshot, saveQuizAttempts,
  getModulePerformance, getProgressDynamics, getAtRiskStudents,
  getGroupComparison, getQuizCategoryAnalytics, getComprehensiveSummary,
  getStudentPerformance, getStudentComparison, getGradebook,
  getEngagementAnalytics, getLearningPathAnalytics, getQuizTrajectory,
  getCohortAnalysis,
  getModuleDeepDive, getCertificationReadiness, getLearningVelocity,
  getQuizSessionAnalytics, getGroupDynamics, getLoginPatterns,
};
