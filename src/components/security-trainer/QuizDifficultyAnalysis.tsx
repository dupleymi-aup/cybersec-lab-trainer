'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Loader2, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import KPICard from './KPICard';
import { logger } from '@/lib/logger';

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
  trendByDifficulty: Array<{
    week: string;
    easy: number;
    medium: number;
    hard: number;
  }>;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export default function QuizDifficultyAnalysis({ groupId, days }: { groupId?: string; days?: number }) {
  const [data, setData] = useState<QuizDifficultyData | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations('quizDifficultyAnalysis');
  const DIFFICULTY_LABELS: Record<string, string> = {
    easy: t('easy'),
    medium: t('medium'),
    hard: t('hard'),
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ days: String(days || 30) });
    if (groupId) params.set('groupId', groupId);
    fetch(`/api/analytics/quiz-difficulty?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => {
        if (process.env.NODE_ENV === 'development')
          logger.error('QuizDifficultyAnalysis failed to load data', { error: err });
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [groupId, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!data || !data.difficultyBreakdown.length) {
    return (
      <Card className="border-border">
        <CardContent className="text-muted-foreground p-8 text-center">
          <Target size={40} className="mx-auto mb-3 opacity-50" />
          <p>{t('noData')}</p>
        </CardContent>
      </Card>
    );
  }

  // Summary KPIs
  const totalAttempts = data.difficultyBreakdown.reduce((sum, d) => sum + d.totalAttempts, 0);
  const avgCorrectRate =
    totalAttempts > 0
      ? Math.round(
          (data.difficultyBreakdown.reduce((sum, d) => sum + d.correctRate * d.totalAttempts, 0) / totalAttempts) * 10,
        ) / 10
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPICard icon={<Target size={18} />} value={totalAttempts} label={t('totalAttempts')} />
        <KPICard icon={<Target size={18} />} value={`${avgCorrectRate}%`} label={t('avgScore')} />
        <KPICard icon={<Target size={18} />} value={totalStudents} label={t('students')} />
        <KPICard icon={<Target size={18} />} value={data.difficultyBreakdown.length} label={t('difficultyLevels')} />
      </div>

      {/* Difficulty Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {data.difficultyBreakdown.map((d) => (
          <Card key={d.difficulty} className="border-border">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS[d.difficulty] }} />
                <span className="text-sm font-semibold">{DIFFICULTY_LABELS[d.difficulty] || d.difficulty}</span>
              </div>
              <div className="text-muted-foreground space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>{t('attempts')}</span>
                  <span className="text-foreground font-medium">{d.totalAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('correct')}</span>
                  <span className="text-foreground font-medium">{d.correctRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('students')}</span>
                  <span className="text-foreground font-medium">{d.uniqueStudents}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart: Correct Rate by Difficulty */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('correctRateByDifficulty')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${value ?? 0}%`} />
              <Bar dataKey="correctRate" fill="#6366f1" name={t('correctPercent')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category × Difficulty Grouped Bar Chart */}
      {heatmapData.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('categoriesByDifficulty')}</h3>
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
            <h3 className="mb-4 text-sm font-semibold">{t('trendByDifficulty')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value ?? 0}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="easy"
                  stroke={DIFFICULTY_COLORS.easy}
                  strokeWidth={2}
                  dot={false}
                  name={t('easy')}
                />
                <Line
                  type="monotone"
                  dataKey="medium"
                  stroke={DIFFICULTY_COLORS.medium}
                  strokeWidth={2}
                  dot={false}
                  name={t('medium')}
                />
                <Line
                  type="monotone"
                  dataKey="hard"
                  stroke={DIFFICULTY_COLORS.hard}
                  strokeWidth={2}
                  dot={false}
                  name={t('hard')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Students Table */}
      {topStudents.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('topByHardQuestions')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-border border-b">
                    <th className="text-muted-foreground px-3 py-2 text-left font-semibold">{t('students')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right font-semibold">{t('easy')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right font-semibold">{t('medium')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right font-semibold">{t('hard')}</th>
                    <th className="text-muted-foreground px-3 py-2 text-right font-semibold">{t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((s) => (
                    <tr key={s.userId} className="border-border/50 hover:bg-muted/50 border-b">
                      <td className="px-3 py-2 font-medium">{s.fullName}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{s.easyRate}%</td>
                      <td className="px-3 py-2 text-right text-amber-600">{s.mediumRate}%</td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">{s.hardRate}%</td>
                      <td className="text-muted-foreground px-3 py-2 text-right">{s.totalAttempts}</td>
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
