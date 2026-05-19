'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, getRoleLabel, type LoginActivityEntry } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { X, BookOpen, Trophy, Activity, BarChart3, Database, Clock, ShieldCheck, Code } from 'lucide-react';

interface UserActivityModalProps {
  user: User;
  onClose: () => void;
}

interface UserProgressData {
  completedModules: string[];
  quizScores: Record<string, number>;
  studiedOwaspItems: string[];
  sqlCompletedLevels: string[];
  xssCompletedLevels: string[];
  csrfCompletedSteps: number[];
  secureCodingAnsweredChallenges: number[];
}

const moduleNames: Record<string, string> = {
  'owasp': 'OWASP Top 10',
  'sql-injection': 'SQL-инъекции',
  'xss': 'XSS атаки',
  'csrf': 'CSRF атаки',
  'auth': 'Аутентификация',
  'secure-coding': 'Безопасное программирование',
  'tools': 'Инструменты',
  'security-headers': 'HTTP заголовки',
};

const sqlLevelNames: Record<string, string> = {
  '1': 'Уровень 1: Basic SELECT',
  '2': 'Уровень 2: UNION attack',
  '3': 'Уровень 3: Authentication bypass',
  '4': 'Уровень 4: Blind SQLi',
  '5': 'Уровень 5: Advanced injection',
};

const xssLevelNames: Record<string, string> = {
  '1': 'Уровень 1: Reflected XSS',
  '2': 'Уровень 2: Stored XSS',
  '3': 'Уровень 3: DOM-based XSS',
  '4': 'Уровень 4: XSS filter bypass',
  '5': 'Уровень 5: Advanced XSS',
};

