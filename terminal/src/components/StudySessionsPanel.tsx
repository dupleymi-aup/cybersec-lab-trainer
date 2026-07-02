'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Clock,
  TrendingUp,
  Calendar,
  Award,
  Flame,
  BarChart3,
} from 'lucide-react';

interface StudySession {
  id: string;
  date: string;
  durationMs: number;
  pageType: string;
  xpEarned: number;
  createdAt: string;
}

interface StudySessionsData {
  sessions: StudySession[];
  totalMinutes: number;
}

interface WeeklyStats {
  date: string;
  minutes: number;
  xp: number;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

interface HeatmapData {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function StudySessionsPanel() {
  const { user } = useAuthStore();
  const [todayData, setTodayData] = useState<StudySessionsData | null>(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };

      const [todayRes, totalRes, weeklyRes, streakRes, heatmapRes] = await Promise.all([
        fetch('/api/study-sessions?action=today', { headers }),
        fetch('/api/study-sessions?action=total', { headers }),
        fetch('/api/study-sessions?action=weekly&weeks=4', { headers }),
        fetch('/api/study-sessions?action=streak', { headers }),
        fetch('/api/study-sessions?action=heatmap&weeks=8', { headers }),
      ]);

      if (todayRes.ok) setTodayData(await todayRes.json());
      if (totalRes.ok) setTotalMinutes((await totalRes.json()).totalMinutes);
      if (weeklyRes.ok) setWeeklyStats((await weeklyRes.json()).weekly);
      if (streakRes.ok) setStreakInfo(await streakRes.json());
      if (heatmapRes.ok) setHeatmapData((await heatmapRes.json()).heatmap);
    } catch {
      toast.error('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  const xpEarnedToday = todayData?.sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0) || 0;
  const dailyXpLimit = 50; // Максимум XP в день
  const xpProgress = Math.min((xpEarnedToday / dailyXpLimit) * 100, 100);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Войдите, чтобы видеть статистику обучения
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Загрузка статистики...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Сегодня</p>
                <p className="text-lg font-bold">{todayData?.totalMinutes || 0} мин</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Всего</p>
                <p className="text-lg font-bold">{totalMinutes} мин</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Серия</p>
                <p className="text-lg font-bold">
                  {streakInfo?.currentStreak || 0} дн.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">XP сегодня</p>
                <p className="text-lg font-bold">{xpEarnedToday}/{dailyXpLimit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5" />
            Прогресс XP сегодня
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={xpProgress} className="mb-2" />
          <p className="text-xs text-muted-foreground">
            1 XP за каждые 5 минут изучения материала
          </p>
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      {weeklyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5" />
              Статистика за 4 недели
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyStats.slice(-4).map((week, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-muted-foreground">
                    {new Date(week.date).toLocaleDateString('ru-RU', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1">
                    <Progress
                      value={(week.minutes / 120) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="text-xs font-medium w-16 text-right">
                    {week.minutes} мин
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap */}
      {heatmapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5" />
              Активность обучения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {heatmapData.slice(-56).map((day, idx) => (
                <div
                  key={idx}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getHeatmapColor(day.level) } as React.CSSProperties}
                  data-tooltip={`${day.date}: ${day.minutes} мин`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Меньше</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: getHeatmapColor(level as 0 | 1 | 2 | 3 | 4) }}
                  />
                ))}
              </div>
              <span>Больше</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Longest Streak */}
      {streakInfo && streakInfo.longestStreak > 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Рекордная серия: <span className="font-bold text-orange-500">{streakInfo.longestStreak}</span> дней
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getHeatmapColor(level: 0 | 1 | 2 | 3 | 4): string {
  const colors = [
    '#e4e4e7', // gray-200 - no activity
    '#bbf7d0', // green-200 - low
    '#86efac', // green-300 - medium
    '#4ade80', // green-400 - high
    '#22c55e', // green-500 - very high
  ];
  return colors[level];
}
