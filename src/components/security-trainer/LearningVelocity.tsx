'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
} from 'recharts';
import { Loader2, AlertTriangle, TrendingUp, Zap, Users, Clock } from 'lucide-react';
import { getLearningVelocity, type LearningVelocityData } from '@/lib/auth-store';
import { useAnalyticsFetcher } from '@/hooks/use-analytics-fetch';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface LearningVelocityProps {
  groupId?: string;
  days?: number;
}

export default function LearningVelocity({ groupId: propGroupId, days: propDays }: LearningVelocityProps = {}) {
  const t = useTranslations('learningVelocity');
  const [internalDays, setInternalDays] = useState(90);
  const [internalGroupId] = useState('');

  const days = propDays ?? internalDays;

  const { data, loading, error } = useAnalyticsFetcher<LearningVelocityData>(
    () => getLearningVelocity(days, propGroupId || internalGroupId || undefined),
    [days, propGroupId, internalGroupId],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">{t('loading')}</p>
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

  const { studentVelocities, velocityDistribution, avgVelocityByGroup, velocityOverTime } = data;

  const avgVelocity =
    studentVelocities.length > 0
      ? Math.round(studentVelocities.reduce((sum, v) => sum + v.velocityScore, 0) / studentVelocities.length)
      : 0;
  const avgDays =
    studentVelocities.length > 0
      ? Math.round(
          (studentVelocities.reduce((sum, v) => sum + v.avgDaysPerModule, 0) / studentVelocities.length) * 10,
        ) / 10
      : 0;
  const avgImprovement =
    studentVelocities.length > 0
      ? Math.round(
          (studentVelocities.reduce((sum, v) => sum + v.scoreImprovement, 0) / studentVelocities.length) * 10,
        ) / 10
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-amber-600" />
          <h2 className="text-lg font-bold">{t('title')}</h2>
        </div>
        {propDays === undefined && (
          <select
            value={internalDays}
            onChange={(e) => setInternalDays(Number(e.target.value))}
            className="border-border bg-card rounded-md border px-3 py-1.5 text-sm"
          >
            <option value={30}>{t('days30')}</option>
            <option value={90}>{t('days90')}</option>
            <option value={180}>{t('days180')}</option>
          </select>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Users size={18} className="mx-auto mb-1 text-indigo-600" />
            <p className="text-2xl font-bold text-indigo-600">{studentVelocities.length}</p>
            <p className="text-muted-foreground text-xs">{t('studentsWithData')}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Clock size={18} className="mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">{avgDays}</p>
            <p className="text-muted-foreground text-xs">{t('avgDaysPerModule')}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp size={18} className="mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold text-emerald-600">
              {avgImprovement > 0 ? '+' : ''}
              {avgImprovement}
            </p>
            <p className="text-muted-foreground text-xs">{t('avgScoreImprovement')}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Zap size={18} className="mx-auto mb-1 text-violet-600" />
            <p className="text-2xl font-bold text-violet-600">{avgVelocity}</p>
            <p className="text-muted-foreground text-xs">{t('avgVelocityIndex')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scatter: velocity vs score improvement */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('velocityVsImprovement')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="avgDaysPerModule"
                  name={t('daysPerModule')}
                  type="number"
                  tick={{ fontSize: 10 }}
                  label={{
                    value: t('daysPerModule'),
                    position: 'insideBottom',
                    offset: -5,
                    fontSize: 11,
                  }}
                />
                <YAxis
                  dataKey="scoreImprovement"
                  name={t('scoreImprovement')}
                  type="number"
                  tick={{ fontSize: 10 }}
                  label={{
                    value: t('scoreImprovement'),
                    angle: -90,
                    position: 'insideLeft',
                    offset: 5,
                    fontSize: 11,
                  }}
                />
                <ZAxis dataKey="velocityScore" range={[30, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [`${value}`, name ?? '']} />
                <Scatter
                  name={t('students')}
                  data={studentVelocities.map((v) => ({
                    ...v,
                    name: v.fullName,
                  }))}
                  fill="#6366f1"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Velocity distribution */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('velocityDistribution')}</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name={t('students')} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Velocity over time */}
      {velocityOverTime.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('velocityOverTime')}</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgDaysPerModule"
                    name={t('daysPerModule')}
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgScoreImprovement"
                    name={t('scoreImprovement')}
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By group */}
      {avgVelocityByGroup.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('velocityByGroup')}</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgVelocityByGroup}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="group" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgDaysPerModule" name={t('daysPerModule')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="avgScoreImprovement"
                    name={t('scoreImprovement')}
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top students ranking */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">{t('velocityRating')}</h3>
          <div className="space-y-2">
            {studentVelocities.slice(0, 15).map((v, i) => (
              <div key={v.userId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'text-muted-foreground bg-slate-200' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium">{v.fullName}</span>
                  {v.group && (
                    <Badge variant="secondary" className="text-[10px]">
                      {v.group}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">
                    {v.avgDaysPerModule} {t('daysModuleShort')}
                  </span>
                  <span className={v.scoreImprovement > 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {v.scoreImprovement > 0 ? '+' : ''}
                    {v.scoreImprovement}
                  </span>
                  <Badge className="bg-violet-100 text-[10px] text-violet-700">{v.velocityScore}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
