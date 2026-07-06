'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Users, GraduationCap, BookOpen, Trophy, Target, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { getComprehensiveSummary, type ComprehensiveSummary } from '@/lib/auth-store';
import { useDateFormatter } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import KPICard from './KPICard';
import StudentDrillDown from './StudentDrillDown';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

const MODULE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#a855f7', '#d8b4fe'];

interface ComprehensiveDashboardProps {
  groupId?: string;
  days?: number;
}

export default function ComprehensiveDashboard({ groupId, days: daysProp }: ComprehensiveDashboardProps) {
  const formatDate = useDateFormatter();
  const [data, setData] = useState<ComprehensiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const days = daysProp ?? internalDays;
  const isControlled = daysProp !== undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getComprehensiveSummary(days, groupId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || 'Ошибка загрузки');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="mx-auto mb-3 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-500" />
        <p className="text-muted-foreground text-sm font-medium">Ошибка загрузки</p>
        <p className="mt-1 text-xs text-slate-400">{error || 'Нет данных'}</p>
      </div>
    );
  }

  const { kpis, trends, previousKpis, moduleDistribution, scoreDistribution, topPerformers, recentActivity } = data;

  const scorePieData = [
    {
      name: 'Отлично (90%+)',
      value: scoreDistribution.excellent,
      color: '#10b981',
    },
    {
      name: 'Хорошо (70-89%)',
      value: scoreDistribution.good,
      color: '#6366f1',
    },
    {
      name: 'Средне (50-69%)',
      value: scoreDistribution.average,
      color: '#f59e0b',
    },
    { name: 'Плохо (<50%)', value: scoreDistribution.poor, color: '#ef4444' },
    {
      name: 'Не attempted',
      value: scoreDistribution.notAttempted,
      color: '#94a3b8',
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Period selector (only when not controlled externally) */}
      {!isControlled && (
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                days === key
                  ? 'bg-background text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          icon={<Users size={18} />}
          value={kpis.totalStudents}
          label="Всего студентов"
          trend={trends.students}
          delta={kpis.totalStudents - previousKpis.totalStudents}
          delay={0}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<Activity size={18} />}
          value={`${kpis.activePercentage}%`}
          label="Активных"
          trend={trends.activity}
          delta={kpis.activePercentage - previousKpis.activePercentage}
          deltaSuffix="%"
          delay={1}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={<BookOpen size={18} />}
          value={kpis.totalModulesCompleted}
          label="Модулей завершено"
          trend={trends.completion}
          delta={kpis.totalModulesCompleted - previousKpis.totalModulesCompleted}
          delay={2}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<Trophy size={18} />}
          value={`${kpis.avgQuizScore}%`}
          label="Ср. балл квизов"
          trend={trends.quizScore}
          delta={Math.round((kpis.avgQuizScore - previousKpis.avgQuizScore) * 10) / 10}
          deltaSuffix="%"
          delay={3}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KPICard
          icon={<Target size={18} />}
          value={kpis.totalQuizAttempts}
          label="Попыток квизов"
          trend={trends.quizScore}
          delta={kpis.totalQuizAttempts - previousKpis.totalQuizAttempts}
          delay={4}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={<GraduationCap size={18} />}
          value={kpis.engagementScore}
          label="Индекс вовлечённости"
          trend={
            kpis.engagementScore > previousKpis.engagementScore
              ? 'up'
              : kpis.engagementScore < previousKpis.engagementScore
                ? 'down'
                : 'stable'
          }
          delta={kpis.engagementScore - previousKpis.engagementScore}
          delay={5}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Score Distribution + Module Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Распределение баллов</h3>
            {scorePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={scorePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {scorePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} студ.`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">Нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Завершение модулей</h3>
            {moduleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={moduleDistribution} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="moduleName" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Завершение']} />
                  <Bar dataKey="completionRate" radius={[0, 4, 4, 0]}>
                    {moduleDistribution.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={MODULE_COLORS[i % MODULE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Топ студентов</h3>
            {topPerformers.length > 0 ? (
              <div className="space-y-2">
                {topPerformers.map((student, i) => (
                  <motion.div
                    key={student.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? 'bg-amber-100 text-amber-700'
                            : i === 1
                              ? 'text-muted-foreground bg-slate-200'
                              : i === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p
                          className="cursor-pointer text-sm font-medium transition-colors hover:text-indigo-600"
                          onClick={() => setSelectedStudentId(student.userId)}
                        >
                          {student.fullName}
                        </p>
                        {student.group && <p className="text-xs text-slate-400">{student.group}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600">{student.score}%</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">Нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Последняя активность</h3>
            {recentActivity.length > 0 ? (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {recentActivity.slice(0, 10).map((activity, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 border-b border-slate-100 py-2 last:border-0"
                  >
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{activity.fullName}</p>
                      <p className="text-xs text-slate-400">{activity.details}</p>
                    </div>
                    <span className="text-xs whitespace-nowrap text-slate-400">{formatDate(activity.timestamp)}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Drill-Down Modal */}
      {selectedStudentId && (
        <StudentDrillDown userId={selectedStudentId} days={days} onClose={() => setSelectedStudentId(null)} />
      )}
    </div>
  );
}
