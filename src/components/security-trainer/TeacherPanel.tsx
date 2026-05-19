'use client';

import { useState, useMemo, useEffect } from 'react';
import { getAllUsers, useAuthStore } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';
import { quizCategories, modules } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  ChevronLeft,
  Users,
  Search,
  GraduationCap,
  BarChart3,
  Trophy,
  BookOpen,
  Filter,
  Table2,
  AlertTriangle,
  GitCompare,
  Clock,
  TrendingUp,
  HelpCircle,
  Award,
  Download,
  MessageSquare,
} from 'lucide-react';
import ProgressTrendsChart from './ProgressTrendsChart';
import QuizQuestionAnalytics from './QuizQuestionAnalytics';
import AchievementAnalytics from './AchievementAnalytics';
import AnalyticsExportPanel from './AnalyticsExportPanel';
import CompetencyRadar from './CompetencyRadar';
import WeaknessAnalyzer from './WeaknessAnalyzer';
import PredictiveInsights from './PredictiveInsights';
import TeacherMessaging from './TeacherMessaging';
import StudentProgressView from './StudentProgressView';
import ModuleDeepDive from './ModuleDeepDive';
import CertificationReadiness from './CertificationReadiness';
import QuizSessionAnalytics from './QuizSessionAnalytics';

interface StudentProgress {
  userId: string;
  completedModules: string[];
  quizScores: Record<string, number>;
  moduleTimestamps: Record<string, string>;
  quizTimestamps: Record<string, string>;
  studiedOwaspItems: string[];
  sqlCompletedLevels: string[];
  xssCompletedLevels: string[];
  csrfCompletedSteps: number[];
  secureCodingCorrectCount: number;
  lastActive?: string;
}

