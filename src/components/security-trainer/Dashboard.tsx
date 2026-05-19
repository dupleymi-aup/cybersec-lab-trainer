'use client';

import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { modules, achievements, sqlChallenges, xssTypes, attackSteps, secureCodingChallenges } from '@/lib/data';
import { getAchievementStatus, countUnlockedAchievements } from '@/lib/achievement-utils';
import { NotificationHelper } from '@/lib/notification-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  ShieldCheck,
  Database,
  FileText,
  Link,
  Lock,
  Code,
  HelpCircle,
  KeyRound,
  Menu,
  Trophy,
  Flame,
  BookOpen,
  ChevronRight,
  Star,
  Target,
  ArrowRight,
  Zap,
} from 'lucide-react';
import type { PageType } from '@/lib/store';

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield size={28} />,
  ShieldCheck: <ShieldCheck size={28} />,
  Database: <Database size={28} />,
  FileText: <FileText size={28} />,
  Link: <Link size={28} />,
  Lock: <Lock size={28} />,
  Code: <Code size={28} />,
  KeyRound: <KeyRound size={28} />,
};

const achievementIcons: Record<string, React.ReactNode> = {
  'first-steps': <BookOpen size={18} />,
  'sql-master': <Database size={18} />,
  'xss-hunter': <Code size={18} />,
  'security-guard': <Shield size={18} />,
  'auth-expert': <Target size={18} />,
  'code-reviewer': <Code size={18} />,
  'quiz-master': <Trophy size={18} />,
  'quiz-perfect': <Star size={18} />,
  'crypto-ninja': <Lock size={18} />,
  'full-completion': <Zap size={18} />,
  'csrf-shield': <Shield size={18} />,
  'owasp-half': <Shield size={18} />,
  'quiz-all': <Trophy size={18} />,
  'crypto-explorer': <KeyRound size={18} />,
  'coding-pro': <Code size={18} />,
  'headers-guard': <ShieldCheck size={18} />,
  'coding-master': <Code size={18} />,
  'network-ninja': <Shield size={18} />,
  'social-engineer': <Target size={18} />,
  'all-headers-correct': <ShieldCheck size={18} />,
};

