'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { GitCompare, Loader2, AlertTriangle } from 'lucide-react';
import { getStudentComparison, getAllUsers, type StudentComparisonData, type User as UserType } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';

const STUDENT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

interface Props {
  groupId?: string;
  days?: number;
}

const isControlled = (props: Props): props is Props & { days: number } => props.days !== undefined;

export default function StudentComparisonView(props: Props = {}) {
  const t = useTranslations('studentComparison');
  const [data, setData] = useState<StudentComparisonData | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(30);

  const PERIOD_OPTIONS = [
    { key: 7, label: t('period7d') },
    { key: 30, label: t('period30d') },
    { key: 90, label: t('period90d') },
    { key: 180, label: t('period180d') },
  ];

  const effectiveDays = isControlled(props) ? props.days : internalDays;
  const controlled = isControlled(props);

  useEffect(() => {
    let cancelled = false;
    getAllUsers().then((users) => {
      if (!cancelled) setAllUsers(users.filter((u) => u.role === 'student'));
    }).catch((e) => {
      logger.error('Failed to load users for comparison', { error: e });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedStudents.length < 2) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStudentComparison(selectedStudents, effectiveDays)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || t('loadError'));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStudents, effectiveDays, t]);

  const toggleStudent = (userId: string) => {
    if (selectedStudents.includes(userId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== userId));
    } else if (selectedStudents.length < 4) {
      setSelectedStudents([...selectedStudents, userId]);
    }
  };

  const studentNames = allUsers.reduce<Record<string, string>>((acc, u) => {
    acc[u.id] = u.fullName;
    return acc;
  }, {});

  // Prepare radar chart data
  const radarData =
    data?.students.map((student) => ({
      metric: studentNames[student.id] || t('student'),
      completion: Math.round((student.modulesCompleted / 12) * 100),
      quizScore: student.avgQuizScore,
      activity: Math.max(0, 100 - student.lastActiveDays * 3),
      engagement: student.engagementScore,
    })) || [];

  // Prepare module comparison data
  const allModuleIds = new Set<string>();
  data?.students.forEach((s) => Object.keys(s.moduleScores).forEach((id) => allModuleIds.add(id)));
  const moduleComparison = Array.from(allModuleIds).map((moduleId) => {
    const entry: Record<string, string | number> = { module: moduleId };
    data?.students.forEach((student) => {
      entry[studentNames[student.id] || t('student')] = student.moduleScores[moduleId] ?? 0;
    });
    return entry;
  });

  return (
    <div className="space-y-6">
      {/* Period selector — hidden when controlled externally */}
      {!controlled && (
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                effectiveDays === key
                  ? 'bg-background text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Student selector */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">{t('selectStudents')}</h3>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {allUsers.map((user) => {
              const isSelected = selectedStudents.includes(user.id);
              return (
                <Button
                  key={user.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStudent(user.id)}
                  disabled={!isSelected && selectedStudents.length >= 4}
                  className="text-xs"
                >
                  {user.fullName} {user.group && `(${user.group})`}
                </Button>
              );
            })}
          </div>
          {selectedStudents.length > 0 && (
            <p className="text-muted-foreground mt-2 text-xs">{t('selectedCount', { count: selectedStudents.length })}</p>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-muted-foreground ml-3 text-sm">{t('loading')}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-16">
          <AlertTriangle size={32} className="text-red-500" />
          <p className="text-muted-foreground ml-3 text-sm font-medium">{error}</p>
        </div>
      )}

      {data && data.students.length >= 2 && (
        <>
          {/* Radar Chart */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold">{t('metricsComparison')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} />
                  {data.students.map((_, i) => (
                    <Radar
                      key={i}
                      name={radarData[i]?.metric || t('studentN', { n: i + 1 })}
                      dataKey={['completion', 'quizScore', 'activity', 'engagement'][i % 4]}
                      stroke={STUDENT_COLORS[i]}
                      fill={STUDENT_COLORS[i]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-xs text-slate-400">
                {t('radarNote')}
              </p>
            </CardContent>
          </Card>

          {/* Side-by-side metrics */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold">{t('studentMetrics')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border border-b">
                      <th className="p-2 text-left">{t('metric')}</th>
                      {data.students.map((student, i) => (
                        <th key={student.id} className="p-2 text-center" style={{ color: STUDENT_COLORS[i] }}>
                          {studentNames[student.id]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: t('modulesCompleted'),
                        getValue: (s: (typeof data.students)[0]) => s.modulesCompleted,
                      },
                      {
                        label: t('avgQuizScore'),
                        getValue: (s: (typeof data.students)[0]) => `${s.avgQuizScore}%`,
                      },
                      {
                        label: t('quizAttempts'),
                        getValue: (s: (typeof data.students)[0]) => s.totalQuizAttempts,
                      },
                      {
                        label: t('daysInactive'),
                        getValue: (s: (typeof data.students)[0]) => s.lastActiveDays,
                      },
                      {
                        label: t('engagement'),
                        getValue: (s: (typeof data.students)[0]) => s.engagementScore,
                      },
                      {
                        label: t('risk'),
                        getValue: (s: (typeof data.students)[0]) => s.riskScore,
                      },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-secondary border-b border-slate-100">
                        <td className="p-2 font-medium">{row.label}</td>
                        {(data?.students ?? []).map((student) => (
                          <td key={student.id} className="p-2 text-center">
                            {row.getValue(student)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Module comparison */}
          {moduleComparison.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold">{t('moduleComparison')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moduleComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="module" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    {data.students.map((student, i) => (
                      <Bar key={student.id} dataKey={studentNames[student.id] || t('student')} fill={STUDENT_COLORS[i]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!data && selectedStudents.length < 2 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <GitCompare size={48} className="mb-4" />
          <p className="text-sm">{t('selectMinimum')}</p>
        </div>
      )}
    </div>
  );
}
