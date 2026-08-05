'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Loader2, AlertTriangle, Flame, Clock } from 'lucide-react';
import { getEngagementAnalytics, getAllUsers, type EngagementData, type User as UserType } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from './KPICard';
import PeriodSelector from './PeriodSelector';
import { logger } from '@/lib/logger';

const DAY_NAME_KEYS = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'] as const;

export interface EngagementAnalyticsProps {
  groupId?: string;
  days?: number;
}

export default function EngagementAnalytics({ groupId: propGroupId, days: propDays }: EngagementAnalyticsProps = {}) {
  const t = useTranslations('engagementAnalytics');
  const tc = useTranslations('common');
  const [data, setData] = useState<EngagementData | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);
  const [internalGroupId, setInternalGroupId] = useState('');

  const days = propDays ?? internalDays;
  const showPeriodSelector = propDays === undefined;
  const showGroupSelector = propGroupId === undefined;

  useEffect(() => {
    let cancelled = false;
    getAllUsers()
      .then((users) => {
        if (!cancelled) setAllUsers(users);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development')
          logger.error('EngagementAnalytics failed to load users', { error: err });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEngagementAnalytics(days, propGroupId || internalGroupId || undefined)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || t('loadingError'));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, propGroupId, internalGroupId, t]);

  const groups = Array.from(new Set(allUsers.filter((u) => u.group).map((u) => u.group)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">{t('loadingData')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-muted-foreground ml-3 text-sm font-medium">{error || t('noData')}</p>
      </div>
    );
  }

  const { scoreDistribution, hourlyActivity, weeklyPattern, streakLeaderboard, engagementTrend } = data;

  const totalStudents = scoreDistribution.reduce((sum, d) => sum + d.count, 0);
  const avgStreak =
    streakLeaderboard.length > 0
      ? Math.round(streakLeaderboard.reduce((sum, s) => sum + s.streakDays, 0) / streakLeaderboard.length)
      : 0;
  const peakHour =
    hourlyActivity.length > 0
      ? hourlyActivity.reduce((max, h) => (h.count > max.count ? h : max), hourlyActivity[0])
      : { hour: 0, count: 0 };
  const peakDay =
    weeklyPattern.length > 0
      ? weeklyPattern.reduce((max, d) => (d.avgActivities > max.avgActivities ? d : max), weeklyPattern[0])
      : { day: 0, avgActivities: 0 };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {showPeriodSelector && (
          <PeriodSelector value={days} onChange={setInternalDays} getLabel={(d) => tc(`days${d}`)} />
        )}

        {showGroupSelector && (
          <select
            value={internalGroupId}
            onChange={(e) => setInternalGroupId(e.target.value)}
            className="border-border bg-card rounded-md border px-3 py-2 text-sm"
          >
            <option value="">{t('allGroups')}</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          icon={<Users size={18} />}
          value={totalStudents}
          label={t('totalStudents')}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<Flame size={18} />}
          value={`${avgStreak}d`}
          label={t('avgStreak')}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<Clock size={18} />}
          value={`${peakHour.hour}:00`}
          label={t('peakHour')}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
        <KPICard
          icon={<TrendingUp size={18} />}
          value={tc(DAY_NAME_KEYS[peakDay.day])}
          label={t('peakDay')}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Score Distribution */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('engagementDistribution')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly Activity */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('hourlyActivity')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Pattern */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('weeklyPattern')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyPattern}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(d) => tc(DAY_NAME_KEYS[d])} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgActivities" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement Trend */}
      {engagementTrend.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('engagementTrend')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Streak Leaderboard */}
      {streakLeaderboard.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">
              <Flame size={16} className="mr-2 inline text-amber-500" />
              {t('topStreaks')}
            </h3>
            <div className="space-y-2">
              {streakLeaderboard.map((student, i) => (
                <motion.div
                  key={student.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-secondary flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        i === 0
                          ? 'bg-amber-100 text-amber-700'
                          : i === 1
                            ? 'bg-muted text-foreground/70'
                            : i === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{student.fullName}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-amber-500">
                    <Flame size={14} className="mr-1" />
                    {student.streakDays}d
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