export default function Dashboard() {
  const { setCurrentPage, completedModules, quizScores, toggleSidebar, sqlCompletedLevels, xssCompletedLevels, csrfCompletedSteps, secureCodingAnsweredChallenges, owaspChallengeScores, authChallengeScores } = useAppStore();
  const { user } = useAuthStore();

  const challengeStats = {
    owaspCorrect: owaspChallengeScores.correct,
    authCorrect: authChallengeScores.correct,
  };

  const totalModules = modules.length;
  const completedCount = completedModules.filter((id) =>
    modules.some((m) => m.id === id)
  ).length;
  const totalProgress = Math.round((completedCount / totalModules) * 100);

  const avgQuizScore =
    Object.keys(quizScores).length > 0
      ? Math.round(
          Object.values(quizScores).reduce((a, b) => a + b, 0) /
            Object.values(quizScores).length
        )
      : 0;

  // Achievements — use centralized achievement-utils
  const unlockedAchievements = achievements.filter((a) =>
    getAchievementStatus(a.id, completedModules, quizScores, challengeStats)
  );
  const nextAchievement = achievements.find((a) =>
    !getAchievementStatus(a.id, completedModules, quizScores, challengeStats)
  );
  const unlockedCount = countUnlockedAchievements(completedModules, quizScores, challengeStats);

  // Per-module granular progress
  const getModuleProgress = (moduleId: string, completed: boolean): { pct: number; label: string } => {
    const TOTALS: Record<string, number> = {
      'sql-injection': sqlChallenges.length,
      'xss': xssTypes.length,
      'csrf': attackSteps.length,
      'secure-coding': secureCodingChallenges.length,
    };
    if (completed) return { pct: 100, label: '' };
    const total = TOTALS[moduleId];
    if (!total) return { pct: 0, label: '' };
    const done = (() => {
      switch (moduleId) {
        case 'sql-injection': return sqlCompletedLevels.length;
        case 'xss': return xssCompletedLevels.length;
        case 'csrf': return csrfCompletedSteps.length;
        case 'secure-coding': return secureCodingAnsweredChallenges.length;
        default: return 0;
      }
    })();
    const pct = Math.round((done / total) * 100);
    return { pct, label: `${done}/${total}` };
  };

  // Recommendations

  // Detect newly unlocked achievements and show toasts
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const current = new Set(unlockedAchievements.map((a) => a.id));
    const prev = prevUnlockedRef.current;
    for (const id of current) {
      if (!prev.has(id)) {
        const achievement = achievements.find((a) => a.id === id);
        if (achievement) {
          toast.success(`🏆 ${achievement.title}`, { description: achievement.description, duration: 5000 });
          NotificationHelper.achievementUnlocked(achievement.title, achievement.description);
        }
      }
    }
    prevUnlockedRef.current = current;
  }, [unlockedAchievements]);
  const getRecommendation = () => {
    // Role-specific recommendations
    if (user?.role === 'admin' && completedModules.length === 0) {
      return { text: 'Управляйте пользователями и настройками системы.', page: 'admin-panel' as PageType };
    }
    if (user?.role === 'teacher' && completedModules.length === 0) {
      return { text: 'Посмотрите аналитику и прогресс студентов.', page: 'teacher-panel' as PageType };
    }

    if (completedModules.length === 0) {
      return { text: 'Начните с OWASP Top 10 — это фундамент веб-безопасности.', page: 'owasp' as PageType };
    }
    if (!completedModules.includes('sql-injection')) {
      return { text: 'Попробуйте SQL-инъекции — самая распространённая уязвимость.', page: 'sql-injection' as PageType };
    }
    if (!completedModules.includes('xss')) {
      return { text: 'Изучите XSS-атаки — они встречаются на каждом третьем сайте.', page: 'xss' as PageType };
    }
    if (!completedModules.includes('csrf')) {
      return { text: 'Изучите CSRF-атаки — подделка запросов от имени пользователя.', page: 'csrf' as PageType };
    }
    if (!completedModules.includes('security-headers')) {
      return { text: 'Освойте Security Headers — CSP, HSTS и другие заголовки безопасности.', page: 'security-headers' as PageType };
    }
    if (!completedModules.includes('auth')) {
      return { text: 'Попробуйте модуль аутентификации — пароли, хеширование и 2FA.', page: 'auth' as PageType };
    }
    if (!completedModules.includes('secure-coding')) {
      return { text: 'Практикуйтесь в безопасном кодировании — 15 задач по ревью кода.', page: 'secure-coding' as PageType };
    }
    if (!completedModules.includes('tools')) {
      return { text: 'Попробуйте инструменты: шифры, кодирование и генератор паролей.', page: 'tools' as PageType };
    }
    if (Object.keys(quizScores).length < 9) {
      return { text: 'Проверьте свои знания в квизах — 9 категорий с фильтрацией по сложности!', page: 'quiz' as PageType };
    }
    if (totalProgress < 100) {
      return { text: 'Завершите оставшиеся модули для полного прохождения!', page: modules.find((m) => !completedModules.includes(m.id))?.id as PageType || 'dashboard' as PageType };
    }
    return { text: 'Великолепно! Вы прошли все модули. Посмотрите достижения!', page: 'achievements' as PageType };
  };

  const recommendation = getRecommendation();

  const handleStartModule = (moduleId: string) => {
    setCurrentPage(moduleId as PageType);
  };

  return (
    <div className="space-y-8">
      {/* Top bar mobile */}
      <div className="flex items-center gap-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu size={22} />
        </Button>
        <Shield size={22} className="text-emerald-600" />
        <span className="font-bold text-lg">CyberSec Lab</span>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white p-8 md:p-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-600/30 mb-4">
            09.03.04 Программная инженерия
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Тренажёр по информационной безопасности
          </h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Интерактивная платформа для изучения уязвимостей веб-приложений, методов атак и защитных
            механизмов. Практикуйтесь в безопасной среде: находите уязвимости, экспериментируйте с
            атаками и учитесь писать защищённый код.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen size={16} className="text-emerald-400" />
              <span className="text-slate-300">{totalModules} модулей</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Flame size={16} className="text-emerald-400" />
              <span className="text-slate-300">{totalProgress}% прогресса</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy size={16} className="text-emerald-400" />
              <span className="text-slate-300">
                {avgQuizScore > 0 ? `Средний балл квизов: ${avgQuizScore}%` : 'Пройдите квиз для оценки'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star size={16} className="text-amber-400" />
              <span className="text-slate-300">{unlockedCount} достижений</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Модули пройдены', value: `${completedCount}/${totalModules}`, color: 'text-emerald-600' },
          { label: 'Квизов завершено', value: `${Object.keys(quizScores).length}/9`, color: 'text-amber-600' },
          { label: 'Средний балл', value: `${avgQuizScore}%`, color: 'text-sky-600' },
          { label: 'Достижения', value: `${unlockedAchievements.length}/${achievements.length}`, color: 'text-violet-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recommendation banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setCurrentPage(recommendation.page)}>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <ArrowRight size={20} />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium">Рекомендация</p>
                <p className="text-sm font-semibold text-slate-800">{recommendation.text}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-emerald-400 shrink-0" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Next achievement */}
      {nextAchievement && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                {achievementIcons[nextAchievement.id]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-600">Следующее достижение</p>
                <p className="text-sm font-semibold text-amber-900">{nextAchievement.title}</p>
                <p className="text-[11px] text-amber-700">{nextAchievement.condition}</p>
              </div>
              <Trophy size={20} className="text-amber-300 shrink-0" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Module Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Модули обучения</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod, i) => {
            const isCompleted = completedModules.includes(mod.id);
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card
                  className="group cursor-pointer border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 overflow-hidden"
                  onClick={() => handleStartModule(mod.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div
                        className={`w-20 shrink-0 flex items-center justify-center ${
                          isCompleted ? 'bg-emerald-50' : 'bg-slate-50'
                        }`}
                      >
                        <span className={isCompleted ? 'text-emerald-600' : 'text-slate-400'}>
                          {iconMap[mod.icon]}
                        </span>
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm group-hover:text-emerald-700 transition-colors">
                              {mod.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {mod.description}
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 group-hover:text-emerald-500 transition-colors mt-1 shrink-0"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary" className={`text-[10px] ${mod.difficultyColor}`}>
                            {mod.difficulty}
                          </Badge>
                          <span className="text-[11px] text-slate-400">{mod.lessons} уроков</span>
                          {isCompleted && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Пройден</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const { pct, label } = getModuleProgress(mod.id, isCompleted);
                      return pct > 0 || isCompleted ? (
                        <div className="px-4 pb-3 pt-1">
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {label && <p className="text-[10px] text-slate-400 mt-1">{label}</p>}
                        </div>
                      ) : (
                        <div className="h-1 bg-slate-100">
                          <div className="h-full bg-slate-200 w-0 transition-all duration-500" />
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quiz + Achievements cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: modules.length * 0.06 }}
          >
            <Card
              className="group cursor-pointer border-amber-200 hover:border-amber-400 hover:shadow-md transition-all duration-300 overflow-hidden"
              onClick={() => setCurrentPage('quiz')}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-20 shrink-0 flex items-center justify-center bg-amber-50">
                    <span className="text-amber-500"><HelpCircle size={28} /></span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-amber-700 transition-colors">Проверка знаний</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">Проверьте свои знания по 9 категориям безопасности с фильтрацией по сложности.</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors mt-1 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">9 категорий</Badge>
                      <span className="text-[11px] text-slate-400">136+ вопросов</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (modules.length + 1) * 0.06 }}
          >
            <Card
              className="group cursor-pointer border-violet-200 hover:border-violet-400 hover:shadow-md transition-all duration-300 overflow-hidden"
              onClick={() => setCurrentPage('achievements')}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-20 shrink-0 flex items-center justify-center bg-violet-50">
                    <span className="text-violet-500"><Trophy size={28} /></span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-violet-700 transition-colors">Достижения и глоссарий</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">Отслеживайте прогресс и изучайте термины ИБ.</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-violet-500 transition-colors mt-1 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px]">
                        {unlockedAchievements.length}/{achievements.length} разблокировано
                      </Badge>
                      <span className="text-[11px] text-slate-400">80+ терминов</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Overall progress */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <h3 className="font-semibold text-sm mb-3">Общий прогресс обучения</h3>
          <Progress value={totalProgress} className="h-3 mb-2" />
          <p className="text-xs text-slate-500">
            {totalProgress === 100
              ? 'Отлично! Вы прошли все модули. Попробуйте квизы для закрепления и откройте все достижения.'
              : totalProgress === 0
                ? 'Начните с любого модуля, который вас интересует.'
                : `Продолжайте обучение! Ещё ${totalModules - completedCount} модулей осталось.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
