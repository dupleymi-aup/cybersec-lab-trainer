'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { getCohortAnalysis, getAllGroups } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from './KPICard';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, TrendingUp, TrendingDown, Target, Loader2, BarChart3 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface CohortRetention {
  week1: number;
  week2: number;
  week4: number;
  week8: number;
  week12: number;
}

interface CohortData {
  month: string;
  monthKey: string;
  totalStudents: number;
  retention: CohortRetention;
}

interface CohortAnalysisResponse {
  cohorts: CohortData[];
  overallRetention: CohortRetention;
}

interface CohortAnalysisProps {
  groupId?: string;
}

const RETENTION_WEEKS: Array<{
  key: keyof CohortRetention;
  label: string;
  daysLabel: string;
}> = [
  { key: 'week1', label: 'week1', daysLabel: 'days7' },
  { key: 'week2', label: 'week2', daysLabel: 'days14' },
  { key: 'week4', label: 'week4', daysLabel: 'days28' },
  { key: 'week8', label: 'week8', daysLabel: 'days56' },
  { key: 'week12', label: 'week12', daysLabel: 'days84' },
];

/**
 * Get a color for a retention percentage.
 * Returns a Tailwind-compatible class for background and text colors.
 */
function getRetentionColor(percent: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (percent >= 80)
    return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    };
  if (percent >= 60)
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    };
  if (percent >= 40)
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    };
  if (percent >= 20)
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100',
    };
  return { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' };
}

/**
 * Get an inline style for heatmap cell intensity.
 */
function getHeatmapStyle(percent: number): React.CSSProperties {
  const opacity = Math.max(0.1, percent / 100);
  const hue = percent >= 60 ? '152' : percent >= 40 ? '38' : '0';
  return {
    backgroundColor: `hsla(${hue}, 70%, 50%, ${opacity})`,
    transition: 'background-color 0.2s ease',
  };
}

