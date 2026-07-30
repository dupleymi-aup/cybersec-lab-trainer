import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { quizCategories, modules } from '@/lib/data';
import { NotificationHelper } from './notification-store';
import { getCurrentUserId, saveProgressSnapshotProxy } from './auth-bridge';
import { logger } from './logger';

// ─── API client ───────────────────────────────────────────────

export async function getAuthHeaders(): Promise<Record<string, string>> {
  // Auth is now handled via httpOnly cookies sent automatically by the browser
  return { 'Content-Type': 'application/json' };
}

/** No-op kept for backwards compatibility */
export function invalidateTokenCache() {
  // No longer needed — tokens are in httpOnly cookies
}

const apiClient = {
  async saveProgress(moduleId: string, completed: boolean, score?: number) {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ moduleId, completed, score }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to save progress');
    }
    return response.json();
  },

  async saveFullProgress(data: {
    moduleId: string;
    completed?: boolean;
    score?: number;
    sqlLevels?: string[];
    xssLevels?: string[];
    csrfSteps?: number[];
    csrfChallengeScores?: { id: number; correct: boolean }[];
    secureCodingAnswers?: number[];
    secureCodingCorrectCount?: number;
    studiedOwaspItems?: string[];
    challengeScores?: unknown;
  }) {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to save progress');
    }
    return response.json();
  },

  async saveQuizResults(quizId: string, score: number, total: number) {
    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ quizId, score, total }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to save quiz results');
    }
    return response.json();
  },

  async loadProgress() {
    const response = await fetch('/api/progress', {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to load progress');
    }
    return response.json();
  },

  async batchSave(progress: unknown[], quizResults: unknown[]) {
    const response = await fetch('/api/progress/batch', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ progress, quizResults }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to batch save');
    }
    return response.json();
  },
};

