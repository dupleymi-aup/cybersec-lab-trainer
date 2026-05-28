'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  AlertTriangle, Loader2, TrendingUp, TrendingDown, Minus, Users, Award,
  Download, FileText,
} from 'lucide-react';
import { getAtRiskStudents, type AtRiskStudent } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateAtRiskPDF, generateAtRiskCSV, downloadCSV } from '@/lib/export-utils';
import RiskScoreBar from './RiskScoreBar';
import KPICard from './KPICard';
import StudentDrillDown from './StudentDrillDown';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

const RISK_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'];

export default function AtRiskReport({ groupId: controlledGroupId, days: controlledDays }: { groupId?: string; days?: number } = {}) {
  const [internalDays, setInternalDays] = useState(30);
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [summary, setSummary] = useState({ totalStudents: 0, atRiskCount: 0, atRiskPercentage: 0, criticalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'riskScore' | 'fullName' | 'lastActiveDays' | 'avgQuizScore'>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAtRiskStudents(days, controlledGroupId)
      .then((d) => {
        if (!cancelled) {
          setAtRiskStudents(d.atRiskStudents);
          setSummary(d.summary);
          setLoading(false);
        }
      })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Ошибка загрузки'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [days, controlledGroupId]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedStudents = [...atRiskStudents].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Risk distribution buckets
  const riskBuckets = [
    { label: '0-20', min: 0, max: 20 },
    { label: '20-40', min: 20, max: 40 },
    { label: '40-60', min: 40, max: 60 },
    { label: '60-80', min: 60, max: 80 },
    { label: '80-100', min: 80, max: 100 },
  ].map((b) => ({
    label: b.label,
    count: atRiskStudents.filter((s) => s.riskScore >= b.min && s.riskScore < b.max).length,
  }));

  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handlePdfExport = async () => {
    setExportStatus('loading');
    try {
      const pdfData = atRiskStudents.map(s => ({
        fullName: s.fullName,
        email: s.email,
        group: s.group,
        riskScore: s.riskScore,
        reasons: s.reasons,
        lastActiveDays: s.lastActiveDays,
        modulesCompleted: s.modulesCompleted,
        avgQuizScore: s.avgQuizScore,
      }));
      await generateAtRiskPDF(pdfData);
      setExportStatus('success');
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("[AtRiskReport.tsx] handlePdfExport failed:", e);
      setExportStatus('idle');
    }
    setTimeout(() => setExportStatus('idle'), 4000);
  };

  const handleCsvExport = () => {
    const csv = generateAtRiskCSV(atRiskStudents.map(s => ({
      ...s,
      trend: s.trend,
      course: s.course || '',
      university: s.university || '',
    })));
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `at-risk-${date}.csv`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar: Period selector + Export buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {controlledDays === undefined && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                days === key ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePdfExport}
            disabled={exportStatus === 'loading'}
            className={exportStatus === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600' : ''}
          >
            {exportStatus === 'loading' ? '...' : exportStatus === 'success' ? 'Готово' : <><FileText size={14} className="mr-1" /> PDF</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCsvExport}>
            <Download size={14} className="mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Users size={18} />}
          value={summary.totalStudents}
          label="Всего студентов"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<AlertTriangle size={18} />}
          value={summary.atRiskCount}
          label="В зоне риска"
          trend={summary.atRiskPercentage > 20 ? 'down' : summary.atRiskPercentage > 10 ? 'stable' : 'up'}
          delta={summary.atRiskPercentage}
          deltaSuffix="%"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={<AlertTriangle size={18} />}
          value={summary.criticalCount}
          label="Критических"
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <KPICard
          icon={<Award size={18} />}
          value={summary.totalStudents - summary.atRiskCount}
          label="В норме"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Risk distribution chart */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Распределение риска</h3>
          {riskBuckets.some((b) => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value ?? 0} студ.`, 'Количество']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskBuckets.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={RISK_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* At-risk table */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Студенты в зоне риска</h3>
          {sortedStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('fullName')}>
                      ФИО {sortField === 'fullName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Группа</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground min-w-[180px]">Риск</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Причины</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('lastActiveDays')}>
                      Неактивен {sortField === 'lastActiveDays' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Модули</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('avgQuizScore')}>
                      Ср. балл {sortField === 'avgQuizScore' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Тренд</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, i) => (
                    <motion.tr
                      key={student.userId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-100 hover:bg-secondary transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium">
                        <button
                          onClick={() => setSelectedStudentId(student.userId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {student.fullName}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-xs">{student.group || '-'}</td>
                      <td className="py-2.5 px-3 min-w-[180px]">
                        <RiskScoreBar score={student.riskScore} showLabel />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {student.reasons.slice(0, 3).map((r, j) => (
                            <Badge key={j} variant="secondary" className="text-[10px]">{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs">{student.lastActiveDays} дн.</td>
                      <td className="py-2.5 px-3 text-right text-xs">{student.modulesCompleted}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{student.avgQuizScore}%</td>
                      <td className="py-2.5 px-3 text-center">
                        {student.trend === 'improving' ? <TrendingUp size={14} className="text-emerald-500 inline" /> :
                         student.trend === 'declining' ? <TrendingDown size={14} className="text-red-500 inline" /> :
                         <Minus size={14} className="text-slate-400 inline" />}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Нет студентов в зоне риска</p>
          )}
        </CardContent>
      </Card>

      {/* Student Drill Down */}
      {selectedStudentId && (
        <StudentDrillDown
          userId={selectedStudentId}
          days={days}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
