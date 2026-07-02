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
  Legend,
} from "recharts";
import { Repeat, Loader2, AlertTriangle } from "lucide-react";
import { getQuizRetryAnalytics, type QuizRetryData } from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import KPICard from "./KPICard";

const PERIOD_OPTIONS = [
  { key: 7, label: "7д" },
  { key: 30, label: "30д" },
  { key: 90, label: "90д" },
  { key: 180, label: "180д" },
];

export default function QuizRetryAnalytics({
  groupId: controlledGroupId,
  days: controlledDays,
}: { groupId?: string; days?: number } = {}) {
  const [internalDays, setInternalDays] = useState(30);
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [data, setData] = useState<QuizRetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getQuizRetryAnalytics(days, controlledGroupId)
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
    retryDistribution,
    improvementByRetries,
    topRetryers,
    categoryRetryStats,
    totalRetries,
    totalUniqueQuizzes,
  } = data;

  const avgAttempts =
    retryDistribution.reduce((sum, b) => {
      const num = parseInt(b.range.split("+")[0].split(" ")[0]) || 0;
      return sum + b.count * (b.range.includes("+") ? 3 : num);
    }, 0) /
    Math.max(
      1,
      retryDistribution.reduce((sum, b) => sum + b.count, 0),
    );

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
          icon={<Repeat size={18} />}
          value={totalRetries}
          label="Всего повторов"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<Repeat size={18} />}
          value={totalUniqueQuizzes}
          label="Уникальных квизов"
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
        <KPICard
          icon={<Repeat size={18} />}
          value={avgAttempts.toFixed(1)}
          label="Ср. попыток"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<Repeat size={18} />}
          value={categoryRetryStats.length}
          label="Категорий"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Retry Distribution */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Распределение повторов</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={retryDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#6366f1"
                name="Студенты"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Improvement by Retries */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">
            Балл по количеству попыток
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={improvementByRetries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempts" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="avgScore"
                fill="#10b981"
                name="Ср. балл (%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Retry Stats */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">
            Статистика по категориям
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Категория
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                    Попытки
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                    Студенты
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                    Ср. попыток
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryRetryStats.map((cat, i) => (
                  <motion.tr
                    key={cat.category}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-100 hover:bg-secondary transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium">{cat.category}</td>
                    <td className="py-2.5 px-3 text-right">
                      {cat.totalAttempts}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {cat.uniqueStudents}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {cat.avgAttemptsPerStudent}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Retryers */}
      {topRetryers.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              Топ студентов по повторам
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                      ФИО
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                      Группа
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                      Повторы
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topRetryers.slice(0, 10).map((r, i) => (
                    <motion.tr
                      key={r.userId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-100 hover:bg-secondary transition-colors"
                    >
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium">{r.fullName}</td>
                      <td className="py-2.5 px-3 text-xs">{r.group || "-"}</td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {r.retryCount}
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
