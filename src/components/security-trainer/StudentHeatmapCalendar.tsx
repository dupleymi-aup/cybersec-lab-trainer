'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { getAllUsers, type User } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import KPICard from './KPICard';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const ACTIVITY_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

function getIntensityColor(count: number, maxCount: number): string {
  if (count === 0) return ACTIVITY_COLORS[0];
  const intensity = Math.ceil((count / Math.max(maxCount, 1)) * 4);
  return ACTIVITY_COLORS[Math.min(intensity, 4)];
}

export default function StudentHeatmapCalendar({ groupId: controlledGroupId }: { groupId?: string } = {}) {
  const [students, setStudents] = useState<Array<{ id: string; fullName: string; group: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxCount, setMaxCount] = useState(1);
  const [totalActivity, setTotalActivity] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const loadStudents = async () => {
      const allUsers = await getAllUsers();
      const studentUsers = allUsers.filter((u: User) => u.role === 'student');
      const mapped = studentUsers.map((u: User) => ({ id: u.id, fullName: u.fullName, group: u.group }));
      setStudents(controlledGroupId ? mapped.filter((s) => s.group === controlledGroupId) : mapped);
    };
    loadStudents();
  }, [controlledGroupId]);

  useEffect(() => {
    if (!selectedStudentId) {
      setActivityData({});
      setMaxCount(1);
      setTotalActivity(0);
      setStreak(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Read from localStorage (same pattern as AnalyticsExportPanel)
    const key = `security-trainer-progress-${selectedStudentId}`;
    const raw = localStorage.getItem(key);

    const data: Record<string, number> = {};
    let max = 1;
    let total = 0;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const allTimestamps = [
          ...Object.values(parsed.moduleTimestamps || {}),
          ...Object.values(parsed.quizTimestamps || {}),
          ...Object.values(parsed.loginTimestamps || {}),
        ].filter(Boolean) as string[];

        // Count activities per day (last 90 days)
        const now = new Date();
        for (let i = 0; i < 90; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateKey = date.toISOString().split('T')[0];
          data[dateKey] = 0;
        }

        for (const ts of allTimestamps) {
          const date = new Date(ts as string);
          const dateKey = date.toISOString().split('T')[0];
          if (data[dateKey] !== undefined) {
            data[dateKey]++;
            total++;
          }
        }

        max = Math.max(1, ...Object.values(data));
      } catch {
        // ignore
      }
    }

    // Calculate streak
    let currentStreak = 0;
    const now = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      if ((data[dateKey] || 0) > 0) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    setActivityData(data);
    setMaxCount(max);
    setTotalActivity(total);
    setStreak(currentStreak);
    setLoading(false);
  }, [selectedStudentId]);

  // Generate 90-day grid (13 weeks x 7 days)
  const weeks: Array<Array<{ date: string; dayOfWeek: number; count: number }>> = [];
  const now = new Date();

  // Start from 90 days ago
  const startDate = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);
  // Adjust to Monday
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));

  for (let week = 0; week < 13; week++) {
    const weekData: Array<{ date: string; dayOfWeek: number; count: number }> = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      weekData.push({
        date: dateKey,
        dayOfWeek: day,
        count: activityData[dateKey] || 0,
      });
    }
    weeks.push(weekData);
  }

  return (
    <div className="space-y-6">
      {/* Student selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-card min-w-[250px]"
        >
          <option value="">Выберите студента...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName} ({s.group || 'без группы'})</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-sm text-muted-foreground ml-3">Загрузка данных...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-16">
          <AlertTriangle size={32} className="text-red-500" />
          <p className="text-sm text-muted-foreground font-medium ml-3">{error}</p>
        </div>
      )}

      {!loading && !error && selectedStudentId && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={<Calendar size={18} />} value={totalActivity} label="Всего действий" iconBg="bg-indigo-100" iconColor="text-indigo-600" />
            <KPICard icon={<TrendingUp size={18} />} value={`${streak}д`} label="Текущая серия" iconBg="bg-emerald-100" iconColor="text-emerald-600" />
            <KPICard icon={<Users size={18} />} value={Object.values(activityData).filter((v) => v > 0).length} label="Активных дней" iconBg="bg-sky-100" iconColor="text-sky-600" />
            <KPICard icon={<Calendar size={18} />} value={maxCount} label="Макс. за день" iconBg="bg-amber-100" iconColor="text-amber-600" />
          </div>

          {/* Heatmap */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Активность за 90 дней</h3>

              {/* Day labels */}
              <div className="flex gap-1 mb-1 ml-8">
                {weeks[0]?.map((d, i) => (
                  <div key={i} className="w-4 text-[8px] text-muted-foreground text-center" />
                ))}
              </div>

              <div className="flex gap-1">
                {/* Row labels */}
                <div className="flex flex-col gap-1 mr-2">
                  {DAY_LABELS.map((label, i) => (
                    <div key={i} className="h-4 flex items-center text-[9px] text-muted-foreground w-6">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid - transposed (weeks as columns, days as rows) */}
                <div className="flex gap-1">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day, di) => (
                        <motion.div
                          key={`${wi}-${di}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (wi * 7 + di) * 0.003 }}
                          className="w-4 h-4 rounded-sm cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 transition-all"
                          style={{ backgroundColor: getIntensityColor(day.count, maxCount) }}
                          title={`${day.date}: ${day.count} действий`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-1 mt-4 text-xs text-muted-foreground">
                <span>Меньше</span>
                {ACTIVITY_COLORS.map((color, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                ))}
                <span>Больше</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Detail */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Детали активности (последние 7 дней)</h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
                  const dateKey = date.toISOString().split('T')[0];
                  const count = activityData[dateKey] || 0;
                  const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
                  const dayNum = date.getDate();
                  return (
                    <div key={dateKey} className={`p-3 rounded-lg border text-center ${count > 0 ? 'border-indigo-200 bg-indigo-50/50' : 'border-border'}`}>
                      <p className="text-xs text-muted-foreground">{dayName}</p>
                      <p className="text-lg font-bold">{dayNum}</p>
                      <p className={`text-sm font-semibold ${count > 0 ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedStudentId && !loading && (
        <div className="flex items-center justify-center py-16">
          <Calendar size={48} className="text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground ml-3">Выберите студента для просмотра календаря активности</p>
        </div>
      )}
    </div>
  );
}
