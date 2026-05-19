'use client';

import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { useAuthStore, hasRole, getRoleLabel, getImpersonationState, stopImpersonation, type UserRole } from '@/lib/auth-store';
import Sidebar from '@/components/security-trainer/Sidebar';
import Dashboard from '@/components/security-trainer/Dashboard';
import AuthPages from '@/components/security-trainer/AuthPages';
import PWAHandler from '@/components/security-trainer/PWAHandler';
import OnboardingTour from '@/components/security-trainer/OnboardingTour';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ModuleWrapper = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <ErrorBoundary name={name}>{children}</ErrorBoundary>
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
const LazyTeacherPanel = dynamic(() => import('@/components/security-trainer/TeacherPanel'), { ssr: false });
const LazyAdminPanel = dynamic(() => import('@/components/security-trainer/AdminPanel'), { ssr: false });
const LazyRoleGuard = dynamic(() => import('@/components/security-trainer/RoleGuard'), { ssr: false });

const pages: Record<string, React.ReactNode> = {
  dashboard: <ModuleWrapper name="Dashboard"><Dashboard /></ModuleWrapper>,
  owasp: <ModuleWrapper name="OWASP Top 10"><LazyOWASPTop10 /></ModuleWrapper>,
  'sql-injection': <ModuleWrapper name="SQL Injection Lab"><LazySQLInjectionLab /></ModuleWrapper>,
  xss: <ModuleWrapper name="XSS Lab"><LazyXSSLab /></ModuleWrapper>,
  csrf: <ModuleWrapper name="CSRF Lab"><LazyCSRFLab /></ModuleWrapper>,
  auth: <ModuleWrapper name="Auth Lab"><LazyAuthSecurityLab /></ModuleWrapper>,
  'secure-coding': <ModuleWrapper name="Secure Coding Lab"><LazySecureCodingLab /></ModuleWrapper>,
  tools: <ModuleWrapper name="Tools Lab"><LazyToolsLab /></ModuleWrapper>,
  'security-headers': <ModuleWrapper name="Security Headers Lab"><LazySecurityHeadersLab /></ModuleWrapper>,
  idor: <ModuleWrapper name="IDOR Lab"><LazyIDORLab /></ModuleWrapper>,
  ssrf: <ModuleWrapper name="SSRF Lab"><LazySSRFLab /></ModuleWrapper>,
  quiz: <ModuleWrapper name="Quiz System"><LazyQuizSystem /></ModuleWrapper>,
  achievements: <ModuleWrapper name="Achievements"><LazyAchievementsGlossary /></ModuleWrapper>,
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
};

export default function Home() {
  const { currentPage, setCurrentPage } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();
  const impersonation = getImpersonationState();

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

  if (!isAuthenticated) {
    return <AuthPages />;
  }

  if (resolvedPage !== currentPage) {
    setCurrentPage(resolvedPage);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {impersonation.isImpersonating && user && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Вы вошли как: {user.fullName} ({getRoleLabel(user.role)})
              </span>
            </div>
            <button
              onClick={() => {
                const result = stopImpersonation();
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
    </div>
  );
}
