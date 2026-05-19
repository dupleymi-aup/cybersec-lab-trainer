'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, BookOpen, Shield, Trophy, HelpCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Добро пожаловать в CyberSec Lab!',
    description: 'Интерактивная платформа для изучения основ информационной безопасности. Здесь вы научитесь находить и исправлять уязвимости веб-приложений.',
    icon: <Shield className="h-8 w-8 text-emerald-500" />,
  },
  {
    title: 'Модули обучения',
    description: '8 интерактивных модулей: OWASP Top 10, SQL-инъекции, XSS, CSRF, аутентификация, безопасное кодирование, Security Headers и криптографические инструменты.',
    icon: <BookOpen className="h-8 w-8 text-blue-500" />,
    action: 'Перейдите в любой модуль через боковое меню',
  },
  {
    title: 'Квизы',
    description: '136+ вопросов по 9 категориям безопасности. Проверяйте свои знания с таймером и фильтрацией по сложности.',
    icon: <HelpCircle className="h-8 w-8 text-amber-500" />,
    action: 'Раздел "Квизы" в боковом меню',
  },
  {
    title: 'Достижения',
    description: '16 достижений за прогресс в обучении. Открывайте новые бейджи, проходя модули и набирая высокие баллы в квизах.',
    icon: <Trophy className="h-8 w-8 text-violet-500" />,
    action: 'Следите за прогрессом в разделе "Достижения"',
  },
  {
    title: 'Профиль',
    description: 'Отслеживайте свой прогресс, историю входов, статистику активности и управляйте настройками аккаунта.',
    icon: <User className="h-8 w-8 text-sky-500" />,
    action: 'Нажмите на свой аватар в нижней части бокового меню',
  },
  {
    title: 'Советы',
    description: 'Начните с OWASP Top 10 — это фундамент веб-безопасности. Затем переходите к практическим лабораториям. Используйте глоссарий для изучения терминов.',
    icon: <Check className="h-8 w-8 text-emerald-600" />,
  },
];

export default function OnboardingTour() {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('cybersec-onboarding-seen');
    const isNewUser = user?.createdAt && (Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000);
    if (!hasSeenTour && (!user?.createdAt || isNewUser)) {
      setIsOpen(true);
    }
  }, [user]);

  const handleClose = () => {
    localStorage.setItem('cybersec-onboarding-seen', 'true');
    setIsOpen(false);
    setIsComplete(true);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
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
      {/* Floating tour button */}
      {!isOpen && !isComplete && (
        <button
          onClick={handleStartTour}
          className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
          title="Пройти обучение"
        >
          <Shield className="h-6 w-6" />
        </button>
      )}

      {/* Tour overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[100]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div className="bg-card rounded-2xl shadow-2xl border max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                  <div className="flex items-center gap-3">
                    {tourSteps[currentStep].icon}
                    <h2 className="text-lg font-bold">{tourSteps[currentStep].title}</h2>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Пропустить"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tourSteps[currentStep].description}
                  </p>
                  {tourSteps[currentStep].action && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        {tourSteps[currentStep].action}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 pb-4">
                  {tourSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentStep
                          ? 'bg-emerald-500'
                          : i < currentStep
                            ? 'bg-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t bg-muted/30">
                  <button
                    onClick={handleSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Пропустить обучение
                  </button>
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                      >
                        <ChevronLeft size={16} className="mr-1" />
                        Назад
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {currentStep === tourSteps.length - 1 ? (
                        <>
                          Начать
                          <Check size={16} className="ml-1" />
                        </>
                      ) : (
                        <>
                          Далее
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
