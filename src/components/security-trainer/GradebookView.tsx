'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, Download, Filter } from 'lucide-react';
import { getGradebook, getAllUsers, type GradebookData, type User as UserType } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StudentDrillDown from './StudentDrillDown';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-muted text-slate-400';
  if (score >= 70) return 'bg-emerald-100 text-emerald-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function GradebookView({
  groupId: controlledGroupId,
  days: controlledDays,
}: { groupId?: string; days?: number } = {}) {
  const [internalGroupId, setInternalGroupId] = useState('');
  const [internalDays, setInternalDays] = useState(30);
  const groupId = controlledGroupId !== undefined ? controlledGroupId : internalGroupId;
  const days = controlledDays !== undefined ? controlledDays : internalDays;
  const [data, setData] = useState<GradebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    getAllUsers().then(setAllUsers);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGradebook({ groupId: groupId || undefined, days })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || 'Ошибка загрузки');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, groupId]);

  const groups = Array.from(new Set(allUsers.filter((u) => u.group).map((u) => u.group)));

  const filteredStudents =
    data?.students.filter(
      (s) =>
        searchTerm === '' ||
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Студент', 'Email', 'Группа', 'Ср. балл', ...data.modules.map((m) => m.moduleId)];
    const rows = data.students.map((s) => [
      s.fullName,
      s.email,
      s.group,
      s.avgQuizScore,
      ...data.modules.map((m) => s.moduleScores[m.moduleId]?.score ?? 'N/A'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-muted-foreground ml-3 text-sm">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-muted-foreground ml-3 text-sm font-medium">{error || 'Нет данных'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {controlledDays === undefined && (
          <div className="bg-muted flex gap-1 rounded-lg p-1">
            {PERIOD_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setInternalDays(key)}
                className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                  days === key
                    ? 'bg-background text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {controlledGroupId === undefined && (
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={internalGroupId}
              onChange={(e) => setInternalGroupId(e.target.value)}
              className="border-border bg-card rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Все группы</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative min-w-[200px] flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск студента..."
            className="pl-3"
          />
        </div>

        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download size={16} className="mr-2" />
          Экспорт CSV
        </Button>
      </div>

      {/* Gradebook Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary border-border border-b">
                  <th className="bg-secondary sticky left-0 z-10 min-w-[200px] p-3 text-left font-semibold">Студент</th>
                  <th className="min-w-[100px] p-3 text-left font-semibold">Группа</th>
                  {data.modules.map((module) => (
                    <th key={module.moduleId} className="min-w-[80px] p-3 text-center font-semibold">
                      <span className="text-xs">{module.moduleName}</span>
                    </th>
                  ))}
                  <th className="min-w-[100px] p-3 text-center font-semibold">Ср. балл</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={data.modules.length + 3} className="p-8 text-center text-slate-400">
                      Нет студентов
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, i) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-secondary border-b border-slate-100"
                    >
                      <td className="bg-card sticky left-0 z-10 p-3 font-medium">
                        <button
                          onClick={() => setSelectedStudentId(student.id)}
                          className="text-left text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {student.fullName}
                        </button>
                      </td>
                      <td className="p-3">
                        {student.group && (
                          <Badge variant="secondary" className="text-xs">
                            {student.group}
                          </Badge>
                        )}
                      </td>
                      {data.modules.map((module) => {
                        const scoreData = student.moduleScores[module.moduleId];
                        const score = scoreData?.score ?? null;
                        return (
                          <td key={module.moduleId} className="p-3 text-center">
                            {score !== null ? (
                              <Badge className={getScoreColor(score)}>{score}%</Badge>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <Badge className={getScoreColor(student.avgQuizScore > 0 ? student.avgQuizScore : null)}>
                          {student.avgQuizScore > 0 ? `${student.avgQuizScore}%` : '—'}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
              {filteredStudents.length > 0 && (
                <tfoot>
                  <tr className="bg-secondary border-border border-t-2 font-semibold">
                    <td className="bg-secondary sticky left-0 z-10 p-3">Средние значения</td>
                    <td className="p-3"></td>
                    {data.modules.map((module) => {
                      const scores = filteredStudents
                        .map((s) => s.moduleScores[module.moduleId]?.score)
                        .filter((s): s is number => s !== null && s !== undefined);
                      const avg =
                        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                      return (
                        <td key={module.moduleId} className="p-3 text-center">
                          {avg !== null ? (
                            <Badge className={getScoreColor(avg)}>{avg}%</Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center">
                      {filteredStudents.length > 0 ? (
                        <Badge
                          className={getScoreColor(
                            Math.round(
                              filteredStudents.reduce((sum, s) => sum + s.avgQuizScore, 0) / filteredStudents.length,
                            ),
                          )}
                        >
                          {Math.round(
                            filteredStudents.reduce((sum, s) => sum + s.avgQuizScore, 0) / filteredStudents.length,
                          )}
                          %
                        </Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{filteredStudents.length}</p>
            <p className="text-muted-foreground mt-1 text-xs">Студентов</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {filteredStudents.filter((s) => s.avgQuizScore >= 70).length}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">Средний балл ≥ 70%</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {filteredStudents.filter((s) => s.avgQuizScore < 50 && s.avgQuizScore > 0).length}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">Средний балл {'<'} 50%</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Drill Down */}
      {selectedStudentId && (
        <StudentDrillDown userId={selectedStudentId} days={days} onClose={() => setSelectedStudentId(null)} />
      )}
    </div>
  );
}
