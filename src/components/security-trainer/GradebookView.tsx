'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, AlertTriangle, Download, Filter,
} from 'lucide-react';
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
  if (score === null) return 'bg-slate-100 text-slate-400';
  if (score >= 70) return 'bg-emerald-100 text-emerald-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function GradebookView({ groupId: controlledGroupId, days: controlledDays }: { groupId?: string; days?: number } = {}) {
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
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Ошибка загрузки'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [days, groupId]);

  const groups = Array.from(new Set(allUsers.filter((u) => u.group).map((u) => u.group)));

  const filteredStudents = data?.students.filter((s) =>
    searchTerm === '' || s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {controlledDays === undefined && (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            {PERIOD_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setInternalDays(key)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  days === key ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
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
              className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
            >
              <option value="">Все группы</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}

        <div className="relative flex-1 min-w-[200px]">
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
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 bg-slate-50 text-left p-3 font-semibold z-10 min-w-[200px]">
                    Студент
                  </th>
                  <th className="text-left p-3 font-semibold min-w-[100px]">Группа</th>
                  {data.modules.map((module) => (
                    <th key={module.moduleId} className="text-center p-3 font-semibold min-w-[80px]">
                      <span className="text-xs">{module.moduleName}</span>
                    </th>
                  ))}
                  <th className="text-center p-3 font-semibold min-w-[100px]">Ср. балл</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={data.modules.length + 3} className="text-center p-8 text-slate-400">
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
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="sticky left-0 bg-white p-3 font-medium z-10">
                        <button
                          onClick={() => setSelectedStudentId(student.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {student.fullName}
                        </button>
                      </td>
                      <td className="p-3">
                        {student.group && <Badge variant="secondary" className="text-xs">{student.group}</Badge>}
                      </td>
                      {data.modules.map((module) => {
                        const scoreData = student.moduleScores[module.moduleId];
                        const score = scoreData?.score ?? null;
                        return (
                          <td key={module.moduleId} className="text-center p-3">
                            {score !== null ? (
                              <Badge className={getScoreColor(score)}>
                                {score}%
                              </Badge>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center p-3">
                        <Badge
                          className={getScoreColor(student.avgQuizScore > 0 ? student.avgQuizScore : null)}
                        >
                          {student.avgQuizScore > 0 ? `${student.avgQuizScore}%` : '—'}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
              {filteredStudents.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                    <td className="sticky left-0 bg-slate-50 p-3 z-10">Средние значения</td>
                    <td className="p-3"></td>
                    {data.modules.map((module) => {
                      const scores = filteredStudents
                        .map((s) => s.moduleScores[module.moduleId]?.score)
                        .filter((s): s is number => s !== null && s !== undefined);
                      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                      return (
                        <td key={module.moduleId} className="text-center p-3">
                          {avg !== null ? (
                            <Badge className={getScoreColor(avg)}>{avg}%</Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center p-3">
                      {filteredStudents.length > 0 ? (
                        <Badge className={getScoreColor(
                          Math.round(filteredStudents.reduce((sum, s) => sum + s.avgQuizScore, 0) / filteredStudents.length)
                        )}>
                          {Math.round(filteredStudents.reduce((sum, s) => sum + s.avgQuizScore, 0) / filteredStudents.length)}%
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
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{filteredStudents.length}</p>
            <p className="text-xs text-slate-500 mt-1">Студентов</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {filteredStudents.filter((s) => s.avgQuizScore >= 70).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Средний балл ≥ 70%</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {filteredStudents.filter((s) => s.avgQuizScore < 50 && s.avgQuizScore > 0).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Средний балл {'<'} 50%</p>
          </CardContent>
        </Card>
      </div>

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
