'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Loader2, AlertTriangle, TrendingUp, BookOpen, Users, Target } from 'lucide-react';
import { getProgressDynamics, type ProgressDynamicsDay } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import KPICard from './KPICard';
import { CHART_COLORS } from '@/lib/constants';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

export interface ProgressDynamicsChartProps {
  groupId?: string;
  days?: number;
}

const DEFAULT_DAYS = 30;

export default function ProgressDynamicsChart({ groupId, days: controlledDays }: ProgressDynamicsChartProps = {}) {
  const [daily, setDaily] = useState<ProgressDynamicsDay[]>([]);
  const [summary, setSummary] = useState<{ totalModulesCompleted: number; totalQuizAttempts: number; avgDailyActive: number; trend: 'up' | 'down' | 'stable' }>({ totalModulesCompleted: 0, totalQuizAttempts: 0, avgDailyActive: 0, trend: 'stable' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(DEFAULT_DAYS);

  const isControlled = controlledDays !== undefined;
  const days = isControlled ? controlledDays : internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProgressDynamics(days, groupId)
      .then((d) => {
        if (!cancelled) {
          setDaily(d.daily);
          setSummary(d.summary);
          setLoading(false);
        }
      })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Ошибка загрузки'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [days, groupId]);

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

  const chartData = daily.map((d) => ({
    ...d,
    dateShort: new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }));

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

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<BookOpen size={18} />}
          value={summary.totalModulesCompleted}
          label="Модулей завершено"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={<Target size={18} />}
          value={summary.totalQuizAttempts}
          label="Попыток квизов"
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KPICard
          icon={<Users size={18} />}
          value={summary.avgDailyActive}
          label="Ср. активных/день"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={<TrendingUp size={18} />}
          value={summary.trend === 'up' ? 'Рост' : summary.trend === 'down' ? 'Спад' : 'Стабильно'}
          label="Тренд активности"
          trend={summary.trend}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Main composed chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Динамика прогресса</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="dateShort" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${CHART_COLORS.grid}` }}
                  formatter={(value, name) => {
                    if (name === 'modulesCompleted') return [value, 'Модулей завершено'];
                    if (name === 'avgQuizScore') return [`${value}%`, 'Ср. балл квизов'];
                    if (name === 'activeStudents') return [value, 'Активных студентов'];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="activeStudents" name="activeStudents" fill={CHART_COLORS.info} fillOpacity={0.15} stroke={CHART_COLORS.info} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="avgQuizScore" name="avgQuizScore" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="modulesCompleted" name="modulesCompleted" stroke={CHART_COLORS.success} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Secondary chart: new completions */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Новые завершения по дням</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="dateShort" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
                <Tooltip formatter={(value, name) => [value, name === 'newCompletions' ? 'Новые завершения' : 'Попытки квизов']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="newCompletions" name="newCompletions" fill={CHART_COLORS.success} fillOpacity={0.2} stroke={CHART_COLORS.success} strokeWidth={2} />
                <Area type="monotone" dataKey="quizAttempts" name="quizAttempts" fill={CHART_COLORS.primary} fillOpacity={0.2} stroke={CHART_COLORS.primary} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Нет данных</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
