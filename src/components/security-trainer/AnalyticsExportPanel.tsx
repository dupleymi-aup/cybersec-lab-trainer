'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Printer, Loader2, CheckCircle2, AlertCircle, ChevronDown, BarChart3, AlertTriangle, GitCompare, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllUsers, getStudentProgress, getModulePerformance, getAtRiskStudents, getGroupComparison, getComprehensiveSummary, type User } from '@/lib/auth-store';
import { downloadCSV, generateGradebookCSV, generateStudentReportCSV, generateModulePerformanceCSV, generateAtRiskCSV, generateGroupComparisonCSV, generateAnalyticsCSV } from '@/lib/export-utils';
import { modules } from '@/lib/data';

interface AnalyticsExportPanelProps {
  students?: Array<{ id: string; fullName: string; email: string; group: string }>;
  groupId?: string;
  days?: number;
}

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

interface ExportState {
  gradebook: ExportStatus;
  studentReport: ExportStatus;
  print: ExportStatus;
  analytics: ExportStatus;
  atRisk: ExportStatus;
  groupComparison: ExportStatus;
  modulePerformance: ExportStatus;
}

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

const isControlled = (props: AnalyticsExportPanelProps): props is AnalyticsExportPanelProps & { days: number } =>
  props.days !== undefined;