export default function CohortAnalysis({ groupId }: CohortAnalysisProps) {
  const t = useTranslations('cohortAnalysis');
  const [data, setData] = useState<CohortAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [internalGroupId, setInternalGroupId] = useState('');

  const isControlled = groupId !== undefined;
  const effectiveGroupId = isControlled ? groupId : internalGroupId;

  // Fetch groups list for selector
  useEffect(() => {
    const controller = new AbortController();
    getAllGroups()
      .then((g) => setGroups(g))
      .catch((err) => {
        if (process.env.NODE_ENV === 'development')
          logger.error('CohortAnalysis failed to load groups', { error: err });
        setGroups([]);
      });
    return () => {
      controller.abort();
    };
  }, []);

  // Fetch cohort data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCohortAnalysis(effectiveGroupId || undefined)
      .then((result) => {
        if (!cancelled) {
          setData(result);
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
  }, [effectiveGroupId, t]);

  // Compute summary statistics
  const summary = useMemo(() => {
    if (!data || data.cohorts.length === 0) {
      return { totalCohorts: 0, bestCohort: null, avgWeek1: 0, avgWeek12: 0 };
    }

    const totalCohorts = data.cohorts.length;

    // Best retention cohort (highest week4 retention as a balance metric)
    const bestCohort = data.cohorts.reduce((best, current) => {
      return current.retention.week4 > best.retention.week4 ? current : best;
    }, data.cohorts[0]);

    // Average week1 and week12 retention
    const avgWeek1 = Math.round((data.cohorts.reduce((sum, c) => sum + c.retention.week1, 0) / totalCohorts) * 10) / 10;
    const avgWeek12 =
      Math.round((data.cohorts.reduce((sum, c) => sum + c.retention.week12, 0) / totalCohorts) * 10) / 10;

    return { totalCohorts, bestCohort, avgWeek1, avgWeek12 };
  }, [data]);

  // Line chart data for overall retention curve
  const lineChartData = useMemo(() => {
    if (!data) return [];
    return RETENTION_WEEKS.map((w) => ({
      week: w.label,
      retention: data.overallRetention[w.key],
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin text-indigo-500" />
          <p className="text-muted-foreground text-sm">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <BarChart3 size={32} className="mx-auto mb-3 text-red-400" />
          <p className="text-muted-foreground text-sm font-medium">{t('loadingError')}</p>
          <p className="mt-1 text-xs text-slate-400">{error || t('noData')}</p>
        </div>
      </div>
    );
  }

  if (data.cohorts.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Calendar size={40} className="mb-3 opacity-50" />
          <p className="text-sm">{t('noData')}</p>
          <p className="mt-1 text-xs text-slate-300">
            {effectiveGroupId ? t('noStudentsInGroup') : t('noStudentsYet')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with group selector */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <BarChart3 size={20} className="text-indigo-600" />
          {t('title')}
        </h2>

        {/* Group selector — hidden when controlled externally */}
        {!isControlled && (
          <div className="flex items-center gap-2">
            <Users size={15} className="text-muted-foreground" />
            <select
              value={internalGroupId}
              onChange={(e) => setInternalGroupId(e.target.value)}
              className="border-border bg-card hover:border-border rounded-md border px-3 py-1.5 text-sm transition-colors outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">{t('allGroups')}</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={<Calendar size={18} />}
          value={summary.totalCohorts}
          label={t('totalCohorts')}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<Target size={18} />}
          value={summary.bestCohort ? `${summary.bestCohort.month}` : '—'}
          label={t('bestCohort')}
          delta={summary.bestCohort ? Math.round(summary.bestCohort.retention.week4 * 10) / 10 : undefined}
          deltaSuffix={t('weekLabel')}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={<TrendingUp size={18} />}
          value={`${summary.avgWeek1}%`}
          label={t('avgRetentionWeek1')}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={<TrendingDown size={18} />}
          value={`${summary.avgWeek12}%`}
          label={t('avgRetentionWeek12')}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Retention heatmap table */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <BarChart3 size={16} className="text-slate-400" />
            {t('retentionHeatmap')}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground min-w-[140px] px-3 py-2 text-left font-semibold">{t('cohort')}</th>
                  <th className="text-muted-foreground px-2 py-2 text-center font-semibold">{t('students')}</th>
                  {RETENTION_WEEKS.map((w) => (
                    <th key={w.key} className="text-muted-foreground min-w-[90px] px-2 py-2 text-center font-semibold">
                      <div className="flex flex-col items-center">
                        <span>{t(w.label)}</span>
                        <span className="text-[10px] font-normal text-slate-400">{t(w.daysLabel)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((cohort, idx) => (
                  <motion.tr
                    key={cohort.monthKey}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-secondary/50 border-b border-slate-100 last:border-0"
                  >
                    <td className="text-foreground/70 px-3 py-2.5 font-medium">{cohort.month}</td>
                    <td className="px-2 py-2.5 text-center">
                      <Badge variant="secondary" className="text-xs">
                        {cohort.totalStudents}
                      </Badge>
                    </td>
                    {RETENTION_WEEKS.map((w) => {
                      const value = cohort.retention[w.key];
                      const colors = getRetentionColor(value);
                      return (
                        <td key={w.key} className="px-2 py-2.5 text-center">
                          <div
                            className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${colors.text} ${colors.border}`}
                            style={getHeatmapStyle(value)}
                          >
                            {value > 0 ? `${value}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="text-muted-foreground mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs">
            <span>{t('retention')}:</span>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={getHeatmapStyle(90)} />
              <span>80%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={getHeatmapStyle(70)} />
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={getHeatmapStyle(50)} />
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={getHeatmapStyle(30)} />
              <span>20-39%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={getHeatmapStyle(10)} />
              <span>&lt;20%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall retention line chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp size={16} className="text-slate-400" />
            {t('overallRetentionByWeek')}
          </h3>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, t('retention')]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{
                    fill: '#6366f1',
                    r: 4,
                    strokeWidth: 2,
                    stroke: '#fff',
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#6366f1',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
