'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getComprehensiveSummary, type ComprehensiveSummary } from '@/lib/auth-store';
import { modules } from '@/lib/data';
import KPICard from './KPICard';

const PRESETS = [
  { key: '7', label: 'Эта неделя' },
  { key: '14', label: 'Прошлая неделя' },
  { key: '30', label: 'Этот месяц' },
  { key: '60', label: 'Прошлый месяц' },
  { key: '90', label: 'Этот квартал' },
  { key: '180', label: 'Прошлый квартал' },
];

export default function PeriodComparison({ groupId }: { groupId?: string }) {
  const [periodA, setPeriodA] = useState(30);
  const [periodB, setPeriodB] = useState(60);
  const [dataA, setDataA] = useState<ComprehensiveSummary | null>(null);
  const [dataB, setDataB] = useState<ComprehensiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getComprehensiveSummary(periodA, groupId),
      getComprehensiveSummary(periodB, groupId),
    ]).then(([a, b]) => {
      setDataA(a);
      setDataB(b);
      setLoading(false);
    });
  }, [periodA, periodB, groupId]);

  if (loading || !dataA || !dataB) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground ml-3">Загрузка данных...</p>
      </div>
    );
  }

  const kpisA = dataA.kpis;
  const kpisB = dataB.kpis;

  const computeDelta = (a: number, b: number, suffix = '') => {
    const delta = a - b;
    const absDelta = Math.abs(delta);
    return { value: delta, absDelta, suffix, direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable' };
  };

  const kpiComparisons = [
    { label: 'Всего студентов', a: kpisA.totalStudents, b: kpisB.totalStudents, delta: computeDelta(kpisA.totalStudents, kpisB.totalStudents) },
    { label: 'Активных (%)', a: kpisA.activePercentage, b: kpisB.activePercentage, delta: computeDelta(kpisA.activePercentage, kpisB.activePercentage, '%') },
    { label: 'Ср. завершение (%)', a: kpisA.avgCompletionRate, b: kpisB.avgCompletionRate, delta: computeDelta(kpisA.avgCompletionRate, kpisB.avgCompletionRate, '%') },
    { label: 'Ср. балл квизов (%)', a: kpisA.avgQuizScore, b: kpisB.avgQuizScore, delta: computeDelta(kpisA.avgQuizScore, kpisB.avgQuizScore, '%') },
    { label: 'Модулей завершено', a: kpisA.totalModulesCompleted, b: kpisB.totalModulesCompleted, delta: computeDelta(kpisA.totalModulesCompleted, kpisB.totalModulesCompleted) },
    { label: 'Вовлечённость', a: kpisA.engagementScore, b: kpisB.engagementScore, delta: computeDelta(kpisA.engagementScore, kpisB.engagementScore) },
  ];

  // Module comparison data
  const moduleComparison = modules.map((mod) => {
    const statA = dataA.moduleDistribution.find((m) => m.moduleId === mod.id);
    const statB = dataB.moduleDistribution.find((m) => m.moduleId === mod.id);
    return {
      module: mod.title,
      periodA: statA ? Math.round(statA.completionRate) : 0,
      periodB: statB ? Math.round(statB.completionRate) : 0,
    };
  });

  // Compute biggest gains/losses
  const sortedByGain = [...moduleComparison].sort((a, b) => (b.periodA - b.periodB) - (a.periodA - a.periodB));
  const biggestGains = sortedByGain.filter((m) => m.periodA - m.periodB > 0).slice(0, 3);
  const biggestLosses = sortedByGain.filter((m) => m.periodA - m.periodB < 0).slice(0, 3);

  const DeltaIcon = ({ direction }: { direction: string }) => {
    if (direction === 'up') return <ArrowUpRight size={14} className="text-emerald-600" />;
    if (direction === 'down') return <ArrowDownRight size={14} className="text-red-600" />;
    return <Minus size={14} className="text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Period Selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-700">Период A</Badge>
          <select
            value={periodA}
            onChange={(e) => setPeriodA(Number(e.target.value))}
            className="px-3 py-1.5 border border-border rounded-md text-sm bg-card"
          >
            {PRESETS.map((p) => (
              <option key={`a-${p.key}`} value={p.key}>{p.label} ({p.key}д)</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-violet-100 text-violet-700">Период B</Badge>
          <select
            value={periodB}
            onChange={(e) => setPeriodB(Number(e.target.value))}
            className="px-3 py-1.5 border border-border rounded-md text-sm bg-card"
          >
            {PRESETS.map((p) => (
              <option key={`b-${p.key}`} value={p.key}>{p.label} ({p.key}д)</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpiComparisons.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{kpi.label}</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-lg font-bold text-indigo-600">{kpi.a}{kpi.delta.suffix}</p>
                    <p className="text-[10px] text-muted-foreground">Период A</p>
                  </div>
                  <div className="flex items-center gap-1 px-2">
                    <DeltaIcon direction={kpi.delta.direction} />
                    <span className={`text-sm font-semibold ${
                      kpi.delta.direction === 'up' ? 'text-emerald-600' : kpi.delta.direction === 'down' ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {kpi.delta.value > 0 ? '+' : ''}{kpi.delta.value}{kpi.delta.suffix}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-violet-600">{kpi.b}{kpi.delta.suffix}</p>
                    <p className="text-[10px] text-muted-foreground">Период B</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Module Comparison Chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Завершение модулей: сравнение</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moduleComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="module" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: number) => [`${value}%`, '']} />
              <Legend />
              <Bar dataKey="periodA" name="Период A" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="periodB" name="Период B" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gains and Losses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {biggestGains.length > 0 && (
          <Card className="border-emerald-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-emerald-600" />
                <h3 className="font-semibold text-sm text-emerald-700">Наибольший рост</h3>
              </div>
              <div className="space-y-2">
                {biggestGains.map((m) => (
                  <div key={m.module} className="flex items-center justify-between text-sm">
                    <span>{m.module}</span>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      +{m.periodA - m.periodB}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {biggestLosses.length > 0 && (
          <Card className="border-red-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={16} className="text-red-600" />
                <h3 className="font-semibold text-sm text-red-700">Наибольшее снижение</h3>
              </div>
              <div className="space-y-2">
                {biggestLosses.map((m) => (
                  <div key={m.module} className="flex items-center justify-between text-sm">
                    <span>{m.module}</span>
                    <Badge className="bg-red-100 text-red-700">
                      {m.periodA - m.periodB}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-2">Итог</h3>
          {(() => {
            const positiveDeltas = kpiComparisons.filter((k) => k.delta.direction === 'up').length;
            const negativeDeltas = kpiComparisons.filter((k) => k.delta.direction === 'down').length;
            const stableDeltas = kpiComparisons.filter((k) => k.delta.direction === 'stable').length;
            const trend = positiveDeltas > negativeDeltas ? 'improving' : negativeDeltas > positiveDeltas ? 'declining' : 'stable';
            const trendLabel = trend === 'improving' ? 'улучшается' : trend === 'declining' ? 'снижается' : 'стабильно';
            const trendColor = trend === 'improving' ? 'text-emerald-600' : trend === 'declining' ? 'text-red-600' : 'text-muted-foreground';

            return (
              <div>
                <p className="text-sm">
                  Общая динамика:{' '}
                  <span className={`font-semibold ${trendColor}`}>{trendLabel}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {positiveDeltas} показателей улучшилось, {negativeDeltas} снизилось, {stableDeltas} без изменений
                </p>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
