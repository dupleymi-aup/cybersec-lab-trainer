'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { ShieldCheck, AlertCircle, AlertTriangle, Info, RefreshCw, ChevronDown, ChevronRight, Loader2, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDataQuality } from '@/lib/analytics-api';
import type { DataQualityData, DataQualityIssue } from '@/lib/auth-types';
import { useNotificationStore } from '@/lib/notification-store';
import { toast } from 'sonner';

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

const SEVERITY_ICONS = { critical: AlertCircle, warning: AlertTriangle, info: Info };
const HEALTH_COLORS = { good: '#10b981', warning: '#f59e0b', poor: '#ef4444' };

export default function DataQualityMonitor({ groupId, days }: { groupId?: string; days?: number }) {
  const t = useTranslations('dataQuality');
  const [data, setData] = useState<DataQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const { addNotification } = useNotificationStore();

  const loadData = useCallback(() => {
    setLoading(true);
    getDataQuality(days || 30, groupId).then((d) => { setData(d); setLoading(false); }).catch(() => { setLoading(false); });
  }, [days, groupId]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleIssue = (type: string) => {
    const next = new Set(expandedIssues);
    if (next.has(type)) next.delete(type); else next.add(type);
    setExpandedIssues(next);
  };

  const handleSendReminders = (issue: DataQualityIssue) => {
    if (!issue.affectedStudents?.length) return;
    issue.affectedStudents.forEach((s) => {
      addNotification({ type: 'warning', title: t('sendReminders'), message: t('reminderSent', { name: s.fullName }) });
    });
    toast.success(t('remindersSent', { count: issue.affectedStudents.length }));
  };

  const getHealthColor = (score: number) => score >= 80 ? HEALTH_COLORS.good : score >= 50 ? HEALTH_COLORS.warning : HEALTH_COLORS.poor;
  const getHealthLabel = (score: number) => score >= 80 ? t('healthExcellent') : score >= 50 ? t('healthWarning') : t('healthCritical');

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">{t('loading')}</p>
      </div>
    );
  }

  if (!data) return null;
  const healthColor = getHealthColor(data.healthScore);
  const healthLabel = getHealthLabel(data.healthScore);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-indigo-600" />
          <div>
            <h3 className="text-sm font-semibold">{t('title')}</h3>
            <p className="text-muted-foreground text-xs">{data.summary.totalStudents} {t('studentsLabel')}, {data.summary.totalModules} {t('modulesLabel')}</p>
          </div>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />{t('refresh')}
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-6">
            <div className="relative h-32 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={[{ value: data.healthScore, fill: healthColor }]}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#e2e8f0' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: healthColor }}>{data.healthScore}</span>
                <span className="text-muted-foreground text-xs">/ 100</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: healthColor }}>{healthLabel}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">{t('active')}</span><span className="ml-1 font-medium">{data.summary.activeStudents}/{data.summary.totalStudents}</span></div>
                <div><span className="text-muted-foreground">{t('modulesCompleted')}</span><span className="ml-1 font-medium">{data.summary.completedModules}/{data.summary.totalModules}</span></div>
                <div><span className="text-muted-foreground">{t('totalQuizzes')}</span><span className="ml-1 font-medium">{data.summary.totalQuizzes}</span></div>
                <div><span className="text-muted-foreground">{t('issuesFound')}</span><span className="ml-1 font-medium">{data.issues.length}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.issues.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <ShieldCheck size={40} className="mx-auto mb-3 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600">{t('noIssues')}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('allDataOk')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.issues.map((issue, i) => {
            const Icon = SEVERITY_ICONS[issue.severity];
            const colorClass = SEVERITY_COLORS[issue.severity];
            const isExpanded = expandedIssues.has(issue.type);
            return (
              <motion.div key={issue.type} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`border-border transition-colors hover:border-indigo-200 ${colorClass}`}>
                  <CardContent className="p-4">
                    <div className="flex cursor-pointer items-center justify-between" onClick={() => toggleIssue(issue.type)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleIssue(issue.type); } }}>
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <div>
                          <p className="text-sm font-semibold">{issue.title}</p>
                          <p className="text-xs opacity-75">{issue.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${colorClass}`}>{issue.count}</Badge>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 border-t border-current/20 pt-3">
                        {issue.affectedStudents && issue.affectedStudents.length > 0 && (
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-medium">{t('affectedStudents')}</p>
                              <Button onClick={(e) => { e.stopPropagation(); handleSendReminders(issue); }} variant="outline" size="sm" className="h-6 text-xs">
                                <Mail size={12} className="mr-1" />{t('sendReminders')}
                              </Button>
                            </div>
                            <div className="max-h-40 space-y-1 overflow-y-auto">
                              {issue.affectedStudents.map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-1 text-xs">
                                  <span>{s.fullName}</span>
                                  {s.group && <span className="text-muted-foreground">{s.group}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {issue.affectedModules && issue.affectedModules.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium">{t('modulesWithoutCompletion')}</p>
                            <div className="flex flex-wrap gap-1">
                              {issue.affectedModules.map((m) => <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>)}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
