'use client';

import { useState, useEffect, useMemo } from 'react';
import { getActivityHeatmap, getAllUsers, type HeatmapData, type User } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock, Calendar, Zap, Flame, Loader2 } from 'lucide-react';

type DateRange = '90d' | '180d' | '365d';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '90d', label: '90 дней' },
  { value: '180d', label: '180 дней' },
  { value: '365d', label: 'Год' },
];

const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const monthNames = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
];

const levelColors = [
  'bg-slate-100',
  'bg-emerald-200',
  'bg-emerald-300',
  'bg-emerald-500',
  'bg-emerald-700',
];

const levelLabels = [
  '0',
  '1-3',
  '4-6',
  '7-9',
  '10+',
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface TooltipState {
  visible: boolean;
  date: string;
  count: number;
  x: number;
  y: number;
}

export default function ActivityHeatmap() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>('90d');
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, date: '', count: 0, x: 0, y: 0 });

  // Fetch students list
  useEffect(() => {
    getAllUsers().then((users) => {
      setStudents(users.filter((u) => u.role === 'student'));
    });
  }, []);

  // Fetch heatmap data
  useEffect(() => {
    setLoading(true);
    getActivityHeatmap(selectedUserId || undefined, dateRange).then((data) => {
      setHeatmapData(data);
      setLoading(false);
    });
  }, [selectedUserId, dateRange]);

  // Build the contribution grid
  const gridData = useMemo(() => {
    if (!heatmapData) return null;

    // Create a map of date -> count for fast lookup
    const countMap = new Map<string, number>();
    for (const entry of heatmapData.dailyActivity) {
      countMap.set(entry.date, entry.count);
    }

    // Determine the number of weeks to display
    const weekCountMap: Record<DateRange, number> = { '90d': 14, '180d': 26, '365d': 52 };
    const numWeeks = weekCountMap[dateRange];

    // Build grid: array of weeks, each week has 7 days (Mon=0 .. Sun=6)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - numWeeks * 7);

    // Align startDate to Monday
    const dayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const weeks: Array<Array<{ date: string; count: number }>> = [];
    const currentDate = new Date(startDate);

    for (let w = 0; w < numWeeks; w++) {
      const week: Array<{ date: string; count: number }> = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = countMap.get(dateStr) || 0;
        week.push({ date: dateStr, count });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    // Month labels: find the first date of each week and group by month
    const monthLabels: Array<{ weekIndex: number; month: number; label: string }> = [];
    let lastMonth = -1;
    for (let w = 0; w < numWeeks; w++) {
      const firstDay = weeks[w][0];
      const d = new Date(firstDay.date);
      if (d.getMonth() !== lastMonth) {
        monthLabels.push({ weekIndex: w, month: d.getMonth(), label: monthNames[d.getMonth()] });
        lastMonth = d.getMonth();
      }
    }

    return { weeks, numWeeks, monthLabels };
  }, [heatmapData, dateRange]);

  // Bar chart data for hour distribution
  const hourChartData = useMemo(() => {
    if (!heatmapData) return [];
    return heatmapData.hourlyActivity.map((h) => ({
      hour: `${String(h.hour).padStart(2, '0')}:00`,
      count: h.count,
    }));
  }, [heatmapData]);

  // Bar chart data for day-of-week distribution
  const dayChartData = useMemo(() => {
    if (!heatmapData) return [];
    return heatmapData.weeklyActivity.map((d) => ({
      day: dayLabels[d.day] || dayLabels[d.day - 1] || '',
      count: d.count,
    }));
  }, [heatmapData]);

  // Custom tooltip for recharts bar charts
  const renderTooltip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: Array<{ payload: { hour?: string; day?: string }; value?: number }> };
    if (p.active && p.payload && p.payload.length) {
      const item = p.payload[0].payload;
      const label = item.hour || item.day;
      const value = p.payload[0].value;
      return (
        <div className="bg-slate-800 text-white text-xs rounded px-3 py-2 shadow-lg">
          <p className="font-medium">{label}</p>
          <p>{value} активностей</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calendar size={20} className="text-emerald-600" />
          Тепловая карта активности
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Student selector */}
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
          >
            <option value="">Все студенты</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>

          {/* Date range selector */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
            {dateRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  dateRange === opt.value
                    ? 'bg-white text-slate-800 shadow-sm font-medium'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-slate-200">
            <CardContent className="flex items-center justify-center h-[300px]">
              <Loader2 size={24} className="animate-spin text-slate-400 mr-2" />
              <span className="text-sm text-slate-400">Загрузка...</span>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main content */}
      {!loading && heatmapData && (
        <>
          {/* GitHub-style contribution grid */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                {/* Month labels row */}
                <div className="flex ml-8 mb-1">
                  {gridData && gridData.monthLabels.map((ml) => (
                    <div
                      key={ml.weekIndex}
                      className="absolute text-[10px] text-slate-500"
                      style={{ left: `calc(2rem + ${ml.weekIndex} * 14px)` }}
                    >
                      {ml.label}
                    </div>
                  ))}
                  <div className="relative w-full h-4">
                    {gridData && gridData.monthLabels.map((ml) => (
                      <span
                        key={ml.weekIndex}
                        className="absolute text-[10px] text-slate-500"
                        style={{ left: `${ml.weekIndex * 14}px` }}
                      >
                        {ml.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grid: day labels + contribution squares */}
                <div className="flex">
                  {/* Day-of-week labels */}
                  <div className="flex flex-col justify-around pr-1 pt-0.5" style={{ height: `${7 * 14}px` }}>
                    {dayLabels.map((label, i) => (
                      <div key={i} className="text-[10px] text-slate-500 leading-[14px]">
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Contribution squares */}
                  <div className="flex gap-[2px] overflow-x-auto">
                    {gridData && gridData.weeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="flex flex-col gap-[2px]">
                        {week.map((day, dayIdx) => {
                          const level = getLevel(day.count);
                          return (
                            <div
                              key={dayIdx}
                              className={`w-3 h-3 rounded-sm ${levelColors[level]} cursor-pointer transition-colors hover:ring-1 hover:ring-slate-400`}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltip({
                                  visible: true,
                                  date: day.date,
                                  count: day.count,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                });
                              }}
                              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tooltip */}
                {tooltip.visible && (
                  <div
                    className="fixed z-50 pointer-events-none bg-slate-800 text-white text-xs rounded px-3 py-2 shadow-lg -translate-x-1/2 -translate-y-full"
                    style={{ left: tooltip.x, top: tooltip.y - 8 }}
                  >
                    <p className="font-medium">{formatDate(tooltip.date)}</p>
                    <p>{tooltip.count} {tooltip.count === 1 ? 'активность' : tooltip.count < 5 ? 'активности' : 'активностей'}</p>
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-1 mt-3 text-[10px] text-slate-500 justify-end">
                  <span>Меньше</span>
                  {levelColors.map((color, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${color}`} title={levelLabels[i]} />
                  ))}
                  <span>Больше</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Total activities */}
              <Card className="border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <Zap size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{heatmapData.totalActivities}</p>
                  <p className="text-xs text-slate-500 mt-1">Всего активностей</p>
                </CardContent>
              </Card>

              {/* Most active day */}
              <Card className="border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center mx-auto mb-2">
                    <Calendar size={16} className="text-sky-600" />
                  </div>
                  <p className="text-2xl font-bold text-sky-600">{heatmapData.mostActiveDay ? formatDate(heatmapData.mostActiveDay) : '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">Самый активный день</p>
                </CardContent>
              </Card>

              {/* Most active hour */}
              <Card className="border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mx-auto mb-2">
                    <Clock size={16} className="text-violet-600" />
                  </div>
                  <p className="text-2xl font-bold text-violet-600">{heatmapData.mostActiveHour !== undefined ? `${String(heatmapData.mostActiveHour).padStart(2, '0')}:00` : '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">Самый активный час</p>
                </CardContent>
              </Card>

              {/* Streak */}
              <Card className="border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
                    <Flame size={16} className="text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{heatmapData.streakDays}</p>
                  <p className="text-xs text-slate-500 mt-1">Дней подряд</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Bottom charts: hour and day distribution */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hour-of-day distribution */}
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    Активность по часам
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip content={renderTooltip} />
                        <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Day-of-week distribution */}
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    Активность по дням недели
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip content={renderTooltip} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </>
      )}

      {/* Empty state */}
      {!loading && heatmapData && heatmapData.totalActivities === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center h-[300px] text-slate-400">
              <Calendar size={40} className="mb-3 opacity-50" />
              <p className="text-sm">Нет данных об активности</p>
              <p className="text-xs text-slate-300 mt-1">Выберите другого студента или расширьте период</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
