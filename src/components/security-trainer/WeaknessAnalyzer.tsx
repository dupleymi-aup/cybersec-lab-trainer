'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Loader2, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { getModulePerformance, getQuizCategoryAnalytics } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CustomDateRangePicker from './CustomDateRangePicker';

interface WeaknessItem {
  topic: string;
  score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'module' | 'quiz';
  details: string;
  recommendations: string[];
}

export default function WeaknessAnalyzer({ groupId }: { groupId?: string }) {
  const t = useTranslations('weaknessAnalyzer');

  const SEVERITY_CONFIG = useMemo(
    () => ({
      critical: {
        color: '#ef4444',
        bg: 'bg-red-50',
        text: 'text-red-700',
        label: t('severityCritical'),
      },
      high: {
        color: '#f97316',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        label: t('severityHigh'),
      },
      medium: {
        color: '#f59e0b',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        label: t('severityMedium'),
      },
      low: {
        color: '#84cc16',
        bg: 'bg-lime-50',
        text: 'text-lime-700',
        label: t('severityLow'),
      },
    }),
    [t],
  );

  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getModulePerformance(days, groupId), getQuizCategoryAnalytics(days, groupId)])
      .then(([modulePerf, quizCategoryData]) => {
        if (cancelled) return;

        const quizStats = quizCategoryData.categories;
        const items: WeaknessItem[] = [];

        // Module weaknesses
        for (const mod of modulePerf) {
          if (mod.completionRate < 60 || mod.avgScore < 60) {
            const avgMetric = (mod.completionRate + mod.avgScore) / 2;
            let severity: WeaknessItem['severity'] = 'low';
            if (avgMetric < 20) severity = 'critical';
            else if (avgMetric < 40) severity = 'high';
            else if (avgMetric < 60) severity = 'medium';

            const recommendations: string[] = [];
            if (mod.completionRate < 40) {
              recommendations.push(t('recModuleIncreaseVisibility', { name: mod.moduleName }));
            }
            if (mod.avgScore < 50) {
              recommendations.push(t('recModuleAddMaterials', { name: mod.moduleName }));
            }
            if (mod.difficultyIndex > 0.7) {
              recommendations.push(t('recModuleSimplify', { name: mod.moduleName }));
            }
            if (recommendations.length === 0) {
              recommendations.push(t('recModuleMorePractice', { name: mod.moduleName }));
            }

            items.push({
              topic: mod.moduleName,
              score: Math.round(avgMetric),
              severity,
              type: 'module',
              details: t('moduleDetails', {
                completed: mod.completedCount,
                total: mod.totalStudents,
                score: mod.avgScore,
              }),
              recommendations,
            });
          }
        }

        // Quiz category weaknesses
        for (const cat of quizStats) {
          if (cat.avgScore < 60) {
            let severity: WeaknessItem['severity'] = 'low';
            if (cat.avgScore < 20) severity = 'critical';
            else if (cat.avgScore < 40) severity = 'high';
            else if (cat.avgScore < 60) severity = 'medium';

            const recommendations: string[] = [];
            if (cat.avgScore < 40) {
              recommendations.push(t('recQuizExtraSession', { name: cat.categoryName }));
            }
            if (cat.questionStats.some((q) => q.correctRate < 0.3)) {
              recommendations.push(t('recQuizReviewQuestions', { name: cat.categoryName }));
            }
            if (recommendations.length === 0) {
              recommendations.push(t('recQuizMorePractice', { name: cat.categoryName }));
            }

            items.push({
              topic: cat.categoryName,
              score: Math.round(cat.avgScore),
              severity,
              type: 'quiz',
              details: t('quizDetails', { students: cat.uniqueStudents, attempts: cat.totalAttempts }),
              recommendations,
            });
          }
        }

        items.sort((a, b) => a.score - b.score);
        setWeaknesses(items);
        setLoading(false);
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
  }, [days, groupId, t]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: weaknesses.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const w of weaknesses) {
      counts[w.severity] = (counts[w.severity] || 0) + 1;
    }
    return counts;
  }, [weaknesses]);

  const filteredWeaknesses = useMemo(() => {
    if (selectedSeverity === 'all') return weaknesses;
    return weaknesses.filter((w) => w.severity === selectedSeverity);
  }, [weaknesses, selectedSeverity]);

  const chartData = useMemo(() => {
    return weaknesses.slice(0, 10).map((w) => ({
      name: w.topic.length > 18 ? w.topic.substring(0, 16) + '...' : w.topic,
      score: w.score,
      severity: w.severity,
    }));
  }, [weaknesses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">{t('loadingMessage')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-muted-foreground ml-3 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Target size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t('title')}</h2>
            <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
          </div>
        </div>
        <CustomDateRangePicker days={days} onChange={setDays} />
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Object.entries(severityCounts).map(([key, count]) => {
          if (key === 'all') {
            return (
              <button
                key={key}
                onClick={() => setSelectedSeverity('all')}
                className={`rounded-lg p-3 text-center transition-all ${
                  selectedSeverity === 'all'
                    ? 'bg-slate-800 text-white ring-2 ring-slate-800 dark:bg-slate-700'
                    : 'bg-muted text-foreground/70 hover:bg-slate-200'
                }`}
              >
                <p className="text-xl font-bold">{count}</p>
                <p className="mt-0.5 text-xs">{t('allProblems')}</p>
              </button>
            );
          }
          const cfg = SEVERITY_CONFIG[key as keyof typeof SEVERITY_CONFIG];
          return (
            <button
              key={key}
              onClick={() => setSelectedSeverity(key)}
              className={`rounded-lg p-3 text-center transition-all ${
                selectedSeverity === key ? `${cfg.bg} ring-2 ring-offset-1` : 'bg-secondary hover:bg-muted'
              }`}
            >
              <p className={`text-xl font-bold ${cfg.text}`}>{count}</p>
              <p className={`mt-0.5 text-xs ${cfg.text}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weakness chart */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp size={16} className="text-muted-foreground" />
              {t('topProblemTopics')}
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(value) => [`${value}%`, t('avgScoreLabel')]} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={SEVERITY_CONFIG[entry.severity].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">{t('noProblemTopics')}</p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Lightbulb size={16} className="text-amber-500" />
              {t('recommendations')}
            </h3>
            {filteredWeaknesses.length > 0 ? (
              <div className="max-h-[300px] space-y-3 overflow-y-auto">
                {filteredWeaknesses.slice(0, 8).map((w, i) => (
                  <motion.div
                    key={`${w.type}-${w.topic}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:border-border rounded-lg border border-slate-100 p-3"
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] ${SEVERITY_CONFIG[w.severity].bg} ${SEVERITY_CONFIG[w.severity].text}`}
                        >
                          {SEVERITY_CONFIG[w.severity].label}
                        </Badge>
                        <span className="text-sm font-medium">{w.topic}</span>
                      </div>
                      <span className={`text-xs font-semibold ${w.score >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {w.score}%
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-2 text-[11px]">{w.details}</p>
                    <ul className="space-y-0.5">
                      {w.recommendations.map((rec, j) => (
                        <li key={j} className="text-muted-foreground flex items-start gap-1.5 text-[11px]">
                          <span className="mt-0.5 text-emerald-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">{t('noProblems')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full weakness table */}
      {filteredWeaknesses.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary border-border border-b">
                    <th className="p-3 text-left text-xs font-semibold">{t('topic')}</th>
                    <th className="p-3 text-left text-xs font-semibold">{t('type')}</th>
                    <th className="p-3 text-center text-xs font-semibold">{t('score')}</th>
                    <th className="p-3 text-center text-xs font-semibold">{t('status')}</th>
                    <th className="p-3 text-left text-xs font-semibold">{t('details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWeaknesses.map((w, i) => (
                    <motion.tr
                      key={`${w.type}-${w.topic}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-secondary border-b border-slate-100"
                    >
                      <td className="p-3 text-xs font-medium">{w.topic}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {w.type === 'module' ? t('module') : t('quiz')}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-xs font-semibold ${w.score >= 50 ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          {w.score}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          className={`text-[10px] ${SEVERITY_CONFIG[w.severity].bg} ${SEVERITY_CONFIG[w.severity].text}`}
                        >
                          {SEVERITY_CONFIG[w.severity].label}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground p-3 text-[11px]">{w.details}</td>
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
