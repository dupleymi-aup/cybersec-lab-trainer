'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { BookOpen, Loader2, AlertTriangle, TrendingDown, Users } from 'lucide-react';
import { getLearningPathAnalytics, type LearningPathEntry } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from '@/components/security-trainer/KPICard';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

const FUNNEL_COLORS = ['#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa', '#818cf8', '#a855f7', '#c4b5fd', '#d8b4fe'];

export interface LearningPathEntryData {
  moduleId: string;
  moduleName: string;
  completedCount: number;
  percentage: number;
}

export interface LearningPathReportProps {
  groupId?: string;
  days?: number;
}

const isControlled = (props: LearningPathReportProps): props is LearningPathReportProps & { days: number } =>
  props.days !== undefined;

export default function LearningPathReport(props: LearningPathReportProps = {}) {
  const [path, setPath] = useState<LearningPathEntry[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);

  const effectiveDays = isControlled(props) ? props.days : internalDays;
  const controlled = isControlled(props);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getLearningPathAnalytics(effectiveDays, props.groupId)
      .then((data) => {
        if (!cancelled) {
          setPath(data.path);
          setTotalStudents(data.totalStudents);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || 'Ошибка загрузки данных');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [effectiveDays, props.groupId]);

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

  const funnelData = path.map((entry, i) => ({
    name: entry.moduleName,
    value: entry.percentage,
    completedCount: entry.completedCount,
    color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }));

  const dropOffRates = path.map((entry, i) => {
    if (i === 0) return 0;
    const prevPercentage = path[i - 1].percentage || 1;
    return Math.round(((prevPercentage - entry.percentage) / prevPercentage) * 10000) / 100;
  });

  return (
    <div className="space-y-6">
      {/* Period selector — hidden when controlled externally */}
      {!controlled && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                effectiveDays === key ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          icon={<Users size={16} />}
          value={totalStudents}
          label="Всего студентов"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<BookOpen size={16} />}
          value={path.length}
          label="Модулей в пути обучения"
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KPICard
          icon={<TrendingDown size={16} />}
          value={path.length > 0 ? `${path[path.length - 1].percentage}%` : '0%'}
          label="Завершение пути"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Learning Path Funnel - Bar Chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Воронка пути обучения</h3>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} width={120} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'value') return [`${value}%`, 'Завершение'];
                  return [value, name];
                }} />
                <Bar dataKey="value" name="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Module Path Cards */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Путь завершения модулей</h3>
          <div className="space-y-3">
            {path.map((entry, i) => (
              <motion.div
                key={entry.moduleId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary hover:bg-muted transition-colors">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                  </div>

                  {/* Module info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold truncate">{entry.moduleName}</p>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.completedCount} / {totalStudents}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            entry.percentage >= 70 ? 'bg-emerald-100 text-emerald-700' :
                            entry.percentage >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {entry.percentage}%
                        </Badge>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${entry.percentage}%`,
                          backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                        }}
                      />
                    </div>
                  </div>

                  {/* Drop-off indicator */}
                  {i > 0 && dropOffRates[i] > 0 && (
                    <div className="flex-shrink-0 text-xs text-red-500 font-medium">
                      -{dropOffRates[i]}%
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Детальная статистика</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Модуль</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Завершено</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Всего студентов</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Завершение %</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Отток</th>
                </tr>
              </thead>
              <tbody>
                {path.map((entry, i) => (
                  <motion.tr
                    key={entry.moduleId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-100 hover:bg-secondary transition-colors"
                  >
                    <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 px-3 font-medium">{entry.moduleName}</td>
                    <td className="py-2.5 px-3 text-right">{entry.completedCount}</td>
                    <td className="py-2.5 px-3 text-right">{totalStudents}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        entry.percentage >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        entry.percentage >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {entry.percentage}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {i > 0 && dropOffRates[i] > 0 ? (
                        <span className="text-red-500 font-medium">-{dropOffRates[i]}%</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
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