export default function AnalyticsExportPanel(props: AnalyticsExportPanelProps = {}) {
  const { students: propStudents, groupId } = props;
  const [students, setStudents] = useState<Array<{ id: string; fullName: string; email: string; group: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({
    gradebook: 'idle',
    studentReport: 'idle',
    print: 'idle',
    analytics: 'idle',
    atRisk: 'idle',
    groupComparison: 'idle',
    modulePerformance: 'idle',
  });
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [printPreview, setPrintPreview] = useState(false);
  const [internalDays, setInternalDays] = useState(30);

  const effectiveDays = isControlled(props) ? props.days : internalDays;
  const controlled = isControlled(props);

  // Load students from API if not provided via props
  useEffect(() => {
    if (propStudents && propStudents.length > 0) {
      const filtered = groupId ? propStudents.filter((s) => s.group === groupId) : propStudents;
      setStudents(filtered);
      return;
    }

    const loadStudents = async () => {
      const allUsers = await getAllUsers();
      const studentUsers = allUsers.filter((u: User) => u.role === 'student');
      const mapped = studentUsers.map((u: User) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        group: u.group,
      }));
      setStudents(groupId ? mapped.filter((s) => s.group === groupId) : mapped);
    };
    loadStudents();
  }, [propStudents, groupId]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const setStatus = useCallback((key: keyof ExportState, status: ExportStatus, message?: string) => {
    setExportState((prev) => ({ ...prev, [key]: status }));
    if (message) {
      setMessages((prev) => ({ ...prev, [key]: message }));
    }
  }, []);

  const clearMessage = useCallback((key: keyof ExportState) => {
    setMessages((prev) => ({ ...prev, [key]: '' }));
  }, []);

  // Export gradebook CSV
  const handleGradebookExport = async () => {
    setStatus('gradebook', 'loading');
    clearMessage('gradebook');

    try {
      const studentData = await Promise.all(
        students.map(async (s) => {
          const progressResult = await getStudentProgress(s.id);
          const progress = (progressResult.progress || []) as Array<{ moduleId?: string; completed?: boolean; score?: number }>;
          const quizResults = (progressResult.quizResults || []) as Array<{ score?: number }>;

          const completedModules = progress.filter((p) => p.completed).length;
          const quizCount = quizResults.length;
          const scores = quizResults.map((q) => q.score ?? 0);
          const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

          // Compute last active from localStorage
          const key = `security-trainer-progress-${s.id}`;
          const raw = localStorage.getItem(key);
          let lastActive = '—';
          if (raw) {
            try {
              const data = JSON.parse(raw);
              const allTimestamps = [
                ...Object.values(data.moduleTimestamps || {}),
                ...Object.values(data.quizTimestamps || {}),
              ].filter(Boolean) as string[];
              if (allTimestamps.length > 0) {
                allTimestamps.sort();
                lastActive = new Date(allTimestamps[allTimestamps.length - 1]).toLocaleDateString('ru-RU');
              }
            } catch {
              // ignore
            }
          }

          return {
            id: s.id,
            fullName: s.fullName,
            email: s.email,
            group: s.group,
            modulesCompleted: completedModules,
            quizCount,
            avgScore,
            lastActive,
          };
        })
      );

      const moduleNames = modules.map((m) => m.title);
      const csv = generateGradebookCSV(studentData, moduleNames);
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `gradebook-${date}.csv`);

      setStatus('gradebook', 'success', `Экспортировано ${studentData.length} студентов`);
    } catch {
    }

    // Reset status after delay
    setTimeout(() => setStatus('gradebook', 'idle'), 4000);
  };

  // Export student report CSV
  const handleStudentReportExport = async () => {
    if (!selectedStudentId) {
      setStatus('studentReport', 'error', 'Выберите студента');
      setTimeout(() => setStatus('studentReport', 'idle'), 3000);
      return;
    }

    setStatus('studentReport', 'loading');
    clearMessage('studentReport');

    try {
      const progressResult = await getStudentProgress(selectedStudentId);
      const progress = (progressResult.progress || []) as Array<{ moduleId?: string; completed?: boolean; score?: number }>;
      const quizResults = (progressResult.quizResults || []) as Array<{ score?: number; total?: number }>;

      // Build module progress
      const moduleProgress = modules.map((m) => {
        const found = progress.find((p) => p.moduleId === m.id);
        return {
          moduleId: m.title,
          completed: found?.completed ?? false,
          score: found?.score ?? null,
        };
      });

      // Build quiz results
      const quizData = quizResults.map((q, i) => ({
        quizId: `Квиз ${i + 1}`,
        score: q.score ?? 0,
        total: q.total ?? 100,
        percentage: q.score ?? 0,
      }));

      const student = students.find((s) => s.id === selectedStudentId);
      if (!student) {
        setStatus('studentReport', 'error', 'Студент не найден');
        return;
      }

      const csv = generateStudentReportCSV(
        {
          fullName: student.fullName,
          email: student.email,
          group: student.group,
          course: '',
          university: '',
        },
        moduleProgress,
        quizData
      );

      const date = new Date().toISOString().split('T')[0];
      const safeName = student.fullName.replace(/\s+/g, '-');
      downloadCSV(csv, `student-${safeName}-${date}.csv`);

      setStatus('studentReport', 'success', 'Отчёт студента экспортирован');
    } catch {
    }

    setTimeout(() => setStatus('studentReport', 'idle'), 4000);
  };

  // Print report
  const handlePrint = () => {
    setPrintPreview(true);
    setStatus('print', 'success', 'Подготовка к печати...');
    setTimeout(() => {
      window.print();
      setPrintPreview(false);
      setTimeout(() => setStatus('print', 'idle'), 2000);
    }, 500);
  };

  // Export analytics CSV
  const handleAnalyticsExport = async () => {
    setStatus('analytics', 'loading');
    clearMessage('analytics');
    try {
      const summary = await getComprehensiveSummary(effectiveDays, groupId);
      const csv = generateAnalyticsCSV(summary, summary.moduleDistribution);
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `analytics-${effectiveDays}d-${date}.csv`);
      setStatus('analytics', 'success', 'Аналитика экспортирована');
    } catch {
      setStatus('analytics', 'error', 'Ошибка при экспорте аналитики');
    }
    setTimeout(() => setStatus('analytics', 'idle'), 4000);
  };

  // Export at-risk students CSV
  const handleAtRiskExport = async () => {
    setStatus('atRisk', 'loading');
    clearMessage('atRisk');
    try {
      const data = await getAtRiskStudents(effectiveDays, groupId);
      const csv = generateAtRiskCSV(data.atRiskStudents.map(s => ({
        ...s, trend: s.trend,
      })));
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `at-risk-${effectiveDays}d-${date}.csv`);
      setStatus('atRisk', 'success', `Экспортировано ${data.atRiskStudents.length} студентов`);
    } catch {
      setStatus('atRisk', 'error', 'Ошибка при экспорте');
    }
    setTimeout(() => setStatus('atRisk', 'idle'), 4000);
  };

  // Export group comparison CSV
  const handleGroupComparisonExport = async () => {
    setStatus('groupComparison', 'loading');
    clearMessage('groupComparison');
    try {
      const data = await getGroupComparison(effectiveDays, 'group');
      const csv = generateGroupComparisonCSV(data.dimensions.map(d => ({
        name: d.name, studentCount: d.studentCount, activeStudents: d.activeStudents,
        activeRate: d.activeRate, avgModulesCompleted: d.avgModulesCompleted,
        avgCompletionRate: d.avgCompletionRate, avgQuizScore: d.avgQuizScore,
        totalQuizAttempts: d.totalQuizAttempts, topModule: d.topModule, weakestModule: d.weakestModule,
      })), 'group');
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `group-comparison-${effectiveDays}d-${date}.csv`);
      setStatus('groupComparison', 'success', `Экспортировано ${data.dimensions.length} групп`);
    } catch {
      setStatus('groupComparison', 'error', 'Ошибка при экспорте');
    }
    setTimeout(() => setStatus('groupComparison', 'idle'), 4000);
  };

  // Export module performance CSV
  const handleModulePerformanceExport = async () => {
    setStatus('modulePerformance', 'loading');
    clearMessage('modulePerformance');
    try {
      const moduleData = await getModulePerformance(effectiveDays, groupId);
      const csv = generateModulePerformanceCSV(moduleData);
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `module-performance-${effectiveDays}d-${date}.csv`);
      setStatus('modulePerformance', 'success', `Экспортировано ${moduleData.length} модулей`);
    } catch {
      setStatus('modulePerformance', 'error', 'Ошибка при экспорте');
    }
    setTimeout(() => setStatus('modulePerformance', 'idle'), 4000);
  };

  const exportCards = [
    {
      key: 'gradebook' as keyof ExportState,
      icon: FileText,
      title: 'Журнал оценок (CSV)',
      description: 'Экспорт полного журнала оценок всех студентов с прогрессом по модулям и средними баллами',
      onClick: handleGradebookExport,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'hover:border-emerald-300',
    },
    {
      key: 'studentReport' as keyof ExportState,
      icon: Download,
      title: 'Отчёт по студенту (CSV)',
      description: 'Выберите студента из списка для экспорта детального отчёта по модулям и квизам',
      onClick: handleStudentReportExport,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'hover:border-violet-300',
    },
    {
      key: 'analytics' as keyof ExportState,
      icon: BarChart3,
      title: 'Аналитика (CSV)',
      description: 'Экспорт комплексной аналитики с KPI, распределением баллов и прогрессом по модулям',
      onClick: handleAnalyticsExport,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'hover:border-indigo-300',
    },
    {
      key: 'atRisk' as keyof ExportState,
      icon: AlertTriangle,
      title: 'Студенты риска (CSV)',
      description: 'Экспорт списка студентов в зоне риска с оценками риска, причинами и трендами',
      onClick: handleAtRiskExport,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'hover:border-red-300',
    },
    {
      key: 'groupComparison' as keyof ExportState,
      icon: GitCompare,
      title: 'Сравнение групп (CSV)',
      description: 'Экспорт сравнительной аналитики групп/курсов/университетов по метрикам',
      onClick: handleGroupComparisonExport,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'hover:border-blue-300',
    },
    {
      key: 'modulePerformance' as keyof ExportState,
      icon: BookOpen,
      title: 'Модули (CSV)',
      description: 'Экспорт статистики по каждому модулю: завершение, баллы, сложность',
      onClick: handleModulePerformanceExport,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
    },
    {
      key: 'print' as keyof ExportState,
      icon: Printer,
      title: 'Печать отчёта',
      description: 'Открыть оптимизированную версию страницы для печати текущего состояния прогресса',
      onClick: handlePrint,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'hover:border-slate-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Экспорт отчётов</h2>
          <p className="text-sm text-slate-500 mt-1">Экспортируйте данные о прогрессе студентов в различных форматах</p>
        </div>
        {!controlled && (
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInternalDays(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                effectiveDays === key ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        )}
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exportCards.map((card, i) => {
          const status = exportState[card.key];
          const message = messages[card.key] || '';

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`border-slate-200 shadow-sm bg-white transition-colors ${card.borderColor}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <card.icon size={20} className={card.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{card.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                    </div>
                  </div>

                  {/* Student dropdown for student report */}
                  {card.key === 'studentReport' && (
                    <div className="mb-3 relative">
                      <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-md text-sm bg-white hover:border-slate-300 transition-colors"
                      >
                        <span className="truncate text-slate-700">
                          {selectedStudent ? selectedStudent.fullName : 'Выберите студента...'}
                        </span>
                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0 ml-2" />
                      </button>

                      {showDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {students.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center">Нет доступных студентов</div>
                          ) : (
                            students.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                  s.id === selectedStudentId ? 'bg-violet-50 text-violet-700' : 'text-slate-700'
                                }`}
                                onClick={() => {
                                  setSelectedStudentId(s.id);
                                  setShowDropdown(false);
                                }}
                              >
                                <div className="font-medium truncate">{s.fullName}</div>
                                {s.group && <div className="text-xs text-slate-400">{s.group}</div>}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Export button */}
                  <Button
                    onClick={card.onClick}
                    disabled={status === 'loading' || (card.key === 'studentReport' && !selectedStudentId)}
                    variant={status === 'success' ? 'default' : 'outline'}
                    className={`w-full text-sm ${
                      status === 'success'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : status === 'error'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : ''
                    }`}
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Экспорт...
                      </>
                    ) : status === 'success' ? (
                      <>
                        <CheckCircle2 size={16} className="mr-2" />
                        Готово
                      </>
                    ) : status === 'error' ? (
                      <>
                        <AlertCircle size={16} className="mr-2" />
                        Ошибка
                      </>
                    ) : (
                      <>
                        <card.icon size={16} className="mr-2" />
                        Экспортировать
                      </>
                    )}
                  </Button>

                  {/* Status message */}
                  {message && (
                    <motion.p
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 text-xs text-center ${
                        status === 'success' ? 'text-emerald-600' : status === 'error' ? 'text-red-500' : 'text-slate-500'
                      }`}
                    >
                      {message}
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Print preview */}
      {printPreview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPrintPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold">Предпросмотр печати</h3>
              <p className="text-sm text-slate-500 mt-1">Текущий прогресс студентов будет распечатан</p>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Отчёт по прогрессу студентов</h2>
                <p className="text-sm text-slate-500">{new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div className="space-y-4">
                {students.map((s) => {
                  const progressKey = `security-trainer-progress-${s.id}`;
                  const raw = localStorage.getItem(progressKey);
                  let moduleCount = 0;
                  let quizCount = 0;
                  if (raw) {
                    try {
                      const data = JSON.parse(raw);
                      moduleCount = (data.completedModules || []).length;
                      quizCount = Object.keys(data.quizScores || {}).length;
                    } catch {
                      // ignore
                    }
                  }

                  return (
                    <div key={s.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{s.fullName}</h4>
                          <p className="text-xs text-slate-500">{s.email}</p>
                          {s.group && <Badge variant="secondary" className="text-xs mt-1">{s.group}</Badge>}
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-bold">{moduleCount}</p>
                            <p className="text-xs text-slate-500">Модулей</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold">{quizCount}</p>
                            <p className="text-xs text-slate-500">Квизов</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {students.length === 0 && (
                  <p className="text-center text-slate-400 py-4">Нет данных для печати</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPrintPreview(false)}>
                Отмена
              </Button>
              <Button onClick={() => { window.print(); setPrintPreview(false); }}>
                <Printer size={16} className="mr-2" />
                Печать
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
