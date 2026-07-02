"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Shield, Loader2, AlertTriangle } from "lucide-react";
import {
  getComprehensiveSummary,
  getAllUsers,
  type User,
} from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { modules } from "@/lib/data";
import CustomDateRangePicker from "./CustomDateRangePicker";

interface Props {
  groupId?: string;
}

export default function CompetencyRadar({ groupId }: Props) {
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<
    Array<{
      category: string;
      completion: number;
      score: number;
      maxScore: number;
    }>
  >([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  useEffect(() => {
    getAllUsers().then(setAllUsers);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getComprehensiveSummary(days, groupId)])
      .then(([summary]) => {
        if (cancelled) return;

        const radarData = modules.map((mod) => {
          const moduleStat = summary.moduleDistribution.find(
            (m) => m.moduleId === mod.id,
          );
          return {
            category: mod.title,
            completion: moduleStat ? Math.round(moduleStat.completionRate) : 0,
            score: moduleStat ? Math.round(moduleStat.avgScore) : 0,
            maxScore: 100,
          };
        });

        setChartData(radarData);
        setLoading(false);
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
  }, [days, groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground ml-3">
          Загрузка данных компетенций...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-muted-foreground font-medium ml-3">
          {error}
        </p>
      </div>
    );
  }

  const students = allUsers.filter((u) => u.role === "student");
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Shield size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Карта компетенций</h2>
            <p className="text-xs text-muted-foreground">
              Радар навыков безопасности по модулям
            </p>
          </div>
        </div>
        <CustomDateRangePicker days={days} onChange={setDays} />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-card"
        >
          <option value="">Среднее по всем студентам</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              {selectedStudent
                ? `Компетенции: ${selectedStudent.fullName}`
                : "Средние компетенции группы"}
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                >
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Radar
                    name="Завершение модулей"
                    dataKey="completion"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.15}
                  />
                  <Radar
                    name="Средний балл"
                    dataKey="score"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                  />
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) =>
                      value === "completion"
                        ? "Завершение модулей"
                        : "Средний балл"
                    }
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-12">
                Нет данных
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Легенда</h3>
              {chartData.map((item) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                >
                  <span className="text-xs text-muted-foreground truncate mr-2">
                    {item.category}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      item.score >= 70
                        ? "text-emerald-600"
                        : item.score >= 40
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {item.score}%
                  </span>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Сильные стороны</h3>
              {chartData.filter((d) => d.score >= 70).length > 0 ? (
                <ul className="space-y-1">
                  {chartData
                    .filter((d) => d.score >= 70)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map((d) => (
                      <li
                        key={d.category}
                        className="flex items-center gap-2 text-xs text-emerald-700"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {d.category} — {d.score}%
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Нет сильных сторон</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Зоны роста</h3>
              {chartData.filter((d) => d.score < 50).length > 0 ? (
                <ul className="space-y-1">
                  {chartData
                    .filter((d) => d.score < 50)
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map((d) => (
                      <li
                        key={d.category}
                        className="flex items-center gap-2 text-xs text-amber-700"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {d.category} — {d.score}%
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">
                  Все модули на хорошем уровне
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
