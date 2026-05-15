import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './auth-store';

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
  | 'quiz'
  | 'achievements'
  | 'profile'
  | 'teacher-panel'
  | 'admin-panel';

interface AppState {
  currentPage: PageType;
  sidebarOpen: boolean;
  completedModules: string[];
  quizScores: Record<string, number>;
  studiedOwaspItems: string[];
  sqlCompletedLevels: string[];
  xssCompletedLevels: string[];
  csrfCompletedSteps: number[];
  secureCodingAnsweredChallenges: number[];
  secureCodingCorrectCount: number;
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
  addSecureCodingAnswer: (idx: number) => void;
  removeSecureCodingAnswer: (idx: number) => void;
  setSecureCodingCorrectCount: (count: number) => void;
}

// Dynamic storage that uses the correct per-user localStorage key
function createDynamicStorage() {
  return createJSONStorage<AppState>(() => ({
    getItem: (name: string) => {
      const { user } = useAuthStore.getState();
      const userId = user?.id || 'anonymous';
      return localStorage.getItem(`${name}-${userId}`);
    },
    setItem: (name: string, value: string) => {
      const { user } = useAuthStore.getState();
      const userId = user?.id || 'anonymous';
      localStorage.setItem(`${name}-${userId}`, value);
    },
    removeItem: (name: string) => {
      const { user } = useAuthStore.getState();
      const userId = user?.id || 'anonymous';
      localStorage.removeItem(`${name}-${userId}`);
    },
  }));
}

// Listen for auth changes and migrate progress to user-specific key
function getStorageKey(userId: string | undefined) {
  const id = userId || 'anonymous';
  return `security-trainer-progress-${id}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'dashboard',
      sidebarOpen: false,
      completedModules: [],
      quizScores: {},
      studiedOwaspItems: [],
      sqlCompletedLevels: [],
      xssCompletedLevels: [],
      csrfCompletedSteps: [],
      secureCodingAnsweredChallenges: [],
      secureCodingCorrectCount: 0,
      setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      completeModule: (moduleId) =>
        set((s) => ({
          completedModules: s.completedModules.includes(moduleId)
            ? s.completedModules
            : [...s.completedModules, moduleId],
        })),
      setQuizScore: (category, score) =>
        set((s) => ({
          quizScores: { ...s.quizScores, [category]: score },
        })),
      resetProgress: () =>
        set({
          completedModules: [],
          quizScores: {},
          studiedOwaspItems: [],
          sqlCompletedLevels: [],
          xssCompletedLevels: [],
          csrfCompletedSteps: [],
          secureCodingAnsweredChallenges: [],
          secureCodingCorrectCount: 0,
        }),
      addStudiedOwasp: (id) =>
        set((s) => ({
          studiedOwaspItems: s.studiedOwaspItems.includes(id)
            ? s.studiedOwaspItems
            : [...s.studiedOwaspItems, id],
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
      setSecureCodingCorrectCount: (count) =>
        set({ secureCodingCorrectCount: count }),
    }),
    {
      name: 'security-trainer-progress',
      storage: createDynamicStorage(),
    }
  )
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
