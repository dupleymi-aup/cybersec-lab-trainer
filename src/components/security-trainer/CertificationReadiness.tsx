'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Loader2, AlertTriangle, Award, CheckCircle, XCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { getCertificationReadiness, type CertificationReadinessData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CertificationReadinessProps {
  groupId?: string;
  days?: number;
}

export default function CertificationReadiness({
  groupId: propGroupId,
  days: propDays,
}: CertificationReadinessProps = {}) {
  const t = useTranslations('certificationReadiness');

  const TIER_CONFIG = {
    ready: {
      label: t('ready'),
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    },
    almost: {
      label: t('almost'),
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: TrendingUp,
    },
    'needs-work': {
      label: t('needsWork'),
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: AlertTriangle,
    },
    'not-ready': {
      label: t('notReady'),
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
    },
  };
  const [data, setData] = useState<CertificationReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);
  const [internalGroupId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const days = propDays ?? internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCertificationReadiness(days, propGroupId || internalGroupId || undefined)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || t('loading'));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, propGroupId, internalGroupId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">{t('loading')}</p>
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

  const { summary, students } = data;

  const tierData = [
    { name: TIER_CONFIG.ready.label, value: summary.ready, color: '#10b981' },
    { name: TIER_CONFIG.almost.label, value: summary.almost, color: '#3b82f6' },
    {
      name: TIER_CONFIG['needs-work'].label,
      value: summary.needsWork,
      color: '#f59e0b',
    },
    {
      name: TIER_CONFIG['not-ready'].label,
      value: summary.notReady,
      color: '#ef4444',
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold">{t('title')}</h2>
        </div>
        {propDays === undefined && (
          <select
            value={internalDays}
            onChange={(e) => setInternalDays(Number(e.target.value))}
            className="border-border bg-card rounded-md border px-3 py-1.5 text-sm"
          >
            <option value={7}>{t('days7')}</option>
            <option value={30}>{t('days30')}</option>
            <option value={90}>{t('days90')}</option>
          </select>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{summary.avgReadinessScore}</p>
            <p className="text-muted-foreground text-xs">{t('avgScore')}</p>
          </CardContent>
        </Card>
        {Object.entries(TIER_CONFIG).map(([key, config]) => {
          const count = summary[key as keyof typeof summary] as number;
          const Icon = config.icon;
          return (
            <Card key={key} className="border-border">
              <CardContent className="p-4 text-center">
                <Icon
                  size={20}
                  className={`mx-auto mb-1 ${key === 'ready' ? 'text-emerald-600' : key === 'almost' ? 'text-blue-600' : key === 'needs-work' ? 'text-amber-600' : 'text-red-600'}`}
                />
                <p
                  className={`text-2xl font-bold ${key === 'ready' ? 'text-emerald-600' : key === 'almost' ? 'text-blue-600' : key === 'needs-work' ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {count}
                </p>
                <p className="text-muted-foreground text-xs">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribution pie */}
      {tierData.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('distribution')}</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    style={{ fontSize: 10 }}
                  >
                    {tierData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary border-border border-b">
                <tr>
                  <th className="text-muted-foreground p-2 text-left font-medium">{t('student')}</th>
                  <th className="text-muted-foreground p-2 text-center font-medium">{t('group')}</th>
                  <th className="text-muted-foreground p-2 text-center font-medium">{t('score')}</th>
                  <th className="text-muted-foreground p-2 text-center font-medium">{t('level')}</th>
                  <th className="text-muted-foreground p-2 text-center font-medium">{t('modules')}</th>
                  <th className="text-muted-foreground p-2 text-center font-medium">{t('achievements')}</th>
                  <th className="text-muted-foreground p-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <motion.tr
                    key={s.userId}
                    className="hover:bg-secondary border-b border-slate-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="p-2 font-medium">{s.fullName}</td>
                    <td className="text-muted-foreground p-2 text-center">{s.group || '—'}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="bg-muted h-2.5 w-16 rounded-full">
                          <div
                            className={`h-full rounded-full ${s.readinessScore >= 75 ? 'bg-emerald-500' : s.readinessScore >= 55 ? 'bg-blue-500' : s.readinessScore >= 35 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${s.readinessScore}%` }}
                          />
                        </div>
                        <span className="font-bold">{s.readinessScore}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge className={`text-[10px] ${TIER_CONFIG[s.readinessTier].color}`}>
                        {TIER_CONFIG[s.readinessTier].label}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      {s.modulesCompleted}/{s.totalModules}
                    </td>
                    <td className="p-2 text-center">{s.achievements}</td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === s.userId ? null : s.userId)}
                        className="hover:text-muted-foreground text-slate-400"
                      >
                        {expandedId === s.userId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded detail */}
          {expandedId &&
            (() => {
              const s = students.find((st) => st.userId === expandedId);
              if (!s) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-secondary border-border border-t p-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Radar chart */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">{t('categoryReadiness')}</h4>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            data={s.categoryReadiness.map((c) => ({
                              name: c.category,
                              score: c.score,
                              fullMark: 100,
                            }))}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 9 }} />
                            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                            <Radar name={t('score')} dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Strengths/Weaknesses/Recommendations */}
                    <div className="space-y-3">
                      {s.strengths.length > 0 && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold text-emerald-700">{t('strengths')}</h4>
                          <div className="flex flex-wrap gap-1">
                            {s.strengths.map((w) => (
                              <Badge key={w} className="bg-emerald-100 text-[10px] text-emerald-700">
                                {w}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {s.weaknesses.length > 0 && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold text-amber-700">{t('growthAreas')}</h4>
                          <div className="flex flex-wrap gap-1">
                            {s.weaknesses.map((w) => (
                              <Badge key={w} className="bg-amber-100 text-[10px] text-amber-700">
                                {w}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {s.recommendations.length > 0 && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold text-indigo-700">{t('recommendations')}</h4>
                          <ul className="space-y-1">
                            {s.recommendations.map((r, _i) => (
                              <li
                                key={s.readinessTier + r}
                                className="text-muted-foreground flex items-start gap-1 text-xs"
                              >
                                <span className="mt-0.5 text-indigo-500">•</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
        </CardContent>
      </Card>
    </div>
  );
}
