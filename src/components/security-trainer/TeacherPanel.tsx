'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getAllUsers, useAuthStore } from '@/lib/auth-store';
import { useDateFormatter } from '@/lib/format';
import { useAppStore, getAuthHeaders } from '@/lib/store';
import { quizCategories, modules } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
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
  Calendar,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  FileBarChart,
  ClipboardList,
  Loader2,
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
import AssignmentBuilder from './AssignmentBuilder';
import { logger } from '@/lib/logger';

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

const EMPTY_PROGRESS: StudentProgress = {
  userId: '',
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

export default function TeacherPanel() {
  const formatDate = useDateFormatter();
  const t = useTranslations('teacher');
  const tc = useTranslations('common');
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const user = useAuthStore((s) => s.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [gradebookSort, setGradebookSort] = useState<'name' | 'modules' | 'score'>('name');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<
    | 'overview'
    | 'trends'
    | 'questions'
    | 'achievements'
    | 'competency'
    | 'weaknesses'
    | 'predictive'
    | 'export'
    | 'module-deep-dive'
    | 'certification'
    | 'quiz-session'
  >('overview');
  const [_selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [students, setStudents] = useState<
    Array<{
      id: string;
      fullName: string;
      email: string;
      group: string;
      avatar: string;
    }>
  >([]);
  const [studentProgress, setStudentProgress] = useState<Record<string, StudentProgress>>({});
  const getSp = useCallback((id: string) => studentProgress[id] ?? EMPTY_PROGRESS, [studentProgress]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    getAllUsers()
      .then((users) => setStudents(users.filter((u) => u.role === 'student')))
      .catch((e) => { logger.error('Failed to load users for teacher panel', { error: e }); })
      .finally(() => setLoadingStudents(false));
  }, []);

  // Load all student progress from batch API (avoids N concurrent requests)
  useEffect(() => {
    if (students.length === 0) return;
    let cancelled = false;
    const loadProgress = async () => {
      const headers = await getAuthHeaders();
      const batchResult: Record<string, StudentProgress> = {};
      const userIds = students.map((s) => s.id);
      const batchSize = 100;

      for (let i = 0; i < userIds.length; i += batchSize) {
        if (cancelled) return;
        const chunk = userIds.slice(i, i + batchSize);
        try {
          const res = await fetch(`/api/progress/batch?userIds=${chunk.join(',')}`, { headers });
          if (!res.ok) continue;
          const data = await res.json();

          for (const [userId, userData] of Object.entries(data) as Array<
            [
              string,
              {
                progress: Array<{
                  moduleId: string;
                  completed: boolean;
                  score: number | null;
                  updatedAt: string;
                  sqlLevels: string | null;
                  xssLevels: string | null;
                  csrfSteps: string | null;
                  secureCodingCorrectCount: number;
                  studiedOwaspItems: string | null;
                }>;
                quizResults: Array<{
                  quizId: string;
                  percentage: number;
                  updatedAt: string;
                }>;
              },
            ]
          >) {
            const completedModules: string[] = [];
            const moduleTimestamps: Record<string, string> = {};
            let studiedOwaspItems: string[] = [];
            let sqlCompletedLevels: string[] = [];
            let xssCompletedLevels: string[] = [];
            let csrfCompletedSteps: number[] = [];
            let secureCodingCorrectCount = 0;
            const timestamps: string[] = [];

            for (const p of userData.progress || []) {
              completedModules.push(p.moduleId);
              if (p.updatedAt) {
                moduleTimestamps[p.moduleId] = p.updatedAt;
                timestamps.push(p.updatedAt);
              }
              if (p.studiedOwaspItems) studiedOwaspItems = [...new Set([...studiedOwaspItems, ...p.studiedOwaspItems])];
              if (p.sqlLevels)
                sqlCompletedLevels = [...sqlCompletedLevels, ...(Array.isArray(p.sqlLevels) ? p.sqlLevels : [])];
              if (p.xssLevels)
                xssCompletedLevels = [...xssCompletedLevels, ...(Array.isArray(p.xssLevels) ? p.xssLevels : [])];
              if (p.csrfSteps)
                csrfCompletedSteps = [...csrfCompletedSteps, ...(Array.isArray(p.csrfSteps) ? p.csrfSteps : [])];
              if (p.secureCodingCorrectCount) secureCodingCorrectCount += p.secureCodingCorrectCount;
            }

            const quizScores: Record<string, number> = {};
            const quizTimestamps: Record<string, string> = {};
            for (const q of userData.quizResults || []) {
              quizScores[q.quizId] = q.percentage;
              if (q.updatedAt) {
                quizTimestamps[q.quizId] = q.updatedAt;
                timestamps.push(q.updatedAt);
              }
            }

            const lastActive = timestamps.length > 0 ? timestamps.sort().reverse()[0] : undefined;

            batchResult[userId] = {
              userId,
              completedModules,
              quizScores,
              moduleTimestamps,
              quizTimestamps,
              studiedOwaspItems,
              sqlCompletedLevels,
              xssCompletedLevels,
              csrfCompletedSteps,
              secureCodingCorrectCount,
              lastActive,
            };
          }
        } catch (e) {
          logger.warn('TeacherPanel: batch progress parse failed', { error: String(e) });
        }
      }

      setStudentProgress(batchResult);
    };
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [students]);

  // Deadlines state
  const [deadlines, setDeadlines] = useState<
    Array<{
      id: string;
      scope: string;
      scopeId: string;
      dueAt: string;
      title: string;
      description: string;
      group: string;
      creator: { fullName: string };
    }>
  >([]);
  const [deadlineReminders, setDeadlineReminders] = useState<
    Array<{
      deadline: {
        id: string;
        scope: string;
        scopeId: string;
        dueAt: string;
        title: string;
        group: string;
      };
      totalStudents: number;
      completedCount: number;
      completionRate: number;
      studentStatus: Array<{
        id: string;
        fullName: string;
        email: string;
        group: string;
        completed: boolean;
        isOverdue: boolean;
      }>;
    }>
  >([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    scope: 'module' as string,
    scopeId: '',
    dueAt: '',
    title: '',
    description: '',
    group: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const r1 = await fetch('/api/deadlines', { headers });
        if (r1.ok) {
          const data = await r1.json();
          if (data.deadlines) setDeadlines(data.deadlines);
        }
      } catch (e) {
        logger.warn('TeacherPanel loadProgress failed', { error: e });
      }

      try {
        const headers = await getAuthHeaders();
        const r2 = await fetch('/api/deadlines/teacher/reminders', { headers });
        if (r2.ok) {
          const data = await r2.json();
          if (data.results) setDeadlineReminders(data.results);
        }
      } catch (e) {
        logger.warn('TeacherPanel loadReminders failed', { error: e });
      }
    })();
  }, []);

  const createDeadline = async () => {
    if (!newDeadline.title || !newDeadline.dueAt || !newDeadline.scopeId) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeadline),
      });
      if (res.ok) {
        const data = await res.json();
        setDeadlines((prev) => [...prev, data.deadline]);
        setNewDeadline({
          scope: 'module',
          scopeId: '',
          dueAt: '',
          title: '',
          description: '',
          group: '',
        });
        setShowCreateForm(false);
        // Refresh reminders
        const r2Headers = await getAuthHeaders();
        const r2 = await fetch('/api/deadlines/teacher/reminders', {
          headers: r2Headers,
        });
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2.results) setDeadlineReminders(d2.results);
        }
      }
    } catch (err) {
      logger.error('Failed to create deadline', { error: err });
    }
  };

  const deleteDeadline = useCallback(async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/deadlines/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setDeadlines((prev) => prev.filter((d) => d.id !== id));
        setDeadlineReminders((prev) => prev.filter((r) => r.deadline.id !== id));
      }
    } catch (err) {
      logger.error('Failed to delete deadline', { error: err });
    }
  }, []);

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        const matchesSearch =
          searchTerm === '' ||
          s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = groupFilter === '' || s.group === groupFilter;
        return matchesSearch && matchesGroup;
      }),
    [students, searchTerm, groupFilter],
  );

  // Get unique groups
  const groups = useMemo(() => [...new Set(students.map((s) => s.group).filter(Boolean))], [students]);

  // Memoize student progress to avoid repeated localStorage reads
  const progressMap = useMemo(() => {
    const map = new Map<string, StudentProgress>();
    for (const s of students) {
      map.set(s.id, getSp(s.id));
    }
    return map;
  }, [students, getSp]);

  // Calculate stats
  const totalStudents = students.length;
  const { activeStudents, avgCompletion, avgQuizScore } = useMemo(() => {
    const active = students.filter((s) => {
      const progress = progressMap.get(s.id);
      return progress && progress.completedModules.length > 0;
    }).length;

    const avgModules =
      totalStudents > 0
        ? Math.round(
            students.reduce((acc, s) => {
              const progress = progressMap.get(s.id);
              return acc + (progress ? progress.completedModules.length : 0);
            }, 0) / totalStudents,
          )
        : 0;

    const avgScore =
      totalStudents > 0
        ? Math.round(
            students.reduce((acc, s) => {
              const progress = progressMap.get(s.id);
              if (!progress) return acc;
              const scores = Object.values(progress.quizScores);
              if (scores.length === 0) return acc;
              return acc + scores.reduce((a, b) => a + b, 0) / scores.length;
            }, 0) / totalStudents,
          )
        : 0;

    return { activeStudents: active, avgCompletion: avgModules, avgQuizScore: avgScore };
  }, [students, progressMap, totalStudents]);

  const quizScoreDistribution = useMemo(() => {
    const ranges = [
      { label: '0-20%', min: 0, max: 20, color: '#ef4444' },
      { label: '21-40%', min: 21, max: 40, color: '#f97316' },
      { label: '41-60%', min: 41, max: 60, color: '#f59e0b' },
      { label: '61-80%', min: 61, max: 80, color: '#84cc16' },
      { label: '81-100%', min: 81, max: 100, color: '#10b981' },
    ];
    return ranges.map((range) => {
      let count = 0;
      students.forEach((s) => {
        const progress = getSp(s.id);
        const scores = Object.values(progress.quizScores);
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg >= range.min && avg <= range.max) count++;
        }
      });
      return { range: range.label, count, color: range.color };
    });
  }, [students, getSp]);

  const engagementLeaderboard = useMemo(() => {
    const now = new Date();
    return students
      .map((s) => {
        const progress = getSp(s.id);
        const scores = Object.values(progress.quizScores);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const daysSinceActive = progress.lastActive
          ? Math.floor((now.getTime() - new Date(progress.lastActive).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const activityFactor = Math.min(25, Math.round((Math.max(0, 30 - daysSinceActive) / 30) * 25));
        const completionFactor = Math.min(25, Math.round((progress.completedModules.length / 12) * 25));
        const quizFactor = Math.round((avgScore / 100) * 25);
        const attemptsFactor = Math.min(25, Math.round((scores.length / 10) * 25));
        const engagementScore = activityFactor + completionFactor + quizFactor + attemptsFactor;
        return {
          ...s,
          progress,
          avgScore,
          daysSinceActive,
          engagementScore,
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);
  }, [students, getSp]);

  // At-risk student detection
  const atRiskStudents = useMemo(() => {
    const now = new Date();
    return students
      .map((s) => {
        const progress = progressMap.get(s.id);
        if (!progress)
          return {
            student: s,
            progress: null,
            avgScore: 0,
            daysSinceActive: 999,
            reasons: [] as string[],
          };
        const scores = Object.values(progress.quizScores);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const daysSinceActive = progress.lastActive
          ? Math.floor((now.getTime() - new Date(progress.lastActive).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const reasons: string[] = [];
        if (daysSinceActive > 7) reasons.push(t('atRisk.inactiveDays', { days: daysSinceActive }));
        if (avgScore < 50 && scores.length > 0) reasons.push(t('atRisk.lowScore', { score: Math.round(avgScore) }));
        if (progress.completedModules.length < 2) reasons.push(t('atRisk.fewModules'));

        return { student: s, progress, avgScore, daysSinceActive, reasons };
      })
      .filter((s) => s.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length || b.daysSinceActive - a.daysSinceActive);
  }, [students, progressMap, t]);

  // Group comparison data
  const groupComparisonData = useMemo(() => {
    return groups.map((group) => {
      const groupStudents = students.filter((s) => s.group === group);
      let totalMods = 0,
        totalScore = 0,
        scoreCount = 0,
        activeCount = 0;
      groupStudents.forEach((s) => {
        const p = getSp(s.id);
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
        avgModules: groupStudents.length > 0 ? Math.round((totalMods / groupStudents.length) * 10) / 10 : 0,
        avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        activityRate: groupStudents.length > 0 ? Math.round((activeCount / groupStudents.length) * 100) : 0,
      };
    });
  }, [groups, students, getSp]);

  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents];
    if (gradebookSort === 'modules')
      sorted.sort((a, b) => getSp(b.id).completedModules.length - getSp(a.id).completedModules.length);
    if (gradebookSort === 'score')
      sorted.sort((a, b) => {
        const aScores = Object.values(getSp(a.id).quizScores);
        const bScores = Object.values(getSp(b.id).quizScores);
        const aAvg = aScores.length > 0 ? aScores.reduce((x, y) => x + y, 0) / aScores.length : 0;
        const bAvg = bScores.length > 0 ? bScores.reduce((x, y) => x + y, 0) / bScores.length : 0;
        return bAvg - aAvg;
      });
    return sorted;
  }, [filteredStudents, gradebookSort, getSp]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} aria-label={tc('back')}>
            <ChevronLeft size={20} />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Users size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
          </div>
        </div>
        <AnalyticsExportPanel students={students} />
      </div>

      {/* Group filter */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-background text-foreground rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">{t('allGroups')}</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {groupFilter && (
            <button
              onClick={() => setGroupFilter('')}
              className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs"
            >
              {t('reset')}
            </button>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[
          {
            label: t('totalStudents'),
            value: totalStudents,
            icon: Users,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
          },
          {
            label: t('active'),
            value: activeStudents,
            icon: GraduationCap,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: t('avgModules'),
            value: avgCompletion,
            icon: BookOpen,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: t('avgScore'),
            value: `${avgQuizScore}%`,
            icon: Trophy,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-none shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className={`h-10 w-10 rounded-lg ${stat.bg} mb-2 flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-xs">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="progress">
        <div className="scrollbar-thin overflow-x-auto pb-2">
          <TabsList className="grid w-full min-w-[640px] grid-cols-5 md:min-w-0 md:grid-cols-9">
            <TabsTrigger value="progress" className="text-xs">
              <BarChart3 size={14} className="mr-1" /> {t('tabs.progress')}
            </TabsTrigger>
            <TabsTrigger value="gradebook" className="text-xs">
              <Table2 size={14} className="mr-1" /> {t('tabs.gradebook')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              <Filter size={14} className="mr-1" /> {t('tabs.analytics')}
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="text-xs">
              <Calendar size={14} className="mr-1" /> {t('tabs.deadlines')}
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">
              <Users size={14} className="mr-1" /> {t('tabs.groups')}
            </TabsTrigger>
            <TabsTrigger value="compare" className="hidden text-xs md:block">
              <GitCompare size={14} className="mr-1" /> {t('tabs.comparison')}
            </TabsTrigger>
            <TabsTrigger value="at-risk" className="hidden text-xs md:block">
              <AlertTriangle size={14} className="mr-1" /> {t('tabs.atRisk')}
            </TabsTrigger>
            <TabsTrigger value="messages" className="hidden text-xs lg:block">
              <MessageSquare size={14} className="mr-1" /> {t('tabs.messages')}
            </TabsTrigger>
            <TabsTrigger value="reports" className="hidden text-xs lg:block">
              <FileBarChart size={14} className="mr-1" /> {t('tabs.reports')}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="hidden text-xs md:block">
              <ClipboardList size={14} className="mr-1" /> {t('tabs.assignments')}
            </TabsTrigger>
          </TabsList>
        </div>

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
          {loadingStudents ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="mb-3 animate-spin opacity-50" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('searchStudent')}
                    className="pl-10"
                  />
                </div>
                <select
                  value={gradebookSort}
                  onChange={(e) => setGradebookSort(e.target.value as 'name' | 'modules' | 'score')}
                  className="border-border bg-card rounded-md border px-3 py-2 text-sm"
                >
                  <option value="name">{t('sortByName')}</option>
                  <option value="modules">{t('sortByModules')}</option>
                  <option value="score">{t('sortByScore')}</option>
                </select>
              </div>

              <div className="border-border overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary border-border border-b">
                    <tr>
                      <th className="text-muted-foreground bg-secondary sticky left-0 z-10 p-2 text-left font-medium">
                        {t('student')}
                      </th>
                      {modules.map((m) => (
                        <th
                          key={m.id}
                          className="text-muted-foreground min-w-[60px] p-2 text-center font-medium"
                          title={t(`modules.${m.id}.title`)}
                        >
                          {t(`modules.${m.id}.title`).split(' ').slice(0, 2).join(' ')}
                        </th>
                      ))}
                      <th className="text-muted-foreground p-2 text-center font-medium">{t('avgScore')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student) => {
                      const progress = getSp(student.id);
                      const scores = Object.entries(progress.quizScores);
                      const avgScore =
                        scores.length > 0 ? Math.round(scores.reduce((a, [, v]) => a + v, 0) / scores.length) : 0;

                      return (
                        <tr key={student.id} className="hover:bg-secondary border-b border-slate-100">
                          <td className="bg-card sticky left-0 z-10 p-2 font-medium">
                            <div>
                              <div className="max-w-[120px] truncate">{student.fullName}</div>
                              {student.group && <div className="text-[10px] text-slate-400">{student.group}</div>}
                            </div>
                          </td>
                          {modules.map((m) => {
                            const done = progress.completedModules.includes(m.id);
                            return (
                              <td key={m.id} className="p-2 text-center">
                                <span
                                  className={`inline-block h-5 w-5 rounded-full text-[10px] leading-5 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-slate-300'}`}
                                >
                                  {done ? '✓' : '·'}
                                </span>
                              </td>
                            );
                          })}
                          <td className="p-2 text-center">
                            <Badge
                              variant={avgScore >= 70 ? 'default' : avgScore >= 50 ? 'secondary' : 'destructive'}
                              className="min-w-[36px] text-[10px]"
                            >
                              {scores.length > 0 ? `${avgScore}%` : '—'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-4 space-y-4">
          <TeacherMessaging currentUser={user?.fullName || t('defaultTeacherName')} groups={groups} />
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="mt-4 space-y-4">
          {/* Create deadline form */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar size={16} className="text-orange-500" />
                  {t('manageDeadlines')}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="text-xs"
                >
                  <Plus size={14} className="mr-1" />
                  {showCreateForm ? t('cancel') : t('newDeadline')}
                </Button>
              </div>

              {showCreateForm && (
                <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs font-medium">
                        {t('deadlineType')}
                      </label>
                      <select
                        value={newDeadline.scope}
                        onChange={(e) =>
                          setNewDeadline({
                            ...newDeadline,
                            scope: e.target.value,
                            scopeId: '',
                          })
                        }
                        className="border-border w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="module">{t('module')}</option>
                        <option value="quiz">{t('quiz')}</option>
                        <option value="course">{t('course')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs font-medium">
                        {newDeadline.scope === 'module'
                          ? t('module')
                          : newDeadline.scope === 'quiz'
                            ? t('quiz')
                            : t('deadlineTitle')}
                      </label>
                      {newDeadline.scope === 'course' ? (
                        <Input
                          value={newDeadline.title}
                          onChange={(e) =>
                            setNewDeadline({
                              ...newDeadline,
                              title: e.target.value,
                              scopeId: 'course',
                            })
                          }
                          placeholder={t('deadlineTitle')}
                        />
                      ) : newDeadline.scope === 'module' ? (
                        <select
                          value={newDeadline.scopeId}
                          onChange={(e) =>
                            setNewDeadline({
                              ...newDeadline,
                              scopeId: e.target.value,
                            })
                          }
                          className="border-border w-full rounded-md border px-3 py-2 text-sm"
                        >
                          <option value="">{t('selectModule')}</option>
                          {modules.map((m) => (
                            <option key={m.id} value={m.id}>
                              {t(`modules.${m.id}.title`)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={newDeadline.scopeId}
                          onChange={(e) =>
                            setNewDeadline({
                              ...newDeadline,
                              scopeId: e.target.value,
                            })
                          }
                          className="border-border w-full rounded-md border px-3 py-2 text-sm"
                        >
                          <option value="">{t('selectQuiz')}</option>
                          {quizCategories.map((q) => (
                            <option key={q.id} value={q.id}>
                              {t(`categories.${q.id}`)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs font-medium">
                        {t('deadlineDate')}
                      </label>
                      <Input
                        type="datetime-local"
                        value={newDeadline.dueAt}
                        onChange={(e) =>
                          setNewDeadline({
                            ...newDeadline,
                            dueAt: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs font-medium">
                        {t('deadlineGroup')}
                      </label>
                      <select
                        value={newDeadline.group}
                        onChange={(e) =>
                          setNewDeadline({
                            ...newDeadline,
                            group: e.target.value,
                          })
                        }
                        className="border-border w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">{t('allStudents')}</option>
                        {groups.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground mb-1 block text-xs font-medium">{t('description')}</label>
                    <Input
                      value={newDeadline.description}
                      onChange={(e) =>
                        setNewDeadline({
                          ...newDeadline,
                          description: e.target.value,
                        })
                      }
                      placeholder={t('optional')}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>
                      {t('cancel')}
                    </Button>
                    <Button size="sm" onClick={createDeadline}>
                      {t('saveDeadline')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Active deadliness list */}
              {deadlines.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {deadlines.map((d) => {
                    const reminder = deadlineReminders.find((r) => r.deadline.id === d.id);
                    const dueDate = new Date(d.dueAt);
                    const now = new Date();
                    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isOverdue = diffDays < 0;

                    const scopeLabel =
                      d.scope === 'course'
                        ? t('course')
                        : d.scope === 'module'
                          ? t(`modules.${d.scopeId}.title`)
                          : t(`categories.${d.scopeId}`) || d.scopeId;

                    return (
                      <div
                        key={d.id}
                        className={`rounded-lg border-l-4 p-4 ${isOverdue ? 'border-l-red-500 bg-red-50/50' : diffDays <= 3 ? 'border-l-orange-500 bg-orange-50/50' : 'border-l-emerald-500 bg-emerald-50/50'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <p className="text-foreground/80 text-sm font-semibold">{d.title}</p>
                              <Badge
                                variant={isOverdue ? 'destructive' : diffDays <= 3 ? 'secondary' : 'default'}
                                className="text-[10px]"
                              >
                                {isOverdue
                                  ? t('overdueDays', {
                                      days: Math.abs(diffDays),
                                    })
                                  : diffDays === 0
                                    ? t('today')
                                    : diffDays === 1
                                      ? t('tomorrow')
                                      : t('daysLeft', { days: diffDays })}
                              </Badge>
                              {d.group && (
                                <Badge variant="outline" className="text-[10px]">
                                  {d.group}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-xs">
                              {scopeLabel} —{' '}
                              {dueDate.toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {d.description && <p className="mt-1 text-xs text-slate-400">{d.description}</p>}
                            {reminder && (
                              <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                  <CheckCircle size={12} className="text-emerald-500" /> {reminder.completedCount}/
                                  {reminder.totalStudents} {t('completed')}
                                </span>
                                <span>{reminder.completionRate}%</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteDeadline(d.id)}
                            className="shrink-0 rounded p-1.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
                            title={t('deleteDeadline')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Student status expandable */}
                        {reminder && reminder.studentStatus.length > 0 && (
                          <details className="mt-3">
                            <summary className="text-muted-foreground hover:text-foreground/70 cursor-pointer text-xs">
                              {t('studentStatus', {
                                count: reminder.studentStatus.length,
                              })}
                            </summary>
                            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                              {reminder.studentStatus.map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-1 text-xs">
                                  <span className="text-foreground/70">{s.fullName}</span>
                                  <span className="flex items-center gap-1">
                                    {s.completed ? (
                                      <span className="flex items-center gap-0.5 text-emerald-600">
                                        <CheckCircle size={10} /> {t('completed')}
                                      </span>
                                    ) : s.isOverdue ? (
                                      <span className="flex items-center gap-0.5 text-red-600">
                                        <XCircle size={10} /> {t('overdue')}
                                      </span>
                                    ) : (
                                      <span className="text-orange-500">{t('inProgress')}</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('noDeadlines')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-4 space-y-4">
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {groups.map((group) => {
                const groupStudents = students.filter((s) => s.group === group);
                return (
                  <Card key={group} className="border-border">
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-sm font-semibold">{group}</h3>
                      <p className="text-muted-foreground mb-3 text-xs">
                        {t('studentsCount', { count: groupStudents.length })}
                      </p>
                      <div className="space-y-1">
                        {groupStudents.slice(0, 5).map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100">
                              <GraduationCap size={12} className="text-violet-600" />
                            </div>
                            <span className="text-foreground/70">{s.fullName}</span>
                          </div>
                        ))}
                        {groupStudents.length > 5 && (
                          <p className="text-xs text-slate-400 italic">
                            {t('more', { count: groupStudents.length - 5 })}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('noGroups')}</p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {/* Sub-tab selector */}
          <div className="bg-muted flex w-fit flex-wrap gap-1 rounded-lg p-1">
            {[
              {
                key: 'overview' as const,
                label: t('analytics.overview'),
                icon: BarChart3,
              },
              {
                key: 'trends' as const,
                label: t('analytics.trends'),
                icon: TrendingUp,
              },
              {
                key: 'questions' as const,
                label: t('analytics.questions'),
                icon: HelpCircle,
              },
              {
                key: 'achievements' as const,
                label: t('analytics.achievements'),
                icon: Award,
              },
              {
                key: 'competency' as const,
                label: t('analytics.competency'),
                icon: BarChart3,
              },
              {
                key: 'weaknesses' as const,
                label: t('analytics.weaknesses'),
                icon: AlertTriangle,
              },
              {
                key: 'predictive' as const,
                label: t('analytics.predictive'),
                icon: TrendingUp,
              },
              {
                key: 'module-deep-dive' as const,
                label: t('analytics.moduleDeepDive'),
                icon: BookOpen,
              },
              {
                key: 'certification' as const,
                label: t('analytics.certification'),
                icon: Trophy,
              },
              {
                key: 'quiz-session' as const,
                label: t('analytics.quizSession'),
                icon: Clock,
              },
              {
                key: 'export' as const,
                label: t('analytics.export'),
                icon: Download,
              },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setAnalyticsSubTab(key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  analyticsSubTab === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
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
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-sm font-semibold">{t('quizAvgScore')}</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          return quizCategories.map((cat) => {
                            const scores = students
                              .map((s) => getSp(s.id).quizScores[cat.id])
                              .filter((v) => v !== undefined && v > 0);
                            const avg =
                              scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                            return {
                              name: cat.name.replace(` ${t('quiz')}`, ''),
                              avg,
                              attempted: scores.length,
                            };
                          });
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: unknown) => `${value}%`} />
                        <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution and activity charts */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Score distribution pie chart */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="mb-4 text-sm font-semibold">{t('quizScoreDistribution')}</h3>
                    {(() => {
                      const allScores = students.flatMap((s) => Object.values(getSp(s.id).quizScores));
                      const excellent = allScores.filter((s) => s >= 80).length;
                      const good = allScores.filter((s) => s >= 60 && s < 80).length;
                      const average = allScores.filter((s) => s >= 40 && s < 60).length;
                      const poor = allScores.filter((s) => s > 0 && s < 40).length;
                      const notAttempted =
                        students.length * quizCategories.length - allScores.filter((s) => s > 0).length;

                      const data = [
                        {
                          name: t('excellent'),
                          value: excellent,
                          color: '#10b981',
                        },
                        {
                          name: t('good'),
                          value: good,
                          color: '#3b82f6',
                        },
                        {
                          name: t('average'),
                          value: average,
                          color: '#f59e0b',
                        },
                        { name: t('poor'), value: poor, color: '#ef4444' },
                        {
                          name: t('notSubmitted'),
                          value: notAttempted,
                          color: '#e2e8f0',
                        },
                      ].filter((d) => d.value > 0);

                      return data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                              style={{ fontSize: 10 }}
                            >
                              {data.map((entry) => (
                                <Cell key={entry.color + entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: unknown) => `${value}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="py-8 text-center text-xs text-slate-400">{t('noData')}</p>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Activity pie chart */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="mb-4 text-sm font-semibold">{t('activityTitle')}</h3>
                    {(() => {
                      const active = students.filter((s) => getSp(s.id).completedModules.length > 0).length;
                      const inactive = students.length - active;
                      const data = [
                        { name: t('active'), value: active, color: '#10b981' },
                        {
                          name: t('inactiveStudents'),
                          value: inactive,
                          color: '#e2e8f0',
                        },
                      ].filter((d) => d.value > 0);

                      return data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                              style={{ fontSize: 10 }}
                            >
                              {data.map((entry) => (
                                <Cell key={entry.color + entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: unknown) => `${value}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="py-8 text-center text-xs text-slate-400">{t('noData')}</p>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Top students ranking */}
              <Card className="border-border">
                <CardContent className="p-5">
                    <h3 className="mb-4 text-sm font-semibold">{t('ranking')}</h3>
                  {(() => {
                    const studentRankings = students
                      .map((s) => {
                        const p = getSp(s.id);
                        const mods = p.completedModules.length;
                        const scores = Object.values(p.quizScores);
                        const avgQ =
                          scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                        const lastActive = p.lastActive ? formatDate(p.lastActive) : '—';
                        return {
                          userId: s.id,
                          fullName: s.fullName,
                          group: s.group,
                          mods,
                          avgQ,
                          total: mods * 10 + avgQ,
                          lastActive,
                        };
                      })
                      .sort((a, b) => b.total - a.total);

                    return (
                      <div className="space-y-2">
                        {studentRankings.slice(0, 10).map((s, i) => (
                          <div key={s.userId} className="flex items-center justify-between text-sm">
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
                                <span className="font-medium">{s.fullName}</span>
                                {s.group && <span className="ml-2 text-xs text-slate-400">{s.group}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-muted-foreground">{s.mods} {t('modules')}</span>
                              <span className="text-muted-foreground">{t('quiz')}: {s.avgQ}%</span>
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <Clock size={10} /> {s.lastActive}
                              </span>
                            </div>
                          </div>
                        ))}
                        {studentRankings.length === 0 && (
                          <p className="py-4 text-center text-xs text-slate-400">{t('noData')}</p>
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
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-sm font-semibold">{t('comparisonTitle')}</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgModules" name={t('avgModules')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avgScore" name={t('avgScore')} fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="activityRate" name={t('activityRate')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {groupComparisonData.map((g) => {
                  const best = groupComparisonData.reduce((a, b) => (b.avgScore > a.avgScore ? b : a));
                  const worst = groupComparisonData.reduce((a, b) => (b.avgScore < a.avgScore ? b : a));
                  return (
                    <Card
                      key={g.name}
                      className={`border-border ${g.name === best.name ? 'border-emerald-300 ring-1 ring-emerald-100' : g.name === worst.name ? 'border-red-300 ring-1 ring-red-100' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">{g.name}</h3>
                          {g.name === best.name && (
                            <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">{t('bestGroup')}</Badge>
                          )}
                          {g.name === worst.name && (
                            <Badge className="border-0 bg-red-100 text-[10px] text-red-700">{t('needsAttention')}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-foreground/70 text-lg font-bold">{g.students}</p>
                            <p className="text-muted-foreground text-[10px]">{t('totalStudents')}</p>
                          </div>
                          <div>
                            <p className="text-foreground/70 text-lg font-bold">{g.avgModules}</p>
                            <p className="text-muted-foreground text-[10px]">{t('avgModules')}</p>
                          </div>
                          <div>
                            <p className="text-foreground/70 text-lg font-bold">{g.avgScore}%</p>
                            <p className="text-muted-foreground text-[10px]">{t('avgScore')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <GitCompare size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('noData')}</p>
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
                  <Card
                    className={`border-l-4 ${reasons.length >= 3 ? 'border-border border-l-red-500' : reasons.length >= 2 ? 'border-border border-l-amber-500' : 'border-border border-l-orange-400'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                            <AlertTriangle
                              size={18}
                              className={
                                reasons.length >= 3
                                  ? 'text-red-500'
                                  : reasons.length >= 2
                                    ? 'text-amber-500'
                                    : 'text-orange-400'
                              }
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{student.fullName}</p>
                            <p className="text-muted-foreground text-xs">{student.email}</p>
                            {student.group && (
                              <Badge variant="secondary" className="mt-0.5 text-[10px]">
                                {student.group}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-muted-foreground text-xs">{t('modules')}</p>
                            <p className="text-sm font-bold">{progress ? progress.completedModules.length : 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">{t('avgScore')}</p>
                            <p className="text-sm font-bold">
                              {progress && Object.values(progress.quizScores).length > 0
                                ? `${Math.round(avgScore)}%`
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">{t('lastActive')}</p>
                            <p className="text-sm font-bold">
                              {progress
                                ? progress.lastActive
                                  ? `${daysSinceActive} ${t('daysAgo')}`
                                  : t('never')
                                : t('never')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {reasons.map((r, _i) => (
                          <Badge key={r} variant="destructive" className="text-[10px]">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <AlertTriangle size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('noAtRisk')}</p>
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          {/* Class Overview KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Users size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStudents}</p>
                    <p className="text-muted-foreground text-xs">{t('totalStudents')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <TrendingUp size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeStudents}</p>
                    <p className="text-muted-foreground text-xs">{t('active')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <BookOpen size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgCompletion}</p>
                    <p className="text-muted-foreground text-xs">{t('avgModules')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                    <Trophy size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgQuizScore}%</p>
                    <p className="text-muted-foreground text-xs">{t('quizAvgScore')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Completion by Group */}
          {groupComparisonData.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold">{t('moduleCompletionByGroup')}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={groupComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgModules" fill="#6366f1" name={t('avgModules')} />
                    <Bar dataKey="avgScore" fill="#10b981" name={t('avgScore')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Quiz Score Distribution */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold">{t('quizScoreDistribution')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={quizScoreDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="range"
                    label={(entry) => `${entry.name} (${((entry.percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {quizScoreDistribution.map((entry) => (
                      <Cell key={entry.color + entry.range} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Leaderboard */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Trophy size={16} className="text-amber-500" />
                {t('engagementLeaders')}
              </h3>
              <div className="space-y-2">
                {engagementLeaderboard.map((student, i) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            i === 0
                              ? 'bg-amber-100 text-amber-700'
                              : i === 1
                                ? 'bg-slate-100 text-slate-600'
                                : i === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{student.fullName}</p>
                          <p className="text-muted-foreground text-[10px]">
                            {student.group} • {t('modules')}: {student.progress.completedModules.length}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold">{Math.round(student.avgScore)}%</p>
                          <p className="text-muted-foreground text-[10px]">{t('quiz')}</p>
                        </div>
                        <Badge
                          variant={
                            student.engagementScore >= 70
                              ? 'default'
                              : student.engagementScore >= 40
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {student.engagementScore}
                        </Badge>
                      </div>
                    </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* At-Risk Alerts */}
          {atRiskStudents.length > 0 && (
            <Card className="border-border border-l-4 border-l-red-500">
              <CardContent className="p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle size={16} className="text-red-500" />
                  {t('atRiskStudents')} ({atRiskStudents.length})
                </h3>
                <div className="space-y-2">
                  {atRiskStudents
                    .slice(0, 5)
                    .map(
                      ({
                        student,
                        progress: _progress,
                        avgScore: _avgScore,
                        daysSinceActive: _daysSinceActive,
                        reasons,
                      }) => (
                        <div key={student.id} className="flex items-center justify-between rounded-lg bg-red-50/50 p-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-500" />
                            <span className="text-sm font-medium">{student.fullName}</span>
                            {student.group && (
                              <Badge variant="secondary" className="text-[10px]">
                                {student.group}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {reasons.slice(0, 2).map((r) => (
                              <Badge key={r} variant="destructive" className="text-[10px]">
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4 space-y-4">
          <AssignmentBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
