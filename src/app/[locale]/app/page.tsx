'use client';

import dynamic from 'next/dynamic';
import { useAppStore, type PageType } from '@/lib/store';
import { logger } from '@/lib/logger';
import {
  useAuthStore,
  hasRole,
  getRoleLabel,
  getImpersonationState,
  stopImpersonation,
  saveProgressSnapshot,
  type UserRole,
} from '@/lib/auth-store';
import { initAuthBridge } from '@/lib/auth-bridge';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { useMemo, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import DashboardSkeleton from '@/components/security-trainer/DashboardSkeleton';

const ModuleLoader = () => (
  <div className="flex min-h-[200px] items-center justify-center py-12">
    <Loader2 className="text-primary h-8 w-8 animate-spin" />
  </div>
);

const DashboardLoader = () => <DashboardSkeleton />;

const Sidebar = dynamic(() => import('@/components/security-trainer/Sidebar'), {
  ssr: false,
  loading: ModuleLoader,
});
const Dashboard = dynamic(() => import('@/components/security-trainer/Dashboard'), {
  ssr: false,
  loading: DashboardLoader,
});
const PWAHandler = dynamic(() => import('@/components/security-trainer/PWAHandler'), { ssr: false });
const OnboardingTour = dynamic(() => import('@/components/security-trainer/OnboardingTour'), { ssr: false });
const ModuleNavigation = dynamic(() => import('@/components/security-trainer/ModuleNavigation'), { ssr: false });
const KeyboardShortcuts = dynamic(() => import('@/components/security-trainer/KeyboardShortcuts'), { ssr: false });
const CompletionCelebration = dynamic(() => import('@/components/security-trainer/CompletionCelebration'), {
  ssr: false,
});
const OfflineBanner = dynamic(() => import('@/components/security-trainer/OfflineBanner'), { ssr: false });

const modulePageIds = [
  'owasp',
  'sql-injection',
  'xss',
  'csrf',
  'auth',
  'secure-coding',
  'tools',
  'security-headers',
  'idor',
  'ssrf',
  'api-security',
  'phishing-analyzer',
  'career-paths',
];

const ModuleWrapper = ({ name, children, pageId }: { name: string; children: React.ReactNode; pageId?: string }) => (
  <ErrorBoundary name={name}>
    {children}
    {pageId && modulePageIds.includes(pageId) && <ModuleNavigation currentId={pageId} />}
  </ErrorBoundary>
);

const LazyOWASPTop10 = dynamic(() => import('@/components/security-trainer/OWASPTop10'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazySQLInjectionLab = dynamic(() => import('@/components/security-trainer/SQLInjectionLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyXSSLab = dynamic(() => import('@/components/security-trainer/XSSLab'), { ssr: false, loading: ModuleLoader });
const LazyCSRFLab = dynamic(() => import('@/components/security-trainer/CSRFLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyAuthSecurityLab = dynamic(() => import('@/components/security-trainer/AuthSecurityLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazySecureCodingLab = dynamic(() => import('@/components/security-trainer/SecureCodingLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyToolsLab = dynamic(() => import('@/components/security-trainer/ToolsLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyQuizSystem = dynamic(() => import('@/components/security-trainer/QuizSystem'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyAchievementsGlossary = dynamic(() => import('@/components/security-trainer/AchievementsGlossary'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyProfilePage = dynamic(() => import('@/components/security-trainer/ProfilePage'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazySecurityHeadersLab = dynamic(() => import('@/components/security-trainer/SecurityHeadersLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyIDORLab = dynamic(() => import('@/components/security-trainer/IDORLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazySSRFLab = dynamic(() => import('@/components/security-trainer/SSRFLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyAPISecurityLab = dynamic(() => import('@/components/security-trainer/APISecurityLab'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyTeacherPanel = dynamic(() => import('@/components/security-trainer/TeacherPanel'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyAdminPanel = dynamic(() => import('@/components/security-trainer/AdminPanel'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyRoleGuard = dynamic(() => import('@/components/security-trainer/RoleGuard'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazySecurityCheatSheets = dynamic(() => import('@/components/security-trainer/SecurityCheatSheets'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyPasswordStrengthChecker = dynamic(() => import('@/components/security-trainer/PasswordStrengthChecker'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyLeaderboard = dynamic(() => import('@/components/security-trainer/Leaderboard'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyPhishingAnalyzer = dynamic(() => import('@/components/security-trainer/PhishingAnalyzer'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyCareerPaths = dynamic(() => import('@/components/security-trainer/CareerPaths'), {
  ssr: false,
  loading: ModuleLoader,
});
const LazyStudentAssignments = dynamic(() => import('@/components/security-trainer/StudentAssignments'), {
  ssr: false,
  loading: ModuleLoader,
});

const roleRestrictedPages: Record<string, UserRole> = {
  'teacher-panel': 'teacher',
  'admin-panel': 'admin',
};

const validPageIds = [
  'dashboard',
  'owasp',
  'sql-injection',
  'xss',
  'csrf',
  'auth',
  'secure-coding',
  'tools',
  'security-headers',
  'idor',
  'ssrf',
  'api-security',
  'phishing-analyzer',
  'career-paths',
  'quiz',
  'achievements',
  'cheat-sheets',
  'password-checker',
  'profile',
  'teacher-panel',
  'admin-panel',
  'leaderboard',
  'assignments',
];

export default function DashboardAppPage() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const tm = useTranslations('appModules');
  const router = useRouter();
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const impersonation = getImpersonationState();

  const pages = useMemo<Record<string, React.ReactNode>>(
    () => ({
      dashboard: (
        <ModuleWrapper name={tm('dashboard')}>
          <Dashboard />
        </ModuleWrapper>
      ),
      owasp: (
        <ModuleWrapper name={tm('owaspTop10')} pageId="owasp">
          <LazyOWASPTop10 />
        </ModuleWrapper>
      ),
      'sql-injection': (
        <ModuleWrapper name={tm('sqlInjectionLab')} pageId="sql-injection">
          <LazySQLInjectionLab />
        </ModuleWrapper>
      ),
      xss: (
        <ModuleWrapper name={tm('xssLab')} pageId="xss">
          <LazyXSSLab />
        </ModuleWrapper>
      ),
      csrf: (
        <ModuleWrapper name={tm('csrfLab')} pageId="csrf">
          <LazyCSRFLab />
        </ModuleWrapper>
      ),
      auth: (
        <ModuleWrapper name={tm('authLab')} pageId="auth">
          <LazyAuthSecurityLab />
        </ModuleWrapper>
      ),
      'secure-coding': (
        <ModuleWrapper name={tm('secureCodingLab')} pageId="secure-coding">
          <LazySecureCodingLab />
        </ModuleWrapper>
      ),
      tools: (
        <ModuleWrapper name={tm('toolsLab')} pageId="tools">
          <LazyToolsLab />
        </ModuleWrapper>
      ),
      'security-headers': (
        <ModuleWrapper name={tm('securityHeadersLab')} pageId="security-headers">
          <LazySecurityHeadersLab />
        </ModuleWrapper>
      ),
      idor: (
        <ModuleWrapper name={tm('idorLab')} pageId="idor">
          <LazyIDORLab />
        </ModuleWrapper>
      ),
      ssrf: (
        <ModuleWrapper name={tm('ssrfLab')} pageId="ssrf">
          <LazySSRFLab />
        </ModuleWrapper>
      ),
      'api-security': (
        <ModuleWrapper name={tm('apiSecurityLab')} pageId="api-security">
          <LazyAPISecurityLab />
        </ModuleWrapper>
      ),
      'phishing-analyzer': (
        <ModuleWrapper name={tm('phishingAnalyzer')} pageId="phishing-analyzer">
          <LazyPhishingAnalyzer />
        </ModuleWrapper>
      ),
      'career-paths': (
        <ModuleWrapper name={tm('careerPaths')} pageId="career-paths">
          <LazyCareerPaths />
        </ModuleWrapper>
      ),
      quiz: (
        <ModuleWrapper name={tm('quizSystem')}>
          <LazyQuizSystem />
        </ModuleWrapper>
      ),
      achievements: (
        <ModuleWrapper name={tm('achievements')}>
          <LazyAchievementsGlossary />
        </ModuleWrapper>
      ),
      'cheat-sheets': (
        <ModuleWrapper name={tm('cheatSheets')}>
          <LazySecurityCheatSheets />
        </ModuleWrapper>
      ),
      'password-checker': (
        <ModuleWrapper name={tm('passwordChecker')}>
          <LazyPasswordStrengthChecker />
        </ModuleWrapper>
      ),
      profile: (
        <ModuleWrapper name={tm('profile')}>
          <LazyProfilePage />
        </ModuleWrapper>
      ),
      'teacher-panel': (
        <ModuleWrapper name={tm('teacherPanel')}>
          <LazyRoleGuard requiredRole="teacher">
            <LazyTeacherPanel />
          </LazyRoleGuard>
        </ModuleWrapper>
      ),
      'admin-panel': (
        <ModuleWrapper name={tm('adminPanel')}>
          <LazyRoleGuard requiredRole="admin">
            <LazyAdminPanel />
          </LazyRoleGuard>
        </ModuleWrapper>
      ),
      leaderboard: (
        <ModuleWrapper name={tm('leaderboard')}>
          <LazyLeaderboard />
        </ModuleWrapper>
      ),
      assignments: (
        <ModuleWrapper name={tm('assignments')}>
          <LazyStudentAssignments />
        </ModuleWrapper>
      ),
    }),
    [tm],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}`);
    }
  }, [isAuthenticated, router, locale]);

  useEffect(() => {
    if (!isAuthenticated) return;
    initAuthBridge(
      () => useAuthStore.getState().user?.id || 'anonymous',
      async (moduleId, score, completed) => {
        await saveProgressSnapshot(moduleId, score, completed);
      },
    );
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated) return;

    const processLTI = async () => {
      const params = new URLSearchParams(window.location.search);
      const ltiPlatform = params.get('lti_platform');
      const ltiModule = params.get('module');
      const ltiQuiz = params.get('quiz');

      if (ltiPlatform) {
        const url = new URL(window.location.href);
        url.searchParams.delete('lti_platform');
        url.searchParams.delete('module');
        url.searchParams.delete('quiz');
        window.history.replaceState({}, '', url.toString());

        const store = useAuthStore.getState();
        try {
          const res = await fetch('/api/auth/profile');
          if (res.ok) {
            const userData = await res.json();
            if (userData && userData.id) {
              store.setUser(userData);
            }
          }
        } catch (e) {
          logger.warn('processLTI profile fetch failed', { error: e });
        }

        if (ltiModule && validPageIds.includes(ltiModule)) {
          setCurrentPage(ltiModule as PageType);
        } else if (ltiQuiz) {
          setCurrentPage('quiz' as PageType);
        } else {
          setCurrentPage('dashboard' as PageType);
        }
      } else if (ltiModule) {
        if (ltiModule && validPageIds.includes(ltiModule)) {
          setCurrentPage(ltiModule as PageType);
        }
      } else if (ltiQuiz) {
        setCurrentPage('quiz' as PageType);
      }
    };

    processLTI();
  }, [isAuthenticated, setCurrentPage]);

  const resolvedPage = useMemo(() => {
    const requiredRole = roleRestrictedPages[currentPage];
    if (requiredRole && (!user || !hasRole(user.role, requiredRole))) {
      return 'dashboard';
    }
    return currentPage;
  }, [currentPage, user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resolvedPage]);

  useEffect(() => {
    if (resolvedPage !== currentPage) {
      setCurrentPage(resolvedPage);
    }
  }, [resolvedPage, currentPage, setCurrentPage]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div id="main-content" className="bg-background flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        {impersonation.isImpersonating && user && (
          <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {t('impersonating')}: {user.fullName} ({getRoleLabel(user.role)})
              </span>
            </div>
            <button
              onClick={async () => {
                const result = await stopImpersonation();
                if (result.success) {
                  setCurrentPage('admin-panel');
                }
              }}
              className="shrink-0 rounded-lg bg-white/20 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/30"
            >
              {t('returnToAdmin')}
            </button>
          </div>
        )}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={resolvedPage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {pages[resolvedPage] || <Dashboard />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
      <PWAHandler />
      <OnboardingTour />
      <KeyboardShortcuts />
      <CompletionCelebration />
    </div>
  );
}
