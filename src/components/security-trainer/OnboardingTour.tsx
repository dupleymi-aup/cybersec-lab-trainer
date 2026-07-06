'use client';

import { useState, useEffect } from 'react';
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

const roleTourSteps: Record<UserRole, TourStep[]> = {
  student: [
    {
      title: 'Welcome to CyberSec Lab!',
      description:
        'An interactive platform for learning information security fundamentals. As a student, you will explore interactive modules, take quizzes, complete assignments, and track your progress as you build cybersecurity skills.',
      icon: <BookOpen className="h-8 w-8 text-emerald-500" />,
    },
    {
      title: 'Modules',
      description:
        'Explore interactive security training modules covering topics like OWASP Top 10, SQL injection, XSS, CSRF, authentication, secure coding, security headers, and cryptographic tools.',
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
      action: 'Access any module from the sidebar menu',
    },
    {
      title: 'Quizzes',
      description:
        'Test your knowledge with 136+ questions across 9 security categories. Take timed quizzes with difficulty filtering. Your scores contribute to your achievements and overall progress.',
      icon: <HelpCircle className="h-8 w-8 text-amber-500" />,
      action: 'Navigate to "Quizzes" in the sidebar',
    },
    {
      title: 'Assignments',
      description:
        'Complete assignments created by your teachers. Submit your work and receive grades with detailed feedback to help you improve your cybersecurity skills.',
      icon: <BookOpen className="h-8 w-8 text-violet-500" />,
      action: 'Navigate to "Assignments" in the sidebar',
    },
    {
      title: 'Achievements',
      description:
        'Earn 16 achievement badges as you progress through modules and quizzes. Unlock new badges by completing modules and scoring high on quizzes.',
      icon: <Trophy className="h-8 w-8 text-violet-500" />,
      action: 'Track your progress in the "Achievements" section',
    },
    {
      title: 'Tips for Learning',
      description:
        'Start with OWASP Top 10 - it is the foundation of web security. Take quizzes immediately after studying modules while concepts are fresh. Review your mistakes to reinforce learning.',
      icon: <Check className="h-8 w-8 text-emerald-600" />,
    },
  ],
  teacher: [
    {
      title: 'Welcome to CyberSec Lab!',
      description:
        'An interactive platform for teaching information security. As a teacher, you can create assignments, grade student submissions, manage deadlines, and view analytics to track your students progress.',
      icon: <Users className="h-8 w-8 text-emerald-500" />,
    },
    {
      title: 'Modules Overview',
      description:
        'Browse all available training modules. Assign specific modules to your classes and track which students have completed them.',
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
      action: 'Navigate to "Modules" in the sidebar',
    },
    {
      title: 'Create Assignments',
      description:
        'Design custom assignments by selecting modules, defining questions, and setting grading criteria. Assignments can target individual classes or specific students.',
      icon: <Shield className="h-8 w-8 text-violet-500" />,
      action: 'Click "Create Assignment" in the Assignments section',
    },
    {
      title: 'Grade Submissions',
      description:
        'Review and grade student submissions efficiently. Provide detailed feedback and rubric-based scoring to help students understand their performance.',
      icon: <Check className="h-8 w-8 text-amber-500" />,
      action: 'Navigate to "Assignments" > "Pending Review"',
    },
    {
      title: 'View Analytics',
      description:
        'Access detailed analytics on class and individual student performance. Identify knowledge gaps and track improvement over time with visual dashboards.',
      icon: <Trophy className="h-8 w-8 text-sky-500" />,
      action: 'Navigate to "Analytics" in the sidebar',
    },
    {
      title: 'Manage Deadlines',
      description:
        'Set and adjust deadlines for assignments and modules. Send reminders to students and monitor completion rates before due dates.',
      icon: <HelpCircle className="h-8 w-8 text-blue-500" />,
      action: 'Configure deadlines in each assignment settings',
    },
    {
      title: 'Tips for Teaching',
      description:
        'Use analytics to identify struggling students early. Create scaffolded assignments that build on previous knowledge. Provide timely, actionable feedback to maximize student engagement.',
      icon: <Check className="h-8 w-8 text-emerald-600" />,
    },
  ],
  admin: [
    {
      title: 'Welcome to CyberSec Lab!',
      description:
        'An interactive platform for teaching information security. As an administrator, you have full access to manage users, configure system settings, review audit logs, and monitor platform-wide analytics.',
      icon: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
    },
    {
      title: 'Full Access',
      description:
        'You have access to all features across the platform. Navigate to any section to manage content, users, and system configurations.',
      icon: <ShieldCheck className="h-8 w-8 text-blue-500" />,
    },
    {
      title: 'User Management',
      description:
        'Create, update, and deactivate user accounts. Assign roles (student, teacher, admin) and manage class enrollments and teacher assignments.',
      icon: <Users className="h-8 w-8 text-violet-500" />,
      action: 'Navigate to "Users" in the admin panel',
    },
    {
      title: 'Audit Logs',
      description:
        'Review comprehensive audit logs tracking all system activities, user actions, and security events. Export logs for compliance and reporting purposes.',
      icon: <Shield className="h-8 w-8 text-amber-500" />,
      action: 'Navigate to "Audit" in the admin panel',
    },
    {
      title: 'System Settings',
      description:
        'Configure platform-wide settings including authentication methods, notification preferences, module availability, and integration with external systems.',
      icon: <HelpCircle className="h-8 w-8 text-sky-500" />,
      action: 'Navigate to "Settings" in the admin panel',
    },
    {
      title: 'Advanced Analytics',
      description:
        'Access platform-wide analytics dashboards showing adoption rates, completion metrics, and performance trends across all classes and departments.',
      icon: <Trophy className="h-8 w-8 text-violet-500" />,
      action: 'Navigate to "Analytics" in the admin panel',
    },
    {
      title: 'Announcements',
      description:
        'Create and broadcast announcements to specific user groups or the entire platform. Schedule announcements and track read receipts.',
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
      action: 'Navigate to "Announcements" in the admin panel',
    },
    {
      title: 'Tips for Administration',
      description:
        'Regularly review audit logs for security compliance. Use analytics to identify underutilized modules and drive adoption. Keep system settings documented and communicate changes to users proactively.',
      icon: <Check className="h-8 w-8 text-emerald-600" />,
    },
  ],
};

