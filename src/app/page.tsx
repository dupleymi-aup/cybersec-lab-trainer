'use client';

import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { useAuthStore, hasRole, getRoleLabel, getImpersonationState, stopImpersonation, saveProgressSnapshot, type UserRole } from '@/lib/auth-store';
import { initAuthBridge } from '@/lib/auth-bridge';
import Sidebar from '@/components/security-trainer/Sidebar';
import Dashboard from '@/components/security-trainer/Dashboard';
import AuthPages from '@/components/security-trainer/AuthPages';
import PWAHandler from '@/components/security-trainer/PWAHandler';
import OnboardingTour from '@/components/security-trainer/OnboardingTour';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { useMemo, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ModuleNavigation from '@/components/security-trainer/ModuleNavigation';
import KeyboardShortcuts from '@/components/security-trainer/KeyboardShortcuts';
import CompletionCelebration from '@/components/security-trainer/CompletionCelebration';
import OfflineBanner from '@/components/security-trainer/OfflineBanner';

const modulePageIds = ['owasp', 'sql-injection', 'xss', 'csrf', 'auth', 'secure-coding', 'tools', 'security-headers', 'idor', 'ssrf', 'api-security', 'phishing-analyzer', 'career-paths'];

const ModuleWrapper = ({ name, children, pageId }: { name: string; children: React.ReactNode; pageId?: string }) => (
  <ErrorBoundary name={name}>
    {children}
    {pageId && modulePageIds.includes(pageId) && <ModuleNavigation currentId={pageId} />}
  </ErrorBoundary>
);

const LazyOWASPTop10 = dynamic(() => import('@/components/security-trainer/OWASPTop10'), { ssr: false });
const LazySQLInjectionLab = dynamic(() => import('@/components/security-trainer/SQLInjectionLab'), { ssr: false });
const LazyXSSLab = dynamic(() => import('@/components/security-trainer/XSSLab'), { ssr: false });
const LazyCSRFLab = dynamic(() => import('@/components/security-trainer/CSRFLab'), { ssr: false });
const LazyAuthSecurityLab = dynamic(() => import('@/components/security-trainer/AuthSecurityLab'), { ssr: false });
const LazySecureCodingLab = dynamic(() => import('@/components/security-trainer/SecureCodingLab'), { ssr: false });
const LazyToolsLab = dynamic(() => import('@/components/security-trainer/ToolsLab'), { ssr: false });
const LazyQuizSystem = dynamic(() => import('@/components/security-trainer/QuizSystem'), { ssr: false });
const LazyAchievementsGlossary = dynamic(() => import('@/components/security-trainer/AchievementsGlossary'), { ssr: false });
const LazyProfilePage = dynamic(() => import('@/components/security-trainer/ProfilePage'), { ssr: false });
const LazySecurityHeadersLab = dynamic(() => import('@/components/security-trainer/SecurityHeadersLab'), { ssr: false });
const LazyIDORLab = dynamic(() => import('@/components/security-trainer/IDORLab'), { ssr: false });
const LazySSRFLab = dynamic(() => import('@/components/security-trainer/SSRFLab'), { ssr: false });
const LazyAPISecurityLab = dynamic(() => import('@/components/security-trainer/APISecurityLab'), { ssr: false });
const LazyTeacherPanel = dynamic(() => import('@/components/security-trainer/TeacherPanel'), { ssr: false });
const LazyAdminPanel = dynamic(() => import('@/components/security-trainer/AdminPanel'), { ssr: false });
const LazyRoleGuard = dynamic(() => import('@/components/security-trainer/RoleGuard'), { ssr: false });
const LazySecurityCheatSheets = dynamic(() => import('@/components/security-trainer/SecurityCheatSheets'), { ssr: false });
const LazyPasswordStrengthChecker = dynamic(() => import('@/components/security-trainer/PasswordStrengthChecker'), { ssr: false });
const LazyLeaderboard = dynamic(() => import('@/components/security-trainer/Leaderboard'), { ssr: false });
const LazyPhishingAnalyzer = dynamic(() => import('@/components/security-trainer/PhishingAnalyzer'), { ssr: false });
const LazyCareerPaths = dynamic(() => import('@/components/security-trainer/CareerPaths'), { ssr: false });

const pages: Record<string, React.ReactNode> = {
  dashboard: <ModuleWrapper name="Dashboard"><Dashboard /></ModuleWrapper>,
  owasp: <ModuleWrapper name="OWASP Top 10" pageId="owasp"><LazyOWASPTop10 /></ModuleWrapper>,
  'sql-injection': <ModuleWrapper name="SQL Injection Lab" pageId="sql-injection"><LazySQLInjectionLab /></ModuleWrapper>,
  xss: <ModuleWrapper name="XSS Lab" pageId="xss"><LazyXSSLab /></ModuleWrapper>,
  csrf: <ModuleWrapper name="CSRF Lab" pageId="csrf"><LazyCSRFLab /></ModuleWrapper>,
  auth: <ModuleWrapper name="Auth Lab" pageId="auth"><LazyAuthSecurityLab /></ModuleWrapper>,
  'secure-coding': <ModuleWrapper name="Secure Coding Lab" pageId="secure-coding"><LazySecureCodingLab /></ModuleWrapper>,
  tools: <ModuleWrapper name="Tools Lab" pageId="tools"><LazyToolsLab /></ModuleWrapper>,
  'security-headers': <ModuleWrapper name="Security Headers Lab" pageId="security-headers"><LazySecurityHeadersLab /></ModuleWrapper>,
  idor: <ModuleWrapper name="IDOR Lab" pageId="idor"><LazyIDORLab /></ModuleWrapper>,
  ssrf: <ModuleWrapper name="SSRF Lab" pageId="ssrf"><LazySSRFLab /></ModuleWrapper>,
  'api-security': <ModuleWrapper name="API Security Lab" pageId="api-security"><LazyAPISecurityLab /></ModuleWrapper>,
  'phishing-analyzer': <ModuleWrapper name="Phishing Analyzer" pageId="phishing-analyzer"><LazyPhishingAnalyzer /></ModuleWrapper>,
  'career-paths': <ModuleWrapper name="Career Paths" pageId="career-paths"><LazyCareerPaths /></ModuleWrapper>,
  quiz: <ModuleWrapper name="Quiz System"><LazyQuizSystem /></ModuleWrapper>,
  achievements: <ModuleWrapper name="Achievements"><LazyAchievementsGlossary /></ModuleWrapper>,
  'cheat-sheets': <ModuleWrapper name="Cheat Sheets"><LazySecurityCheatSheets /></ModuleWrapper>,
  'password-checker': <ModuleWrapper name="Password Checker"><LazyPasswordStrengthChecker /></ModuleWrapper>,
  profile: <ModuleWrapper name="Profile"><LazyProfilePage /></ModuleWrapper>,
  'teacher-panel': (
    <ModuleWrapper name="Teacher Panel">
      <LazyRoleGuard requiredRole="teacher"><LazyTeacherPanel /></LazyRoleGuard>
    </ModuleWrapper>
  ),
  'admin-panel': (
    <ModuleWrapper name="Admin Panel">
      <LazyRoleGuard requiredRole="admin"><LazyAdminPanel /></LazyRoleGuard>
    </ModuleWrapper>
  ),
  leaderboard: <ModuleWrapper name="Leaderboard"><LazyLeaderboard /></ModuleWrapper>,
};

export default function Home() {
  const { currentPage, setCurrentPage } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();
  const impersonation = getImpersonationState();

  // Initialize auth bridge to break circular dependency
  useEffect(() => {
    initAuthBridge(
      () => useAuthStore.getState().user?.id || 'anonymous',
      async (moduleId, score, completed) => { await saveProgressSnapshot(moduleId, score, completed); }
    );
  }, []);

  // Handle LTI launch token from URL (Moodle LTI redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ltiToken = params.get('lti_token');
    const ltiModule = params.get('module');
    const ltiQuiz = params.get('quiz');

    if (ltiToken) {
      // Set the auth token and fetch user profile
      const { useAuthStore } = require('@/lib/auth-store');
      const store = useAuthStore.getState();

      // Store the token
      localStorage.setItem('auth-token', ltiToken);

      // Fetch user profile with the token
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${ltiToken}` },
      })
        .then((res) => res.json())
        .then((user) => {
          if (user && user.id) {
            store.setUser(user);
          }
        })
        .catch(() => {
          // If profile fetch fails, fall back to decoding the JWT
          try {
            const parts = ltiToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              store.setUser({
                id: payload.id,
                email: '',
                phone: '',
                fullName: 'LTI User',
                role: payload.role || 'student',
              });
            }
          } catch {
            // ignore
          }
        });

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('lti_token');
      url.searchParams.delete('lti_platform');
      window.history.replaceState({}, '', url.toString());

      // Navigate to specified module/quiz
      if (ltiModule && pages[ltiModule]) {
        setCurrentPage(ltiModule);
      } else if (ltiQuiz) {
        setCurrentPage('quiz');
      } else {
        setCurrentPage('dashboard');
      }
    } else if (ltiModule && isAuthenticated) {
      // Direct module link (from deep linking)
      if (pages[ltiModule]) {
        setCurrentPage(ltiModule);
      }
    } else if (ltiQuiz && isAuthenticated) {
      setCurrentPage('quiz');
    }
  }, [isAuthenticated, setCurrentPage]);

  const roleRestrictedPages: Record<string, UserRole> = {
    'teacher-panel': 'teacher',
    'admin-panel': 'admin',
  };

  const resolvedPage = useMemo(() => {
    const requiredRole = roleRestrictedPages[currentPage];
    if (requiredRole && (!user || !hasRole(user.role, requiredRole))) {
      return 'dashboard';
    }
    return currentPage;
  }, [currentPage, user]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resolvedPage]);

  // Redirect to dashboard if current page is not accessible
  useEffect(() => {
    if (resolvedPage !== currentPage) {
      setCurrentPage(resolvedPage);
    }
  }, [resolvedPage, currentPage, setCurrentPage]);

  if (!isAuthenticated) {
    return <AuthPages />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <OfflineBanner />
        {impersonation.isImpersonating && user && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Вы вошли как: {user.fullName} ({getRoleLabel(user.role)})
              </span>
            </div>
            <button
              onClick={async () => {
                const result = await stopImpersonation();
                if (result.success) {
                  setCurrentPage('admin-panel');
                }
              }}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1 rounded-lg transition shrink-0"
            >
              Вернуться к администратору
            </button>
          </div>
        )}
        <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
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
