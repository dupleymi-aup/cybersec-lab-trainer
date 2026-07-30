'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Brain,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Loader2,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStudentPerformance, getComprehensiveSummary, getProgressTrends } from '@/lib/auth-store';
import { useDateFormatter, useDateTimeFormatter } from '@/lib/format';
import { modules, quizCategories } from '@/lib/data';
import type { StudentPerformanceData, ComprehensiveSummary, TrendPoint } from '@/lib/auth-store';
import { logger } from '@/lib/logger';

function getStudentProgressLocal(userId: string): {
  completedModules: string[];
  quizScores: Record<string, number>;
  moduleTimestamps: Record<string, string>;
  quizTimestamps: Record<string, string>;
} {
  try {
    const raw = localStorage.getItem(`security-trainer-progress-${userId}`);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        completedModules: data.completedModules || [],
        quizScores: data.quizScores || {},
        moduleTimestamps: data.moduleTimestamps || {},
        quizTimestamps: data.quizTimestamps || {},
      };
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development')
      logger.warn('StudentProgressView getStudentProgressLocal failed', { error: e });
    // Intentionally silent — fallback to defaults if localStorage fails
  }
  return {
    completedModules: [],
    quizScores: {},
    moduleTimestamps: {},
    quizTimestamps: {},
  };
}