function getStudentProgress(userId: string): StudentProgress {
  try {
    const key = `security-trainer-progress-${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      // Compute lastActive from the most recent timestamp
      const allTimestamps = [
        ...Object.values(data.moduleTimestamps || {}),
        ...Object.values(data.quizTimestamps || {}),
      ].filter(Boolean) as string[];
      const lastActive = allTimestamps.length > 0
        ? allTimestamps.sort().reverse()[0]
        : undefined;

      return {
        userId,
        completedModules: data.completedModules || [],
        quizScores: data.quizScores || {},
        moduleTimestamps: data.moduleTimestamps || {},
        quizTimestamps: data.quizTimestamps || {},
        studiedOwaspItems: data.studiedOwaspItems || [],
        sqlCompletedLevels: data.sqlCompletedLevels || [],
        xssCompletedLevels: data.xssCompletedLevels || [],
        csrfCompletedSteps: data.csrfCompletedSteps || [],
        secureCodingCorrectCount: data.secureCodingCorrectCount || 0,
        lastActive,
      };
    }
  } catch {
    // ignore
  }
  return {
    userId,
    completedModules: [],
    quizScores: {},
    moduleTimestamps: {},
    quizTimestamps: {},
    studiedOwaspItems: [],
    sqlCompletedLevels: [],
    xssCompletedLevels: [],
    csrfCompletedSteps: [],
    secureCodingCorrectCount: 0,
  };
}

export default function TeacherPanel() {
  const { setCurrentPage } = useAppStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [gradebookSort, setGradebookSort] = useState<'name' | 'modules' | 'score'>('name');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'overview' | 'trends' | 'questions' | 'achievements' | 'competency' | 'weaknesses' | 'predictive' | 'export' | 'module-deep-dive' | 'certification' | 'quiz-session'>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [students, setStudents] = useState<Array<{ id: string; fullName: string; email: string; group: string; avatar: string }>>([]);

  useEffect(() => {
    getAllUsers().then((users) => setStudents(users.filter((u) => u.role === 'student')));
  }, []);

  const filteredStudents = useMemo(() => students.filter((s) => {
    const matchesSearch =
      searchTerm === '' ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = groupFilter === '' || s.group === groupFilter;
    return matchesSearch && matchesGroup;
  }), [students, searchTerm, groupFilter]);

  // Get unique groups
  const groups = [...new Set(students.map((s) => s.group).filter(Boolean))];

  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => {
    const progress = getStudentProgress(s.id);
    return progress.completedModules.length > 0;
  }).length;

  const avgCompletion =
    totalStudents > 0
      ? Math.round(
          students.reduce((acc, s) => {
            const progress = getStudentProgress(s.id);
            return acc + progress.completedModules.length;
          }, 0) / totalStudents
        )
      : 0;

  const avgQuizScore =
    totalStudents > 0
      ? Math.round(
          students.reduce((acc, s) => {
            const progress = getStudentProgress(s.id);
            const scores = Object.values(progress.quizScores);
            if (scores.length === 0) return acc;
            return acc + scores.reduce((a, b) => a + b, 0) / scores.length;
          }, 0) / totalStudents
        )
      : 0;

  // At-risk student detection
  const atRiskStudents = useMemo(() => {
    const now = new Date();
    return students.map((s) => {
      const progress = getStudentProgress(s.id);
      const scores = Object.values(progress.quizScores);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const daysSinceActive = progress.lastActive
        ? Math.floor((now.getTime() - new Date(progress.lastActive).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const reasons: string[] = [];
      if (daysSinceActive > 7) reasons.push(`Не активен ${daysSinceActive} дн.`);
      if (avgScore < 50 && scores.length > 0) reasons.push(`Низкий балл (${Math.round(avgScore)}%)`);
      if (progress.completedModules.length < 2) reasons.push('Мало модулей');

      return { student: s, progress, avgScore, daysSinceActive, reasons };
    }).filter((s) => s.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length || b.daysSinceActive - a.daysSinceActive);
  }, [students]);

  // Group comparison data
  const groupComparisonData = useMemo(() => {
    return groups.map((group) => {
      const groupStudents = students.filter((s) => s.group === group);
      let totalMods = 0, totalScore = 0, scoreCount = 0, activeCount = 0;
      groupStudents.forEach((s) => {
        const p = getStudentProgress(s.id);
        totalMods += p.completedModules.length;
        const scores = Object.values(p.quizScores);
        if (scores.length > 0) {
          totalScore += scores.reduce((a, b) => a + b, 0);
          scoreCount += scores.length;
        }
        if (p.completedModules.length > 0) activeCount++;
      });
      return {
        name: group,
        students: groupStudents.length,
        avgModules: groupStudents.length > 0 ? Math.round(totalMods / groupStudents.length * 10) / 10 : 0,
        avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        activityRate: groupStudents.length > 0 ? Math.round(activeCount / groupStudents.length * 100) : 0,
      };
    });
  }, [groups, students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Users size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Панель преподавателя</h1>
          <p className="text-xs text-slate-500">Отслеживайте прогресс и управляйте группами</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего студентов', value: totalStudents, icon: Users, color: 'text-sky-600' },
          { label: 'Активных', value: activeStudents, icon: GraduationCap, color: 'text-emerald-600' },
          { label: 'Ср. модулей', value: avgCompletion, icon: BookOpen, color: 'text-violet-600' },
          { label: 'Ср. балл квизов', value: `${avgQuizScore}%`, icon: Trophy, color: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="progress">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="progress" className="text-xs">
            <BarChart3 size={14} className="mr-1" /> Прогресс
          </TabsTrigger>
          <TabsTrigger value="gradebook" className="text-xs">
            <Table2 size={14} className="mr-1" /> Журнал
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">
            <Filter size={14} className="mr-1" /> Аналитика
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs">
            <MessageSquare size={14} className="mr-1" /> Сообщения
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">
            <Users size={14} className="mr-1" /> Группы
          </TabsTrigger>
          <TabsTrigger value="compare" className="text-xs">
            <GitCompare size={14} className="mr-1" /> Сравнение
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="text-xs">
            <AlertTriangle size={14} className="mr-1" /> Внимание
          </TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4 space-y-4">
          <StudentProgressView
            students={filteredStudents}
            groupId={groupFilter || undefined}
            onBack={() => setSelectedStudentId(null)}
          />
        </TabsContent>

        {/* Gradebook Tab */}
        <TabsContent value="gradebook" className="mt-4 space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск студента..."
                className="pl-10"
              />
            </div>
            <select
              value={gradebookSort}
              onChange={(e) => setGradebookSort(e.target.value as 'name' | 'modules' | 'score')}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
            >
              <option value="name">По имени</option>
              <option value="modules">По модулям</option>
              <option value="score">По баллу</option>
            </select>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-2 font-medium text-slate-600 sticky left-0 bg-slate-50 z-10">Студент</th>
                  {modules.map((m) => (
                    <th key={m.id} className="p-2 font-medium text-slate-600 text-center min-w-[60px]" title={m.title}>
                      {m.title.split(' ').slice(0, 2).join(' ')}
                    </th>
                  ))}
                  <th className="p-2 font-medium text-slate-600 text-center">Ср. балл</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let sorted = [...filteredStudents];
                  if (gradebookSort === 'modules') sorted.sort((a, b) => getStudentProgress(b.id).completedModules.length - getStudentProgress(a.id).completedModules.length);
                  if (gradebookSort === 'score') sorted.sort((a, b) => {
                    const aScores = Object.values(getStudentProgress(a.id).quizScores);
                    const bScores = Object.values(getStudentProgress(b.id).quizScores);
                    const aAvg = aScores.length > 0 ? aScores.reduce((x, y) => x + y, 0) / aScores.length : 0;
                    const bAvg = bScores.length > 0 ? bScores.reduce((x, y) => x + y, 0) / bScores.length : 0;
                    return bAvg - aAvg;
                  });

                  return sorted.map((student) => {
                    const progress = getStudentProgress(student.id);
                    const scores = Object.entries(progress.quizScores);
                    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, [, v]) => a + v, 0) / scores.length) : 0;

                    return (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-medium sticky left-0 bg-white z-10">
                          <div>
                            <div className="truncate max-w-[120px]">{student.fullName}</div>
                            {student.group && <div className="text-[10px] text-slate-400">{student.group}</div>}
                          </div>
                        </td>
                        {modules.map((m) => {
                          const done = progress.completedModules.includes(m.id);
                          return (
                            <td key={m.id} className="p-2 text-center">
                              <span className={`inline-block w-5 h-5 rounded-full text-[10px] leading-5 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-300'}`}>
                                {done ? '✓' : '·'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-2 text-center">
                          <Badge variant={avgScore >= 70 ? 'default' : avgScore >= 50 ? 'secondary' : 'destructive'} className="text-[10px] min-w-[36px]">
                            {scores.length > 0 ? `${avgScore}%` : '—'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-4 space-y-4">
          <TeacherMessaging currentUser={user?.fullName || 'Преподаватель'} groups={groups} />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-4 space-y-4">
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const groupStudents = students.filter((s) => s.group === group);
                return (
                  <Card key={group} className="border-slate-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2">{group}</h3>
                      <p className="text-xs text-slate-500 mb-3">{groupStudents.length} студентов</p>
                      <div className="space-y-1">
                        {groupStudents.slice(0, 5).map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                              <GraduationCap size={12} className="text-violet-600" />
                            </div>
                            <span className="text-slate-700">{s.fullName}</span>
                          </div>
                        ))}
                        {groupStudents.length > 5 && (
                          <p className="text-xs text-slate-400 italic">+{groupStudents.length - 5} ещё</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Группы ещё не созданы. Студенты могут указать группу в профиле.</p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {/* Sub-tab selector */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit flex-wrap">
            {[
              { key: 'overview' as const, label: 'Обзор', icon: BarChart3 },
              { key: 'trends' as const, label: 'Тренды', icon: TrendingUp },
              { key: 'questions' as const, label: 'Вопросы', icon: HelpCircle },
              { key: 'achievements' as const, label: 'Достижения', icon: Award },
              { key: 'competency' as const, label: 'Компетенции', icon: BarChart3 },
              { key: 'weaknesses' as const, label: 'Слабые места', icon: AlertTriangle },
              { key: 'predictive' as const, label: 'Прогноз', icon: TrendingUp },
              { key: 'module-deep-dive' as const, label: 'Модули+', icon: BookOpen },
              { key: 'certification' as const, label: 'Сертификация', icon: Trophy },
              { key: 'quiz-session' as const, label: 'Сессии квизов', icon: Clock },
              { key: 'export' as const, label: 'Экспорт', icon: Download },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setAnalyticsSubTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  analyticsSubTab === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Overview sub-tab */}
          {analyticsSubTab === 'overview' && (
          <>
          {/* Category averages bar chart */}
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Средний балл по категориям квизов</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    return quizCategories.map((cat) => {
                      const scores = students
                        .map((s) => getStudentProgress(s.id).quizScores[cat.id])
                        .filter((v) => v !== undefined && v > 0);
                      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                      return { name: cat.name.replace(' квизы', ''), avg, attempted: scores.length };
                    });
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: unknown) => `${value}%`} />
                    <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution and activity charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score distribution pie chart */}
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Распределение оценок</h3>
                {(() => {
                  const allScores = students.flatMap((s) => Object.values(getStudentProgress(s.id).quizScores));
                  const excellent = allScores.filter((s) => s >= 80).length;
                  const good = allScores.filter((s) => s >= 60 && s < 80).length;
                  const average = allScores.filter((s) => s >= 40 && s < 60).length;
                  const poor = allScores.filter((s) => s > 0 && s < 40).length;
                  const notAttempted = students.length * quizCategories.length - allScores.filter((s) => s > 0).length;

                  const data = [
                    { name: 'Отлично (80%+)', value: excellent, color: '#10b981' },
                    { name: 'Хорошо (60-79%)', value: good, color: '#3b82f6' },
                    { name: 'Средне (40-59%)', value: average, color: '#f59e0b' },
                    { name: 'Плохо (<40%)', value: poor, color: '#ef4444' },
                    { name: 'Не сдано', value: notAttempted, color: '#e2e8f0' },
                  ].filter((d) => d.value > 0);

                  return data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 10 }}>
                          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value: unknown) => `${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-8">Нет данных</p>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Activity pie chart */}
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Активность студентов</h3>
                {(() => {
                  const active = students.filter((s) => getStudentProgress(s.id).completedModules.length > 0).length;
                  const inactive = students.length - active;
                  const data = [
                    { name: 'Активные', value: active, color: '#10b981' },
                    { name: 'Неактивные', value: inactive, color: '#e2e8f0' },
                  ].filter((d) => d.value > 0);

                  return data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 10 }}>
                          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value: unknown) => `${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-8">Нет данных</p>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Top students ranking */}
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Рейтинг студентов</h3>
              {(() => {
                const studentRankings = students
                  .map((s) => {
                    const p = getStudentProgress(s.id);
                    const mods = p.completedModules.length;
                    const scores = Object.values(p.quizScores);
                    const avgQ = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                    const lastActive = p.lastActive ? new Date(p.lastActive).toLocaleDateString('ru-RU') : '—';
                    return { fullName: s.fullName, group: s.group, mods, avgQ, total: mods * 10 + avgQ, lastActive };
                  })
                  .sort((a, b) => b.total - a.total);

                return (
                  <div className="space-y-2">
                    {studentRankings.slice(0, 10).map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-medium">{s.fullName}</span>
                            {s.group && <span className="text-xs text-slate-400 ml-2">{s.group}</span>}
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs items-center">
                          <span className="text-slate-500">{s.mods} модулей</span>
                          <span className="text-slate-500">квизы: {s.avgQ}%</span>
                          <span className="text-slate-400 flex items-center gap-0.5"><Clock size={10} /> {s.lastActive}</span>
                        </div>
                      </div>
                    ))}
                    {studentRankings.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4">Нет данных</p>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          </>
          )}

          {/* Trends sub-tab */}
          {analyticsSubTab === 'trends' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProgressTrendsChart students={students} groupId={groupFilter} />
            </motion.div>
          )}

          {/* Questions sub-tab */}
          {analyticsSubTab === 'questions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <QuizQuestionAnalytics />
            </motion.div>
          )}

          {/* Achievements sub-tab */}
          {analyticsSubTab === 'achievements' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AchievementAnalytics students={students} groupId={groupFilter} />
            </motion.div>
          )}

          {/* Competency sub-tab */}
          {analyticsSubTab === 'competency' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CompetencyRadar groupId={groupFilter || undefined} />
            </motion.div>
          )}

          {/* Weaknesses sub-tab */}
          {analyticsSubTab === 'weaknesses' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <WeaknessAnalyzer groupId={groupFilter || undefined} />
            </motion.div>
          )}

          {/* Predictive sub-tab */}
          {analyticsSubTab === 'predictive' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PredictiveInsights groupId={groupFilter || undefined} />
            </motion.div>
          )}

          {/* Module Deep-Dive sub-tab */}
          {analyticsSubTab === 'module-deep-dive' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ModuleDeepDive groupId={groupFilter} />
            </motion.div>
          )}

          {/* Certification Readiness sub-tab */}
          {analyticsSubTab === 'certification' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CertificationReadiness groupId={groupFilter} />
            </motion.div>
          )}

          {/* Quiz Session sub-tab */}
          {analyticsSubTab === 'quiz-session' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <QuizSessionAnalytics groupId={groupFilter} />
            </motion.div>
          )}

          {/* Export sub-tab */}
          {analyticsSubTab === 'export' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AnalyticsExportPanel students={students} />
            </motion.div>
          )}
        </TabsContent>

        {/* Group Compare Tab */}
        <TabsContent value="compare" className="mt-4 space-y-4">
          {groupComparisonData.length > 0 ? (
            <>
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-4">Сравнение групп</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgModules" name="Ср. модулей" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avgScore" name="Ср. балл (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="activityRate" name="Активность (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupComparisonData.map((g) => {
                  const best = groupComparisonData.reduce((a, b) => b.avgScore > a.avgScore ? b : a);
                  const worst = groupComparisonData.reduce((a, b) => b.avgScore < a.avgScore ? b : a);
                  return (
                    <Card key={g.name} className={`border-slate-200 ${g.name === best.name ? 'border-emerald-300 ring-1 ring-emerald-100' : g.name === worst.name ? 'border-red-300 ring-1 ring-red-100' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-sm">{g.name}</h3>
                          {g.name === best.name && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Лучшая</Badge>}
                          {g.name === worst.name && <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Требует внимания</Badge>}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-slate-700">{g.students}</p>
                            <p className="text-[10px] text-slate-500">Студентов</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-700">{g.avgModules}</p>
                            <p className="text-[10px] text-slate-500">Ср. модулей</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-700">{g.avgScore}%</p>
                            <p className="text-[10px] text-slate-500">Ср. балл</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <GitCompare size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Нет данных для сравнения. Студенты должны быть распределены по группам.</p>
            </div>
          )}
        </TabsContent>

        {/* At-Risk Tab */}
        <TabsContent value="at-risk" className="mt-4 space-y-4">
          {atRiskStudents.length > 0 ? (
            <div className="space-y-3">
              {atRiskStudents.map(({ student, progress, avgScore, daysSinceActive, reasons }, i) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className={`border-l-4 ${reasons.length >= 3 ? 'border-l-red-500 border-slate-200' : reasons.length >= 2 ? 'border-l-amber-500 border-slate-200' : 'border-l-orange-400 border-slate-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle size={18} className={reasons.length >= 3 ? 'text-red-500' : reasons.length >= 2 ? 'text-amber-500' : 'text-orange-400'} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{student.fullName}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                            {student.group && <Badge variant="secondary" className="text-[10px] mt-0.5">{student.group}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-xs text-slate-500">Модули</p>
                            <p className="text-sm font-bold">{progress.completedModules.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Ср. балл</p>
                            <p className="text-sm font-bold">{Object.values(progress.quizScores).length > 0 ? `${Math.round(avgScore)}%` : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Последняя активность</p>
                            <p className="text-sm font-bold">{progress.lastActive ? `${daysSinceActive} дн. назад` : 'Никогда'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {reasons.map((r, i) => (
                          <Badge key={i} variant="destructive" className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Все студенты в порядке! Нет студентов с признаками риска.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
