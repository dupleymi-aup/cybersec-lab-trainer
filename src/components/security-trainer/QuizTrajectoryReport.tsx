'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDateFormatter } from '@/lib/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, AlertTriangle, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { getQuizTrajectory, type QuizTrajectoryPoint } from '@/lib/auth-store';
import { CHART_COLORS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import KPICard from './KPICard';

const PERIOD_OPTIONS = [
  { key: 7, label: '7d' },
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
  { key: 180, label: '180d' },
];

// Consistent color palette for categories — derived from central chart palette
const CATEGORY_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  CHART_COLORS.accent,
  CHART_COLORS.muted,
];

export interface QuizTrajectoryReportProps {
  groupId?: string;
  days?: number;
}

const DEFAULT_DAYS = 30;

export default function QuizTrajectoryReport({ groupId, days: controlledDays }: QuizTrajectoryReportProps = {}) {
  const formatDateLocale = useDateFormatter();
  const t = useTranslations('common.quizTrajectory');
  const [trajectories, setTrajectories] = useState<QuizTrajectoryPoint[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(DEFAULT_DAYS);

  const isControlled = controlledDays !== undefined;
  const days = isControlled ? controlledDays : internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getQuizTrajectory(days, groupId)
      .then((data) => {
        if (!cancelled) {
          setTrajectories(data.trajectories);
          setCategories(data.categories);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || t('loadError'));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, groupId, t]);

  // Merge trajectories into chart data: one row per week, one column per category
  const chartData = useMemo(() => {
    const weekMap = new Map<string, Record<string, unknown>>();

    for (const t of trajectories) {
      if (!weekMap.has(t.week)) {
        weekMap.set(t.week, { week: t.week });
      }
      const row = weekMap.get(t.week);
      if (row) {
        row[t.category] = t.avgScore;
        row[`${t.category}_attempts`] = t.attempts;
      }
    }

    return Array.from(weekMap.values()).sort((a, b) => (a.week as string).localeCompare(b.week as string));
  }, [trajectories]);

  // Summary computations
  const summary = useMemo(() => {
    if (trajectories.length === 0) {
      return { bestImproved: null, highestAvg: null, mostAttempts: null };
    }

    const catStats = new Map<string, { scores: number[]; totalAttempts: number; weeks: string[] }>();

    for (const t of trajectories) {
      const stat = catStats.get(t.category) || {
        scores: [],
        totalAttempts: 0,
        weeks: [],
      };
      stat.scores.push(t.avgScore);
      stat.totalAttempts += t.attempts;
      if (!stat.weeks.includes(t.week)) stat.weeks.push(t.week);
      catStats.set(t.category, stat);
    }

    let bestImproved: { category: string; improvement: number } | null = null;
    let highestAvg: { category: string; avgScore: number } | null = null;
    let mostAttempts: { category: string; attempts: number } | null = null;

    for (const [cat, stat] of catStats) {
      // Improvement: last score - first score
      const sortedWeeks = [...stat.weeks].sort();
      const firstWeekData = trajectories.find((t) => t.week === sortedWeeks[0] && t.category === cat);
      const lastWeekData = trajectories.find(
        (t) => t.week === sortedWeeks[sortedWeeks.length - 1] && t.category === cat,
      );
      const improvement = firstWeekData && lastWeekData ? lastWeekData.avgScore - firstWeekData.avgScore : 0;

      const avgScore =
        stat.scores.length > 0
          ? Math.round((stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length) * 100) / 100
          : 0;

      if (!bestImproved || improvement > bestImproved.improvement) {
        bestImproved = {
          category: cat,
          improvement: Math.round(improvement * 100) / 100,
        };
      }
      if (!highestAvg || avgScore > highestAvg.avgScore) {
        highestAvg = { category: cat, avgScore };
      }
      if (!mostAttempts || stat.totalAttempts > mostAttempts.attempts) {
        mostAttempts = { category: cat, attempts: stat.totalAttempts };
      }
    }

    return { bestImproved, highestAvg, mostAttempts };
  }, [trajectories]);

  const formatDate = (weekStr: string) => {
    const d = new Date(weekStr);
    return formatDateLocale(d, { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="mx-auto mb-3 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-500" />
        <p className="text-muted-foreground text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector (hidden when controlled externally) */}
      {!isControlled && (
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                days === key
                  ? 'bg-background text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.bestImproved && (
          <KPICard
            icon={<TrendingUp size={18} />}
            value={`+${summary.bestImproved.improvement}%`}
            label={`${t('bestProgress')}: ${summary.bestImproved.category}`}
            trend="up"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
        )}
        {summary.highestAvg && (
          <KPICard
            icon={<Target size={18} />}
            value={`${summary.highestAvg.avgScore}%`}
            label={`${t('bestAvgScore')}: ${summary.highestAvg.category}`}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        )}
        {summary.mostAttempts && (
          <KPICard
            icon={<BarChart3 size={18} />}
            value={summary.mostAttempts.attempts}
            label={`${t('attempts')}: ${summary.mostAttempts.category}`}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
        )}
      </div>

      {/* Trajectory chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('trajectoryTitle')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickFormatter={formatDate}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${CHART_COLORS.grid}`,
                  }}
                  formatter={(value, name) => {
                    const nameStr = String(name || '');
                    if (nameStr.endsWith('_attempts')) return [value, t('attemptsLabel')];
                    return [`${value}%`, name];
                  }}
                  labelFormatter={(label) => formatDate(String(label))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {categories.map((cat, i) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    name={cat}
                    stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">{t('noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
