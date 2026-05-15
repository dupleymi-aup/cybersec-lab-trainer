'use client';

import { useAppStore } from '@/lib/store';
import { useAuthStore, hasRole, getRoleLabel, getImpersonationState, stopImpersonation, type UserRole } from '@/lib/auth-store';
import Sidebar from '@/components/security-trainer/Sidebar';
import Dashboard from '@/components/security-trainer/Dashboard';
import OWASPTop10 from '@/components/security-trainer/OWASPTop10';
import SQLInjectionLab from '@/components/security-trainer/SQLInjectionLab';
import XSSLab from '@/components/security-trainer/XSSLab';
import CSRFLab from '@/components/security-trainer/CSRFLab';
import AuthSecurityLab from '@/components/security-trainer/AuthSecurityLab';
import SecureCodingLab from '@/components/security-trainer/SecureCodingLab';
import ToolsLab from '@/components/security-trainer/ToolsLab';
import QuizSystem from '@/components/security-trainer/QuizSystem';
import AchievementsGlossary from '@/components/security-trainer/AchievementsGlossary';
import AuthPages from '@/components/security-trainer/AuthPages';
import ProfilePage from '@/components/security-trainer/ProfilePage';
import SecurityHeadersLab from '@/components/security-trainer/SecurityHeadersLab';
import PWAHandler from '@/components/security-trainer/PWAHandler';
import RoleGuard from '@/components/security-trainer/RoleGuard';
import TeacherPanel from '@/components/security-trainer/TeacherPanel';
import AdminPanel from '@/components/security-trainer/AdminPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { useMemo } from 'react';

const pages: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  owasp: <OWASPTop10 />,
  'sql-injection': <SQLInjectionLab />,
  xss: <XSSLab />,
  csrf: <CSRFLab />,
  auth: <AuthSecurityLab />,
  'secure-coding': <SecureCodingLab />,
  tools: <ToolsLab />,
  'security-headers': <SecurityHeadersLab />,
  quiz: <QuizSystem />,
  achievements: <AchievementsGlossary />,
  profile: <ProfilePage />,
  'teacher-panel': <RoleGuard requiredRole="teacher"><TeacherPanel /></RoleGuard>,
  'admin-panel': <RoleGuard requiredRole="admin"><AdminPanel /></RoleGuard>,
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

  // Redirect to dashboard if user lost access to current page
  if (resolvedPage !== currentPage) {
    setCurrentPage(resolvedPage);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Impersonation Banner */}
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
    </div>
  );
}
