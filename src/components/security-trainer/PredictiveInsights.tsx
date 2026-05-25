'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Loader2, AlertTriangle, Lightbulb, BarChart3,
} from 'lucide-react';
import {
  getProgressTrends, getComprehensiveSummary, getAtRiskStudents,
  type TrendPoint, type ComprehensiveSummary, type AtRiskStudent,
} from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import CustomDateRangePicker from './CustomDateRangePicker';

interface AtRiskDataResponse {
  atRiskStudents: AtRiskStudent[];
  summary: {
    totalStudents: number;
    atRiskCount: number;
    atRiskPercentage: number;
    criticalCount: number;
  };
}

interface Props {
  groupId?: string;
}

function generateForecast(trend: TrendPoint[], days: number): TrendPoint[] {
  if (trend.length < 2) return [];
  const recent = trend.slice(-Math.min(30, trend.length));
  const avgModules = recent.reduce((s, p) => s + p.modulesCompleted, 0) / recent.length;
  const avgScore = recent.reduce((s, p) => s + p.avgQuizScore, 0) / recent.length;

  const lastDate = new Date(recent[recent.length - 1].date);
  const forecast: TrendPoint[] = [];
  for (let i = 1; i <= Math.min(days, 30); i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i * 7);
    const jitterModules = (Math.random() - 0.5) * avgModules * 0.1;
    const jitterScore = (Math.random() - 0.5) * avgScore * 0.05;
    forecast.push({
      date: nextDate.toISOString().split('T')[0],
      modulesCompleted: Math.max(0, Math.round(avgModules + jitterModules * (i / 4))),
      avgQuizScore: Math.min(100, Math.max(0, Math.round(avgScore + jitterScore * (i / 4)))),
      activeStudents: 0,
    });
  }
  return forecast;
}

