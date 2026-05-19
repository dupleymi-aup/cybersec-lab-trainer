'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import {
  Loader2, AlertTriangle, Award, CheckCircle, XCircle, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getCertificationReadiness, type CertificationReadinessData, type CertificationStudentData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CertificationReadinessProps {
  groupId?: string;
  days?: number;
}

const TIER_CONFIG = {
  ready: { label: 'Готов', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  almost: { label: 'Почти готов', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: TrendingUp },
  'needs-work': { label: 'Нужна работа', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  'not-ready': { label: 'Не готов', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

const RADAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6'];

export default function CertificationReadiness({ groupId: propGroupId, days: propDays }: CertificationReadinessProps = {}) {
  const [data, setData] = useState<CertificationReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);
  const [internalGroupId, setInternalGroupId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const days = propDays ?? internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCertificationReadiness(days, propGroupId || internalGroupId || undefined)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Ошибка загрузки'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [days, propGroupId, internalGroupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500 ml-3">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-slate-600 font-medium ml-3">{error || 'Нет данных'}</p>
      </div>
    );
  }

  const { summary, students } = data;

  const tierData = [
    { name: TIER_CONFIG.ready.label, value: summary.ready, color: '#10b981' },
    { name: TIER_CONFIG.almost.label, value: summary.almost, color: '#3b82f6' },
    { name: TIER_CONFIG['needs-work'].label, value: summary.needsWork, color: '#f59e0b' },
    { name: TIER_CONFIG['not-ready'].label, value: summary.notReady, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold">Готовность к сертификации</h2>
        </div>
        {propDays === undefined && (
          <select
            value={internalDays}
            onChange={(e) => setInternalDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white"
          >
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{summary.avgReadinessScore}</p>
            <p className="text-xs text-slate-500">Ср. балл готовности</p>
          </CardContent>
        </Card>
        {Object.entries(TIER_CONFIG).map(([key, config]) => {
          const count = summary[key as keyof typeof summary] as number;
          const Icon = config.icon;
          return (
            <Card key={key} className="border-slate-200">
              <CardContent className="p-4 text-center">
                <Icon size={20} className={`mx-auto mb-1 ${key === 'ready' ? 'text-emerald-600' : key === 'almost' ? 'text-blue-600' : key === 'needs-work' ? 'text-amber-600' : 'text-red-600'}`} />
                <p className={`text-2xl font-bold ${key === 'ready' ? 'text-emerald-600' : key === 'almost' ? 'text-blue-600' : key === 'needs-work' ? 'text-amber-600' : 'text-red-600'}`}>{count}</p>
                <p className="text-xs text-slate-500">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribution pie */}
      {tierData.length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Распределение по уровням готовности</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 10 }}>
                    {tierData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-2 font-medium text-slate-600">Студент</th>
                  <th className="p-2 font-medium text-slate-600 text-center">Группа</th>
                  <th className="p-2 font-medium text-slate-600 text-center">Балл</th>
                  <th className="p-2 font-medium text-slate-600 text-center">Уровень</th>
                  <th className="p-2 font-medium text-slate-600 text-center">Модули</th>
                  <th className="p-2 font-medium text-slate-600 text-center">Достижения</th>
                  <th className="p-2 font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <motion.tr key={s.userId} className="border-b border-slate-100 hover:bg-slate-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="p-2 font-medium">{s.fullName}</td>
                    <td className="p-2 text-center text-slate-500">{s.group || '—'}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-slate-100 rounded-full h-2.5">
                          <div
                            className={`h-full rounded-full ${s.readinessScore >= 75 ? 'bg-emerald-500' : s.readinessScore >= 55 ? 'bg-blue-500' : s.readinessScore >= 35 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${s.readinessScore}%` }}
                          />
                        </div>
                        <span className="font-bold">{s.readinessScore}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge className={`text-[10px] ${TIER_CONFIG[s.readinessTier].color}`}>
                        {TIER_CONFIG[s.readinessTier].label}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">{s.modulesCompleted}/{s.totalModules}</td>
                    <td className="p-2 text-center">{s.achievements}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => setExpandedId(expandedId === s.userId ? null : s.userId)} className="text-slate-400 hover:text-slate-600">
                        {expandedId === s.userId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded detail */}
          {expandedId && (() => {
            const s = students.find((st) => st.userId === expandedId);
            if (!s) return null;
            return (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Radar chart */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Готовность по категориям</h4>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={s.categoryReadiness.map((c, i) => ({ name: c.category, score: c.score, fullMark: 100 }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                          <Radar name="Балл" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Strengths/Weaknesses/Recommendations */}
                  <div className="space-y-3">
                    {s.strengths.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-emerald-700 mb-1">Сильные стороны</h4>
                        <div className="flex flex-wrap gap-1">
                          {s.strengths.map((w, i) => <Badge key={i} className="bg-emerald-100 text-emerald-700 text-[10px]">{w}</Badge>)}
                        </div>
                      </div>
                    )}
                    {s.weaknesses.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-amber-700 mb-1">Зоны роста</h4>
                        <div className="flex flex-wrap gap-1">
                          {s.weaknesses.map((w, i) => <Badge key={i} className="bg-amber-100 text-amber-700 text-[10px]">{w}</Badge>)}
                        </div>
                      </div>
                    )}
                    {s.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-indigo-700 mb-1">Рекомендации</h4>
                        <ul className="space-y-1">
                          {s.recommendations.map((r, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                              <span className="text-indigo-500 mt-0.5">•</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