function getUserProgress(userId: string): UserProgressData {
  try {
    const key = `security-trainer-progress-${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completedModules: [], quizScores: {}, studiedOwaspItems: [], sqlCompletedLevels: [], xssCompletedLevels: [], csrfCompletedSteps: [], secureCodingAnsweredChallenges: [] };
}

function getLoginActivity(): LoginActivityEntry[] {
  try {
    const raw = localStorage.getItem('security-trainer-login-activity');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getQuizLabel(category: string): string {
  const labels: Record<string, string> = {
    'owasp': 'OWASP Top 10',
    'sql-injection': 'SQL-инъекции',
    'xss': 'XSS атаки',
    'csrf': 'CSRF атаки',
    'auth': 'Аутентификация',
    'secure-coding': 'Безопасное программирование',
    'tools': 'Инструменты',
    'security-headers': 'HTTP заголовки',
  };
  return labels[category] || category;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

export default function UserActivityModal({ user, onClose }: UserActivityModalProps) {
  const [progress, setProgress] = useState<UserProgressData>({
    completedModules: [],
    quizScores: {},
    studiedOwaspItems: [],
    sqlCompletedLevels: [],
    xssCompletedLevels: [],
    csrfCompletedSteps: [],
    secureCodingAnsweredChallenges: [],
  });
  const [loginActivity, setLoginActivity] = useState<LoginActivityEntry[]>([]);

  useEffect(() => {
    setProgress(getUserProgress(user.id));
    const allActivity = getLoginActivity();
    const userActivity = allActivity.filter((a) => a.userId === user.id);
    setLoginActivity(userActivity.reverse().slice(0, 50));
  }, [user.id]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Stats
  const totalModules = Object.keys(moduleNames).length;
  const completedCount = progress.completedModules.length;
  const quizEntries = Object.entries(progress.quizScores);
  const avgScore = quizEntries.length > 0
    ? Math.round(quizEntries.reduce((sum, [, s]) => sum + s, 0) / quizEntries.length)
    : 0;
  const totalLogins = loginActivity.filter((a) => a.success).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold">Активность пользователя</h2>
            <p className="text-xs text-muted-foreground">{user.fullName} • {user.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* User badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge className={`text-xs ${
            user.role === 'student' ? 'bg-violet-100 text-violet-700' :
            user.role === 'teacher' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {getRoleLabel(user.role)}
          </Badge>
          {user.group && (
            <Badge variant="secondary" className="text-xs">{user.group}</Badge>
          )}
          {user.university && (
            <Badge variant="outline" className="text-xs">{user.university}</Badge>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="text-center p-3 bg-sky-50 rounded-lg">
            <BarChart3 size={18} className="text-sky-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-sky-600">{completedCount}/{totalModules}</p>
            <p className="text-[10px] text-muted-foreground">Модули</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <Trophy size={18} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-600">{avgScore}%</p>
            <p className="text-[10px] text-muted-foreground">Ср. балл</p>
          </div>
          <div className="text-center p-3 bg-violet-50 rounded-lg">
            <Activity size={18} className="text-violet-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-violet-600">{totalLogins}</p>
            <p className="text-[10px] text-muted-foreground">Входов</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <Clock size={18} className="text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-600">{user.loginCount || 0}</p>
            <p className="text-[10px] text-muted-foreground">Всего</p>
          </div>
        </div>

        <Tabs defaultValue="modules">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="modules" className="text-xs">Модули</TabsTrigger>
            <TabsTrigger value="quizzes" className="text-xs">Квизы</TabsTrigger>
            <TabsTrigger value="labs" className="text-xs">Лабы</TabsTrigger>
            <TabsTrigger value="logins" className="text-xs">Входы</TabsTrigger>
          </TabsList>

          {/* Modules tab */}
          <TabsContent value="modules" className="mt-4 space-y-2">
            {Object.entries(moduleNames).map(([id, name]) => {
              const done = progress.completedModules.includes(id);
              return (
                <div key={id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {done && <X size={12} className="text-white" />}
                    </div>
                    <span className="text-sm">{name}</span>
                  </div>
                  <Badge variant={done ? 'default' : 'secondary'} className="text-[10px]">
                    {done ? 'Пройден' : 'Не пройден'}
                  </Badge>
                </div>
              );
            })}
          </TabsContent>

          {/* Quizzes tab */}
          <TabsContent value="quizzes" className="mt-4 space-y-2">
            {quizEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Квизы ещё не проходились</p>
            ) : (
              quizEntries.map(([category, score]) => (
                <div key={category} className="p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{getQuizLabel(category)}</span>
                    <Badge className={`text-xs border ${getScoreColor(score)}`}>
                      {score}%
                    </Badge>
                  </div>
                  <Progress value={score} className={`h-2 ${
                    score >= 80 ? '[&>div]:bg-emerald-500' :
                    score >= 50 ? '[&>div]:bg-amber-500' :
                    '[&>div]:bg-red-500'
                  }`} />
                </div>
              ))
            )}
          </TabsContent>

          {/* Labs tab */}
          <TabsContent value="labs" className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Database size={14} className="text-sky-500" /> SQL-инъекции
              </h4>
              {progress.sqlCompletedLevels.length === 0 ? (
                <p className="text-xs text-muted-foreground">Уровни не пройдены</p>
              ) : (
                <div className="space-y-1">
                  {progress.sqlCompletedLevels.map((level) => (
                    <Badge key={level} variant="secondary" className="mr-1 text-xs">
                      {sqlLevelNames[level] || `Уровень ${level}`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <BookOpen size={14} className="text-amber-500" /> XSS атаки
              </h4>
              {progress.xssCompletedLevels.length === 0 ? (
                <p className="text-xs text-muted-foreground">Уровни не пройдены</p>
              ) : (
                <div className="space-y-1">
                  {progress.xssCompletedLevels.map((level) => (
                    <Badge key={level} variant="secondary" className="mr-1 text-xs">
                      {xssLevelNames[level] || `Уровень ${level}`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" /> CSRF атаки
              </h4>
              {progress.csrfCompletedSteps?.length === 0 ? (
                <p className="text-xs text-muted-foreground">Шаги не пройдены</p>
              ) : (
                <div className="space-y-1">
                  {progress.csrfCompletedSteps.map((step) => (
                    <Badge key={step} variant="secondary" className="mr-1 text-xs">
                      Шаг {step + 1}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Code size={14} className="text-purple-500" /> Безопасное кодирование
              </h4>
              {progress.secureCodingAnsweredChallenges?.length === 0 ? (
                <p className="text-xs text-muted-foreground">Задания не пройдены</p>
              ) : (
                <div className="space-y-1">
                  {progress.secureCodingAnsweredChallenges.map((idx) => (
                    <Badge key={idx} variant="secondary" className="mr-1 text-xs">
                      Задание {idx + 1}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Logins tab */}
          <TabsContent value="logins" className="mt-4 space-y-2">
            {loginActivity.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Нет записей о входах</p>
                <p className="text-xs text-slate-400 mt-1">Записи появляются после каждого входа в систему</p>
              </div>
            ) : (
              loginActivity.slice(0, 20).map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${entry.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs font-medium">
                        {entry.success ? 'Успешный вход' : 'Ошибка входа'}
                      </p>
                      <p className="text-[10px] text-slate-400">{entry.ip}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Close */}
        <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100">
          <Button onClick={onClose} className="flex-1">Закрыть</Button>
        </div>
      </motion.div>
    </div>
  );
}
