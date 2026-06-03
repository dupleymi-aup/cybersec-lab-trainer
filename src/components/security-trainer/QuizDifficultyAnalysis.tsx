'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import { Loader2, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import KPICard from './KPICard';

interface DifficultyBreakdown {
  difficulty: string;
  totalAttempts: number;
  correctCount: number;
  correctRate: number;
  uniqueStudents: number;
}

interface CategoryByDifficulty {
  category: string;
  difficulty: string;
  totalAttempts: number;
  correctRate: number;
}

interface StudentPerformance {
  userId: string;
  fullName: string;
  easyRate: number;
  mediumRate: number;
  hardRate: number;
  totalAttempts: number;
}

interface QuizDifficultyData {
  difficultyBreakdown: DifficultyBreakdown[];
  categoryByDifficulty: CategoryByDifficulty[];
  studentPerformanceByDifficulty: StudentPerformance[];
  trendByDifficulty: Array<{ week: string; easy: number; medium: number; hard: number }>;
}

const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Лёгкие', medium: 'Средние', hard: 'Сложные' };
const DIFFICULTY_COLORS: Record<string, string> = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

export default function QuizDifficultyAnalysis({ groupId, days }: { groupId?: string; days?: number }) {
  const [data, setData] = useState<QuizDifficultyData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ days: String(days || 30) });
    if (groupId) params.set('groupId', groupId);
    fetch(`/api/analytics/quiz-difficulty?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => { if (process.env.NODE_ENV === 'development') console.error("QuizDifficultyAnalysis: Failed to load data:", err); setData(null); })
      .finally(() => setLoading(false));
  }, [groupId, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.difficultyBreakdown.length) {
    return (
      <Card className="border-border">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Target size={40} className="mx-auto mb-3 opacity-50" />
          <p>Нет данных о квизах за выбранный период</p>
        </CardContent>
      </Card>
    );
  }

  // Summary KPIs
  const totalAttempts = data.difficultyBreakdown.reduce((sum, d) => sum + d.totalAttempts, 0);
  const avgCorrectRate = totalAttempts > 0
    ? Math.round(data.difficultyBreakdown.reduce((sum, d) => sum + d.correctRate * d.totalAttempts, 0) / totalAttempts * 10) / 10
    : 0;
  const totalStudents = new Set(data.studentPerformanceByDifficulty.map((s) => s.userId)).size;

  // Grouped bar chart data: correct rate by difficulty
  const barChartData = data.difficultyBreakdown.map((d) => ({
    difficulty: DIFFICULTY_LABELS[d.difficulty] || d.difficulty,
    correctRate: d.correctRate,
    attempts: d.totalAttempts,
    students: d.uniqueStudents,
  }));

  // Category × difficulty heatmap data
  const categories = Array.from(new Set(data.categoryByDifficulty.map((c) => c.category)));
  const heatmapData = categories.map((cat) => {
    const entry: Record<string, string | number> = { category: cat };
    for (const item of data.categoryByDifficulty.filter((c) => c.category === cat)) {
      entry[DIFFICULTY_LABELS[item.difficulty] || item.difficulty] = item.correctRate;
    }
    return entry;
  });

  // Trend data
  const trendData = data.trendByDifficulty.map((t) => ({
    week: t.week.slice(5), // MM-DD
    easy: t.easy,
    medium: t.medium,
    hard: t.hard,
  }));

  // Top students by hard difficulty performance
  const topStudents = data.studentPerformanceByDifficulty
    .filter((s) => s.totalAttempts >= 5)
    .sort((a, b) => b.hardRate - a.hardRate)
    .slice(0, 15);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<Target size={18} />}
          value={totalAttempts}
          label="Всего попыток"
        />
        <KPICard
          icon={<Target size={18} />}
          value={`${avgCorrectRate}%`}
          label="Средний балл"
        />
        <KPICard
          icon={<Target size={18} />}
          value={totalStudents}
          label="Студентов"
        />
        <KPICard
          icon={<Target size={18} />}
          value={data.difficultyBreakdown.length}
          label="Уровней сложности"
        />
      </div>

      {/* Difficulty Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {data.difficultyBreakdown.map((d) => (
          <Card key={d.difficulty} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS[d.difficulty] }} />
                <span className="font-semibold text-sm">{DIFFICULTY_LABELS[d.difficulty] || d.difficulty}</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Попыток:</span>
                  <span className="font-medium text-foreground">{d.totalAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Правильных:</span>
                  <span className="font-medium text-foreground">{d.correctRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Студентов:</span>
                  <span className="font-medium text-foreground">{d.uniqueStudents}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart: Correct Rate by Difficulty */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Процент правильных по сложности</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${value ?? 0}%`} />
              <Bar dataKey="correctRate" fill="#6366f1" name="Правильных (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category × Difficulty Grouped Bar Chart */}
      {heatmapData.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Категории по сложности</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatmapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value ?? 0}%`} />
                <Legend />
                {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                  <Bar key={key} dataKey={label} fill={DIFFICULTY_COLORS[key]} name={label} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Trend Line Chart */}
      {trendData.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Тренд по сложности (еженедельно)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value ?? 0}%`} />
                <Legend />
                <Line type="monotone" dataKey="easy" stroke={DIFFICULTY_COLORS.easy} strokeWidth={2} dot={false} name="Лёгкие" />
                <Line type="monotone" dataKey="medium" stroke={DIFFICULTY_COLORS.medium} strokeWidth={2} dot={false} name="Средние" />
                <Line type="monotone" dataKey="hard" stroke={DIFFICULTY_COLORS.hard} strokeWidth={2} dot={false} name="Сложные" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Students Table */}
      {topStudents.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Лучшие по сложным вопросам (мин. 5 попыток)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Студент</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Лёгкие</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Средние</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Сложные</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Всего</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((s) => (
                    <tr key={s.userId} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{s.fullName}</td>
                      <td className="py-2 px-3 text-right text-emerald-600">{s.easyRate}%</td>
                      <td className="py-2 px-3 text-right text-amber-600">{s.mediumRate}%</td>
                      <td className="py-2 px-3 text-right text-red-600 font-semibold">{s.hardRate}%</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{s.totalAttempts}</td>
                    </tr>
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
