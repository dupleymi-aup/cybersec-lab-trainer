'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  Loader2, AlertTriangle, Clock, AlertCircle, TrendingUp,
} from 'lucide-react';
import { getQuizSessionAnalytics, type QuizSessionData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from './KPICard';

export interface QuizSessionAnalyticsProps {
  groupId?: string;
  days?: number;
}

export default function QuizSessionAnalytics({ groupId: propGroupId, days: propDays }: QuizSessionAnalyticsProps = {}) {
  const [data, setData] = useState<QuizSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);
  const [internalGroupId, setInternalGroupId] = useState('');

  const days = propDays ?? internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getQuizSessionAnalytics(days, propGroupId || internalGroupId || undefined)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Ошибка загрузки'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [days, propGroupId, internalGroupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500 ml-3">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-slate-600 font-medium ml-3">{error || 'Нет данных'}</p>
      </div>
    );
  }

  const { categoryTiming, rushedQuizzes, timeVsPerformance, hourlyPerformance, weekdayVsWeekend } = data;

  const totalSessions = timeVsPerformance.reduce((sum, b) => sum + b.attemptCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-sky-600" />
          <h2 className="text-lg font-bold">Аналитика квиз-сессий</h2>
        </div>
        {propDays === undefined && (
          <select
            value={internalDays}
            onChange={(e) => setInternalDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white"
          >
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        )}
      </div>

      {/* Timing by category */}
      {categoryTiming.length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Среднее время по категориям (сек)</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryTiming}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgDuration" name="Ср. время (сек)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="medianDuration" name="Медиана (сек)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time vs Performance */}
      {timeVsPerformance.length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Время vs Результат</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeVsPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="durationBucket" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgPercentage" name="Ср. результат (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hourly performance */}
      {hourlyPerformance.length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Результат по часам дня</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: unknown) => `${value}%`} />
                  <Bar dataKey="avgPercentage" name="Ср. результат" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekday vs Weekend */}
      <div className="grid grid-cols-2 gap-4">
        {weekdayVsWeekend.map((d) => (
          <Card key={d.dayType} className="border-slate-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">{d.dayType === 'weekday' ? 'Будни' : 'Выходные'}</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-indigo-600">{d.avgPercentage}%</p>
                  <p className="text-xs text-slate-500">Ср. балл</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{d.attemptCount}</p>
                  <p className="text-xs text-slate-500">Попыток</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rushed quizzes */}
      {rushedQuizzes.length > 0 && (
        <Card className="border-l-4 border-l-red-400 border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-red-600">
              <AlertCircle size={16} /> Обнаружены rushed-квизы ({rushedQuizzes.length})
            </h3>
            <p className="text-xs text-slate-500 mb-3">Студенты, завершившие квиз менее чем за 30 секунд (возможно, угадывание)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-2 font-medium text-slate-600">Студент</th>
                    <th className="p-2 font-medium text-slate-600">Категория</th>
                    <th className="p-2 font-medium text-slate-600 text-center">Время (сек)</th>
                    <th className="p-2 font-medium text-slate-600 text-center">Вопросов</th>
                    <th className="p-2 font-medium text-slate-600 text-center">Результат</th>
                  </tr>
                </thead>
                <tbody>
                  {rushedQuizzes.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2 font-medium">{r.fullName}</td>
                      <td className="p-2 text-slate-500">{r.category}</td>
                      <td className="p-2 text-center">
                        <Badge variant="destructive" className="text-[10px]">{r.duration}с</Badge>
                      </td>
                      <td className="p-2 text-center">{r.questionCount}</td>
                      <td className="p-2 text-center">
                        <span className={r.percentage < 40 ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>{r.percentage}%</span>
                      </td>
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