// ─── Sync logic ───────────────────────────────────────────────
interface AppActions {
  setCurrentPage: (page: PageType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  completeModule: (moduleId: string) => void;
  setQuizScore: (category: string, score: number) => void;
  resetProgress: () => void;
  addStudiedOwasp: (id: string) => void;
  addSqlLevel: (level: string) => void;
  addXssLevel: (level: string) => void;
  addCsrfStep: (step: number) => void;
  addCsrfChallengeAnswer: (id: number, correct: boolean) => void;
  addSecureCodingAnswer: (idx: number) => void;
  removeSecureCodingAnswer: (idx: number) => void;
  setSecureCodingCorrectCount: (count: number) => void;
  setOwaspChallengeScore: (correct: number, answered: number[]) => void;
  setAuthChallengeScore: (correct: number, answered: number[]) => void;
  setHeadersChallengeScore: (correct: number, answered: number[]) => void;
  setUserId: (userId: string | null) => void;
  syncWithDatabase: () => Promise<void>;
  loadFromDatabase: (userId: string) => Promise<void>;
}

type AppStore = AppState & AppActions;

const syncWithDatabase = async (state: AppState, set: (partial: Partial<AppStore>) => void) => {
  if (!state.userId) {
    set({ syncStatus: 'idle' });
    return;
  }

  set({ syncStatus: 'syncing' });
  try {
    // Build full progress array for all modules
    const progress: Record<string, unknown>[] = state.completedModules.map((moduleId) => ({
      moduleId,
      completed: true,
      score: 100,
    }));

    // Add detailed progress for lab modules
    if (state.sqlCompletedLevels.length > 0) {
      progress.push({
        moduleId: 'sql-injection',
        sqlLevels: state.sqlCompletedLevels,
        completed: state.completedModules.includes('sql-injection'),
      });
    }
    if (state.xssCompletedLevels.length > 0) {
      progress.push({
        moduleId: 'xss',
        xssLevels: state.xssCompletedLevels,
        completed: state.completedModules.includes('xss'),
      });
    }
    if (state.csrfCompletedSteps.length > 0) {
      progress.push({
        moduleId: 'csrf',
        csrfSteps: state.csrfCompletedSteps,
        csrfChallengeScores: state.csrfChallengeScores,
        completed: state.completedModules.includes('csrf'),
      });
    }
    if (state.secureCodingAnsweredChallenges.length > 0) {
      progress.push({
        moduleId: 'secure-coding',
        secureCodingAnswers: state.secureCodingAnsweredChallenges,
        secureCodingCorrectCount: state.secureCodingCorrectCount,
        completed: state.completedModules.includes('secure-coding'),
      });
    }
    if (state.studiedOwaspItems.length > 0) {
      progress.push({
        moduleId: 'owasp',
        studiedOwaspItems: state.studiedOwaspItems,
        completed: state.completedModules.includes('owasp'),
      });
    }

    // Add challenge scores
    const challengeModules = [
      { moduleId: 'owasp-challenge', data: state.owaspChallengeScores },
      { moduleId: 'auth-challenge', data: state.authChallengeScores },
      { moduleId: 'headers-challenge', data: state.headersChallengeScores },
    ];
    for (const cm of challengeModules) {
      if (cm.data.answered.length > 0) {
        progress.push({
          moduleId: cm.moduleId,
          challengeScores: cm.data,
        });
      }
    }

    // Build quiz results array
    const quizResults = Object.entries(state.quizScores).map(([quizId, percentage]) => {
      const total = quizCategories.find((c) => c.id === quizId)?.count ?? 100;
      const score = Math.round((percentage / 100) * total);
      return { quizId, score, total };
    });

    await apiClient.batchSave(progress, quizResults);

    // Save ProgressSnapshot records for each module (fire-and-forget)
    for (const p of progress) {
      const score = typeof p.score === 'number' ? p.score : 0;
      const completed = p.completed === true;
      saveProgressSnapshotProxy(p.moduleId as string, score, completed).catch((err) => {
        logger.warn('Failed to save progress snapshot', {
          moduleId: p.moduleId,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    set({ syncStatus: 'synced', lastSyncedAt: new Date() });
  } catch (e) {
    logger.error('Sync error', {
      error: e instanceof Error ? e.message : String(e),
    });
    set({ syncStatus: 'error' });
  }
};

const loadFromDatabase = async (
  set: (partial: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void,
  userId: string,
) => {
  try {
    const data = await apiClient.loadProgress();

    set((s) => ({
      completedModules: data.completedModules || s.completedModules,
      quizScores: data.quizScores || s.quizScores,
      ...(data.progress &&
        data.progress.length > 0 &&
        (() => {
          const updates: Record<string, unknown> = {};
          for (const p of data.progress) {
            if (p.sqlLevels) updates.sqlCompletedLevels = p.sqlLevels;
            if (p.xssLevels) updates.xssCompletedLevels = p.xssLevels;
            if (p.csrfSteps) updates.csrfCompletedSteps = p.csrfSteps;
            if (p.csrfChallengeScores) updates.csrfChallengeScores = p.csrfChallengeScores;
            if (p.secureCodingAnswers) updates.secureCodingAnsweredChallenges = p.secureCodingAnswers;
            if (p.secureCodingCorrectCount !== undefined) updates.secureCodingCorrectCount = p.secureCodingCorrectCount;
            if (p.studiedOwaspItems) updates.studiedOwaspItems = p.studiedOwaspItems;
            if (p.challengeScores) {
              if (p.moduleId === 'owasp-challenge') updates.owaspChallengeScores = p.challengeScores;
              if (p.moduleId === 'auth-challenge') updates.authChallengeScores = p.challengeScores;
              if (p.moduleId === 'headers-challenge') updates.headersChallengeScores = p.challengeScores;
            }
          }
          return updates;
        })()),
      userId,
      syncStatus: 'synced' as const,
      lastSyncedAt: new Date(),
    }));
  } catch (e) {
    logger.error('Load error', {
      error: e instanceof Error ? e.message : String(e),
    });
    set({ syncStatus: 'error', userId });
  }
};

export type PageType =
  | 'dashboard'
  | 'owasp'
  | 'sql-injection'
  | 'xss'
  | 'csrf'
  | 'auth'
  | 'secure-coding'
  | 'tools'
  | 'security-headers'
  | 'idor'
  | 'ssrf'
  | 'api-security'
  | 'phishing-analyzer'
  | 'career-paths'
  | 'quiz'
  | 'achievements'
  | 'cheat-sheets'
  | 'password-checker'
  | 'profile'
  | 'teacher-panel'
  | 'admin-panel'
  | 'leaderboard'
  | 'assignments';

interface AppState {
  currentPage: PageType;
  sidebarOpen: boolean;
  completedModules: string[];
  quizScores: Record<string, number>;
  moduleTimestamps: Record<string, string>;
  quizTimestamps: Record<string, string>;
  studiedOwaspItems: string[];
  sqlCompletedLevels: string[];
  xssCompletedLevels: string[];
  csrfCompletedSteps: number[];
  csrfChallengeScores: { correct: number; total: number; answered: number[] };
  secureCodingAnsweredChallenges: number[];
  secureCodingCorrectCount: number;
  owaspChallengeScores: { correct: number; total: number; answered: number[] };
  authChallengeScores: { correct: number; total: number; answered: number[] };
  headersChallengeScores: {
    correct: number;
    total: number;
    answered: number[];
  };
  userId: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: Date | null;
  setCurrentPage: (page: PageType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  completeModule: (moduleId: string) => void;
  setQuizScore: (category: string, score: number) => void;
  resetProgress: () => void;
  addStudiedOwasp: (id: string) => void;
  addSqlLevel: (level: string) => void;
  addXssLevel: (level: string) => void;
  addCsrfStep: (step: number) => void;
  addCsrfChallengeAnswer: (id: number, correct: boolean) => void;
  addSecureCodingAnswer: (idx: number) => void;
  removeSecureCodingAnswer: (idx: number) => void;
  setSecureCodingCorrectCount: (count: number) => void;
  setOwaspChallengeScore: (correct: number, answered: number[]) => void;
  setAuthChallengeScore: (correct: number, answered: number[]) => void;
  setHeadersChallengeScore: (correct: number, answered: number[]) => void;
  setUserId: (userId: string | null) => void;
}

// Type for what actually gets persisted (matches partialize output)
type PersistedState = Pick<
  AppState,
  | 'currentPage'
  | 'sidebarOpen'
  | 'completedModules'
  | 'quizScores'
  | 'moduleTimestamps'
  | 'quizTimestamps'
  | 'studiedOwaspItems'
  | 'sqlCompletedLevels'
  | 'xssCompletedLevels'
  | 'csrfCompletedSteps'
  | 'csrfChallengeScores'
  | 'secureCodingAnsweredChallenges'
  | 'secureCodingCorrectCount'
  | 'owaspChallengeScores'
  | 'authChallengeScores'
  | 'headersChallengeScores'
>;

// Dynamic storage that uses the correct per-user localStorage key
function createDynamicStorage() {
  return createJSONStorage<PersistedState>(() => ({
    getItem: (name: string) => {
      try {
        const userId = getCurrentUserId();
        return localStorage.getItem(`${name}-${userId}`);
      } catch (e) {
        logger.warn('Store: localStorage getItem failed', { name, error: String(e) });
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        const userId = getCurrentUserId();
        localStorage.setItem(`${name}-${userId}`, value);
      } catch (e) {
        logger.warn('Store: localStorage setItem failed', { name, error: String(e) });
      }
    },
    removeItem: (name: string) => {
      try {
        const userId = getCurrentUserId();
        localStorage.removeItem(`${name}-${userId}`);
      } catch (e) {
        logger.warn('Store: localStorage removeItem failed', { name, error: String(e) });
      }
    },
  }));
}

// Listen for auth changes and migrate progress to user-specific key
function getStorageKey(userId: string | undefined) {
  const id = userId || 'anonymous';
  return `security-trainer-progress-${id}`;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      sidebarOpen: false,
      completedModules: [],
      quizScores: {},
      moduleTimestamps: {},
      quizTimestamps: {},
      studiedOwaspItems: [],
      sqlCompletedLevels: [],
      xssCompletedLevels: [],
      csrfCompletedSteps: [],
      csrfChallengeScores: { correct: 0, total: 0, answered: [] },
      secureCodingAnsweredChallenges: [],
      secureCodingCorrectCount: 0,
      owaspChallengeScores: { correct: 0, total: 0, answered: [] },
      authChallengeScores: { correct: 0, total: 0, answered: [] },
      headersChallengeScores: { correct: 0, total: 0, answered: [] },
      userId: null,
      syncStatus: 'idle',
      lastSyncedAt: null,
      setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      completeModule: (moduleId) => {
        set((s) => {
          const alreadyCompleted = s.completedModules.includes(moduleId);
          if (alreadyCompleted) return s;
          const mod = modules.find((m) => m.id === moduleId);
          if (mod) {
            NotificationHelper.moduleCompleted(mod.title);
          }
          return {
            completedModules: [...s.completedModules, moduleId],
            moduleTimestamps: {
              ...s.moduleTimestamps,
              [moduleId]: new Date().toISOString(),
            },
          };
        });
      },
      setQuizScore: (category, score) => {
        set((s) => ({
          quizScores: { ...s.quizScores, [category]: score },
          quizTimestamps: {
            ...s.quizTimestamps,
            [category]: new Date().toISOString(),
          },
        }));
      },
      resetProgress: () =>
        set((s) => ({
          completedModules: [],
          quizScores: {},
          moduleTimestamps: {},
          quizTimestamps: {},
          studiedOwaspItems: [],
          sqlCompletedLevels: [],
          xssCompletedLevels: [],
          csrfCompletedSteps: [],
          csrfChallengeScores: { correct: 0, total: 0, answered: [] },
          secureCodingAnsweredChallenges: [],
          secureCodingCorrectCount: 0,
          owaspChallengeScores: { correct: 0, total: 0, answered: [] },
          authChallengeScores: { correct: 0, total: 0, answered: [] },
          headersChallengeScores: { correct: 0, total: 0, answered: [] },
          userId: s.userId,
          syncStatus: 'idle' as const,
          lastSyncedAt: null,
        })),
      addStudiedOwasp: (id) =>
        set((s) => ({
          studiedOwaspItems: s.studiedOwaspItems.includes(id) ? s.studiedOwaspItems : [...s.studiedOwaspItems, id],
        })),
      addSqlLevel: (level) =>
        set((s) => ({
          sqlCompletedLevels: s.sqlCompletedLevels.includes(level)
            ? s.sqlCompletedLevels
            : [...s.sqlCompletedLevels, level],
        })),
      addXssLevel: (level) =>
        set((s) => ({
          xssCompletedLevels: s.xssCompletedLevels.includes(level)
            ? s.xssCompletedLevels
            : [...s.xssCompletedLevels, level],
        })),
      addCsrfStep: (step) =>
        set((s) => ({
          csrfCompletedSteps: s.csrfCompletedSteps.includes(step)
            ? s.csrfCompletedSteps
            : [...s.csrfCompletedSteps, step],
        })),
      addCsrfChallengeAnswer: (id, correct) =>
        set((s) => {
          const already = s.csrfChallengeScores.answered.includes(id);
          if (already) return s;
          return {
            csrfChallengeScores: {
              correct: s.csrfChallengeScores.correct + (correct ? 1 : 0),
              total: s.csrfChallengeScores.total + 1,
              answered: [...s.csrfChallengeScores.answered, id],
            },
          };
        }),
      addSecureCodingAnswer: (idx) =>
        set((s) => ({
          secureCodingAnsweredChallenges: s.secureCodingAnsweredChallenges.includes(idx)
            ? s.secureCodingAnsweredChallenges
            : [...s.secureCodingAnsweredChallenges, idx],
        })),
      removeSecureCodingAnswer: (idx) =>
        set((s) => ({
          secureCodingAnsweredChallenges: s.secureCodingAnsweredChallenges.filter((i) => i !== idx),
        })),
      setSecureCodingCorrectCount: (count) => set({ secureCodingCorrectCount: count }),
      setOwaspChallengeScore: (correct, answered) => {
        set({
          owaspChallengeScores: { correct, total: answered.length, answered },
        });
      },
      setAuthChallengeScore: (correct, answered) => {
        set({
          authChallengeScores: { correct, total: answered.length, answered },
        });
      },
      setHeadersChallengeScore: (correct, answered) => {
        set({
          headersChallengeScores: { correct, total: answered.length, answered },
        });
      },
      setUserId: (uid) => set({ userId: uid }),
      syncWithDatabase: async () => {
        await syncWithDatabase(get(), set);
      },
      loadFromDatabase: async (userId: string) => {
        await loadFromDatabase(set, userId);
      },
    }),
    {
      name: 'security-trainer-progress',
      storage: createDynamicStorage(),
      partialize: (state) => ({
        currentPage: state.currentPage,
        sidebarOpen: state.sidebarOpen,
        completedModules: state.completedModules,
        quizScores: state.quizScores,
        moduleTimestamps: state.moduleTimestamps,
        quizTimestamps: state.quizTimestamps,
        studiedOwaspItems: state.studiedOwaspItems,
        sqlCompletedLevels: state.sqlCompletedLevels,
        xssCompletedLevels: state.xssCompletedLevels,
        csrfCompletedSteps: state.csrfCompletedSteps,
        csrfChallengeScores: state.csrfChallengeScores,
        secureCodingAnsweredChallenges: state.secureCodingAnsweredChallenges,
        secureCodingCorrectCount: state.secureCodingCorrectCount,
        owaspChallengeScores: state.owaspChallengeScores,
        authChallengeScores: state.authChallengeScores,
        headersChallengeScores: state.headersChallengeScores,
        // syncStatus and lastSyncedAt are runtime-only, not persisted
      }),
    },
  ),
);

// Migrate progress to user-specific storage on login
export function migrateProgressToUser(userId: string) {
  const anonKey = 'security-trainer-progress-anonymous';
  const userKey = getStorageKey(userId);
  const data = localStorage.getItem(anonKey);
  if (data) {
    localStorage.setItem(userKey, data);
    localStorage.removeItem(anonKey);
  }
  // Rehydrate the store so it picks up the user key immediately
  useAppStore.persist.rehydrate();
}

// Export apiClient for use in components that need direct API calls
export { apiClient };
