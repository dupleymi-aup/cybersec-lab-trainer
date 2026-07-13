'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { getModulePerformance, type ModulePerformance } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#a855f7', '#d8b4fe'];

function getDifficultyColor(difficultyIndex: number): string {
  if (difficultyIndex >= 60) return 'bg-red-100 text-red-700';
  if (difficultyIndex >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function getDifficultyLabel(difficultyIndex: number): string {
  if (difficultyIndex >= 60) return 'hard';
  if (difficultyIndex >= 40) return 'medium';
  return 'easy';
}

export interface ModulePerformanceReportProps {
  groupId?: string;
  days?: number;
}

const isControlled = (props: ModulePerformanceReportProps): props is ModulePerformanceReportProps & { days: number } =>
  props.days !== undefined;

export default function ModulePerformanceReport(props: ModulePerformanceReportProps = {}) {
  const t = useTranslations('modulePerformance');
  const [modules, setModules] = useState<ModulePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);

  const effectiveDays = isControlled(props) ? props.days : internalDays;
  const controlled = isControlled(props);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getModulePerformance(effectiveDays, props.groupId)
      .then((m) => {
        if (!cancelled) {
          setModules(m);
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
  }, [effectiveDays, props.groupId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="mx-auto mb-3 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm">{t('loadingData')}</p>
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

  const chartData = modules.map((m, i) => ({
    name: m.moduleName,
    completionRate: m.completionRate,
    avgScore: m.avgScore,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Period selector — hidden when controlled externally */}
      {!controlled && (
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                effectiveDays === key
                  ? 'bg-background text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Module cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m, i) => (
          <motion.div
            key={m.moduleId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border hover:border-border transition-colors">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                    <BookOpen size={16} className="text-indigo-600" />
                  </div>
                  <p className="text-sm leading-tight font-semibold">{m.moduleName}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('completion')}</span>
                    <span className="font-semibold">{m.completionRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('avgScore')}</span>
                    <span className="font-semibold">{m.avgScore}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('difficulty')}</span>
                    <Badge className={`text-[10px] ${getDifficultyColor(m.difficultyIndex)}`}>
                      {t(getDifficultyLabel(m.difficultyIndex))}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('completed')}</span>
                    <span className="font-semibold">
                      {m.completedCount}/{m.totalStudents}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Completion rate bar chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('moduleCompletion')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name === 'completionRate' ? t('completion') : t('avgScore')]}
                />
                <Bar dataKey="completionRate" name="completionRate" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">{t('noData')}</p>
          )}
        </CardContent>
      </Card>

      {/* Module detail table */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('moduleDetails')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('module')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('students')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('completed')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('completion')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('avgScore')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('difficulty')}</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m, i) => (
                  <motion.tr
                    key={m.moduleId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-secondary border-b border-slate-100 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-medium">{m.moduleName}</td>
                    <td className="px-3 py-2.5 text-right">{m.totalStudents}</td>
                    <td className="px-3 py-2.5 text-right">{m.completedCount}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          m.completionRate >= 70
                            ? 'bg-emerald-100 text-emerald-700'
                            : m.completionRate >= 40
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.completionRate}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">{m.avgScore}%</td>
                    <td className="px-3 py-2.5 text-right">
                      <Badge className={`text-[10px] ${getDifficultyColor(m.difficultyIndex)}`}>
                        {t(getDifficultyLabel(m.difficultyIndex))}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
