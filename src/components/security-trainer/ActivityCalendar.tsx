'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Flame, CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ActivityCalendar() {
  const t = useTranslations('common.activityCalendar');
  const moduleTimestamps = useAppStore((s) => s.moduleTimestamps);
  const quizTimestamps = useAppStore((s) => s.quizTimestamps);

  const { dailyData, currentStreak, longestStreak, totalActiveDays } = useMemo(() => {
    const dayMap = new Map<string, { count: number; types: Set<string> }>();

    for (const ts of Object.values(moduleTimestamps)) {
      const day = new Date(ts).toISOString().slice(0, 10);
      const entry = dayMap.get(day) || { count: 0, types: new Set<string>() };
      entry.count++;
      entry.types.add('module');
      dayMap.set(day, entry);
    }
    for (const ts of Object.values(quizTimestamps)) {
      const day = new Date(ts).toISOString().slice(0, 10);
      const entry = dayMap.get(day) || { count: 0, types: new Set<string>() };
      entry.count++;
      entry.types.add('quiz');
      dayMap.set(day, entry);
    }

    // Current streak
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const checkDate = new Date(today);
    while (true) {
      const ds = checkDate.toISOString().slice(0, 10);
      if (dayMap.has(ds)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Allow yesterday gap
        if (streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          if (dayMap.has(checkDate.toISOString().slice(0, 10))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        } else break;
      }
    }

    // Longest streak
    let longest = 0;
    let cur = 0;
    const allSorted = [...dayMap.keys()].sort();
    for (let i = 0; i < allSorted.length; i++) {
      if (i === 0 || daysDiff(allSorted[i - 1], allSorted[i]) === 1) {
        cur++;
      } else {
        cur = 1;
      }
      longest = Math.max(longest, cur);
    }

    // Build last 30 days
    const days: Array<{
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
    }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const entry = dayMap.get(ds);
      const count = entry?.count || 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count > 0) level = count <= 2 ? 1 : count <= 4 ? 2 : count <= 8 ? 3 : 4;
      days.push({ date: ds, count, level });
    }

    return {
      dailyData: days,
      currentStreak: streak,
      longestStreak: longest,
      totalActiveDays: dayMap.size,
    };
  }, [moduleTimestamps, quizTimestamps]);

  if (totalActiveDays === 0) return null;

  const weekDays = [t('mon'), '', t('wed'), '', t('fri'), '', ''];
  const weeks: (typeof dailyData)[] = [];
  for (let i = 0; i < dailyData.length; i += 7) {
    weeks.push(dailyData.slice(i, i + 7));
  }

  const levelColors = ['bg-muted', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Streak indicators */}
      <div className="flex items-center gap-4 text-xs">
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-orange-500" />
            <span className="text-foreground/70 font-semibold">{currentStreak} {t('daysShort')}</span>
            <span className="text-slate-400">{t('currentStreak')}</span>
          </div>
        )}
        {longestStreak > 0 && (
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-violet-500" />
            <span className="text-foreground/70 font-semibold">{longestStreak} {t('daysShort')}</span>
            <span className="text-slate-400">{t('longestStreak')}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/70 font-semibold">{totalActiveDays}</span>
          <span className="text-slate-400">{t('activeDays')}</span>
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-0.5">
          {weekDays.map((d, i) => (
            <span key={i} className="h-[14px] text-[9px] leading-[14px] text-slate-400">
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week[di];
                if (!day) return <div key={di} className="h-[14px] w-[14px]" />;
                return (
                  <div
                    key={day.date}
                    className={`h-[14px] w-[14px] rounded-sm ${levelColors[day.level]} cursor-default`}
                    title={`${day.date}: ${day.count} ${t('actions')}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
        <span>{t('less')}</span>
        {levelColors.map((c, i) => (
          <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span>{t('more')}</span>
      </div>
    </motion.div>
  );
}

function daysDiff(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / 86400000);
}
