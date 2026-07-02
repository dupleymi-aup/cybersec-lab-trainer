'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Users,
  GraduationCap,
  BookOpen,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { getAdminSummary, type AdminSummary } from '@/lib/auth-store';
import { useAnalyticsFetcher } from '@/hooks/use-analytics-fetch';
import { Card, CardContent } from '@/components/ui/card';

type GroupBy = 'group' | 'course' | 'university';

const groupByLabels: Record<GroupBy, string> = {
  group: 'По группе',
  course: 'По курсу',
  university: 'По университету',
};

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#a855f7', '#d8b4fe'];

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
  deltaSuffix?: string;
  delay?: number;
  iconBg: string;
  iconColor: string;
}

function MetricCard({ icon, value, label, trend, delta, deltaSuffix, delay = 0, iconBg, iconColor }: MetricCardProps) {
  const trendIcon = trend === 'up' ? (
    <TrendingUp size={14} className="text-emerald-500" />
  ) : trend === 'down' ? (
    <TrendingDown size={14} className="text-red-500" />
  ) : (
    <Minus size={14} className="text-slate-400" />
  );

  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400';

  const deltaDisplay = delta !== undefined ? `${delta > 0 ? '+' : ''}${delta}${deltaSuffix || ''}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
    >
      <Card className="border-border hover:border-border transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                <span className={iconColor}>{icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                {trendIcon}
                {delta !== undefined && delta !== 0 && (
                  <span className={`text-xs font-medium ${trendColor}`}>{deltaDisplay}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function chartData(summary: AdminSummary, groupBy: GroupBy) {
  const source =
    groupBy === 'group'
      ? summary.byGroup
      : groupBy === 'course'
        ? summary.byCourse
        : summary.byUniversity;

  if (!source || source.length === 0) return [];

  return source.map((item, i) => ({
    name:
      groupBy === 'group'
        ? (item as { group: string }).group
        : groupBy === 'course'
          ? (item as { course: string }).course
          : (item as { university: string }).university,
    students: item.students,
    avgCompletion: Math.round(item.avgCompletion),
    avgQuizScore: Math.round(item.avgQuizScore * 10) / 10,
    color: COLORS[i % COLORS.length],
  }));
}

function tableData(summary: AdminSummary, groupBy: GroupBy) {
  const source =
    groupBy === 'group'
      ? summary.byGroup
      : groupBy === 'course'
        ? summary.byCourse
        : summary.byUniversity;

  if (!source || source.length === 0) return [];

  return source.map((item) => ({
    name:
      groupBy === 'group'
        ? (item as { group: string }).group
        : groupBy === 'course'
          ? (item as { course: string }).course
          : (item as { university: string }).university,
    students: item.students,
    avgCompletion: Math.round(item.avgCompletion),
    avgQuizScore: (Math.round(item.avgQuizScore * 100) / 100).toFixed(1),
  }));
}

export default function AdminSummaryReport() {
  const [groupBy, setGroupBy] = useState<GroupBy>('group');

  const { data: summary, loading, error } = useAnalyticsFetcher<AdminSummary>(
    () => getAdminSummary(groupBy),
    [groupBy],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Ошибка загрузки</p>
          <p className="text-xs text-slate-400 mt-1">{error || 'Нет данных'}</p>
        </div>
      </div>
    );
  }

  const { current, previous, trends } = summary;
  const cData = chartData(summary, groupBy);
  const tData = tableData(summary, groupBy);

  const completionModules = Math.round(current.avgCompletionRate);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users size={18} />}
          value={current.totalStudents}
          label="Всего студентов"
          trend={trends.students}
          delta={current.totalStudents - previous.totalStudents}
          delay={0}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <MetricCard
          icon={<GraduationCap size={18} />}
          value={current.activeStudents}
          label="Активных"
          trend={trends.activity}
          delta={current.activePercentage}
          deltaSuffix="%"
          delay={1}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <MetricCard
          icon={<BookOpen size={18} />}
          value={`${completionModules}/8 модулей`}
          label="Ср. завершение"
          trend={trends.completion}
          delta={Math.round(current.avgCompletionRate - previous.avgCompletionRate)}
          delay={2}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <MetricCard
          icon={<Trophy size={18} />}
          value={`${(Math.round(current.avgQuizScore * 100) / 100).toFixed(1)}%`}
          label="Ср. балл квизов"
          trend={trends.quizScore}
          delta={Math.round((current.avgQuizScore - previous.avgQuizScore) * 100) / 100}
          deltaSuffix="%"
          delay={3}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
      </div>

      {/* Aggregation Chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-sm">Агрегация по группам</h3>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              {(['group', 'course', 'university'] as GroupBy[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setGroupBy(key)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    groupBy === key
                      ? 'bg-background text-foreground shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {groupByLabels[key]}
                </button>
              ))}
            </div>
          </div>

          {cData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value, name) => {
                    const v = value as number;
                    if (name === 'students') return [v, 'Студенты'];
                    if (name === 'avgCompletion') return [`${v}%`, 'Завершение'];
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => (value === 'students' ? 'Студенты' : value === 'avgCompletion' ? 'Завершение (%)' : value)}
                />
                <Bar yAxisId="left" dataKey="students" name="students" radius={[4, 4, 0, 0]}>
                  {cData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="avgCompletion" name="avgCompletion" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-slate-400">Нет данных для отображения</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Table */}
      {tData.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              Сводка{' '}
              <span className="text-slate-400 font-normal">
                ({groupBy === 'group' ? 'по группам' : groupBy === 'course' ? 'по курсам' : 'по университетам'})
              </span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {groupBy === 'group' ? 'Группа' : groupBy === 'course' ? 'Курс' : 'Университет'}
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Студенты
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ср. завершение
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ср. балл квизов
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tData.map((row, i) => (
                    <motion.tr
                      key={row.name}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-100 hover:bg-secondary transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium">{row.name}</td>
                      <td className="py-2.5 px-3 text-right">{row.students}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            Number(row.avgCompletion) >= 70
                              ? 'bg-emerald-100 text-emerald-700'
                              : Number(row.avgCompletion) >= 40
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.avgCompletion}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{row.avgQuizScore}%</td>
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
