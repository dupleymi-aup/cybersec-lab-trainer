'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
} from 'recharts';
import { TrendingUp, Loader2, AlertTriangle, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { getPredictiveRisk, type PredictiveRiskData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from './KPICard';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

export default function PredictiveRiskDashboard({
  groupId: controlledGroupId,
  days: controlledDays,
}: { groupId?: string; days?: number } = {}) {
  const t = useTranslations('predictiveRisk');
  const [internalDays, setInternalDays] = useState(30);
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [data, setData] = useState<PredictiveRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPredictiveRisk(days, controlledGroupId)
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
  }, [days, controlledGroupId, t]);

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

  const { students, summary } = data;

  // Scatter plot data: risk score vs dropout probability
  const scatterData = students.map((s) => ({
    name: s.fullName,
    riskScore: s.riskScore,
    dropoutProbability: Math.round(s.dropoutProbability * 100),
    group: s.group,
  }));

  // Risk distribution
  const riskDistribution = [
    { name: t('highRisk'), value: summary.highRisk, color: '#ef4444' },
    { name: t('mediumRisk'), value: summary.mediumRisk, color: '#f59e0b' },
    { name: t('lowRisk'), value: summary.lowRisk, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      {controlledDays === undefined && (
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              onClick={() => setInternalDays(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${days === key ? 'bg-background text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPICard
          icon={<TrendingUp size={18} />}
          value={summary.totalStudents}
          label={t('totalStudents')}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<AlertTriangle size={18} />}
          value={summary.highRisk}
          label={t('highRisk')}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <KPICard
          icon={<AlertCircle size={18} />}
          value={summary.mediumRisk}
          label={t('mediumRisk')}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<CheckCircle size={18} />}
          value={summary.lowRisk}
          label={t('lowRisk')}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={<Target size={18} />}
          value={summary.avgRisk}
          label={t('avgRisk')}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
      </div>

      {/* Risk Distribution */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('riskDistribution')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Студенты" radius={[4, 4, 0, 0]}>
                {riskDistribution.map((entry, i) => (
                  <Bar key={i} dataKey="value" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dropout Probability Scatter Plot */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('dropoutVsRisk')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="riskScore"
                name={t('riskScore')}
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{
                  value: t('riskScore'),
                  position: 'insideBottom',
                  offset: -5,
                }}
              />
              <YAxis
                dataKey="dropoutProbability"
                name={t('dropoutProbability')}
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{
                  value: t('dropoutProbability'),
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v) => [`${v ?? 0}%`]} />
              <Legend />
              <Scatter name={t('students')} data={scatterData} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* High Risk Students Table */}
      {students.filter((s) => s.riskScore >= 70).length > 0 && (
        <Card className="border-border border-red-200">
          <CardContent className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-600">
              <AlertTriangle size={16} />
              {t('highRiskStudents', { count: students.filter((s) => s.riskScore >= 70).length })}
            </h3>
            <div className="space-y-4">
              {students
                .filter((s) => s.riskScore >= 70)
                .slice(0, 10)
                .map((student, i) => (
                  <motion.div
                    key={student.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-red-100 bg-red-50/30 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{student.fullName}</p>
                        <p className="text-muted-foreground text-xs">{student.group || t('noGroup')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{student.riskScore}</p>
                          <p className="text-muted-foreground text-xs">{t('risk')}</p>
                        </div>
                        <Badge variant="destructive">{Math.round(student.dropoutProbability * 100)}% {t('dropout')}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {student.recommendedInterventions.slice(0, 3).map((rec, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">
                          {rec}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Students Risk Table */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('allStudents')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('name')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('group')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('risk')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('dropout')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">{t('dropoutWeek')}</th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t('recommendations')}</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 20).map((student, i) => (
                  <motion.tr
                    key={student.userId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`hover:bg-secondary border-b border-slate-100 transition-colors ${student.riskScore >= 70 ? 'bg-red-50/30' : student.riskScore >= 40 ? 'bg-amber-50/30' : ''}`}
                  >
                    <td className="px-3 py-2.5 font-medium">{student.fullName}</td>
                    <td className="px-3 py-2.5 text-xs">{student.group || '-'}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`font-bold ${student.riskScore >= 70 ? 'text-red-600' : student.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}
                      >
                        {student.riskScore}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">{Math.round(student.dropoutProbability * 100)}%</td>
                    <td className="px-3 py-2.5 text-right">
                      {student.predictedDropoutWeek ? `${student.predictedDropoutWeek} нед.` : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {student.recommendedInterventions.slice(0, 2).map((rec, j) => (
                          <Badge key={j} variant="outline" className="text-[10px]">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
