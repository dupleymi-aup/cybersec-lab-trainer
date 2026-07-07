'use client';

import { useState, useEffect, useCallback } from 'react';
import { type User, getRoleLabel, type LoginActivityEntry } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { X, BookOpen, Trophy, Activity, BarChart3, Database, Clock, ShieldCheck, Code } from 'lucide-react';
import { useDateTimeFormatter } from '@/lib/format';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';

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
  owasp: 'OWASP Top 10',
  'sql-injection': 'SQL-инъекции',
  xss: 'XSS атаки',
  csrf: 'CSRF атаки',
  auth: 'Аутентификация',
  'secure-coding': 'Безопасное программирование',
  tools: 'Инструменты',
  'security-headers': 'HTTP заголовки',
};

function getUserProgress(userId: string): UserProgressData {
  try {
    const key = `security-trainer-progress-${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (error) {
    logger.warn('Failed to parse user progress from localStorage', { error });
  }
  return {
    completedModules: [],
    quizScores: {},
    studiedOwaspItems: [],
    sqlCompletedLevels: [],
    xssCompletedLevels: [],
    csrfCompletedSteps: [],
    secureCodingAnsweredChallenges: [],
  };
}

function getLoginActivity(): LoginActivityEntry[] {
  try {
    const raw = localStorage.getItem('security-trainer-login-activity');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    logger.warn('UserActivityModal getLoginActivity failed', { error: e });
    // Intentionally empty — non-critical localStorage parse, return empty array as fallback
    return [];
  }
}

function getQuizLabel(category: string): string {
  const labels: Record<string, string> = {
    owasp: 'OWASP Top 10',
    'sql-injection': 'SQL-инъекции',
    xss: 'XSS атаки',
    csrf: 'CSRF атаки',
    auth: 'Аутентификация',
    'secure-coding': 'Безопасное программирование',
    tools: 'Инструменты',
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
  const formatDateTime = useDateTimeFormatter();
  const t = useTranslations('admin.userActivity');
  const tc = useTranslations('common');
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
    setLoginActivity([...userActivity].reverse().slice(0, 50));
  }, [user.id]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Stats
  const totalModules = Object.keys(moduleNames).length;
  const completedCount = progress.completedModules.length;
  const quizEntries = Object.entries(progress.quizScores);
  const avgScore =
    quizEntries.length > 0 ? Math.round(quizEntries.reduce((sum, [, s]) => sum + s, 0) / quizEntries.length) : 0;
  const totalLogins = loginActivity.filter((a) => a.success).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t('title')}</h2>
            <p className="text-muted-foreground text-xs">
              {user.fullName} • {user.email}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={tc('close')}>
            <X size={18} />
          </Button>
        </div>

        {/* User badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge
            className={`text-xs ${
              user.role === 'student'
                ? 'bg-violet-100 text-violet-700'
                : user.role === 'teacher'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {getRoleLabel(user.role)}
          </Badge>
          {user.group && (
            <Badge variant="secondary" className="text-xs">
              {user.group}
            </Badge>
          )}
          {user.university && (
            <Badge variant="outline" className="text-xs">
              {user.university}
            </Badge>
          )}
        </div>

        {/* Summary cards */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-sky-50 p-3 text-center">
            <BarChart3 size={18} className="mx-auto mb-1 text-sky-500" />
            <p className="text-xl font-bold text-sky-600">
              {completedCount}/{totalModules}
            </p>
            <p className="text-muted-foreground text-[10px]">{t('modules')}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-center">
            <Trophy size={18} className="mx-auto mb-1 text-emerald-500" />
            <p className="text-xl font-bold text-emerald-600">{avgScore}%</p>
            <p className="text-muted-foreground text-[10px]">{t('avgScore')}</p>
          </div>
          <div className="rounded-lg bg-violet-50 p-3 text-center">
            <Activity size={18} className="mx-auto mb-1 text-violet-500" />
            <p className="text-xl font-bold text-violet-600">{totalLogins}</p>
            <p className="text-muted-foreground text-[10px]">{t('totalLogins')}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <Clock size={18} className="mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold text-amber-600">{user.loginCount || 0}</p>
            <p className="text-muted-foreground text-[10px]">{t('totalCount')}</p>
          </div>
        </div>

        <Tabs defaultValue="modules">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="modules" className="text-xs">
              {t('modules')}
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="text-xs">
              {t('quizzes')}
            </TabsTrigger>
            <TabsTrigger value="labs" className="text-xs">
              {t('labs')}
            </TabsTrigger>
            <TabsTrigger value="logins" className="text-xs">
              {t('logins')}
            </TabsTrigger>
          </TabsList>

          {/* Modules tab */}
          <TabsContent value="modules" className="mt-4 space-y-2">
            {Object.entries(moduleNames).map(([id, name]) => {
              const done = progress.completedModules.includes(id);
              return (
                <div key={id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      {done && <X size={12} className="text-white" />}
                    </div>
                    <span className="text-sm">{name}</span>
                  </div>
                  <Badge variant={done ? 'default' : 'secondary'} className="text-[10px]">
                    {done ? t('passed') : t('notPassed')}
                  </Badge>
                </div>
              );
            })}
          </TabsContent>

          {/* Quizzes tab */}
          <TabsContent value="quizzes" className="mt-4 space-y-2">
            {quizEntries.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">{t('noQuizzes')}</p>
            ) : (
              quizEntries.map(([category, score]) => (
                <div key={category} className="rounded-lg border border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{getQuizLabel(category)}</span>
                    <Badge className={`border text-xs ${getScoreColor(score)}`}>{score}%</Badge>
                  </div>
                  <Progress
                    value={score}
                    className={`h-2 ${
                      score >= 80
                        ? '[&>div]:bg-emerald-500'
                        : score >= 50
                          ? '[&>div]:bg-amber-500'
                          : '[&>div]:bg-red-500'
                    }`}
                  />
                </div>
              ))
            )}
          </TabsContent>

          {/* Labs tab */}
          <TabsContent value="labs" className="mt-4 space-y-4">
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Database size={14} className="text-sky-500" /> {t('sqlInjection')}
              </h4>
              {progress.sqlCompletedLevels.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('noLevels')}</p>
              ) : (
                <div className="space-y-1">
                  {progress.sqlCompletedLevels.map((level) => (
                    <Badge key={level} variant="secondary" className="mr-1 text-xs">
                      {t('level', { n: level })}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BookOpen size={14} className="text-amber-500" /> {t('xssAttacks')}
              </h4>
              {progress.xssCompletedLevels.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('noLevels')}</p>
              ) : (
                <div className="space-y-1">
                  {progress.xssCompletedLevels.map((level) => (
                    <Badge key={level} variant="secondary" className="mr-1 text-xs">
                      {t('level', { n: level })}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={14} className="text-emerald-500" /> {t('csrfAttacks')}
              </h4>
              {progress.csrfCompletedSteps?.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('noSteps')}</p>
              ) : (
                <div className="space-y-1">
                  {progress.csrfCompletedSteps.map((step) => (
                    <Badge key={step} variant="secondary" className="mr-1 text-xs">
                      {t('step', { n: step + 1 })}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Code size={14} className="text-purple-500" /> {t('secureCoding')}
              </h4>
              {progress.secureCodingAnsweredChallenges?.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('noChallenges')}</p>
              ) : (
                <div className="space-y-1">
                  {progress.secureCodingAnsweredChallenges.map((idx) => (
                    <Badge key={idx} variant="secondary" className="mr-1 text-xs">
                      {t('challenge', { n: idx + 1 })}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Logins tab */}
          <TabsContent value="logins" className="mt-4 space-y-2">
            {loginActivity.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-muted-foreground text-sm">{t('noLoginRecords')}</p>
                <p className="mt-1 text-xs text-slate-400">{t('loginRecordsAppear')}</p>
              </div>
            ) : (
              loginActivity.slice(0, 20).map((entry) => (
                <div
                  key={entry.timestamp}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${entry.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs font-medium">{entry.success ? t('loginSuccess') : t('loginFailed')}</p>
                      <p className="text-[10px] text-slate-400">{entry.ip}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-[10px]">{formatDateTime(entry.timestamp)}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Close */}
        <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
          <Button onClick={onClose} className="flex-1">
            {tc('close')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
