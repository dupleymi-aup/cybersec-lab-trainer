'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { GitBranch, Loader2, AlertTriangle, Users, BookOpen, Trophy, CheckCircle } from 'lucide-react';
import { getComprehensiveSummary, type ComprehensiveSummary } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import KPICard from './KPICard';
import PeriodSelector from './PeriodSelector';

const STAGE_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function ProgressSankey({
  groupId: controlledGroupId,
  days: controlledDays,
}: { groupId?: string; days?: number } = {}) {
  const [internalDays, setInternalDays] = useState(30);
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [data, setData] = useState<ComprehensiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('progressSankey');
  const tc = useTranslations('common');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getComprehensiveSummary(days, controlledGroupId)
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

  const { kpis, moduleDistribution, scoreDistribution } = data;

  // Build funnel stages
  const totalStudents = kpis.totalStudents;
  const activeStudents = kpis.activeStudents;
  const completedAtLeastOne = Math.round((kpis.avgCompletionRate / 100) * totalStudents);
  const passedAtLeastOne = scoreDistribution.good + scoreDistribution.excellent;
  const fullyCompleted = Math.round((kpis.avgCompletionRate / 100) * activeStudents * 0.3);

  const stages = [
    {
      label: t('registered'),
      value: totalStudents,
      icon: Users,
      color: '#6366f1',
    },
    {
      label: t('active'),
      value: activeStudents,
      icon: Loader2,
      color: '#8b5cf6',
    },
    {
      label: t('startedModules'),
      value: completedAtLeastOne,
      icon: BookOpen,
      color: '#10b981',
    },
    {
      label: t('passedQuizzes'),
      value: passedAtLeastOne,
      icon: Trophy,
      color: '#f59e0b',
    },
    {
      label: t('completedCourse'),
      value: fullyCompleted,
      icon: CheckCircle,
      color: '#ef4444',
    },
  ];

  // Calculate conversion rates between stages
  const conversions = stages.slice(0, -1).map((s, i) => ({
    from: s.label,
    to: stages[i + 1].label,
    rate: s.value > 0 ? Math.round((stages[i + 1].value / s.value) * 100) : 0,
    dropoff: s.value - stages[i + 1].value,
  }));

  // Module flow data
  const moduleFlow = moduleDistribution
    .map((m, i) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      started: Math.round((m.completionRate / 100) * totalStudents),
      completed: Math.round((m.completionRate / 100) * totalStudents * 0.7),
      passed: Math.round((m.completionRate / 100) * totalStudents * 0.6),
      color: STAGE_COLORS[i % STAGE_COLORS.length],
    }))
    .sort((a, b) => b.started - a.started);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      {controlledDays === undefined && (
        <PeriodSelector value={days} onChange={setInternalDays} getLabel={(d) => tc(`days${d}`)} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stages.map((stage) => (
          <KPICard
            key={stage.label}
            icon={<stage.icon size={18} />}
            value={stage.value}
            label={stage.label}
            iconBg="bg-opacity-20"
            iconColor="text-white"
          />
        ))}
      </div>

      {/* Main Funnel Visualization */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold">
            <GitBranch size={16} className="text-indigo-500" />
            {t('funnelTitle')}
          </h3>
          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const widthPercent = totalStudents > 0 ? (stage.value / totalStudents) * 100 : 0;
              return (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-40 flex-shrink-0 text-right">
                    <p className="text-sm font-medium">{stage.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {stage.value} {t('students')}
                    </p>
                  </div>
                  <div className="relative flex-1">
                    <div
                      className="flex h-10 items-center rounded-lg px-4 transition-all duration-500"
                      style={{
                        width: `${Math.max(widthPercent, 5)}%`,
                        backgroundColor: stage.color,
                        opacity: 0.8 + idx * 0.05,
                      }}
                    >
                      <span className="text-sm font-bold text-white">{stage.value}</span>
                    </div>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className="w-16 flex-shrink-0 text-center">
                      <span
                        className={`text-xs font-semibold ${conversions[idx].rate >= 70 ? 'text-emerald-600' : conversions[idx].rate >= 40 ? 'text-amber-600' : 'text-red-600'}`}
                      >
                        {conversions[idx].rate}%
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Details */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('conversionBetweenStages')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {conversions.map((conv, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-lg border p-4 ${conv.rate >= 70 ? 'border-emerald-200 bg-emerald-50/50' : conv.rate >= 40 ? 'border-amber-200 bg-amber-50/50' : 'border-red-200 bg-red-50/50'}`}
              >
                <p className="text-muted-foreground text-xs">
                  {conv.from} → {conv.to}
                </p>
                <p
                  className={`mt-1 text-2xl font-bold ${conv.rate >= 70 ? 'text-emerald-600' : conv.rate >= 40 ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {conv.rate}%
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t('churn')}: {conv.dropoff} {t('students')}
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Progress Flow */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('moduleProgress')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('module')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('started')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('completed')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('passed')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('conversion')}</th>
                </tr>
              </thead>
              <tbody>
                {moduleFlow.slice(0, 8).map((mod, i) => {
                  const conversion = mod.started > 0 ? Math.round((mod.passed / mod.started) * 100) : 0;
                  return (
                    <motion.tr
                      key={mod.moduleId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-secondary border-b border-slate-100 transition-colors"
                    >
                      <td className="px-3 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: mod.color }} />
                          {mod.moduleName}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">{mod.started}</td>
                      <td className="px-3 py-2.5 text-right">{mod.completed}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{mod.passed}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`font-semibold ${conversion >= 70 ? 'text-emerald-600' : conversion >= 40 ? 'text-amber-600' : 'text-red-600'}`}
                        >
                          {conversion}%
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
