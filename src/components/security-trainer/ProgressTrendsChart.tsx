'use client';

import { useState, useEffect } from 'react';
import { getProgressTrends, type TrendPoint } from '@/lib/auth-store';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { CHART_COLORS } from '@/lib/constants';
import { useTranslations } from 'next-intl';

interface ProgressTrendsChartProps {
  students?: Array<{ id: string; fullName: string }>;
  groupId?: string;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function ProgressTrendsChart({ students, groupId: _groupId }: ProgressTrendsChartProps) {
  const t = useTranslations('common.progressTrends');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '7d', label: t('7days') },
    { value: '30d', label: t('30days') },
    { value: '90d', label: t('90days') },
    { value: 'all', label: t('allTime') },
  ];
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
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h3 className="text-sm font-semibold">{t('title')}</h3>

            <div className="flex flex-wrap items-center gap-2">
              {students && students.length > 0 && (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="border-border bg-card rounded-md border px-3 py-1.5 text-xs"
                >
                  <option value="">{t('allStudents')}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              )}

              <div className="bg-muted flex items-center gap-1 rounded-md p-0.5">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`rounded px-2.5 py-1 text-xs transition-colors ${
                      dateRange === opt.value
                        ? 'bg-background text-foreground font-medium shadow-sm'
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
            <div className="flex h-[300px] items-center justify-center text-slate-400">
              <Clock size={20} className="mr-2 animate-spin" />
              {t('loading')}
            </div>
          ) : trends.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-slate-400">
              <Clock size={40} className="mb-3 opacity-50" />
              <p className="text-sm">{t('noData')}</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: t('modulesLabel'),
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    label={{
                      value: t('scoreLabel'),
                      angle: 90,
                      position: 'insideRight',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="modulesCompleted"
                    name={t('modulesCompleted')}
                    stroke={CHART_COLORS.success}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgQuizScore"
                    name={t('avgQuizScore')}
                    stroke={CHART_COLORS.info}
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