export default function StudentProgressView({
  students: studentList,
  groupId,
  onBack,
}: {
  students: Array<{
    id: string;
    fullName: string;
    email: string;
    group: string;
    avatar: string;
  }>;
  groupId?: string;
  onBack: () => void;
}) {
  const formatDate = useDateFormatter();
  const formatDateTime = useDateTimeFormatter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<StudentPerformanceData | null>(null);
  const [summary, setSummary] = useState<ComprehensiveSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const t = useTranslations('studentProgress');

  const selectedStudent = useMemo(
    () => studentList.find((s) => s.id === selectedId) || null,
    [selectedId, studentList],
  );

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setData(null);
    setSummary(null);
    setTrends([]);
    setLoadError(false);
    Promise.all([
      getStudentPerformance(selectedId, 30),
      getComprehensiveSummary(30, groupId),
      getProgressTrends(selectedId, '30d', groupId),
    ])
      .then(([perf, summ, trendData]) => {
        setData(perf);
        setSummary(summ);
        setTrends(trendData);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development')
          logger.error('StudentProgressView failed to load student data', { error: err });
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [selectedId, groupId]);

  const localProgress = getStudentProgressLocal(selectedId || '');

  const radarData = useMemo(() => {
    if (!selectedId) return [];
    if (data?.categoryBreakdown) {
      return data.categoryBreakdown.map((c) => ({
        category: c.category,
        student: Math.round(c.avgScore),
        group: summary?.kpis.avgQuizScore || 0,
      }));
    }
    return quizCategories.map((cat) => {
      const score = localProgress.quizScores[cat.id] || 0;
      return {
        category: cat.name,
        student: score,
        group: summary?.kpis.avgQuizScore || 0,
      };
    });
  }, [selectedId, data, summary, localProgress.quizScores]);

  if (!selectedId || !selectedStudent) {
    return (
      <div className="space-y-2">
        {studentList.map((student, i) => {
          const progress = getStudentProgressLocal(student.id);
          const moduleCount = progress.completedModules.length;
          const quizCount = Object.keys(progress.quizScores).length;
          const avgScore =
            Object.values(progress.quizScores).length > 0
              ? Math.round(
                  Object.values(progress.quizScores).reduce((a, b) => a + b, 0) /
                    Object.values(progress.quizScores).length,
                )
              : 0;

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className="border-border cursor-pointer transition-colors hover:border-emerald-200"
                onClick={() => setSelectedId(student.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100">
                        {student.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={student.avatar}
                            alt={`${t('avatar')}: ${student.fullName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <GraduationCap size={16} className="text-violet-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{student.fullName}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                        {student.group && (
                          <Badge variant="secondary" className="mt-0.5 text-[10px]">
                            {student.group}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-[10px] text-slate-400">{t('modules')}</p>
                        <p className="text-xs font-bold">{moduleCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">{t('quizzes')}</p>
                        <p className="text-xs font-bold">{quizCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">{t('avgScore')}</p>
                        <p className="text-xs font-bold">{avgScore}%</p>
                      </div>
                      <Zap size={14} className="text-slate-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {studentList.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('noStudents')}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setData(null);
            onBack();
          }}
          className="hover:bg-muted rounded-lg p-1.5 transition-colors"
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-violet-100">
            {selectedStudent.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedStudent.avatar}
                alt={`${t('avatar')}: ${selectedStudent.fullName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <GraduationCap size={20} className="text-violet-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold">{selectedStudent.fullName}</h3>
            <p className="text-xs text-slate-400">{selectedStudent.email}</p>
          </div>
        </div>
        {data && (
          <Badge
            className={
              data.kpis.riskScore > 60
                ? 'bg-red-100 text-red-700'
                : data.kpis.riskScore > 30
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
            }
          >
            {t('risk')}: {data.kpis.riskScore}%
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : loadError ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <AlertTriangle size={24} className="mr-2" />
          <span className="text-sm">{t('loadFailed')}</span>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-500" />
                  <span className="text-muted-foreground text-xs">{t('modules')}</span>
                </div>
                <p className="mt-1 text-xl font-bold">
                  {data.kpis.modulesCompleted}/{data.kpis.totalModules}
                </p>
                <div className="bg-muted mt-1 h-1.5 w-full rounded-full">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${data.kpis.totalModules > 0 ? (data.kpis.modulesCompleted / data.kpis.totalModules) * 100 : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-emerald-500" />
                  <span className="text-muted-foreground text-xs">{t('avgScore')}</span>
                </div>
                <p className="mt-1 text-xl font-bold">{data.kpis.avgQuizScore}%</p>
                <p className="mt-1 text-xs text-slate-400">{data.kpis.totalQuizAttempts} {t('attempts')}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-violet-500" />
                  <span className="text-muted-foreground text-xs">{t('engagement')}</span>
                </div>
                <p className="mt-1 text-xl font-bold">{data.kpis.engagementScore}%</p>
                <p className="mt-1 text-xs text-slate-400">{t('inactiveFor')} {data.kpis.lastActiveDays} {t('days')}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Target
                    size={14}
                    className={
                      data.kpis.riskScore > 60
                        ? 'text-red-500'
                        : data.kpis.riskScore > 30
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                    }
                  />
                  <span className="text-muted-foreground text-xs">{t('riskLabel')}</span>
                </div>
                <p className="mt-1 text-xl font-bold">{data.kpis.riskScore}%</p>
                <p className="mt-1 text-xs text-slate-400">
                  {data.kpis.riskScore > 60 ? t('needsAttention') : data.kpis.riskScore > 30 ? t('medium') : t('low')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">
                {t('tabOverview')}
              </TabsTrigger>
              <TabsTrigger value="modules" className="text-xs">
                {t('tabModules')}
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">
                {t('tabTrends')}
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                {t('tabActivity')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Radar Chart */}
                <Card className="border-border">
                  <CardContent className="p-3">
                    <h4 className="mb-2 text-xs font-semibold">{t('competencies')}</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar
                            name={selectedStudent.fullName}
                            dataKey="student"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.2}
                          />
                          <Radar
                            name={t('groupAvg')}
                            dataKey="group"
                            stroke="#94a3b8"
                            fill="#94a3b8"
                            fillOpacity={0.1}
                          />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="border-border">
                  <CardContent className="p-3">
                    <h4 className="mb-2 text-xs font-semibold">{t('categoryResults')}</h4>
                    <div className="space-y-2">
                      {radarData.map((cat) => (
                        <div key={cat.category} className="flex items-center gap-2">
                          <span className="text-muted-foreground w-24 truncate text-[11px]" title={cat.category}>
                            {cat.category}
                          </span>
                          <div className="bg-muted h-2 flex-1 rounded-full">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                cat.student >= 80 ? 'bg-emerald-500' : cat.student >= 50 ? 'bg-amber-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${cat.student}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-[11px] font-medium">{cat.student}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Preview */}
              {data.activityTimeline.length > 0 && (
                <Card className="border-border">
                  <CardContent className="p-3">
                    <h4 className="mb-2 text-xs font-semibold">{t('recentActivity')}</h4>
                    <div className="space-y-1.5">
                      {data.activityTimeline.slice(0, 5).map((event, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              event.type === 'module'
                                ? 'bg-blue-400'
                                : event.type === 'quiz'
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-muted-foreground min-w-[80px]">{formatDate(event.date)}</span>
                          <span className="text-foreground/70">{event.details}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent value="modules" className="mt-3">
              <Card className="border-border">
                <CardContent className="p-3">
                  <h4 className="mb-3 text-xs font-semibold">{t('moduleProgress')}</h4>
                  <div className="space-y-1.5">
                    {data.moduleProgress.map((mod) => {
                      const modInfo = modules.find((m) => m.id === mod.moduleId);
                      return (
                        <div key={mod.moduleId} className="hover:bg-secondary flex items-center gap-3 rounded-lg p-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full">
                            {mod.completed ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <XCircle size={16} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{modInfo?.title || mod.moduleId}</p>
                            <p className="text-[10px] text-slate-400">
                              {mod.completed ? `${t('score')}: ${mod.score ?? '—'}%` : t('notCompleted')}
                            </p>
                          </div>
                          <div className="text-right">
                            {mod.updatedAt && <p className="text-[10px] text-slate-400">{formatDate(mod.updatedAt)}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="mt-3">
              <Card className="border-border">
                <CardContent className="p-3">
                  <h4 className="mb-3 text-xs font-semibold">{t('performanceTrends')}</h4>
                  {trends.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="avgQuizScore"
                            name={t('avgScore')}
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="modulesCompleted"
                            name={t('modules')}
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-slate-400">
                      <TrendingUp size={24} className="mr-2 opacity-50" />
                      <span className="text-sm">{t('insufficientData')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-3">
              <Card className="border-border">
                <CardContent className="p-3">
                  <h4 className="mb-3 text-xs font-semibold">{t('activityTimeline')}</h4>
                  {data.activityTimeline.length > 0 ? (
                    <div className="max-h-96 space-y-1.5 overflow-y-auto">
                      {data.activityTimeline.map((event, i) => (
                        <div key={i} className="hover:bg-secondary flex items-start gap-3 rounded-lg p-2">
                          <div className="mt-0.5">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                event.type === 'module'
                                  ? 'bg-blue-400'
                                  : event.type === 'quiz'
                                    ? 'bg-emerald-400'
                                    : 'bg-slate-300'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground/70 text-xs">{event.details}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">{formatDateTime(event.date)}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-slate-400">
                      <Clock size={24} className="mr-2 opacity-50" />
                      <span className="text-sm">{t('noActivity')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <AlertTriangle size={24} className="mr-2" />
          <span className="text-sm">{t('loadFailed')}</span>
        </div>
      )}
    </div>
  );
}
