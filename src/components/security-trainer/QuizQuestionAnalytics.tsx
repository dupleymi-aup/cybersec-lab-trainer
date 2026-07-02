"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getQuizQuestionAnalytics,
  type QuizQuestionStat,
} from "@/lib/auth-store";
import { quizCategories } from "@/lib/data/quiz-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Filter, Loader2, AlertCircle } from "lucide-react";

const ALL_CATEGORIES = "all";
const ALL_DIFFICULTIES = "all";

const DIFFICULTY_OPTIONS = [
  { value: ALL_DIFFICULTIES, label: "Все" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function getCorrectRateColor(rate: number): string {
  if (rate < 30) return "#ef4444";
  if (rate < 60) return "#f59e0b";
  return "#10b981";
}

function getCorrectRateBadgeClasses(rate: number): string {
  if (rate < 30) return "bg-red-100 text-red-700";
  if (rate < 60) return "bg-yellow-100 text-yellow-700";
  return "bg-emerald-100 text-emerald-700";
}

function getDifficultyBadgeClasses(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-emerald-100 text-emerald-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "hard":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function QuizQuestionAnalytics() {
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [difficulty, setDifficulty] = useState(ALL_DIFFICULTIES);
  const [stats, setStats] = useState<QuizQuestionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const catParam = category === ALL_CATEGORIES ? undefined : category;
    const diffParam = difficulty === ALL_DIFFICULTIES ? undefined : difficulty;

    getQuizQuestionAnalytics(catParam, diffParam).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [category, difficulty]);

  const hardestQuestions = useMemo(() => {
    return [...stats]
      .filter((s) => s.totalAttempts > 0)
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 10);
  }, [stats]);

  const barChartData = useMemo(() => {
    return hardestQuestions.map((s) => ({
      id: s.questionId,
      correctRate: Math.round(s.correctRate),
      color: getCorrectRateColor(s.correctRate),
    }));
  }, [hardestQuestions]);

  const hasData = stats.some((s) => s.totalAttempts > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-slate-400" />
        <span className="ml-3 text-sm text-slate-400">
          Загрузка аналитики...
        </span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <AlertCircle size={40} className="mb-3 opacity-50" />
        <p className="text-sm">Нет данных</p>
        <p className="text-xs mt-1">
          Студенты ещё не отвечали на вопросы квизов
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <BarChart3 size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Аналитика вопросов квизов</h2>
          <p className="text-xs text-muted-foreground">
            Самые сложные вопросы и статистика ответов
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-muted-foreground">Категория:</span>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-md text-sm bg-card"
        >
          <option value={ALL_CATEGORIES}>Все категории</option>
          {quizCategories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-muted-foreground">Сложность:</span>
        </div>
        <div className="flex gap-1">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={difficulty === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(opt.value)}
              className={`text-xs px-2.5 py-1 h-7 ${
                difficulty === opt.value
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Top 10 Hardest Questions Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-1">
              Топ 10 самых сложных вопросов
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Вопросы с наименьшим процентом правильных ответов
            </p>
            {barChartData.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="id"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value, _name, props) => {
                        const p = props.payload as {
                          id?: string;
                          correctRate?: number;
                        };
                        return [`${p.correctRate ?? 0}%`, "Правильных ответов"];
                      }}
                      labelFormatter={(label) => `Вопрос: ${label}`}
                    />
                    <Bar
                      dataKey="correctRate"
                      radius={[4, 4, 0, 0]}
                      name="Правильных ответов (%)"
                    >
                      {barChartData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400 py-8">
                Нет данных для выбранных фильтров
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Heatmap Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Таблица вопросов</h3>
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground min-w-[200px]">
                      Вопрос
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Категория
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Сложность
                    </th>
                    <th className="text-center p-2 font-medium text-muted-foreground">
                      Попытки
                    </th>
                    <th className="text-center p-2 font-medium text-muted-foreground">
                      Правильно
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats
                    .filter((s) => s.totalAttempts > 0)
                    .sort((a, b) => a.correctRate - b.correctRate)
                    .map((stat, i) => (
                      <tr
                        key={stat.questionId}
                        className="border-b border-slate-100 hover:bg-secondary"
                      >
                        <td className="p-2 text-slate-400 font-mono">
                          {i + 1}
                        </td>
                        <td className="p-2">
                          <span
                            className="truncate max-w-[200px] inline-block"
                            title={stat.questionText}
                          >
                            {stat.questionText.length > 60
                              ? `${stat.questionText.slice(0, 60)}...`
                              : stat.questionText}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {stat.category}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge
                            className={`text-[10px] border-0 ${getDifficultyBadgeClasses(stat.difficulty)}`}
                          >
                            {stat.difficulty}
                          </Badge>
                        </td>
                        <td className="p-2 text-center font-medium">
                          {stat.totalAttempts}
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            className={`text-[10px] border-0 min-w-[42px] ${getCorrectRateBadgeClasses(stat.correctRate)}`}
                          >
                            {Math.round(stat.correctRate)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {stats.filter((s) => s.totalAttempts > 0).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">Нет данных для выбранных фильтров</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
