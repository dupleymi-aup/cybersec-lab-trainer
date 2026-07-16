'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Repeat, Loader2, AlertTriangle } from 'lucide-react';
import { getQuizRetryAnalytics, type QuizRetryData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import KPICard from './KPICard';

export default function QuizRetryAnalytics({
  groupId: controlledGroupId,
  days: controlledDays,
}: { groupId?: string; days?: number } = {}) {
  const [internalDays, setInternalDays] = useState(30);
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [data, setData] = useState<QuizRetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('quizRetryAnalytics');
  const tc = useTranslations('common');

  const PERIOD_OPTIONS = [
    { key: 7, labelKey: 'days7' },
    { key: 30, labelKey: 'days30' },
    { key: 90, labelKey: 'days90' },
    { key: 180, labelKey: 'days180' },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getQuizRetryAnalytics(days, controlledGroupId)
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

  const { retryDistribution, improvementByRetries, topRetryers, categoryRetryStats, totalRetries, totalUniqueQuizzes } =
    data;

  const avgAttempts =
    retryDistribution.reduce((sum, b) => {
      const num = parseInt(b.range.split('+')[0].split(' ')[0]) || 0;
      return sum + b.count * (b.range.includes('+') ? 3 : num);
    }, 0) /
    Math.max(
      1,
      retryDistribution.reduce((sum, b) => sum + b.count, 0),
    );

  return (
    <div className="space-y-6">
      {/* Period selector */}
      {controlledDays === undefined && (
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, labelKey }) => (
            <button
              type="button"
              key={key}
              onClick={() => setInternalDays(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${days === key ? 'bg-background text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tc(labelKey)}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          icon={<Repeat size={18} />}
          value={totalRetries}
          label={t('totalRetries')}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<Repeat size={18} />}
          value={totalUniqueQuizzes}
          label={t('uniqueQuizzes')}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
        <KPICard
          icon={<Repeat size={18} />}
          value={avgAttempts.toFixed(1)}
          label={t('avgAttempts')}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<Repeat size={18} />}
          value={categoryRetryStats.length}
          label={t('categories')}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Retry Distribution */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('retryDistribution')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={retryDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" name={t('students')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Improvement by Retries */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('scoreByAttempts')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={improvementByRetries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempts" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#10b981" name={t('avgScore')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Retry Stats */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('categoryStats')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('category')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('attempts')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('students')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('avgAttemptsPerStudent')}</th>
                </tr>
              </thead>
              <tbody>
                {categoryRetryStats.map((cat, i) => (
                  <motion.tr
                    key={cat.category}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary border-b border-slate-100 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-medium">{cat.category}</td>
                    <td className="px-3 py-2.5 text-right">{cat.totalAttempts}</td>
                    <td className="px-3 py-2.5 text-right">{cat.uniqueStudents}</td>
                    <td className="px-3 py-2.5 text-right">{cat.avgAttemptsPerStudent}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Retryers */}
      {topRetryers.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('topRetryers')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border border-b">
                    <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">#</th>
                    <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('name')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('group')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('retries')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topRetryers.slice(0, 10).map((r, i) => (
                    <motion.tr
                      key={r.userId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-secondary border-b border-slate-100 transition-colors"
                    >
                      <td className="text-muted-foreground px-3 py-2.5">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium">{r.fullName}</td>
                      <td className="px-3 py-2.5 text-xs">{r.group || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{r.retryCount}</td>
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
