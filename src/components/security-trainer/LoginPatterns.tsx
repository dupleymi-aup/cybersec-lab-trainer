'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, AlertTriangle, LogIn, Users, AlertCircle, Clock } from 'lucide-react';
import { getLoginPatterns, type LoginPatternsData } from '@/lib/auth-store';
import { useDateFormatter } from '@/lib/format';
import { useAnalyticsFetcher } from '@/hooks/use-analytics-fetch';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface LoginPatternsProps {
  groupId?: string;
  days?: number;
}

export default function LoginPatterns({ groupId: propGroupId, days: propDays }: LoginPatternsProps = {}) {
  const t = useTranslations('loginPatterns');
  const formatDate = useDateFormatter();
  const [internalDays, setInternalDays] = useState(30);
  const [internalGroupId] = useState('');

  const days = propDays ?? internalDays;

  const { data, loading, error } = useAnalyticsFetcher<LoginPatternsData>(
    () => getLoginPatterns(days, propGroupId || internalGroupId || undefined),
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

  const { loginFrequency, failedLogins, dormantAccounts, hourlyDistribution, dailyDistribution } = data;

  const totalLogins = loginFrequency.reduce((sum, l) => sum + l.loginCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogIn size={20} className="text-sky-600" />
          <h2 className="text-lg font-bold">{t('title')}</h2>
        </div>
        {propDays === undefined && (
          <select
            value={internalDays}
            onChange={(e) => setInternalDays(Number(e.target.value))}
            className="border-border bg-card rounded-md border px-3 py-1.5 text-sm"
          >
            <option value={7}>{t('days7')}</option>
            <option value={30}>{t('days30')}</option>
            <option value={90}>{t('days90')}</option>
          </select>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <LogIn size={18} className="mx-auto mb-1 text-sky-600" />
            <p className="text-2xl font-bold text-sky-600">{totalLogins}</p>
            <p className="text-muted-foreground text-xs">{t('totalLogins')}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Users size={18} className="mx-auto mb-1 text-indigo-600" />
            <p className="text-2xl font-bold text-indigo-600">{loginFrequency.length}</p>
            <p className="text-muted-foreground text-xs">{t('studentsCount')}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <AlertCircle size={18} className="mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">{failedLogins.length}</p>
            <p className="text-muted-foreground text-xs">{t('loginErrors')}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Clock size={18} className="mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{dormantAccounts.length}</p>
            <p className="text-muted-foreground text-xs">{t('dormantAccounts')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly distribution */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('hourlyDistribution')}</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="loginCount" name={t('totalLogins')} fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily distribution */}
      {dailyDistribution.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t('dailyDistribution')}</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="loginCount"
                    name={t('totalLogins')}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed logins */}
      {failedLogins.length > 0 && (
        <Card className="border-border border-l-4 border-l-amber-400">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600">
              <AlertCircle size={16} /> {t('frequentErrors')} ({failedLogins.length} {t('studentsCount')})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary border-border border-b">
                  <tr>
                    <th className="text-muted-foreground p-2 text-left font-medium">{t('student')}</th>
                    <th className="text-muted-foreground p-2 text-center font-medium">{t('errors')}</th>
                    <th className="text-muted-foreground p-2 text-center font-medium">{t('lastAttempts')}</th>
                  </tr>
                </thead>
                <tbody>
                  {failedLogins.slice(0, 15).map((f) => (
                    <tr key={f.userId} className="hover:bg-secondary border-b border-slate-100">
                      <td className="p-2 font-medium">{f.fullName}</td>
                      <td className="p-2 text-center">
                        <Badge variant="destructive" className="text-[10px]">
                          {f.count}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground p-2 text-center">
                        {f.recentAttempts.map((a, i) => (
                          <span key={i} className="mr-2">
                            {formatDate(a.timestamp)} ({a.ip})
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dormant accounts */}
      {dormantAccounts.length > 0 && (
        <Card className="border-border border-l-4 border-l-red-400">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600">
              <Clock size={16} /> {t('dormantTitle')} ({dormantAccounts.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary border-border border-b">
                  <tr>
                    <th className="text-muted-foreground p-2 text-left font-medium">{t('student')}</th>
                    <th className="text-muted-foreground p-2 font-medium">{t('group')}</th>
                    <th className="text-muted-foreground p-2 text-center font-medium">{t('lastLogin')}</th>
                    <th className="text-muted-foreground p-2 text-center font-medium">{t('daysInactive')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dormantAccounts.slice(0, 20).map((d) => (
                    <tr key={d.userId} className="hover:bg-secondary border-b border-slate-100">
                      <td className="p-2 font-medium">{d.fullName}</td>
                      <td className="text-muted-foreground p-2">{d.group || '—'}</td>
                      <td className="text-muted-foreground p-2 text-center">{formatDate(d.lastLogin)}</td>
                      <td className="p-2 text-center">
                        <Badge variant="destructive" className="text-[10px]">
                          {d.daysInactive} {t('daysShort')}
                        </Badge>
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
