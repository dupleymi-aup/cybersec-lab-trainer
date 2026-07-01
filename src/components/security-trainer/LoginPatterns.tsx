'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  Loader2, AlertTriangle, LogIn, Users, AlertCircle, Clock,
} from 'lucide-react';
import { getLoginPatterns, type LoginPatternsData } from '@/lib/auth-store';
import { useDateFormatter } from '@/lib/format';
import { useAnalyticsFetcher } from '@/hooks/use-analytics-fetch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface LoginPatternsProps {
  groupId?: string;
  days?: number;
}

export default function LoginPatterns({ groupId: propGroupId, days: propDays }: LoginPatternsProps = {}) {
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
        <p className="text-sm text-muted-foreground ml-3">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-muted-foreground font-medium ml-3">{error || 'Нет данных'}</p>
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
          <h2 className="text-lg font-bold">Паттерны входа</h2>
        </div>
        {propDays === undefined && (
          <select
            value={internalDays}
            onChange={(e) => setInternalDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-border rounded-md text-sm bg-card"
          >
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <LogIn size={18} className="mx-auto mb-1 text-sky-600" />
            <p className="text-2xl font-bold text-sky-600">{totalLogins}</p>
            <p className="text-xs text-muted-foreground">Входов</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Users size={18} className="mx-auto mb-1 text-indigo-600" />
            <p className="text-2xl font-bold text-indigo-600">{loginFrequency.length}</p>
            <p className="text-xs text-muted-foreground">Студентов</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <AlertCircle size={18} className="mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">{failedLogins.length}</p>
            <p className="text-xs text-muted-foreground">С ошибками входа</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Clock size={18} className="mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{dormantAccounts.length}</p>
            <p className="text-xs text-muted-foreground">Спящих аккаунтов</p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly distribution */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Распределение входов по часам</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="loginCount" name="Входов" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily distribution */}
      {dailyDistribution.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Входы по дням</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="loginCount" name="Входов" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed logins */}
      {failedLogins.length > 0 && (
        <Card className="border-l-4 border-l-amber-400 border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-amber-600">
              <AlertCircle size={16} /> Частые ошибки входа ({failedLogins.length} студентов)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">Студент</th>
                    <th className="p-2 font-medium text-muted-foreground text-center">Ошибок</th>
                    <th className="p-2 font-medium text-muted-foreground text-center">Последние попытки</th>
                  </tr>
                </thead>
                <tbody>
                  {failedLogins.slice(0, 15).map((f) => (
                    <tr key={f.userId} className="border-b border-slate-100 hover:bg-secondary">
                      <td className="p-2 font-medium">{f.fullName}</td>
                      <td className="p-2 text-center">
                        <Badge variant="destructive" className="text-[10px]">{f.count}</Badge>
                      </td>
                      <td className="p-2 text-center text-muted-foreground">
                        {f.recentAttempts.map((a, i) => (
                          <span key={i} className="mr-2">{formatDate(a.timestamp)} ({a.ip})</span>
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
        <Card className="border-l-4 border-l-red-400 border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-red-600">
              <Clock size={16} /> Спящие аккаунты ({dormantAccounts.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">Студент</th>
                    <th className="p-2 font-medium text-muted-foreground">Группа</th>
                    <th className="p-2 font-medium text-muted-foreground text-center">Последний вход</th>
                    <th className="p-2 font-medium text-muted-foreground text-center">Дней неактивен</th>
                  </tr>
                </thead>
                <tbody>
                  {dormantAccounts.slice(0, 20).map((d) => (
                    <tr key={d.userId} className="border-b border-slate-100 hover:bg-secondary">
                      <td className="p-2 font-medium">{d.fullName}</td>
                      <td className="p-2 text-muted-foreground">{d.group || '—'}</td>
                      <td className="p-2 text-center text-muted-foreground">{formatDate(d.lastLogin)}</td>
                      <td className="p-2 text-center">
                        <Badge variant="destructive" className="text-[10px]">{d.daysInactive} дн.</Badge>
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
