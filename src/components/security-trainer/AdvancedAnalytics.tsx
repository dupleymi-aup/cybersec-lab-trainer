'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Loader2, AlertTriangle, Clock, RefreshCw, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from './KPICard';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

interface ModuleTimeEntry {
  moduleId: string;
  avg: number;
  median: number;
}

interface StudentSpeedEntry {
  userId: string;
  fullName: string;
  group?: string;
  modulesCompleted: number;
  avgHoursPerModule: number;
}

interface TimeAnalyticsData {
  moduleTimes: ModuleTimeEntry[];
  studentSpeeds: StudentSpeedEntry[];
}

interface ErrorRateEntry {
  category: string;
  errorRate: number;
}

interface MissedQuestionEntry {
  questionId: string;
  category: string;
  difficulty: string;
  totalAttempts: number;
  errorRate: number;
}

interface ErrorTrendEntry {
  week: string;
  errorRate: number;
}

interface ErrorAnalyticsData {
  categoryErrorRates: ErrorRateEntry[];
  mostMissedQuestions: MissedQuestionEntry[];
  errorTrends: ErrorTrendEntry[];
}

interface RetryDistributionEntry {
  name: string;
  count: number;
  percent: number;
}

interface ImprovementEntry {
  attempts: string;
  avgScore: number;
}

interface RetryerEntry {
  userId: string;
  fullName: string;
  group?: string;
  retryCount: number;
}

interface RetryAnalyticsData {
  totalRetries: number;
  totalUniqueQuizzes: number;
  retryDistribution: RetryDistributionEntry[];
  improvementByRetries: ImprovementEntry[];
  topRetryers: RetryerEntry[];
}

interface Props {
  groupId?: string;
  days?: number;
}

