"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
} from "recharts";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getStudentPerformance,
  getComprehensiveSummary,
  getProgressTrends,
} from "@/lib/auth-store";
import { useDateFormatter, useDateTimeFormatter } from "@/lib/format";
import { modules, quizCategories } from "@/lib/data";
import type {
  StudentPerformanceData,
  ComprehensiveSummary,
  TrendPoint,
} from "@/lib/auth-store";
import { logger } from "@/lib/logger";

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
    if (process.env.NODE_ENV === "development")
      logger.warn(
        "StudentProgressView getStudentProgressLocal failed",
        { error: e },
      );
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
  const [activeTab, setActiveTab] = useState("overview");

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
    Promise.all([
      getStudentPerformance(selectedId, 30),
      getComprehensiveSummary(30, groupId),
      getProgressTrends(selectedId, "30d", groupId),
    ])
      .then(([perf, summ, trendData]) => {
        setData(perf);
        setSummary(summ);
        setTrends(trendData);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development")
          logger.error(
            "StudentProgressView failed to load student data",
            { error: err },
          );
      })
      .finally(() => setLoading(false));
  }, [selectedId, groupId]);

  const localProgress = getStudentProgressLocal(selectedId || "");

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
                  Object.values(progress.quizScores).reduce(
                    (a, b) => a + b,
                    0,
                  ) / Object.values(progress.quizScores).length,
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
                className="border-border hover:border-emerald-200 transition-colors cursor-pointer"
                onClick={() => setSelectedId(student.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden shrink-0">
                        {student.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={student.avatar}
                            alt={`Аватар: ${student.fullName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GraduationCap
                            size={16}
                            className="text-violet-600"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {student.fullName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {student.email}
                        </p>
                        {student.group && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-0.5"
                          >
                            {student.group}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-[10px] text-slate-400">Модули</p>
                        <p className="text-xs font-bold">{moduleCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Квизы</p>
                        <p className="text-xs font-bold">{quizCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Ср. балл</p>
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
          <div className="text-center py-12 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Студенты не найдены</p>
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
          onClick={() => {
            setSelectedId(null);
            setData(null);
            onBack();
          }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden">
            {selectedStudent.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedStudent.avatar}
                alt={`Аватар: ${selectedStudent.fullName}`}
                className="w-full h-full object-cover"
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
                ? "bg-red-100 text-red-700"
                : data.kpis.riskScore > 30
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
            }
          >
            Риск: {data.kpis.riskScore}%
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-500" />
                  <span className="text-xs text-muted-foreground">Модули</span>
                </div>
                <p className="text-xl font-bold mt-1">
                  {data.kpis.modulesCompleted}/{data.kpis.totalModules}
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
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
                  <span className="text-xs text-muted-foreground">
                    Ср. балл
                  </span>
                </div>
                <p className="text-xl font-bold mt-1">
                  {data.kpis.avgQuizScore}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {data.kpis.totalQuizAttempts} попыток
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-violet-500" />
                  <span className="text-xs text-muted-foreground">
                    Вовлечённость
                  </span>
                </div>
                <p className="text-xl font-bold mt-1">
                  {data.kpis.engagementScore}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Не активен {data.kpis.lastActiveDays} дн.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Target
                    size={14}
                    className={
                      data.kpis.riskScore > 60
                        ? "text-red-500"
                        : data.kpis.riskScore > 30
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }
                  />
                  <span className="text-xs text-muted-foreground">Риск</span>
                </div>
                <p className="text-xl font-bold mt-1">{data.kpis.riskScore}%</p>
                <p className="text-xs text-slate-400 mt-1">
                  {data.kpis.riskScore > 60
                    ? "Требует внимания"
                    : data.kpis.riskScore > 30
                      ? "Средний"
                      : "Низкий"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">
                Обзор
              </TabsTrigger>
              <TabsTrigger value="modules" className="text-xs">
                Модули
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">
                Тренды
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                Активность
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Radar Chart */}
                <Card className="border-border">
                  <CardContent className="p-3">
                    <h4 className="text-xs font-semibold mb-2">Компетенции</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis
                            dataKey="category"
                            tick={{ fontSize: 10 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fontSize: 9 }}
                          />
                          <Radar
                            name={selectedStudent.fullName}
                            dataKey="student"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.2}
                          />
                          <Radar
                            name="Среднее по группе"
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
                    <h4 className="text-xs font-semibold mb-2">
                      Результаты по категориям
                    </h4>
                    <div className="space-y-2">
                      {radarData.map((cat) => (
                        <div
                          key={cat.category}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="text-[11px] text-muted-foreground w-24 truncate"
                            title={cat.category}
                          >
                            {cat.category}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                cat.student >= 80
                                  ? "bg-emerald-500"
                                  : cat.student >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-400"
                              }`}
                              style={{ width: `${cat.student}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium w-8 text-right">
                            {cat.student}%
                          </span>
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
                    <h4 className="text-xs font-semibold mb-2">
                      Последние действия
                    </h4>
                    <div className="space-y-1.5">
                      {data.activityTimeline.slice(0, 5).map((event, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              event.type === "module"
                                ? "bg-blue-400"
                                : event.type === "quiz"
                                  ? "bg-emerald-400"
                                  : "bg-slate-300"
                            }`}
                          />
                          <span className="text-muted-foreground min-w-[80px]">
                            {formatDate(event.date)}
                          </span>
                          <span className="text-foreground/70">
                            {event.details}
                          </span>
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
                  <h4 className="text-xs font-semibold mb-3">
                    Прогресс по модулям
                  </h4>
                  <div className="space-y-1.5">
                    {data.moduleProgress.map((mod) => {
                      const modInfo = modules.find(
                        (m) => m.id === mod.moduleId,
                      );
                      return (
                        <div
                          key={mod.moduleId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary"
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center">
                            {mod.completed ? (
                              <CheckCircle2
                                size={16}
                                className="text-emerald-500"
                              />
                            ) : (
                              <XCircle size={16} className="text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {modInfo?.title || mod.moduleId}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {mod.completed
                                ? `Оценка: ${mod.score ?? "—"}%`
                                : "Не пройден"}
                            </p>
                          </div>
                          <div className="text-right">
                            {mod.updatedAt && (
                              <p className="text-[10px] text-slate-400">
                                {formatDate(mod.updatedAt)}
                              </p>
                            )}
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
                  <h4 className="text-xs font-semibold mb-3">
                    Динамика успеваемости
                  </h4>
                  {trends.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis
                            yAxisId="left"
                            domain={[0, 100]}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, "auto"]}
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="avgQuizScore"
                            name="Ср. балл"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="modulesCompleted"
                            name="Модули"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                      <TrendingUp size={24} className="mr-2 opacity-50" />
                      <span className="text-sm">
                        Недостаточно данных для тренда
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-3">
              <Card className="border-border">
                <CardContent className="p-3">
                  <h4 className="text-xs font-semibold mb-3">
                    Хронология активности
                  </h4>
                  {data.activityTimeline.length > 0 ? (
                    <div className="space-y-1.5 max-h-96 overflow-y-auto">
                      {data.activityTimeline.map((event, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary"
                        >
                          <div className="mt-0.5">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                event.type === "module"
                                  ? "bg-blue-400"
                                  : event.type === "quiz"
                                    ? "bg-emerald-400"
                                    : "bg-slate-300"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground/70">
                              {event.details}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formatDateTime(event.date)}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] capitalize"
                          >
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                      <Clock size={24} className="mr-2 opacity-50" />
                      <span className="text-sm">Активность не найдена</span>
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
          <span className="text-sm">Не удалось загрузить данные</span>
        </div>
      )}
    </div>
  );
}
