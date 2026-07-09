'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  Award,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  Calendar,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { getAuthHeaders } from '@/lib/store';
import { useDateFormatter } from '@/lib/format';
import { modules } from '@/lib/data';
import { logger } from '@/lib/logger';

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'code-review' | 'attack' | 'writeup' | 'custom';
  moduleId: string;
  content: string;
  maxScore: number;
  passScore: number;
  autoGrade: boolean;
  timeLimit: number | null;
  attempts: number;
  group: string;
  dueAt: string | null;
  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; fullName: string; role: string };
  _count: { submissions: number };
}

interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  score: number | null;
  maxScore: number;
  passed: boolean | null;
  attempt: number;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  gradedBy: string | null;
}

const typeKeyMap: Record<Assignment['type'], string> = {
  quiz: 'typeQuiz',
  'code-review': 'typeCodeReview',
  attack: 'typeAttack',
  writeup: 'typeWriteup',
  custom: 'typeCustom',
};

export default function StudentAssignments() {
  const t = useTranslations('teacher.assignments');
  const formatDate = useDateFormatter();
  const user = useAuthStore((s) => s.user);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const [assignmentsRes] = await Promise.all([fetch('/api/assignments?published=true', { headers })]);

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);

        // Fetch submissions for each assignment
        const submissionPromises = data.map(async (a: Assignment) => {
          try {
            const res = await fetch(`/api/assignments/${a.id}/submissions`, {
              headers,
            });
            if (res.ok) {
              const subs = await res.json();
              const mySubs = subs.filter((s: Submission) => s.userId === user?.id);
              return { id: a.id, subs: mySubs };
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development')
              logger.warn('StudentAssignments failed to fetch submissions', { error: e });
            return { id: a.id, subs: [] };
          }
        });

        const results = await Promise.all(submissionPromises);
        const subMap: Record<string, Submission[]> = {};
        results.forEach((r) => {
          subMap[r.id] = r.subs;
        });
        setSubmissions(subMap);
      }
    } catch (e) {
      logger.warn('StudentAssignments fetchData failed', { error: e });
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer for time-limited assignments
  useEffect(() => {
    if (!timerRunning || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          toast.warning(t('timerExpired'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timer, t]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartAssignment = (a: Assignment) => {
    setViewingId(a.id);
    setSubmissionText('');
    if (a.timeLimit) {
      setTimer(a.timeLimit * 60);
      setTimerRunning(true);
    }
  };

  const handleSubmit = async (a: Assignment) => {
    if (!submissionText.trim()) {
      toast.error(t('enterSolution'));
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/assignments/${a.id}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: submissionText }),
      });

      if (res.ok) {
        toast.success(t('solutionSent'));
        setViewingId(null);
        setSubmissionText('');
        setTimerRunning(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({ error: t('error') }));
        toast.error(err.error || t('sendFailed'));
      }
    } catch (e) {
      logger.warn('StudentAssignments handleSubmit failed', { error: e });
      toast.error(t('networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const getMyBestSubmission = (a: Assignment) => {
    const mySubs = submissions[a.id] || [];
    if (mySubs.length === 0) return null;
    return mySubs.reduce((best, s) => {
      if (best.score === null) return s;
      if (s.score === null) return best;
      return s.score > best.score ? s : best;
    }, mySubs[0]);
  };

  const _getMyAttemptCount = (a: Assignment) => (submissions[a.id] || []).length;

  // View single assignment
  if (viewingId) {
    const a = assignments.find((x) => x.id === viewingId);
    if (!a) return null;
    const mySubs = submissions[a.id] || [];
    const attemptCount = mySubs.length;
    const maxAttempts = a.attempts === 0 ? Infinity : a.attempts;
    const canSubmit = attemptCount < maxAttempts;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setViewingId(null);
                    setTimerRunning(false);
                  }}
                >
                  <ChevronLeft size={16} /> {t('back')}
                </Button>
                <h2 className="text-lg font-bold">{a.title}</h2>
              </div>
              {a.timeLimit && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${timer <= 300 ? 'bg-red-100 text-red-700' : 'bg-muted'}`}
                >
                  <Timer size={16} />
                  <span className="font-mono text-sm font-bold">{formatTime(timer)}</span>
                </div>
              )}
            </div>

            {a.description && <p className="text-muted-foreground text-sm">{a.description}</p>}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t('type')}</p>
                <p className="text-sm font-semibold">{t(typeKeyMap[a.type])}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t('score')}</p>
                <p className="text-sm font-semibold">
                  {a.passScore}% / {a.maxScore}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t('attempts')}</p>
                <p className="text-sm font-semibold">
                  {attemptCount}/{a.attempts === 0 ? '∞' : a.attempts}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t('bestScore')}</p>
                <p className="text-sm font-semibold">
                  {(() => {
                    const best = getMyBestSubmission(a);
                    return best && best.score !== null ? `${best.score}/${best.maxScore}` : '—';
                  })()}
                </p>
              </div>
            </div>

            {a.moduleId && (
              <Badge variant="outline" className="text-xs">
                {t('module', { name: modules.find((m) => m.id === a.moduleId)?.title || a.moduleId })}
              </Badge>
            )}

            {a.dueAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-orange-500" />
                <span>
                  {t('deadline', {
                    date: new Date(a.dueAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  })}
                </span>
              </div>
            )}

            {a.content && (
              <div>
                <p className="mb-2 text-sm font-medium">{t('assignment')}</p>
                <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">{a.content}</div>
              </div>
            )}

            {/* Submission area */}
            {canSubmit ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">{t('yourSolution')}</h3>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder={
                    a.type === 'code-review'
                      ? t('placeholderCodeReview')
                      : a.type === 'attack'
                        ? t('placeholderAttack')
                        : t('placeholderDefault')
                  }
                  className="border-border bg-card min-h-[150px] w-full rounded-lg border px-3 py-3 font-mono text-sm"
                />
                <div className="flex justify-end">
                  <Button onClick={() => handleSubmit(a)} disabled={submitting || !submissionText.trim()}>
                    {submitting ? (
                      <Loader2 size={16} className="mr-1 animate-spin" />
                    ) : (
                      <Send size={16} className="mr-1" />
                    )}
                    {t('submit')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertCircle size={20} className="shrink-0 text-amber-500" />
                <p className="text-sm text-amber-700">
                  {t('allAttemptsUsed', { count: a.attempts })}
                </p>
              </div>
            )}

            {/* Previous submissions */}
            {mySubs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">{t('yourAttempts')}</h3>
                {mySubs.map((sub) => (
                  <div key={sub.id} className="border-border flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{t('attempt', { num: sub.attempt })}</span>
                      <span className="text-muted-foreground">{formatDate(sub.startedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.score !== null ? (
                        <Badge variant={sub.passed ? 'default' : 'destructive'} className="text-xs">
                          {sub.score}/{sub.maxScore}
                        </Badge>
                      ) : sub.submittedAt ? (
                        <Badge variant="secondary" className="text-xs">
                          <Clock size={12} className="mr-1" /> {t('awaitingReview')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {t('incomplete')}
                        </Badge>
                      )}
                      {sub.passed === true && <CheckCircle size={14} className="text-emerald-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Assignment list for students
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <FileText size={22} className="text-violet-500" />
          {t('myAssignments')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('myAssignmentsSubtitle')}</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-50" />
          <p className="text-sm">{t('loadingAssignments')}</p>
        </div>
      ) : assignments.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('noAssignments')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const mySubs = submissions[a.id] || [];
            const bestSub = getMyBestSubmission(a);
            const attemptCount = mySubs.length;
            const isCompleted = mySubs.some((s) => s.passed === true);
            const isPending = mySubs.some((s) => s.submittedAt && s.score === null);

            const dueDate = a.dueAt ? new Date(a.dueAt) : null;
            const now = new Date();
            const isOverdue = dueDate && dueDate < now;
            const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <Card
                key={a.id}
                className={`border-border transition-shadow hover:shadow-sm ${isCompleted ? 'border-l-4 border-l-emerald-500' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isCompleted ? 'bg-emerald-100' : isOverdue ? 'bg-red-100' : 'bg-violet-100'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={18} className="text-emerald-600" />
                      ) : (
                        <FileText size={18} className="text-violet-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleStartAssignment(a)}
                          className="text-left text-sm font-semibold transition-colors hover:text-violet-600"
                        >
                          {a.title}
                        </button>
                        <Badge variant="outline" className="text-[10px]">
                          {t(typeKeyMap[a.type])}
                        </Badge>
                        {isCompleted && (
                          <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
                            <CheckCircle size={10} className="mr-0.5" /> {t('completed')}
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Clock size={10} className="mr-0.5" /> {t('pending')}
                          </Badge>
                        )}
                      </div>

                      {a.description && <p className="text-muted-foreground mt-1 text-xs">{a.description}</p>}

                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Award size={12} /> {t('points', { count: a.maxScore })}
                        </span>
                        {a.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {t('minutes', { count: a.timeLimit })}
                          </span>
                        )}
                        <span>
                          {t('attemptsCount', {
                            used: attemptCount,
                            total: a.attempts === 0 ? '∞' : a.attempts,
                          })}
                        </span>
                        {a.autoGrade && <span>{t('autoGrade')}</span>}
                        {dueDate && daysLeft !== null && (
                          <span
                            className={isOverdue ? 'font-medium text-red-500' : daysLeft <= 3 ? 'text-orange-500' : ''}
                          >
                            {isOverdue
                              ? t('overdueWithDays', { days: Math.abs(daysLeft) })
                              : daysLeft === 0
                                ? t('today')
                                : daysLeft === 1
                                  ? t('tomorrow')
                                  : t('deadlineDays', { days: daysLeft })}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {bestSub && bestSub.score !== null && (
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={(bestSub.score / bestSub.maxScore) * 100} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-violet-600">
                            {Math.round((bestSub.score / bestSub.maxScore) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
