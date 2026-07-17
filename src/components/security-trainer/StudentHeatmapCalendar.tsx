'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getAllUsers, type User } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import KPICard from './KPICard';
import { logger } from '@/lib/logger';

const ACTIVITY_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

function getIntensityColor(count: number, maxCount: number): string {
  if (count === 0) return ACTIVITY_COLORS[0];
  const intensity = Math.ceil((count / Math.max(maxCount, 1)) * 4);
  return ACTIVITY_COLORS[Math.min(intensity, 4)];
}

export default function StudentHeatmapCalendar({ groupId: controlledGroupId }: { groupId?: string } = {}) {
  const t = useTranslations('studentHeatmap');
  const locale = useLocale();
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
      try {
        const allUsers = await getAllUsers();
        const studentUsers = allUsers.filter((u: User) => u.role === 'student');
        const mapped = studentUsers.map((u: User) => ({
          id: u.id,
          fullName: u.fullName,
          group: u.group,
        }));
        setStudents(controlledGroupId ? mapped.filter((s) => s.group === controlledGroupId) : mapped);
      } catch {
        // Failed to load students
      }
    };
    loadStudents().catch((err) => {
      logger.error('Failed to load students', { error: err });
      setLoading(false);
    });
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
      } catch (e) {
        if (process.env.NODE_ENV === 'development')
          logger.warn('StudentHeatmapCalendar loadStudents failed', { error: e });
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

  const DAY_LABELS = [t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')];

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
          className="border-border bg-card min-w-[250px] rounded-md border px-3 py-2 text-sm"
        >
          <option value="">{t('selectStudent')}</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.group || t('noGroup')})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-muted-foreground ml-3 text-sm">{t('loadingData')}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-16">
          <AlertTriangle size={32} className="text-red-500" />
          <p className="text-muted-foreground ml-3 text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && selectedStudentId && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard
              icon={<Calendar size={18} />}
              value={totalActivity}
              label={t('totalActions')}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
            />
            <KPICard
              icon={<TrendingUp size={18} />}
              value={`${streak}${t('streakUnit')}`}
              label={t('currentStreak')}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <KPICard
              icon={<Users size={18} />}
              value={Object.values(activityData).filter((v) => v > 0).length}
              label={t('activeDays')}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
            />
            <KPICard
              icon={<Calendar size={18} />}
              value={maxCount}
              label={t('maxPerDay')}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
          </div>

          {/* Heatmap */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold">{t('activity90Days')}</h3>

              {/* Day labels */}
              <div className="mb-1 ml-8 flex gap-1">
                {weeks[0]?.map((d, i) => (
                  <div key={i} className="text-muted-foreground w-4 text-center text-[8px]" />
                ))}
              </div>

              <div className="flex gap-1">
                {/* Row labels */}
                <div className="mr-2 flex flex-col gap-1">
                  {DAY_LABELS.map((label, i) => (
                    <div key={i} className="text-muted-foreground flex h-4 w-6 items-center text-[9px]">
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
                          className="h-4 w-4 cursor-pointer rounded-sm transition-all hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1"
                          style={{
                            backgroundColor: getIntensityColor(day.count, maxCount),
                          }}
                          title={t('tooltip', { date: day.date, count: day.count })}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="text-muted-foreground mt-4 flex items-center justify-end gap-1 text-xs">
                <span>{t('less')}</span>
                {ACTIVITY_COLORS.map((color, i) => (
                  <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                ))}
                <span>{t('more')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Detail */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold">{t('activityDetails')}</h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
                  const dateKey = date.toISOString().split('T')[0];
                  const count = activityData[dateKey] || 0;
                  const dayName = date.toLocaleDateString(locale, {
                    weekday: 'short',
                  });
                  const dayNum = date.getDate();
                  return (
                    <div
                      key={dateKey}
                      className={`rounded-lg border p-3 text-center ${count > 0 ? 'border-indigo-200 bg-indigo-50/50' : 'border-border'}`}
                    >
                      <p className="text-muted-foreground text-xs">{dayName}</p>
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
          <p className="text-muted-foreground ml-3 text-sm">{t('emptyState')}</p>
        </div>
      )}
    </div>
  );
}
