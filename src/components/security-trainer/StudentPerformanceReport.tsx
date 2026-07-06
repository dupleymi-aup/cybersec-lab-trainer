"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  User,
  BookOpen,
  Trophy,
  Activity,
  Award,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileText,
} from "lucide-react";
import {
  getStudentPerformance,
  type StudentPerformanceData,
} from "@/lib/auth-store";
import { useDateFormatter, useDateTimeFormatter } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateStudentReportPDF,
  generateStudentReportCSV,
  downloadCSV,
} from "@/lib/export-utils";
import KPICard from "./KPICard";
import { logger } from "@/lib/logger";

const PERIOD_OPTIONS = [
  { key: 7, label: "7д" },
  { key: 30, label: "30д" },
  { key: 90, label: "90д" },
  { key: 180, label: "180д" },
];

interface Props {
  userId: string;
  initialDays?: number;
  groupId?: string;
}

export default function StudentPerformanceReport({
  userId,
  initialDays = 30,
  groupId: _groupId,
}: Props) {
  const formatDate = useDateFormatter();
  const formatDateTime = useDateTimeFormatter();
  const [data, setData] = useState<StudentPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStudentPerformance(userId, days)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Ошибка загрузки");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">
          Выберите студента для просмотра отчёта
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground ml-3">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-muted-foreground font-medium ml-3">
          Ошибка загрузки
        </p>
      </div>
    );
  }

  const {
    profile,
    kpis,
    moduleProgress,
    quizResults,
    categoryBreakdown,
    activityTimeline,
    achievements,
    moduleCompletionTimeline,
    quizCategoryTrajectory,
    loginActivityTimeline,
    skillsGap,
    recommendations,
  } = data;

  const riskColor =
    kpis.riskScore >= 70
      ? "text-red-600"
      : kpis.riskScore >= 30
        ? "text-amber-600"
        : "text-emerald-600";
  const riskBg =
    kpis.riskScore >= 70
      ? "bg-red-50"
      : kpis.riskScore >= 30
        ? "bg-amber-50"
        : "bg-emerald-50";

  const handlePdfExport = async () => {
    setExportStatus("loading");
    try {
      await generateStudentReportPDF(
        {
          fullName: profile.fullName,
          email: profile.email,
          group: profile.group,
          course: profile.course || "",
          university: profile.university || "",
        },
        {
          modulesCompleted: kpis.modulesCompleted,
          totalModules: kpis.totalModules,
          avgQuizScore: kpis.avgQuizScore,
          engagementScore: kpis.engagementScore,
          riskScore: kpis.riskScore,
        },
        moduleProgress.map((p) => ({
          moduleId: p.moduleName,
          completed: p.completed,
          score: p.score,
        })),
        quizResults.map((q) => ({
          quizId: q.quizId,
          score: q.score,
          total: q.total,
          percentage: q.percentage,
        })),
        recommendations,
      );
      setExportStatus("success");
    } catch (e) {
      if (process.env.NODE_ENV === "development")
        logger.warn(
          "StudentPerformanceReport handlePdfExport failed",
          { error: e },
        );
      setExportStatus("idle");
    }
    setTimeout(() => setExportStatus("idle"), 4000);
  };

  const handleCsvExport = () => {
    const csv = generateStudentReportCSV(
      {
        fullName: profile.fullName,
        email: profile.email,
        group: profile.group,
        course: profile.course || "",
        university: profile.university || "",
      },
      moduleProgress.map((p) => ({
        moduleId: p.moduleName,
        completed: p.completed,
        score: p.score,
      })),
      quizResults.map((q) => ({
        quizId: q.quizId,
        score: q.score,
        total: q.total,
        percentage: q.percentage,
      })),
    );
    const date = new Date().toISOString().split("T")[0];
    const safeName = profile.fullName.replace(/\s+/g, "-");
    downloadCSV(csv, `student-${safeName}-${date}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Period selector + Export buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDays(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                days === key
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePdfExport}
            disabled={exportStatus === "loading"}
            className={
              exportStatus === "success"
                ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                : ""
            }
          >
            {exportStatus === "loading" ? (
              "..."
            ) : exportStatus === "success" ? (
              "Готово"
            ) : (
              <>
                <FileText size={14} className="mr-1" /> PDF
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCsvExport}>
            <Download size={14} className="mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={32} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{profile.fullName}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {profile.group && (
                  <Badge variant="secondary">{profile.group}</Badge>
                )}
                {profile.course && (
                  <Badge variant="outline">{profile.course}</Badge>
                )}
                {profile.university && (
                  <Badge variant="outline">{profile.university}</Badge>
                )}
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${riskBg}`}>
              <p className={`text-2xl font-bold ${riskColor}`}>
                {kpis.riskScore}
              </p>
              <p className="text-xs text-muted-foreground">Риск</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<BookOpen size={18} />}
          value={`${kpis.modulesCompleted}/${kpis.totalModules}`}
          label="Модули"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<Trophy size={18} />}
          value={`${kpis.avgQuizScore}%`}
          label="Ср. балл квизов"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={<Activity size={18} />}
          value={kpis.totalQuizAttempts}
          label="Попыток квизов"
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
        <KPICard
          icon={<Clock size={18} />}
          value={
            kpis.lastActiveDays === 0
              ? "Сегодня"
              : `${kpis.lastActiveDays}д назад`
          }
          label="Последняя активность"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="text-xs">
            Обзор
          </TabsTrigger>
          <TabsTrigger value="modules" className="text-xs">
            Модули
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="text-xs">
            Квизы
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            Активность
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            Таймлайн
          </TabsTrigger>
          <TabsTrigger value="skills-gap" className="text-xs">
            Разрыв навыков
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-xs">
            Рекомендации
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {categoryBreakdown.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">
                  Результаты по категориям квизов
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="correctRate" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {activityTimeline.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">
                  Последняя активность
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activityTimeline.slice(0, 15).map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary"
                    >
                      {activity.type === "login" ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : activity.type === "module_completed" ? (
                        <Trophy size={16} className="text-amber-500" />
                      ) : (
                        <Activity size={16} className="text-sky-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-medium">
                          {activity.details}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateTime(activity.date)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements Summary */}
          {achievements.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Достижения</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${achievement.unlocked ? "border-amber-200 bg-amber-50/50" : "border-border opacity-60"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Award
                          size={16}
                          className={
                            achievement.unlocked
                              ? "text-amber-600"
                              : "text-slate-400"
                          }
                        />
                        <p className="text-xs font-semibold">
                          {achievement.title}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">
                Прогресс по модулям
              </h3>
              <div className="space-y-2">
                {moduleProgress.map((module, i) => (
                  <motion.div
                    key={module.moduleId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      {module.completed ? (
                        <CheckCircle size={18} className="text-emerald-500" />
                      ) : (
                        <XCircle size={18} className="text-slate-300" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {module.moduleName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(module.updatedAt)}
                        </p>
                      </div>
                    </div>
                    {module.score !== null && (
                      <Badge
                        variant={
                          module.score >= 70
                            ? "default"
                            : module.score >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {module.score}%
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Результаты квизов</h3>
              {quizResults.length > 0 ? (
                <div className="space-y-2">
                  {quizResults.map((quiz, i) => (
                    <motion.div
                      key={quiz.quizId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                    >
                      <div>
                        <p className="text-sm font-medium">{quiz.quizId}</p>
                        <p className="text-[10px] text-slate-400">
                          {quiz.score}/{quiz.total} правильных
                        </p>
                      </div>
                      <Badge
                        variant={
                          quiz.percentage >= 70
                            ? "default"
                            : quiz.percentage >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {quiz.percentage}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Нет результатов квизов
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">
                Хронология активности
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityTimeline.map((activity, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100"
                  >
                    {activity.type === "login" ? (
                      <CheckCircle
                        size={16}
                        className="text-emerald-500 mt-0.5"
                      />
                    ) : activity.type === "module_completed" ? (
                      <Trophy size={16} className="text-amber-500 mt-0.5" />
                    ) : (
                      <Activity size={16} className="text-sky-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium">{activity.details}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatDateTime(activity.date)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {activity.type === "login"
                        ? "Вход"
                        : activity.type === "module_completed"
                          ? "Модуль"
                          : "Прогресс"}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          {/* Module Completion Timeline */}
          {moduleCompletionTimeline.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Прогресс по модулям
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={moduleCompletionTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) =>
                        formatDate(v, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip labelFormatter={(v) => formatDate(v)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.1}
                      name="Балл"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Login Activity Timeline */}
          {loginActivityTimeline.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" />
                  Активность входов
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={loginActivityTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) =>
                        formatDate(v, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(v) => formatDate(v)} />
                    <Legend />
                    <Bar dataKey="count" fill="#6366f1" name="Входы" />
                    <Bar
                      dataKey="successCount"
                      fill="#10b981"
                      name="Успешные"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Quiz Category Trajectory */}
          {quizCategoryTrajectory.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Target size={16} className="text-amber-500" />
                  Траектория квизов по категориям
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={quizCategoryTrajectory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) =>
                        formatDate(v, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip labelFormatter={(v) => formatDate(v)} />
                    <Legend />
                    {Array.from(
                      new Set(quizCategoryTrajectory.map((p) => p.category)),
                    ).map((category, i) => {
                      const colors = [
                        "#6366f1",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                        "#ec4899",
                      ];
                      return (
                        <Line
                          key={category}
                          type="monotone"
                          dataKey="avgScore"
                          name={category}
                          stroke={colors[i % colors.length]}
                          dot={false}
                          data={quizCategoryTrajectory.filter(
                            (p) => p.category === category,
                          )}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {moduleCompletionTimeline.length === 0 &&
            loginActivityTimeline.length === 0 &&
            quizCategoryTrajectory.length === 0 && (
              <Card className="border-border">
                <CardContent className="p-8 text-center">
                  <Clock
                    size={32}
                    className="text-muted-foreground mx-auto mb-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Нет данных для отображения таймлайна
                  </p>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Skills Gap Tab */}
        <TabsContent value="skills-gap" className="mt-4 space-y-4">
          {skillsGap.length > 0 && (
            <>
              {/* Skills Gap Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <KPICard
                  icon={<AlertTriangle size={18} />}
                  value={skillsGap.filter((g) => g.severity === "high").length}
                  label="Критичные"
                  iconBg="bg-red-100"
                  iconColor="text-red-600"
                />
                <KPICard
                  icon={<AlertTriangle size={18} />}
                  value={
                    skillsGap.filter((g) => g.severity === "medium").length
                  }
                  label="Средние"
                  iconBg="bg-amber-100"
                  iconColor="text-amber-600"
                />
                <KPICard
                  icon={<CheckCircle size={18} />}
                  value={skillsGap.filter((g) => g.severity === "low").length}
                  label="Норма"
                  iconBg="bg-emerald-100"
                  iconColor="text-emerald-600"
                />
              </div>

              {/* Skills Gap Bar Chart */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-4">
                    Сравнение с группой
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={skillsGap}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="moduleId"
                        tick={{ fontSize: 9 }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                        tickFormatter={(v) =>
                          v.startsWith("category:")
                            ? v.replace("category:", "").substring(0, 8)
                            : v.substring(0, 8)
                        }
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="studentScore"
                        fill="#6366f1"
                        name="Студент"
                      />
                      <Bar dataKey="cohortAvg" fill="#94a3b8" name="Группа" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detailed Gap Table */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-4">
                    Детальный анализ
                  </h3>
                  <div className="space-y-2">
                    {skillsGap
                      .sort((a, b) => a.gap - b.gap)
                      .map((gap, i) => {
                        const severityColor =
                          gap.severity === "high"
                            ? "destructive"
                            : gap.severity === "medium"
                              ? "secondary"
                              : "default";
                        const TrendIcon =
                          gap.gap > 0
                            ? TrendingUp
                            : gap.gap < 0
                              ? TrendingDown
                              : Minus;
                        return (
                          <motion.div
                            key={gap.moduleId}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              <TrendIcon
                                size={16}
                                className={
                                  gap.gap > 0
                                    ? "text-emerald-500"
                                    : gap.gap < 0
                                      ? "text-red-500"
                                      : "text-slate-400"
                                }
                              />
                              <div>
                                <p className="text-sm font-medium">
                                  {gap.moduleId.startsWith("category:")
                                    ? `Категория: ${gap.moduleId.replace("category:", "")}`
                                    : gap.moduleId}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Студент: {gap.studentScore}% | Группа:{" "}
                                  {gap.cohortAvg}%
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold ${gap.gap > 0 ? "text-emerald-600" : "text-red-600"}`}
                              >
                                {gap.gap > 0 ? "+" : ""}
                                {gap.gap}%
                              </span>
                              <Badge
                                variant={severityColor}
                                className="text-[10px]"
                              >
                                {gap.severity === "high"
                                  ? "Критично"
                                  : gap.severity === "medium"
                                    ? "Средне"
                                    : "Норма"}
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {skillsGap.length === 0 && (
            <Card className="border-border">
              <CardContent className="p-8 text-center">
                <Target
                  size={32}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  Нет данных для анализа навыков
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-4 space-y-4">
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, i) => {
                const priorityColor =
                  rec.priority === "high"
                    ? "border-red-200 bg-red-50/50"
                    : rec.priority === "medium"
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-emerald-200 bg-emerald-50/50";
                const priorityBadge =
                  rec.priority === "high"
                    ? "destructive"
                    : rec.priority === "medium"
                      ? "secondary"
                      : "default";
                const TypeIcon =
                  rec.type === "module"
                    ? BookOpen
                    : rec.type === "quiz"
                      ? Target
                      : Lightbulb;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={`border ${priorityColor}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              rec.priority === "high"
                                ? "bg-red-100"
                                : rec.priority === "medium"
                                  ? "bg-amber-100"
                                  : "bg-emerald-100"
                            }`}
                          >
                            <TypeIcon
                              size={18}
                              className={
                                rec.priority === "high"
                                  ? "text-red-600"
                                  : rec.priority === "medium"
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold">{rec.title}</p>
                              <Badge
                                variant={priorityBadge}
                                className="text-[10px]"
                              >
                                {rec.priority === "high"
                                  ? "Высокий"
                                  : rec.priority === "medium"
                                    ? "Средний"
                                    : "Низкий"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="p-8 text-center">
                <Lightbulb
                  size={32}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  Нет рекомендаций — отличная работа!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
