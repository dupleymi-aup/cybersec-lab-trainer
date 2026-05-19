'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { getGroupComparison, type GroupComparisonDimension } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

const DIMENSION_OPTIONS = [
  { key: 'group' as const, label: 'По группе' },
  { key: 'course' as const, label: 'По курсу' },
  { key: 'university' as const, label: 'По университету' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#a855f7', '#d8b4fe'];

export interface GroupComparisonReportProps {
  groupId?: string;
  days?: number;
}

export default function GroupComparisonReport({ groupId, days: controlledDays }: GroupComparisonReportProps = {}) {
  const [dimensions, setDimensions] = useState<GroupComparisonDimension[]>([]);
  const [_rankings, setRankings] = useState({ byCompletion: [] as Array<{ name: string; value: number }>, byQuizScore: [] as Array<{ name: string; value: number }>, byActivity: [] as Array<{ name: string; value: number }> });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);
  const [dimension, setDimension] = useState<'group' | 'course' | 'university'>('group');

  const days = controlledDays ?? internalDays;
  const isControlled = controlledDays !== undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGroupComparison(days, dimension, groupId)
      .then((d) => {
        if (!cancelled) {
          setDimensions(d.dimensions);
          setRankings(d.rankings);
          setLoading(false);
        }
      })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Ошибка загрузки'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [days, dimension, groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-sm text-slate-600 font-medium">{error}</p>
      </div>
    );
  }

  // Grouped bar chart data
  const barData = dimensions.map((d, i) => ({
    name: d.name,
    avgCompletionRate: d.avgCompletionRate,
    avgQuizScore: d.avgQuizScore,
    activeRate: d.activeRate,
    color: COLORS[i % COLORS.length],
  }));

  // Radar chart data (top 5 by completion)
  const top5 = [...dimensions].sort((a, b) => b.avgCompletionRate - a.avgCompletionRate).slice(0, 5);
  const radarData = top5.map((d, i) => ({
    name: d.name,
    completion: d.avgCompletionRate,
    quiz: d.avgQuizScore,
    activity: d.activeRate,
    color: COLORS[i % COLORS.length],
  }));

  const bestGroup = dimensions.length > 0 ? [...dimensions].sort((a, b) => b.avgCompletionRate - a.avgCompletionRate)[0] : null;
  const worstGroup = dimensions.length > 0 ? [...dimensions].sort((a, b) => a.avgCompletionRate - b.avgCompletionRate)[0] : null;

  return (
    <div className="space-y-6">
      {/* Period + dimension selector */}
      <div className="flex gap-3 items-center flex-wrap">
        {!isControlled && (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            {PERIOD_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setInternalDays(key)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  days === key ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {DIMENSION_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDimension(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                dimension === key ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Best/Worst callouts */}
      {bestGroup && worstGroup && bestGroup.name !== worstGroup.name && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Лучший</p>
                  <p className="text-sm font-bold text-emerald-700">{bestGroup.name}</p>
                  <p className="text-xs text-emerald-600">Завершение: {bestGroup.avgCompletionRate}%, Балл: {bestGroup.avgQuizScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-red-600" />
                <div>
                  <p className="text-xs text-red-600 font-medium">Требует внимания</p>
                  <p className="text-sm font-bold text-red-700">{worstGroup.name}</p>
                  <p className="text-xs text-red-600">Завершение: {worstGroup.avgCompletionRate}%, Балл: {worstGroup.avgQuizScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grouped bar chart */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Сравнительная диаграмма</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value, name) => {
                  const labels: Record<string, string> = { avgCompletionRate: 'Завершение', avgQuizScore: 'Ср. балл', activeRate: 'Активность' };
                  return [`${value}%`, labels[name] || name];
                }} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => {
                  const labels: Record<string, string> = { avgCompletionRate: 'Завершение', avgQuizScore: 'Ср. балл', activeRate: 'Активность' };
                  return labels[value] || value;
                }} />
                <Bar dataKey="avgCompletionRate" name="avgCompletionRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgQuizScore" name="avgQuizScore" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeRate" name="activeRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Radar chart */}
      {radarData.length >= 2 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Радар сравнения (топ 5)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                {top5.map((_, i) => (
                  <Radar
                    key={i}
                    name={radarData[i].name}
                    dataKey={['completion', 'quiz', 'activity'][i % 3]}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip formatter={(value) => [`${value}%`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Ranking table */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Рейтинг</h3>
          {dimensions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">#</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">{dimension === 'group' ? 'Группа' : dimension === 'course' ? 'Курс' : 'Университет'}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Студенты</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Завершение</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Ср. балл</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Активность</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Лучший модуль</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Слабый модуль</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dimensions].sort((a, b) => b.avgCompletionRate - a.avgCompletionRate).map((d, i) => (
                    <motion.tr
                      key={d.name}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{d.name}</td>
                      <td className="py-2.5 px-3 text-right">{d.studentCount}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          d.avgCompletionRate >= 70 ? 'bg-emerald-100 text-emerald-700' :
                          d.avgCompletionRate >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{d.avgCompletionRate}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{d.avgQuizScore}%</td>
                      <td className="py-2.5 px-3 text-right">{d.activeRate}%</td>
                      <td className="py-2.5 px-3 text-right text-xs text-emerald-600">{d.topModule}</td>
                      <td className="py-2.5 px-3 text-right text-xs text-red-600">{d.weakestModule}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Нет данных</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
