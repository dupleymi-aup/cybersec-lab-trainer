'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, AlertTriangle, BookOpen, BarChart3 } from 'lucide-react';
import { getModuleDeepDive, type ModuleDeepDiveData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ModuleDeepDiveProps {
  groupId?: string;
  days?: number;
}

export default function ModuleDeepDive({ groupId: propGroupId, days: propDays }: ModuleDeepDiveProps = {}) {
  const t = useTranslations('moduleDeepDive');
  const [data, setData] = useState<ModuleDeepDiveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);
  const [internalGroupId] = useState('');

  const days = propDays ?? internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getModuleDeepDive(days, propGroupId || internalGroupId || undefined)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || t('loading'));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, propGroupId, internalGroupId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">{t('loading')}</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-muted-foreground ml-3 text-sm font-medium">{error || t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-indigo-600" />
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

      <Tabs defaultValue={data[0]?.moduleId}>
        <TabsList className="flex w-fit flex-wrap">
          {data.map((m) => (
            <TabsTrigger key={m.moduleId} value={m.moduleId} className="text-xs">
              {m.moduleName}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.map((m) => (
          <TabsContent key={m.moduleId} value={m.moduleId} className="mt-4 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{m.totalStudents}</p>
                  <p className="text-muted-foreground text-xs">{t('students')}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{m.completionRate}%</p>
                  <p className="text-muted-foreground text-xs">{t('completion')}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{m.avgScore}%</p>
                  <p className="text-muted-foreground text-xs">{t('avgScore')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Level progress */}
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 size={16} /> {t('levelProgress')}
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={m.levels.map((l) => ({
                        level: t('level', { n: l.level }),
                        started: l.started,
                        completed: l.completed,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="level" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="started" name={t('started')} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name={t('completed')} fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Level detail bars */}
            <div className="space-y-2">
              {m.levels.map((l) => (
                <div key={l.level} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-medium">{t('level', { n: l.level })}</span>
                  <div className="bg-muted relative h-4 flex-1 overflow-hidden rounded-full">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${l.completionRate}%` }} />
                    <span className="text-foreground/70 absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                      {l.completed} / {l.started} ({l.completionRate}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Challenge scores */}
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold">{t('challengeScores')}</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m.challengeScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" name={t('students')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* OWASP studied items */}
            {m.studiedItemsCoverage && m.studiedItemsCoverage.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="mb-3 text-sm font-semibold">{t('owaspCoverage')}</h3>
                  <div className="space-y-2">
                    {m.studiedItemsCoverage.map((item) => (
                      <div key={item.item} className="flex items-center gap-3 text-xs">
                        <span className="w-40 truncate">{item.item}</span>
                        <div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${item.studiedRate}%` }}
                          />
                        </div>
                        <span className="w-12 text-right">{item.studiedRate}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Secure coding distribution */}
            {m.secureCodingDistribution && (
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-sm font-semibold">{t('secureCoding')}</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={m.secureCodingDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="correctRange" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" name={t('students')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