export default function AdvancedAnalytics({ groupId, days: controlledDays }: Props) {
  const [internalDays, setInternalDays] = useState(30);
  const [subTab, setSubTab] = useState<'time' | 'errors' | 'retry'>('time');
  const [timeData, setTimeData] = useState<TimeAnalyticsData | null>(null);
  const [errorData, setErrorData] = useState<ErrorAnalyticsData | null>(null);
  const [retryData, setRetryData] = useState<RetryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const days = controlledDays ?? internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = `days=${days}${groupId ? `&groupId=${groupId}` : ''}`;

    Promise.all([
      fetch(`/api/analytics/module-time-to-complete?${params}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/analytics/error-patterns?${params}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/analytics/quiz-retry?${params}`).then((r) => r.ok ? r.json() : null),
    ]).then(([time, errors, retry]) => {
      if (!cancelled) {
        setTimeData(time);
        setErrorData(errors);
        setRetryData(retry);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        console.error("AdvancedAnalytics: Failed to load data:", err);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [days, groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground ml-3">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector and sub-tabs */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                days === key ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[
            { key: 'time' as const, label: 'Время модулей', icon: Clock },
            { key: 'errors' as const, label: 'Ошибки', icon: AlertTriangle },
            { key: 'retry' as const, label: 'Повторы квизов', icon: RefreshCw },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                subTab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Module Time-to-Complete Tab */}
      {subTab === 'time' && timeData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              icon={<Clock size={18} />}
              value={timeData.moduleTimes?.length ?? 0}
              label="Модулей с данными"
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
            />
            <KPICard
              icon={<TrendingUp size={18} />}
              value={`${timeData.moduleTimes?.[0]?.avg ?? 0}ч`}
              label="Ср. время (быстрый)"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <KPICard
              icon={<Clock size={18} />}
              value={`${timeData.moduleTimes?.[timeData.moduleTimes.length - 1]?.avg ?? 0}ч`}
              label="Ср. время (медленный)"
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
            <KPICard
              icon={<Target size={18} />}
              value={timeData.studentSpeeds?.length ?? 0}
              label="Студентов tracked"
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
            />
          </div>

          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Среднее время прохождения модулей</h3>
              {timeData.moduleTimes && timeData.moduleTimes.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeData.moduleTimes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="moduleId" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Часы', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg" fill="#6366f1" name="Среднее" />
                    <Bar dataKey="median" fill="#10b981" name="Медиана" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top fastest students */}
          {timeData.studentSpeeds && timeData.studentSpeeds.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  Быстрые студенты
                </h3>
                <div className="space-y-2">
                  {timeData.studentSpeeds.slice(0, 10).map((s: StudentSpeedEntry, i: number) => (
                    <motion.div
                      key={s.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                        <span className="text-sm font-medium">{s.fullName}</span>
                        {s.group && <Badge variant="secondary" className="text-[10px]">{s.group}</Badge>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{s.modulesCompleted} мод.</span>
                        <Badge variant={s.avgHoursPerModule < 6 ? 'default' : s.avgHoursPerModule < 12 ? 'secondary' : 'destructive'}>
                          {s.avgHoursPerModule}ч
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Error Patterns Tab */}
      {subTab === 'errors' && errorData && (
        <div className="space-y-4">
          {/* Category Error Rates */}
          {errorData.categoryErrorRates && errorData.categoryErrorRates.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Ошибки по категориям</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={errorData.categoryErrorRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="errorRate" fill="#ef4444" name="Ошибка %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Most Missed Questions */}
          {errorData.mostMissedQuestions && errorData.mostMissedQuestions.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Самые сложные вопросы</h3>
                <div className="space-y-2">
                  {errorData.mostMissedQuestions.slice(0, 15).map((q: MissedQuestionEntry, i: number) => (
                    <motion.div
                      key={q.questionId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{q.questionId}</p>
                          <p className="text-[10px] text-muted-foreground">{q.category} • {q.difficulty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{q.totalAttempts} попыток</span>
                        <Badge variant={q.errorRate > 70 ? 'destructive' : q.errorRate > 50 ? 'secondary' : 'default'}>
                          {q.errorRate}% ошибок
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Trends */}
          {errorData.errorTrends && errorData.errorTrends.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Динамика ошибок</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={errorData.errorTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('ru-RU')} />
                    <Legend />
                    <Line type="monotone" dataKey="errorRate" stroke="#ef4444" name="Ошибка %" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quiz Retry Tab */}
      {subTab === 'retry' && retryData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              icon={<RefreshCw size={18} />}
              value={retryData.totalRetries ?? 0}
              label="Квизов с повторами"
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
            />
            <KPICard
              icon={<Target size={18} />}
              value={retryData.totalUniqueQuizzes ?? 0}
              label="Всего квизов"
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
            />
            <KPICard
              icon={<TrendingUp size={18} />}
              value={`${retryData.improvementByRetries?.[2]?.avgScore ?? 0}%`}
              label="Ср. балл (3+ попыток)"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <KPICard
              icon={<Clock size={18} />}
              value={retryData.topRetryers?.length ?? 0}
              label="Активных retry-еров"
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
          </div>

          {/* Retry Distribution */}
          {retryData.retryDistribution && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Распределение повторов</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={retryData.retryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="range"
                      label={(entry) => `${entry.name} (${((entry.percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {retryData.retryDistribution.map((_entry: RetryDistributionEntry, i: number) => {
                        const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];
                        return <Cell key={i} fill={colors[i]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Improvement by Retries */}
          {retryData.improvementByRetries && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Балл по количеству попыток</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={retryData.improvementByRetries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="attempts" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#6366f1" name="Ср. балл" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Retryers */}
          {retryData.topRetryers && retryData.topRetryers.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <RefreshCw size={16} className="text-indigo-500" />
                  Студенты с наибольшим количеством повторов
                </h3>
                <div className="space-y-2">
                  {retryData.topRetryers.slice(0, 10).map((s: RetryerEntry, i: number) => (
                    <motion.div
                      key={s.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                        <span className="text-sm font-medium">{s.fullName}</span>
                        {s.group && <Badge variant="secondary" className="text-[10px]">{s.group}</Badge>}
                      </div>
                      <Badge variant={s.retryCount > 5 ? 'destructive' : s.retryCount > 2 ? 'secondary' : 'default'}>
                        {s.retryCount} повторов
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
