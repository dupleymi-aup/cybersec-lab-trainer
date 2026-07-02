'use client';

import { useState, useEffect } from 'react';
import { getProgressTrends, type TrendPoint } from '@/lib/auth-store';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ProgressTrendsChartProps {
  students?: Array<{ id: string; fullName: string }>;
  groupId?: string;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
  { value: 'all', label: 'Всё время' },
];

export default function ProgressTrendsChart({ students, groupId: _groupId }: ProgressTrendsChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProgressTrends(selectedUserId || undefined, dateRange).then((data) => {
      setTrends(data);
      setLoading(false);
    });
  }, [dateRange, selectedUserId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-sm">Динамика прогресса</h3>

            <div className="flex flex-wrap items-center gap-2">
              {students && students.length > 0 && (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-md text-xs bg-card"
                >
                  <option value="">Все студенты</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${
                      dateRange === opt.value
                        ? 'bg-background text-foreground shadow-sm font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              <Clock size={20} className="animate-spin mr-2" />
              Загрузка...
            </div>
          ) : trends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
              <Clock size={40} className="mb-3 opacity-50" />
              <p className="text-sm">Нет данных</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Модули', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Балл (%)', angle: 90, position: 'insideRight', fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="modulesCompleted"
                    name="Модули пройдены"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgQuizScore"
                    name="Средний балл квизов"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