const roleIconMap: Record<UserRole, React.ReactNode> = {
  student: <BookOpen className="h-4 w-4 text-blue-600" />,
  teacher: <Users className="h-4 w-4 text-blue-600" />,
  admin: <ShieldCheck className="h-4 w-4 text-blue-600" />,
};

const roleLabelMap: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
};

export default function OnboardingTour() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'student') as UserRole;
  const steps = roleTourSteps[role] ?? roleTourSteps.student;
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
          title="Start onboarding tour"
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
                    title="Skip"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2 px-5 pt-3">
                  {roleIconMap[role]}
                  <span className="text-xs font-medium tracking-wider text-blue-600 uppercase">
                    {roleLabelMap[role]}
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
                      className={`$\{ i === currentStep ? 'bg-emerald-500' : i < currentStep ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700' } h-2 w-2 rounded-full transition-colors`}
                    />
                  ))}
                </div>

                <div className="bg-muted/30 flex items-center justify-between border-t p-5">
                  <button
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    Skip tour
                  </button>
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button variant="outline" size="sm" onClick={handlePrev}>
                        <ChevronLeft size={16} className="mr-1" />
                        Previous
                      </Button>
                    )}
                    <Button size="sm" onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                      {currentStep === steps.length - 1 ? (
                        <>
                          Get Started
                          <Check size={16} className="ml-1" />
                        </>
                      ) : (
                        <>
                          Next
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
