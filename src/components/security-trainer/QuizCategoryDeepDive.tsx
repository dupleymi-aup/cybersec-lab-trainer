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
} from "recharts";
import {
  getQuizCategoryAnalytics,
  type QuizCategoryStat,
} from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, BarChart3 } from "lucide-react";

interface QuizCategoryDeepDiveProps {
  groupId?: string;
  days?: number;
}

export default function QuizCategoryDeepDive({
  groupId,
  days = 30,
}: QuizCategoryDeepDiveProps) {
  const [categories, setCategories] = useState<QuizCategoryStat[]>([]);
  const [hardestQuestions, setHardestQuestions] = useState<
    Array<{
      questionId: string;
      questionText: string;
      category: string;
      correctRate: number;
      attempts: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getQuizCategoryAnalytics(days, groupId).then((data) => {
      setCategories(data.categories);
      setHardestQuestions(data.hardestQuestions);
      setLoading(false);
    });
  }, [days, groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-slate-400" />
        <span className="ml-3 text-sm text-slate-400">
          Загрузка категорий...
        </span>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <AlertCircle size={40} className="mb-3 opacity-50" />
        <p className="text-sm">{error || "Нет данных по категориям"}</p>
      </div>
    );
  }

  const barData = categories.map((c) => ({
    name: c.categoryName,
    avgScore: Math.round(c.avgScore),
    passRate: Math.round(c.passRate),
    attempts: c.totalAttempts,
    students: c.uniqueStudents,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <BarChart3 size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Детализация категорий квизов</h2>
          <p className="text-xs text-muted-foreground">
            Статистика по каждой категории
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="avgScore"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    name="Средний балл"
                  />
                  <Bar
                    dataKey="passRate"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Проходной %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {hardestQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">
                Самые сложные вопросы
              </h3>
              <div className="space-y-2">
                {hardestQuestions.slice(0, 10).map((q, i) => (
                  <div
                    key={q.questionId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary"
                  >
                    <span className="text-xs text-slate-400 w-5">{i + 1}</span>
                    <p className="text-xs flex-1 truncate">{q.questionText}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {q.category}
                    </Badge>
                    <span
                      className={`text-xs font-medium ${q.correctRate < 30 ? "text-red-600" : q.correctRate < 60 ? "text-amber-600" : "text-emerald-600"}`}
                    >
                      {Math.round(q.correctRate)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Таблица категорий</h3>
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Категория
                    </th>
                    <th className="text-center p-2 font-medium text-muted-foreground">
                      Попытки
                    </th>
                    <th className="text-center p-2 font-medium text-muted-foreground">
                      Студентов
                    </th>
                    <th className="text-center p-2 font-medium text-muted-foreground">
                      Средний балл
                    </th>
                    <th className="text-center p-2 font-medium text-muted-foreground">
                      Проходной %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr
                      key={cat.categoryId}
                      className="border-b border-slate-100 hover:bg-secondary"
                    >
                      <td className="p-2 font-medium">{cat.categoryName}</td>
                      <td className="p-2 text-center">{cat.totalAttempts}</td>
                      <td className="p-2 text-center">{cat.uniqueStudents}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-medium ${cat.avgScore < 40 ? "text-red-600" : cat.avgScore < 70 ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          {Math.round(cat.avgScore)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-medium ${cat.passRate < 40 ? "text-red-600" : cat.passRate < 70 ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          {Math.round(cat.passRate)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
