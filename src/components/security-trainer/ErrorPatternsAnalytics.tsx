'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { AlertOctagon, Loader2, AlertTriangle } from 'lucide-react';
import { getErrorPatternsAnalytics, type ErrorPatternsData } from '@/lib/auth-store';
import { useDateFormatter } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from './KPICard';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export default function ErrorPatternsAnalytics({
  groupId: controlledGroupId,
  days: controlledDays,
}: { groupId?: string; days?: number } = {}) {
  const t = useTranslations('errorPatterns');
  const tc = useTranslations('common');
  const formatDate = useDateFormatter();
  const [internalDays, setInternalDays] = useState(30);
  const PERIOD_OPTIONS = [
    { key: 7, label: tc('days7') },
    { key: 30, label: tc('days30') },
    { key: 90, label: tc('days90') },
    { key: 180, label: tc('days180') },
  ];
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [data, setData] = useState<ErrorPatternsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getErrorPatternsAnalytics(days, controlledGroupId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || t('loadingError'));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, controlledGroupId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">{t('loadingData')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-muted-foreground ml-3 text-sm font-medium">{error || t('noData')}</p>
      </div>
    );
  }

  const { categoryErrorRates, difficultyErrorRates, errorTrends, mostMissedQuestions } = data;

  const totalErrors = categoryErrorRates.reduce((sum, c) => sum + c.incorrectCount, 0);
  const totalAttempts = categoryErrorRates.reduce((sum, c) => sum + c.totalAttempts, 0);
  const overallErrorRate = totalAttempts > 0 ? Math.round((totalErrors / totalAttempts) * 1000) / 10 : 0;
  const topCategory = categoryErrorRates[0]?.category || '—';

  return (
    <div className="space-y-6">
      {/* Period selector */}
      {controlledDays === undefined && (
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              onClick={() => setInternalDays(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${days === key ? 'bg-background text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={totalErrors}
          label={t('totalErrors')}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={`${overallErrorRate}%`}
          label={t('overallErrorRate')}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={topCategory}
          label={t('problemCategory')}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={mostMissedQuestions.length}
          label={t('questionsWithErrors')}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
      </div>

      {/* Error Rate by Category */}
      {categoryErrorRates.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('errorRateByCategory')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryErrorRates.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, t('error')]} />
                <Bar dataKey="errorRate" fill="#ef4444" name="%" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Error Rate by Difficulty */}
      {difficultyErrorRates.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('errorRateByDifficulty')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={difficultyErrorRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="difficulty"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => t(DIFFICULTY_LABELS[v] || v)}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, t('error')]} />
                <Bar dataKey="errorRate" name="%" radius={[4, 4, 0, 0]}>
                  {difficultyErrorRates.map((entry, i) => (
                    <Bar key={i} dataKey="errorRate" fill={DIFFICULTY_COLORS[entry.difficulty] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Error Trends Over Time */}
      {errorTrends.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('errorTrend')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={errorTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => formatDate(v, { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip labelFormatter={(v) => formatDate(String(v))} />
                <Legend />
                <Line type="monotone" dataKey="errorRate" stroke="#ef4444" name={t('errorRate')} dot={false} />
                <Line type="monotone" dataKey="incorrectCount" stroke="#f59e0b" name={t('errorCount')} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Most Missed Questions */}
      {mostMissedQuestions.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('topMissedQuestions')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border border-b">
                    <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">#</th>
                    <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('question')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('category')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('difficulty')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('attempts')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('errors')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('errorRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mostMissedQuestions.slice(0, 20).map((q, i) => (
                    <motion.tr
                      key={q.questionId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-secondary border-b border-slate-100 transition-colors"
                    >
                      <td className="text-muted-foreground px-3 py-2.5">{i + 1}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{q.questionId.slice(0, 12)}...</td>
                      <td className="px-3 py-2.5">{q.category}</td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={
                            q.difficulty === 'hard'
                              ? 'destructive'
                              : q.difficulty === 'medium'
                                ? 'secondary'
                                : 'default'
                          }
                          className="text-[10px]"
                        >
                          {t(DIFFICULTY_LABELS[q.difficulty] || q.difficulty)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">{q.totalAttempts}</td>
                      <td className="px-3 py-2.5 text-right">{q.incorrectCount}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-red-600">{q.errorRate}%</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
