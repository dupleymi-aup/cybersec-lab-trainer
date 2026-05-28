'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  FileText, Clock, Award, Send, AlertCircle, CheckCircle,
  Loader2, ChevronLeft, Calendar, Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { getAuthHeaders } from '@/lib/store';
import { modules } from '@/lib/data';

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

const typeLabels: Record<Assignment['type'], string> = {
  quiz: 'Квиз',
  'code-review': 'Code Review',
  attack: 'Атака',
  writeup: 'Write-up',
  custom: 'Своё',
};

export default function StudentAssignments() {
  const user = useAuthStore(s => s.user);
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
      const [assignmentsRes] = await Promise.all([
        fetch('/api/assignments?published=true', { headers }),
      ]);

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);

        // Fetch submissions for each assignment
        const submissionPromises = data.map(async (a: Assignment) => {
          try {
            const res = await fetch(`/api/assignments/${a.id}/submissions`, { headers });
            if (res.ok) {
              const subs = await res.json();
              const mySubs = subs.filter((s: Submission) => s.userId === user?.id);
              return { id: a.id, subs: mySubs };
            }
          } catch { /* silent */ }
          return { id: a.id, subs: [] };
        });

        const results = await Promise.all(submissionPromises);
        const subMap: Record<string, Submission[]> = {};
        results.forEach((r) => { subMap[r.id] = r.subs; });
        setSubmissions(subMap);
      }
    } catch {
      toast.error('Ошибка загрузки заданий');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Timer for time-limited assignments
  useEffect(() => {
    if (!timerRunning || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setTimerRunning(false);
          toast.warning('Время вышло! Отправьте ваше решение.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

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
      toast.error('Введите ваше решение');
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
        toast.success('Решение отправлено!');
        setViewingId(null);
        setSubmissionText('');
        setTimerRunning(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({ error: 'Ошибка' }));
        toast.error(err.error || 'Не удалось отправить');
      }
    } catch {
      toast.error('Ошибка сети');
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
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" onClick={() => { setViewingId(null); setTimerRunning(false); }}>
                  <ChevronLeft size={16} /> Назад
                </Button>
                <h2 className="text-lg font-bold">{a.title}</h2>
              </div>
              {a.timeLimit && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timer <= 300 ? 'bg-red-100 text-red-700' : 'bg-muted'}`}>
                  <Timer size={16} />
                  <span className="font-mono text-sm font-bold">{formatTime(timer)}</span>
                </div>
              )}
            </div>

            {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Тип</p>
                <p className="font-semibold text-sm">{typeLabels[a.type]}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Баллы</p>
                <p className="font-semibold text-sm">{a.passScore}% / {a.maxScore}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Попытки</p>
                <p className="font-semibold text-sm">{attemptCount}/{a.attempts === 0 ? '∞' : a.attempts}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Лучший результат</p>
                <p className="font-semibold text-sm">
                  {(() => {
                    const best = getMyBestSubmission(a);
                    return best && best.score !== null ? `${best.score}/${best.maxScore}` : '—';
                  })()}
                </p>
              </div>
            </div>

            {a.moduleId && (
              <Badge variant="outline" className="text-xs">
                Модуль: {modules.find((m) => m.id === a.moduleId)?.title || a.moduleId}
              </Badge>
            )}

            {a.dueAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-orange-500" />
                <span>Дедлайн: {new Date(a.dueAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}

            {a.content && (
              <div>
                <p className="text-sm font-medium mb-2">Задание</p>
                <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {a.content}
                </div>
              </div>
            )}

            {/* Submission area */}
            {canSubmit ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Ваше решение</h3>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder={a.type === 'code-review' ? '// Вставьте ваш код' : a.type === 'attack' ? 'Опишите ваш подход к атаке...' : 'Введите ваше решение...'}
                  className="w-full px-3 py-3 border border-border rounded-lg text-sm bg-card font-mono min-h-[150px]"
                />
                <div className="flex justify-end">
                  <Button onClick={() => handleSubmit(a)} disabled={submitting || !submissionText.trim()}>
                    {submitting ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Send size={16} className="mr-1" />}
                    Отправить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
                <AlertCircle size={20} className="text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700">
                  Вы использовали все {a.attempts} попыток. Обратитесь к преподавателю для дополнительной попытки.
                </p>
              </div>
            )}

            {/* Previous submissions */}
            {mySubs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Ваши попытки</h3>
                {mySubs.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">Попытка #{sub.attempt}</span>
                      <span className="text-muted-foreground">
                        {new Date(sub.startedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.score !== null ? (
                        <Badge variant={sub.passed ? 'default' : 'destructive'} className="text-xs">
                          {sub.score}/{sub.maxScore}
                        </Badge>
                      ) : sub.submittedAt ? (
                        <Badge variant="secondary" className="text-xs">
                          <Clock size={12} className="mr-1" /> Ожидает проверки
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Незавершённая</Badge>
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
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText size={22} className="text-violet-500" />
          Мои задания
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Выполняйте задания преподавателя и отслеживайте прогресс</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-50" />
          <p className="text-sm">Загрузка заданий...</p>
        </div>
      ) : assignments.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Нет доступных заданий</p>
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
              <Card key={a.id} className={`border-border hover:shadow-sm transition-shadow ${isCompleted ? 'border-l-4 border-l-emerald-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-emerald-100' : isOverdue ? 'bg-red-100' : 'bg-violet-100'
                    }`}>
                      {isCompleted ? <CheckCircle size={18} className="text-emerald-600" /> : <FileText size={18} className="text-violet-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleStartAssignment(a)}
                          className="font-semibold text-sm hover:text-violet-600 transition-colors text-left"
                        >
                          {a.title}
                        </button>
                        <Badge variant="outline" className="text-[10px]">{typeLabels[a.type]}</Badge>
                        {isCompleted && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                            <CheckCircle size={10} className="mr-0.5" /> Выполнено
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Clock size={10} className="mr-0.5" /> Ожидает
                          </Badge>
                        )}
                      </div>

                      {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Award size={12} /> {a.maxScore} баллов</span>
                        {a.timeLimit && <span className="flex items-center gap-1"><Clock size={12} /> {a.timeLimit} мин</span>}
                        <span>Попытки: {attemptCount}/{a.attempts === 0 ? '∞' : a.attempts}</span>
                        {a.autoGrade && <span>Автопроверка</span>}
                        {dueDate && daysLeft !== null && (
                          <span className={isOverdue ? 'text-red-500 font-medium' : daysLeft <= 3 ? 'text-orange-500' : ''}>
                            {isOverdue ? `Просрочен (${Math.abs(daysLeft)} дн.)` : daysLeft === 0 ? 'Сегодня' : daysLeft === 1 ? 'Завтра' : `Дедлайн: ${daysLeft} дн.`}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {bestSub && bestSub.score !== null && (
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={(bestSub.score / bestSub.maxScore) * 100} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-violet-600">{Math.round((bestSub.score / bestSub.maxScore) * 100)}%</span>
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
