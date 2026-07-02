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
  Legend,
} from "recharts";
import { AlertOctagon, Loader2, AlertTriangle } from "lucide-react";
import {
  getErrorPatternsAnalytics,
  type ErrorPatternsData,
} from "@/lib/auth-store";
import { useDateFormatter } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KPICard from "./KPICard";

const PERIOD_OPTIONS = [
  { key: 7, label: "7д" },
  { key: 30, label: "30д" },
  { key: 90, label: "90д" },
  { key: 180, label: "180д" },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#ef4444",
};

export default function ErrorPatternsAnalytics({
  groupId: controlledGroupId,
  days: controlledDays,
}: { groupId?: string; days?: number } = {}) {
  const formatDate = useDateFormatter();
  const [internalDays, setInternalDays] = useState(30);
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [data, setData] = useState<ErrorPatternsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getErrorPatternsAnalytics(days, controlledGroupId)
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
  }, [days, controlledGroupId]);

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
          {error || "Нет данных"}
        </p>
      </div>
    );
  }

  const {
    categoryErrorRates,
    difficultyErrorRates,
    errorTrends,
    mostMissedQuestions,
  } = data;

  const totalErrors = categoryErrorRates.reduce(
    (sum, c) => sum + c.incorrectCount,
    0,
  );
  const totalAttempts = categoryErrorRates.reduce(
    (sum, c) => sum + c.totalAttempts,
    0,
  );
  const overallErrorRate =
    totalAttempts > 0
      ? Math.round((totalErrors / totalAttempts) * 1000) / 10
      : 0;
  const topCategory = categoryErrorRates[0]?.category || "—";

  return (
    <div className="space-y-6">
      {/* Period selector */}
      {controlledDays === undefined && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              onClick={() => setInternalDays(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${days === key ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={totalErrors}
          label="Всего ошибок"
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={`${overallErrorRate}%`}
          label="Общий % ошибок"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={topCategory}
          label="Проблемная категория"
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <KPICard
          icon={<AlertOctagon size={18} />}
          value={mostMissedQuestions.length}
          label="Вопросов с ошибками"
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
      </div>

      {/* Error Rate by Category */}
      {categoryErrorRates.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              % ошибок по категориям
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryErrorRates.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, "Ошибка"]} />
                <Bar
                  dataKey="errorRate"
                  fill="#ef4444"
                  name="%"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Error Rate by Difficulty */}
      {difficultyErrorRates.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              % ошибок по сложности
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={difficultyErrorRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="difficulty"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => DIFFICULTY_LABELS[v] || v}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, "Ошибка"]} />
                <Bar dataKey="errorRate" name="%" radius={[4, 4, 0, 0]}>
                  {difficultyErrorRates.map((entry, i) => (
                    <Bar
                      key={i}
                      dataKey="errorRate"
                      fill={DIFFICULTY_COLORS[entry.difficulty] || "#6366f1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Error Trends Over Time */}
      {errorTrends.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              Тренд ошибок (по неделям)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={errorTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) =>
                    formatDate(v, { month: "short", day: "numeric" })
                  }
                />
                <YAxis />
                <Tooltip labelFormatter={(v) => formatDate(v)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="errorRate"
                  stroke="#ef4444"
                  name="% ошибок"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="incorrectCount"
                  stroke="#f59e0b"
                  name="Кол-во ошибок"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Most Missed Questions */}
      {mostMissedQuestions.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              Топ вопросов с ошибками
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                      Вопрос
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                      Категория
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                      Сложность
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                      Попытки
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                      Ошибки
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                      % ошибок
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mostMissedQuestions.slice(0, 20).map((q, i) => (
                    <motion.tr
                      key={q.questionId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-100 hover:bg-secondary transition-colors"
                    >
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs">
                        {q.questionId.slice(0, 12)}...
                      </td>
                      <td className="py-2.5 px-3">{q.category}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            q.difficulty === "hard"
                              ? "destructive"
                              : q.difficulty === "medium"
                                ? "secondary"
                                : "default"
                          }
                          className="text-[10px]"
                        >
                          {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {q.totalAttempts}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {q.incorrectCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-red-600">
                        {q.errorRate}%
                      </td>
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
