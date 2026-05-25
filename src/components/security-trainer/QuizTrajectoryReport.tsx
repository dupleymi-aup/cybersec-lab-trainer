'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Loader2, AlertTriangle, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { getQuizTrajectory, type QuizTrajectoryPoint } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import KPICard from './KPICard';

const PERIOD_OPTIONS = [
  { key: 7, label: '7d' },
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
  { key: 180, label: '180d' },
];

// Consistent color palette for categories
const CATEGORY_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
];

export interface QuizTrajectoryReportProps {
  groupId?: string;
  days?: number;
}

const DEFAULT_DAYS = 30;

export default function QuizTrajectoryReport({ groupId, days: controlledDays }: QuizTrajectoryReportProps = {}) {
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
          setError(e.message || 'Ошибка загрузки');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [days, groupId]);

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

    return Array.from(weekMap.values()).sort(
      (a, b) => (a.week as string).localeCompare(b.week as string)
    );
  }, [trajectories]);

  // Summary computations
  const summary = useMemo(() => {
    if (trajectories.length === 0) {
      return { bestImproved: null, highestAvg: null, mostAttempts: null };
    }

    const catStats = new Map<string, { scores: number[]; totalAttempts: number; weeks: string[] }>();

    for (const t of trajectories) {
      const stat = catStats.get(t.category) || { scores: [], totalAttempts: 0, weeks: [] };
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
      const lastWeekData = trajectories.find((t) => t.week === sortedWeeks[sortedWeeks.length - 1] && t.category === cat);
      const improvement = firstWeekData && lastWeekData ? lastWeekData.avgScore - firstWeekData.avgScore : 0;

      const avgScore = stat.scores.length > 0
        ? Math.round((stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length) * 100) / 100
        : 0;

      if (!bestImproved || improvement > bestImproved.improvement) {
        bestImproved = { category: cat, improvement: Math.round(improvement * 100) / 100 };
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
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector (hidden when controlled externally) */}
      {!isControlled && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
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
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary.bestImproved && (
          <KPICard
            icon={<TrendingUp size={18} />}
            value={`+${summary.bestImproved.improvement}%`}
            label={`Лучший прогресс: ${summary.bestImproved.category}`}
            trend="up"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
        )}
        {summary.highestAvg && (
          <KPICard
            icon={<Target size={18} />}
            value={`${summary.highestAvg.avgScore}%`}
            label={`Лучший ср. балл: ${summary.highestAvg.category}`}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        )}
        {summary.mostAttempts && (
          <KPICard
            icon={<BarChart3 size={18} />}
            value={summary.mostAttempts.attempts}
            label={`Попыток: ${summary.mostAttempts.category}`}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
        )}
      </div>

      {/* Trajectory chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Траектория квизов по категориям</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={formatDate}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value, name) => {
                    const nameStr = String(name || '');
                    if (nameStr.endsWith('_attempts')) return [value, 'Попытки'];
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
            <p className="text-sm text-slate-400 text-center py-12">Нет данных</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
