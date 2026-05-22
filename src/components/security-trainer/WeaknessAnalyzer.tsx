'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  AlertTriangle, Loader2, Lightbulb, Target, TrendingUp,
} from 'lucide-react';
import { getModulePerformance, getQuizCategoryAnalytics } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CustomDateRangePicker from './CustomDateRangePicker';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', label: 'Критично' },
  high: { color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', label: 'Высокий' },
  medium: { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Средний' },
  low: { color: '#84cc16', bg: 'bg-lime-50', text: 'text-lime-700', label: 'Низкий' },
};

interface WeaknessItem {
  topic: string;
  score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'module' | 'quiz';
  details: string;
  recommendations: string[];
}

export default function WeaknessAnalyzer({ groupId }: { groupId?: string }) {
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getModulePerformance(days, groupId),
      getQuizCategoryAnalytics(days, groupId),
    ]).then(([modulePerf, quizCategoryData]) => {
      if (cancelled) return;

      const quizStats = quizCategoryData.categories;
      const items: WeaknessItem[] = [];

      // Module weaknesses
      for (const mod of modulePerf) {
        if (mod.completionRate < 60 || mod.avgScore < 60) {
          const avgMetric = (mod.completionRate + mod.avgScore) / 2;
          let severity: WeaknessItem['severity'] = 'low';
          if (avgMetric < 20) severity = 'critical';
          else if (avgMetric < 40) severity = 'high';
          else if (avgMetric < 60) severity = 'medium';

          const recommendations: string[] = [];
          if (mod.completionRate < 40) {
            recommendations.push(`Повысить видимость модуля "${mod.moduleName}" в учебной программе`);
          }
          if (mod.avgScore < 50) {
            recommendations.push(`Добавить дополнительные материалы и практику по "${mod.moduleName}"`);
          }
          if (mod.difficultyIndex > 0.7) {
            recommendations.push(`Упростить или разбить на подуровни модуль "${mod.moduleName}"`);
          }
          if (recommendations.length === 0) {
            recommendations.push(`Увеличить количество практических заданий в "${mod.moduleName}"`);
          }

          items.push({
            topic: mod.moduleName,
            score: Math.round(avgMetric),
            severity,
            type: 'module',
            details: `${mod.completedCount}/${mod.totalStudents} завершили, средний балл ${mod.avgScore}%`,
            recommendations,
          });
        }
      }

      // Quiz category weaknesses
      for (const cat of quizStats) {
        if (cat.avgScore < 60) {
          let severity: WeaknessItem['severity'] = 'low';
          if (cat.avgScore < 20) severity = 'critical';
          else if (cat.avgScore < 40) severity = 'high';
          else if (cat.avgScore < 60) severity = 'medium';

          const recommendations: string[] = [];
          if (cat.avgScore < 40) {
            recommendations.push(`Провести дополнительное занятие по "${cat.categoryName}"`);
          }
          if (cat.questionStats.some((q) => q.correctRate < 0.3)) {
            recommendations.push(`Пересмотреть сложные вопросы в категории "${cat.categoryName}"`);
          }
          if (recommendations.length === 0) {
            recommendations.push(`Добавить больше практики по "${cat.categoryName}"`);
          }

          items.push({
            topic: cat.categoryName,
            score: Math.round(cat.avgScore),
            severity,
            type: 'quiz',
            details: `${cat.uniqueStudents} студентов, ${cat.totalAttempts} попыток`,
            recommendations,
          });
        }
      }

      items.sort((a, b) => a.score - b.score);
      setWeaknesses(items);
      setLoading(false);
    }).catch((e) => {
      if (!cancelled) {
        setError(e.message || 'Ошибка загрузки');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [days, groupId]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: weaknesses.length, critical: 0, high: 0, medium: 0, low: 0 };
    for (const w of weaknesses) {
      counts[w.severity] = (counts[w.severity] || 0) + 1;
    }
    return counts;
  }, [weaknesses]);

  const filteredWeaknesses = useMemo(() => {
    if (selectedSeverity === 'all') return weaknesses;
    return weaknesses.filter((w) => w.severity === selectedSeverity);
  }, [weaknesses, selectedSeverity]);

  const chartData = useMemo(() => {
    return weaknesses.slice(0, 10).map((w) => ({
      name: w.topic.length > 18 ? w.topic.substring(0, 16) + '...' : w.topic,
      score: w.score,
      severity: w.severity,
    }));
  }, [weaknesses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground ml-3">Анализ слабых мест...</p>
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
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Target size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Анализ слабых мест</h2>
            <p className="text-xs text-muted-foreground">
              Выявление проблемных тем и рекомендации по улучшению
            </p>
          </div>
        </div>
        <CustomDateRangePicker days={days} onChange={setDays} />
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(severityCounts).map(([key, count]) => {
          if (key === 'all') {
            return (
              <button
                key={key}
                onClick={() => setSelectedSeverity('all')}
                className={`p-3 rounded-lg text-center transition-all ${
                  selectedSeverity === 'all' ? 'bg-slate-800 dark:bg-slate-700 text-white ring-2 ring-slate-800' : 'bg-muted text-foreground/70 hover:bg-slate-200'
                }`}
              >
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs mt-0.5">Все проблемы</p>
              </button>
            );
          }
          const cfg = SEVERITY_CONFIG[key as keyof typeof SEVERITY_CONFIG];
          return (
            <button
              key={key}
              onClick={() => setSelectedSeverity(key)}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedSeverity === key ? `${cfg.bg} ring-2 ring-offset-1` : 'bg-secondary hover:bg-muted'
              }`}
            >
              <p className={`text-xl font-bold ${cfg.text}`}>{count}</p>
              <p className={`text-xs mt-0.5 ${cfg.text}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weakness chart */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-muted-foreground" />
              Топ проблемных тем
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Средний балл']} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={SEVERITY_CONFIG[entry.severity].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-12">
                Проблемные темы не обнаружены
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              Рекомендации
            </h3>
            {filteredWeaknesses.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {filteredWeaknesses.slice(0, 8).map((w, i) => (
                  <motion.div
                    key={`${w.type}-${w.topic}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-lg border border-slate-100 hover:border-border"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${SEVERITY_CONFIG[w.severity].bg} ${SEVERITY_CONFIG[w.severity].text}`}>
                          {SEVERITY_CONFIG[w.severity].label}
                        </Badge>
                        <span className="text-sm font-medium">{w.topic}</span>
                      </div>
                      <span className={`text-xs font-semibold ${
                        w.score >= 50 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {w.score}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{w.details}</p>
                    <ul className="space-y-0.5">
                      {w.recommendations.map((rec, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-12">
                Проблем не найдено
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full weakness table */}
      {filteredWeaknesses.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    <th className="text-left p-3 font-semibold text-xs">Тема</th>
                    <th className="text-left p-3 font-semibold text-xs">Тип</th>
                    <th className="text-center p-3 font-semibold text-xs">Балл</th>
                    <th className="text-center p-3 font-semibold text-xs">Статус</th>
                    <th className="text-left p-3 font-semibold text-xs">Детали</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWeaknesses.map((w, i) => (
                    <motion.tr
                      key={`${w.type}-${w.topic}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-100 hover:bg-secondary"
                    >
                      <td className="p-3 font-medium text-xs">{w.topic}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {w.type === 'module' ? 'Модуль' : 'Квиз'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold text-xs ${
                          w.score >= 50 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {w.score}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`text-[10px] ${SEVERITY_CONFIG[w.severity].bg} ${SEVERITY_CONFIG[w.severity].text}`}>
                          {SEVERITY_CONFIG[w.severity].label}
                        </Badge>
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground">{w.details}</td>
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