export default function PredictiveInsights({ groupId }: Props) {
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [summary, setSummary] = useState<ComprehensiveSummary | null>(null);
  const [atRiskData, setAtRiskData] = useState<AtRiskDataResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getProgressTrends(undefined, `${days}d`, groupId),
      getComprehensiveSummary(days, groupId),
      getAtRiskStudents(days, groupId),
    ]).then(([trends, compSummary, atRisk]) => {
      if (!cancelled) {
        setTrendData(trends);
        setSummary(compSummary);
        setAtRiskData(atRisk);
        setLoading(false);
      }
    }).catch((e) => {
      if (!cancelled) {
        setError(e.message || 'Ошибка загрузки');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [days, groupId]);

  const forecast = useMemo(() => generateForecast(trendData, days), [trendData, days]);

  const insights = useMemo(() => {
    if (!summary || !atRiskData) return [];

    const result: Array<{
      label: string;
      current: number;
      predicted: number;
      trend: 'up' | 'down' | 'stable';
      unit: string;
    }> = [];

    const currentActive = summary.kpis.activePercentage;
    const predictedActive = Math.min(100, Math.max(0, currentActive + (forecast.length > 0 ? forecast[forecast.length - 1].avgQuizScore - (trendData[trendData.length - 1]?.avgQuizScore || 0) : 0)));
    result.push({
      label: 'Активность',
      current: currentActive,
      predicted: Math.round(predictedActive),
      trend: predictedActive > currentActive ? 'up' : predictedActive < currentActive ? 'down' : 'stable',
      unit: '%',
    });

    const currentAtRisk = atRiskData.summary.atRiskPercentage;
    const predictedAtRisk = Math.max(0, Math.min(100, currentAtRisk + (atRiskData.summary.atRiskCount > 5 ? 5 : -2)));
    result.push({
      label: 'Риск отставания',
      current: currentAtRisk,
      predicted: Math.round(predictedAtRisk),
      trend: predictedAtRisk > currentAtRisk ? 'up' : predictedAtRisk < currentAtRisk ? 'down' : 'stable',
      unit: '%',
    });

    const currentScore = summary.kpis.avgQuizScore;
    const lastForecastScore = forecast.length > 0 ? forecast[forecast.length - 1].avgQuizScore : currentScore;
    result.push({
      label: 'Средний балл',
      current: currentScore,
      predicted: Math.round(lastForecastScore),
      trend: lastForecastScore > currentScore ? 'up' : lastForecastScore < currentScore ? 'down' : 'stable',
      unit: '%',
    });

    return result;
  }, [summary, atRiskData, forecast, trendData]);

  const completionForecastData = useMemo(() => {
    if (trendData.length < 2) return [];
    const historical = trendData.slice(-14).map((p) => ({
      date: new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      actual: p.modulesCompleted,
      predicted: null as number | null,
      lower: null as number | null,
      upper: null as number | null,
    }));
    const projected = forecast.slice(0, 8).map((p) => ({
      date: new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      actual: null as number | null,
      predicted: p.modulesCompleted,
      lower: Math.max(0, p.modulesCompleted - 2),
      upper: p.modulesCompleted + 2,
    }));
    return [...historical, ...projected];
  }, [trendData, forecast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground ml-3">Прогнозирование...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-muted-foreground font-medium ml-3">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <BarChart3 size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Прогнозная аналитика</h2>
            <p className="text-xs text-muted-foreground">
              Прогнозирование успеваемости на основе исторических данных
            </p>
          </div>
        </div>
        <CustomDateRangePicker days={days} onChange={setDays} />
      </div>

      {/* KPI predictions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border-border ${
              insight.trend === 'up' && insight.label !== 'Риск отставания'
                ? 'hover:border-emerald-300'
                : insight.trend === 'down' && insight.label === 'Риск отставания'
                  ? 'hover:border-emerald-300'
                  : 'hover:border-amber-300'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{insight.label}</span>
                  {insight.trend === 'up' ? (
                    <TrendingUp size={16} className="text-emerald-500" />
                  ) : insight.trend === 'down' ? (
                    <TrendingDown size={16} className="text-red-500" />
                  ) : (
                    <TrendingUp size={16} className="text-slate-400" />
                  )}
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Текущее</p>
                    <p className="text-2xl font-bold">{insight.current}{insight.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Прогноз</p>
                    <p className={`text-2xl font-bold ${
                      ((insight.trend === 'up' && insight.label !== 'Риск отставания') ||
                       (insight.trend === 'down' && insight.label === 'Риск отставания'))
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}>
                      {insight.predicted}{insight.unit}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ((insight.trend === 'up' && insight.label !== 'Риск отставания') ||
                       (insight.trend === 'down' && insight.label === 'Риск отставания'))
                        ? 'bg-emerald-500'
                        : insight.trend === 'stable'
                          ? 'bg-slate-400'
                          : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${(insight.predicted / Math.max(insight.current, insight.predicted)) * 50 + 50}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Completion forecast chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Прогноз завершения модулей</h3>
          {completionForecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={completionForecastData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) =>
                    value === 'actual' ? 'Факт' : value === 'predicted' ? 'Прогноз' : 'Диапазон'
                  }
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="transparent"
                  fill="#6366f1"
                  fillOpacity={0.08}
                  name="upper"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="transparent"
                  fill="#6366f1"
                  fillOpacity={0.08}
                  name="lower"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                  name="actual"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#f59e0b' }}
                  name="predicted"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">
              Недостаточно данных для прогноза
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-500" />
            Рекомендации на основе прогноза
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.filter((i) => i.trend === 'down').length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-red-700 mb-2">Требуется внимание</p>
                <ul className="space-y-1">
                  {insights.filter((i) => i.trend === 'down' && i.label !== 'Риск отставания').map((i) => (
                    <li key={i.label} className="text-xs text-red-600 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      Прогнозируется снижение {i.label.toLowerCase()} ({i.current}{i.unit} → {i.predicted}{i.unit})
                    </li>
                  ))}
                  {insights.filter((i) => i.label === 'Риск отставания' && i.trend === 'up').map((i) => (
                    <li key={i.label} className="text-xs text-red-600 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      Прогнозируется рост студентов в зоне риска ({i.current}{i.unit} → {i.predicted}{i.unit})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {forecast.length > 0 && forecast[forecast.length - 1].modulesCompleted < (trendData[trendData.length - 1]?.modulesCompleted || 0) * 0.8 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-amber-700 mb-2">Долгосрочные риски</p>
                <p className="text-xs text-amber-600">
                  Снижение темпа завершения модулей. Рекомендуется усилить мотивационную составляющую
                  и добавить промежуточные цели для студентов.
                </p>
              </div>
            )}
            {insights.filter((i) => i.trend === 'up' && i.label !== 'Риск отставания').length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm font-medium text-emerald-700 mb-2">Позитивные тренды</p>
                <ul className="space-y-1">
                  {insights.filter((i) => i.trend === 'up' && i.label !== 'Риск отставания').map((i) => (
                    <li key={i.label} className="text-xs text-emerald-600 flex items-start gap-1.5">
                      <TrendingUp size={12} className="mt-0.5 flex-shrink-0" />
                      Рост {i.label.toLowerCase()} ({i.current}{i.unit} → {i.predicted}{i.unit})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insights.filter((i) => i.trend === 'stable').length > 0 && (
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                <p className="text-sm font-medium text-sky-700 mb-2">Стабильные показатели</p>
                <p className="text-xs text-sky-600">
                  Текущий уровень сохраняется. Рекомендуется внедрить точечные улучшения
                  для перехода к положительной динамике.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
