'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/auth-store';
import { UserRole } from '@/lib/auth-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Shield,
  Trophy,
  HelpCircle,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
}

function useRoleTourSteps(role: UserRole, t: ReturnType<typeof useTranslations>): TourStep[] {
  const icons = {
    book: <BookOpen className="h-8 w-8 text-blue-500" />,
    bookGreen: <BookOpen className="h-8 w-8 text-emerald-500" />,
    bookViolet: <BookOpen className="h-8 w-8 text-violet-500" />,
    help: <HelpCircle className="h-8 w-8 text-amber-500" />,
    trophy: <Trophy className="h-8 w-8 text-violet-500" />,
    trophySky: <Trophy className="h-8 w-8 text-sky-500" />,
    check: <Check className="h-8 w-8 text-emerald-600" />,
    checkAmber: <Check className="h-8 w-8 text-amber-500" />,
    users: <Users className="h-8 w-8 text-emerald-500" />,
    shield: <Shield className="h-8 w-8 text-violet-500" />,
    shieldCheck: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
    shieldCheckBlue: <ShieldCheck className="h-8 w-8 text-blue-500" />,
    helpSky: <HelpCircle className="h-8 w-8 text-sky-500" />,
    helpBlue: <HelpCircle className="h-8 w-8 text-blue-500" />,
  };

  if (role === 'student') {
    return [
      { title: t('studentWelcome.title'), description: t('studentWelcome.description'), icon: icons.bookGreen },
      { title: t('studentModules.title'), description: t('studentModules.description'), icon: icons.book, action: t('studentModules.action') },
      { title: t('studentQuizzes.title'), description: t('studentQuizzes.description'), icon: icons.help, action: t('studentQuizzes.action') },
      { title: t('studentAssignments.title'), description: t('studentAssignments.description'), icon: icons.bookViolet, action: t('studentAssignments.action') },
      { title: t('studentAchievements.title'), description: t('studentAchievements.description'), icon: icons.trophy, action: t('studentAchievements.action') },
      { title: t('studentTips.title'), description: t('studentTips.description'), icon: icons.check },
    ];
  }

  if (role === 'teacher') {
    return [
      { title: t('teacherWelcome.title'), description: t('teacherWelcome.description'), icon: icons.users },
      { title: t('teacherModules.title'), description: t('teacherModules.description'), icon: icons.book, action: t('teacherModules.action') },
      { title: t('teacherCreateAssignments.title'), description: t('teacherCreateAssignments.description'), icon: icons.shield, action: t('teacherCreateAssignments.action') },
      { title: t('teacherGradeSubmissions.title'), description: t('teacherGradeSubmissions.description'), icon: icons.checkAmber, action: t('teacherGradeSubmissions.action') },
      { title: t('teacherViewAnalytics.title'), description: t('teacherViewAnalytics.description'), icon: icons.trophySky, action: t('teacherViewAnalytics.action') },
      { title: t('teacherManageDeadlines.title'), description: t('teacherManageDeadlines.description'), icon: icons.helpBlue, action: t('teacherManageDeadlines.action') },
      { title: t('teacherTips.title'), description: t('teacherTips.description'), icon: icons.check },
    ];
  }

  // admin
  return [
    { title: t('adminWelcome.title'), description: t('adminWelcome.description'), icon: icons.shieldCheck },
    { title: t('adminFullAccess.title'), description: t('adminFullAccess.description'), icon: icons.shieldCheckBlue },
    { title: t('adminUserManagement.title'), description: t('adminUserManagement.description'), icon: icons.users, action: t('adminUserManagement.action') },
    { title: t('adminAuditLogs.title'), description: t('adminAuditLogs.description'), icon: icons.shield, action: t('adminAuditLogs.action') },
    { title: t('adminSystemSettings.title'), description: t('adminSystemSettings.description'), icon: icons.helpSky, action: t('adminSystemSettings.action') },
    { title: t('adminAdvancedAnalytics.title'), description: t('adminAdvancedAnalytics.description'), icon: icons.trophy, action: t('adminAdvancedAnalytics.action') },
    { title: t('adminAnnouncements.title'), description: t('adminAnnouncements.description'), icon: icons.book, action: t('adminAnnouncements.action') },
    { title: t('adminTips.title'), description: t('adminTips.description'), icon: icons.check },
  ];
}

const roleIconMap: Record<UserRole, React.ReactNode> = {
  student: <BookOpen className="h-4 w-4 text-blue-600" />,
  teacher: <Users className="h-4 w-4 text-blue-600" />,
  admin: <ShieldCheck className="h-4 w-4 text-blue-600" />,
};

const roleLabelKeyMap: Record<UserRole, string> = {
  student: 'roleStudent',
  teacher: 'roleTeacher',
  admin: 'roleAdmin',
};

export default function OnboardingTour() {
  const t = useTranslations('onboardingTour');
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'student') as UserRole;
  const steps = useRoleTourSteps(role, t);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(() => {
    return localStorage.getItem(`cybersec-onboarding-seen-${role}`) === 'true';
  });

  useEffect(() => {
    const storageKey = `cybersec-onboarding-seen-${role}`;
    const hasSeenTour = localStorage.getItem(storageKey);
    const isNewUser = user?.createdAt && Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000;
    if (!hasSeenTour && (!user?.createdAt || isNewUser)) {
      setIsOpen(true);
    }
  }, [user, role]);

  useEffect(() => {
    const storageKey = `cybersec-onboarding-seen-${role}`;
    setIsComplete(localStorage.getItem(storageKey) === 'true');
    setCurrentStep(0);
  }, [role]);

  const handleClose = () => {
    const storageKey = `cybersec-onboarding-seen-${role}`;
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    setIsComplete(true);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleStartTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
    setIsComplete(false);
  };

  if (isComplete) return null;

  return (
    <>
      {!isOpen && !isComplete && (
        <button
          onClick={handleStartTour}
          className="fixed right-6 bottom-6 z-50 rounded-full bg-emerald-600 p-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-emerald-700"
          title={t('startTour')}
        >
          <Shield className="h-6 w-6" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div className="bg-card w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl">
                <div className="flex items-center justify-between border-b p-5">
                  <div className="flex items-center gap-3">
                    {steps[currentStep].icon}
                    <h2 className="text-lg font-bold">{steps[currentStep].title}</h2>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="hover:bg-muted rounded-lg p-1.5 transition-colors"
                    title={t('skip')}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2 px-5 pt-3">
                  {roleIconMap[role]}
                  <span className="text-xs font-medium tracking-wider text-blue-600 uppercase">
                    {t(roleLabelKeyMap[role] as 'roleStudent' | 'roleTeacher' | 'roleAdmin')}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">{steps[currentStep].description}</p>
                  {steps[currentStep].action && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        {steps[currentStep].action}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-1.5 pb-4">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`${i === currentStep ? 'bg-emerald-500' : i < currentStep ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'} h-2 w-2 rounded-full transition-colors`}
                    />
                  ))}
                </div>

                <div className="bg-muted/30 flex items-center justify-between border-t p-5">
                  <button
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {t('skipTour')}
                  </button>
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button variant="outline" size="sm" onClick={handlePrev}>
                        <ChevronLeft size={16} className="mr-1" />
                        {t('previous')}
                      </Button>
                    )}
                    <Button size="sm" onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                      {currentStep === steps.length - 1 ? (
                        <>
                          {t('getStarted')}
                          <Check size={16} className="ml-1" />
                        </>
                      ) : (
                        <>
                          {t('next')}
                          <ChevronRight size={16} className="ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
