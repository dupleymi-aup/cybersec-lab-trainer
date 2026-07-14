'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  BarChart3,
  AlertTriangle,
  GitCompare,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getAllUsers,
  getStudentProgress,
  getModulePerformance,
  getAtRiskStudents,
  getGroupComparison,
  getComprehensiveSummary,
  getQuizRetryAnalytics,
  type User,
} from '@/lib/auth-store';
import {
  downloadCSV,
  generateGradebookCSV,
  generateStudentReportCSV,
  generateStudentReportPDF,
  generateModulePerformanceCSV,
  generateAtRiskCSV,
  generateGroupComparisonCSV,
  generateAnalyticsCSV,
  generateGradebookPDF,
  generateAtRiskPDF,
  generateAnalyticsPDF,
  generateModulePerformancePDF,
  generateGroupComparisonPDF,
  generateQuizRetryPDF,
} from '@/lib/export-utils';
import { modules } from '@/lib/data';
import { useDateFormatter } from '@/lib/format';
import { logger } from '@/lib/logger';

interface AnalyticsExportPanelProps {
  students?: Array<{
    id: string;
    fullName: string;
    email: string;
    group: string;
  }>;
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
  gradebookPdf: ExportStatus;
  atRiskPdf: ExportStatus;
  analyticsPdf: ExportStatus;
  modulePerformancePdf: ExportStatus;
  groupComparisonPdf: ExportStatus;
  studentReportPdf: ExportStatus;
  quizRetryPdf: ExportStatus;
}

const PERIOD_OPTIONS = [
  { key: 7, label: '7d' },
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
  { key: 180, label: '180d' },
];

const isControlled = (props: AnalyticsExportPanelProps): props is AnalyticsExportPanelProps & { days: number } =>
  props.days !== undefined;

export default function AnalyticsExportPanel(props: AnalyticsExportPanelProps = {}) {
  const t = useTranslations('analyticsExport');
  const formatDate = useDateFormatter();
  const { students: propStudents, groupId } = props;
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const exportingKeys = useRef(new Set<string>());
  const isExporting = useCallback((key: string) => exportingKeys.current.has(key), []);
  const startExport = useCallback((key: string) => exportingKeys.current.add(key), []);
  const endExport = useCallback((key: string) => exportingKeys.current.delete(key), []);
  const scheduleReset = useCallback((key: keyof ExportState, ms: number) => {
    const timer = setTimeout(() => {
      setExportState((prev) => ({ ...prev, [key]: 'idle' }));
      timersRef.current.delete(timer);
    }, ms);
    timersRef.current.add(timer);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

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
    gradebookPdf: 'idle',
    atRiskPdf: 'idle',
    analyticsPdf: 'idle',
    modulePerformancePdf: 'idle',
    groupComparisonPdf: 'idle',
    studentReportPdf: 'idle',
    quizRetryPdf: 'idle',
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
    if (isExporting('gradebook')) return;
    startExport('gradebook');
    setStatus('gradebook', 'loading');
    clearMessage('gradebook');

    try {
      const studentData = await Promise.all(
        students.map(async (s) => {
          const { progress, quizResults } = await getStudentProgress(s.id);

          const completedModules = progress.filter((p) => p.completed).length;
          const quizCount = quizResults.length;
          const percentages = quizResults.map((q) => {
            if (typeof q.percentage === 'number') return q.percentage;
            if (q.score != null && q.total && q.total > 0) return (q.score / q.total) * 100;
            return q.score ?? 0;
          });
          const avgScore = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;

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
                lastActive = formatDate(allTimestamps[allTimestamps.length - 1]);
              }
            } catch (e) {
              logger.warn('AnalyticsExportPanel gradebook localStorage parse failed', { error: e });
              // Intentionally empty — non-critical localStorage parse, fallback to default values
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
        }),
      );

      const moduleNames = modules.map((m) => m.title);
      const csv = generateGradebookCSV(studentData, moduleNames);
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `gradebook-${date}.csv`);

      setStatus('gradebook', 'success', t('exportedN', { count: studentData.length }));
    } catch (error) {
      logger.error('Gradebook export failed', { error });
      setStatus('gradebook', 'error', t('exportError'));
    } finally {
      endExport('gradebook');
    }

    // Reset status after delay
    scheduleReset('gradebook', 4000);
  };

  // Export student report CSV
  const handleStudentReportExport = async () => {
    if (!selectedStudentId) {
      setStatus('studentReport', 'error', t('selectStudent'));
      scheduleReset('studentReport', 3000);
      return;
    }

    setStatus('studentReport', 'loading');
    clearMessage('studentReport');

    try {
      const { progress, quizResults } = await getStudentProgress(selectedStudentId);

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
        quizId: t('quizLabel', { n: i + 1 }),
        score: q.score ?? 0,
        total: q.total ?? 100,
        percentage: q.score ?? 0,
      }));

      const student = students.find((s) => s.id === selectedStudentId);
      if (!student) {
        setStatus('studentReport', 'error', t('studentNotFound'));
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
        quizData,
      );

      const date = new Date().toISOString().split('T')[0];
      const safeName = student.fullName.replace(/\s+/g, '-');
      downloadCSV(csv, `student-${safeName}-${date}.csv`);

      setStatus('studentReport', 'success', t('studentReportExported'));
    } catch (error) {
      logger.error('Student report export failed', { error });
      setStatus('studentReport', 'error', t('exportError'));
    }

    scheduleReset('studentReport', 4000);
  };

  // Print report
  const handlePrint = () => {
    setPrintPreview(true);
    setStatus('print', 'success', t('preparingPrint'));
    setTimeout(() => {
      window.print();
      setPrintPreview(false);
      scheduleReset('print', 2000);
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
      setStatus('analytics', 'success', t('analyticsExported'));
    } catch (e) {
      logger.warn('Analytics export failed', { error: e });
      setStatus('analytics', 'error', t('analyticsError'));
    }
    scheduleReset('analytics', 4000);
  };

  // Export at-risk students CSV
  const handleAtRiskExport = async () => {
    setStatus('atRisk', 'loading');
    clearMessage('atRisk');
    try {
      const data = await getAtRiskStudents(effectiveDays, groupId);
      const csv = generateAtRiskCSV(
        data.atRiskStudents.map((s) => ({
          ...s,
          trend: s.trend,
        })),
      );
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `at-risk-${effectiveDays}d-${date}.csv`);
      setStatus('atRisk', 'success', t('exportedN', { count: data.atRiskStudents.length }));
    } catch (e) {
      logger.warn('At-risk export failed', { error: e });
      setStatus('atRisk', 'error', t('exportError'));
    }
    scheduleReset('atRisk', 4000);
  };

  // Export group comparison CSV
  const handleGroupComparisonExport = async () => {
    setStatus('groupComparison', 'loading');
    clearMessage('groupComparison');
    try {
      const data = await getGroupComparison(effectiveDays, 'group');
      const csv = generateGroupComparisonCSV(
        data.dimensions.map((d) => ({
          name: d.name,
          studentCount: d.studentCount,
          activeStudents: d.activeStudents,
          activeRate: d.activeRate,
          avgModulesCompleted: d.avgModulesCompleted,
          avgCompletionRate: d.avgCompletionRate,
          avgQuizScore: d.avgQuizScore,
          totalQuizAttempts: d.totalQuizAttempts,
          topModule: d.topModule,
          weakestModule: d.weakestModule,
        })),
        'group',
      );
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `group-comparison-${effectiveDays}d-${date}.csv`);
      setStatus('groupComparison', 'success', t('exportedGroups', { count: data.dimensions.length }));
    } catch (e) {
      logger.warn('Group comparison export failed', { error: e });
      setStatus('groupComparison', 'error', t('exportError'));
    }
    scheduleReset('groupComparison', 4000);
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
      setStatus('modulePerformance', 'success', t('exportedModules', { count: moduleData.length }));
    } catch (e) {
      logger.warn('Module performance export failed', { error: e });
      setStatus('modulePerformance', 'error', t('exportError'));
    }
    scheduleReset('modulePerformance', 4000);
  };

  // Export gradebook PDF
  const handleGradebookPdfExport = async () => {
    setStatus('gradebookPdf', 'loading');
    clearMessage('gradebookPdf');
    try {
      const studentData = await Promise.all(
        students.map(async (s) => {
          const { progress, quizResults } = await getStudentProgress(s.id);
          const completedModules = progress.filter((p) => p.completed).length;
          const quizCount = quizResults.length;
          const percentages = quizResults.map((q) => {
            if (typeof q.percentage === 'number') return q.percentage;
            if (q.score != null && q.total && q.total > 0) return (q.score / q.total) * 100;
            return q.score ?? 0;
          });
          const avgScore = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
          return {
            id: s.id,
            fullName: s.fullName,
            email: s.email,
            group: s.group,
            modulesCompleted: completedModules,
            quizCount,
            avgScore,
          };
        }),
      );
      await generateGradebookPDF(studentData);
      setStatus('gradebookPdf', 'success', t('pdfExported', { count: studentData.length }));
    } catch (e) {
      logger.warn('Gradebook PDF export failed', { error: e });
      setStatus('gradebookPdf', 'error', t('pdfError'));
    }
    scheduleReset('gradebookPdf', 4000);
  };

  // Export at-risk PDF
  const handleAtRiskPdfExport = async () => {
    setStatus('atRiskPdf', 'loading');
    clearMessage('atRiskPdf');
    try {
      const data = await getAtRiskStudents(effectiveDays, groupId);
      const atRiskData = data.atRiskStudents.map((s) => ({
        fullName: s.fullName,
        email: s.email,
        group: s.group,
        riskScore: s.riskScore,
        reasons: s.reasons,
        lastActiveDays: s.lastActiveDays,
        modulesCompleted: s.modulesCompleted,
        avgQuizScore: s.avgQuizScore,
      }));
      await generateAtRiskPDF(atRiskData);
      setStatus('atRiskPdf', 'success', t('pdfExported', { count: atRiskData.length }));
    } catch (e) {
      logger.warn('At-risk PDF export failed', { error: e });
      setStatus('atRiskPdf', 'error', t('pdfError'));
    }
    scheduleReset('atRiskPdf', 4000);
  };

  // Export analytics PDF
  const handleAnalyticsPdfExport = async () => {
    setStatus('analyticsPdf', 'loading');
    clearMessage('analyticsPdf');
    try {
      const summary = await getComprehensiveSummary(effectiveDays, groupId);
      await generateAnalyticsPDF(summary, summary.moduleDistribution);
      setStatus('analyticsPdf', 'success', t('analyticsPdfDone'));
    } catch (e) {
      logger.warn('Analytics PDF export failed', { error: e });
      setStatus('analyticsPdf', 'error', t('pdfError'));
    }
    scheduleReset('analyticsPdf', 4000);
  };

  // Export module performance PDF
  const handleModulePerformancePdfExport = async () => {
    setStatus('modulePerformancePdf', 'loading');
    clearMessage('modulePerformancePdf');
    try {
      const moduleData = await getModulePerformance(effectiveDays, groupId);
      await generateModulePerformancePDF(moduleData);
      setStatus('modulePerformancePdf', 'success', t('pdfExported', { count: moduleData.length }));
    } catch (e) {
      logger.warn('Module performance PDF export failed', { error: e });
      setStatus('modulePerformancePdf', 'error', t('pdfError'));
    }
    scheduleReset('modulePerformancePdf', 4000);
  };

  // Export group comparison PDF
  const handleGroupComparisonPdfExport = async () => {
    setStatus('groupComparisonPdf', 'loading');
    clearMessage('groupComparisonPdf');
    try {
      const data = await getGroupComparison(effectiveDays, 'group');
      await generateGroupComparisonPDF(data.dimensions, 'group');
      setStatus('groupComparisonPdf', 'success', t('pdfExported', { count: data.dimensions.length }));
    } catch (e) {
      logger.warn('Group comparison PDF export failed', { error: e });
      setStatus('groupComparisonPdf', 'error', t('pdfError'));
    }
    scheduleReset('groupComparisonPdf', 4000);
  };

  // Export student report PDF
  const handleStudentReportPdfExport = async () => {
    if (!selectedStudentId) {
      setStatus('studentReportPdf', 'error', t('selectStudent'));
      scheduleReset('studentReportPdf', 3000);
      return;
    }
    setStatus('studentReportPdf', 'loading');
    clearMessage('studentReportPdf');
    try {
      const { progress, quizResults } = await getStudentProgress(selectedStudentId);
      const moduleProgress = modules.map((m) => {
        const found = progress.find((p) => p.moduleId === m.id);
        return {
          moduleId: m.title,
          completed: found?.completed ?? false,
          score: found?.score ?? null,
        };
      });
      const quizData = quizResults.map((q, i) => ({
        quizId: t('quizLabel', { n: i + 1 }),
        score: q.score ?? 0,
        total: q.total ?? 100,
        percentage: q.score ?? 0,
      }));
      const student = students.find((s) => s.id === selectedStudentId);
      if (!student) {
        setStatus('studentReportPdf', 'error', t('studentNotFound'));
        return;
      }
      await generateStudentReportPDF(
        {
          fullName: student.fullName,
          email: student.email,
          group: student.group,
          course: '',
          university: '',
        },
        {
          modulesCompleted: progress.filter((p) => p.completed).length,
          totalModules: modules.length,
          avgQuizScore:
            quizResults.length > 0
              ? quizResults.reduce((s, q) => {
                  if (typeof q.percentage === 'number') return s + q.percentage;
                  if (q.score != null && q.total && q.total > 0) return s + (q.score / q.total) * 100;
                  return s + (q.score ?? 0);
                }, 0) / quizResults.length
              : 0,
          engagementScore: 0,
          riskScore: 0,
        },
        moduleProgress,
        quizData,
        [],
      );
      setStatus('studentReportPdf', 'success', t('studentPdfDone'));
    } catch (e) {
      logger.warn('Student report PDF export failed', { error: e });
      setStatus('studentReportPdf', 'error', t('pdfError'));
    }
    scheduleReset('studentReportPdf', 4000);
  };

  // Export quiz retry PDF
  const handleQuizRetryPdfExport = async () => {
    setStatus('quizRetryPdf', 'loading');
    clearMessage('quizRetryPdf');
    try {
      const retryData = await getQuizRetryAnalytics(effectiveDays, groupId);
      await generateQuizRetryPDF(retryData.categoryRetryStats, retryData.topRetryers);
      setStatus('quizRetryPdf', 'success', t('retryPdfDone'));
    } catch (e) {
      logger.warn('Quiz retry PDF export failed', { error: e });
      setStatus('quizRetryPdf', 'error', t('pdfError'));
    }
    scheduleReset('quizRetryPdf', 4000);
  };

  const exportCards = [
    {
      key: 'gradebook' as keyof ExportState,
      icon: FileText,
      title: t('gradebookCsv'),
      description: 'Экспорт полного журнала оценок всех студентов с прогрессом по модулям и средними баллами',
      onClick: handleGradebookExport,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'hover:border-emerald-300',
    },
    {
      key: 'studentReport' as keyof ExportState,
      icon: Download,
      title: t('studentReportCsv'),
      description: t('studentReportCsvDesc'),
      onClick: handleStudentReportExport,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'hover:border-violet-300',
    },
    {
      key: 'analytics' as keyof ExportState,
      icon: BarChart3,
      title: t('analyticsCsv'),
      description: 'Экспорт комплексной аналитики с KPI, распределением баллов и прогрессом по модулям',
      onClick: handleAnalyticsExport,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'hover:border-indigo-300',
    },
    {
      key: 'atRisk' as keyof ExportState,
      icon: AlertTriangle,
      title: t('atRiskCsv'),
      description: 'Экспорт списка студентов в зоне риска с оценками риска, причинами и трендами',
      onClick: handleAtRiskExport,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'hover:border-red-300',
    },
    {
      key: 'groupComparison' as keyof ExportState,
      icon: GitCompare,
      title: t('groupComparisonCsv'),
      description: 'Экспорт сравнительной аналитики групп/курсов/университетов по метрикам',
      onClick: handleGroupComparisonExport,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'hover:border-blue-300',
    },
    {
      key: 'modulePerformance' as keyof ExportState,
      icon: BookOpen,
      title: t('modulesCsv'),
      description: 'Экспорт статистики по каждому модулю: завершение, баллы, сложность',
      onClick: handleModulePerformanceExport,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
    },
    {
      key: 'gradebookPdf' as keyof ExportState,
      icon: FileText,
      title: t('gradebookPdf'),
      description: 'Скачать журнал успеваемости в формате PDF для печати или отправки',
      onClick: handleGradebookPdfExport,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'hover:border-emerald-300',
    },
    {
      key: 'atRiskPdf' as keyof ExportState,
      icon: AlertTriangle,
      title: t('atRiskPdf'),
      description: 'Скачать отчёт по студентам в зоне риска в формате PDF',
      onClick: handleAtRiskPdfExport,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'hover:border-red-300',
    },
    {
      key: 'analyticsPdf' as keyof ExportState,
      icon: BarChart3,
      title: t('analyticsPdf'),
      description: 'Скачать комплексный аналитический отчёт с KPI и метриками в формате PDF',
      onClick: handleAnalyticsPdfExport,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'hover:border-indigo-300',
    },
    {
      key: 'modulePerformancePdf' as keyof ExportState,
      icon: BookOpen,
      title: t('modulesPdf'),
      description: 'Скачать статистику по модулям в формате PDF',
      onClick: handleModulePerformancePdfExport,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
    },
    {
      key: 'groupComparisonPdf' as keyof ExportState,
      icon: GitCompare,
      title: t('groupComparisonPdf'),
      description: 'Скачать сравнительную аналитику групп в формате PDF',
      onClick: handleGroupComparisonPdfExport,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'hover:border-blue-300',
    },
    {
      key: 'studentReportPdf' as keyof ExportState,
      icon: FileText,
      title: t('studentReportPdf'),
      description: t('studentReportPdfDesc'),
      onClick: handleStudentReportPdfExport,
      color: 'text-violet-700',
      bgColor: 'bg-violet-50',
      borderColor: 'hover:border-violet-300',
    },
    {
      key: 'quizRetryPdf' as keyof ExportState,
      icon: Download,
      title: t('quizRetryPdf'),
      description: 'Скачать аналитику по повторам квизов в формате PDF',
      onClick: handleQuizRetryPdfExport,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
      borderColor: 'hover:border-teal-300',
    },
    {
      key: 'print' as keyof ExportState,
      icon: Printer,
      title: t('printReport'),
      description: 'Открыть оптимизированную версию страницы для печати текущего состояния прогресса',
      onClick: handlePrint,
      color: 'text-muted-foreground',
      bgColor: 'bg-secondary',
      borderColor: 'hover:border-border',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Экспортируйте данные о прогрессе студентов в различных форматах
          </p>
        </div>
        {!controlled && (
          <div className="bg-muted flex gap-1 rounded-lg p-1">
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
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <Card className={`border-border bg-card shadow-sm transition-colors ${card.borderColor}`}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl ${card.bgColor} flex flex-shrink-0 items-center justify-center`}
                    >
                      <card.icon size={20} className={card.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">{card.title}</h3>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{card.description}</p>
                    </div>
                  </div>

                  {/* Student dropdown for student report */}
                  {(card.key === 'studentReport' || card.key === 'studentReportPdf') && (
                    <div className="relative mb-3">
                      <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="border-border bg-card hover:border-border flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors"
                      >
                        <span className="text-foreground/70 truncate">
                          {selectedStudent ? selectedStudent.fullName : `${t('selectStudent')}...`}
                        </span>
                        <ChevronDown size={14} className="ml-2 flex-shrink-0 text-slate-400" />
                      </button>

                      {showDropdown && (
                        <div className="bg-card border-border absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-lg">
                          {students.length === 0 ? (
                            <div className="px-3 py-3 text-center text-xs text-slate-400">{t('noStudents')}</div>
                          ) : (
                            students.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className={`hover:bg-secondary w-full px-3 py-2 text-left text-sm transition-colors ${
                                  s.id === selectedStudentId ? 'bg-violet-50 text-violet-700' : 'text-foreground/70'
                                }`}
                                onClick={() => {
                                  setSelectedStudentId(s.id);
                                  setShowDropdown(false);
                                }}
                              >
                                <div className="truncate font-medium">{s.fullName}</div>
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
                    disabled={
                      status === 'loading' ||
                      ((card.key === 'studentReport' || card.key === 'studentReportPdf') && !selectedStudentId)
                    }
                    variant={status === 'success' ? 'default' : 'outline'}
                    className={`w-full text-sm ${
                      status === 'success'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
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
                      className={`mt-2 text-center text-xs ${
                        status === 'success'
                          ? 'text-emerald-600'
                          : status === 'error'
                            ? 'text-red-500'
                            : 'text-muted-foreground'
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPrintPreview(false)}
        >
          <div
            className="bg-card max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-border border-b p-6">
              <h3 className="text-lg font-bold">{t('printPreview')}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{t('printProgress')}</p>
            </div>

            <div className="p-6">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold">{t('studentProgressReport')}</h2>
                <p className="text-muted-foreground text-sm">
                  {new Date().toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
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
                    } catch (e) {
                      logger.warn('AnalyticsExportPanel localStorage parse failed', { error: e });
                      // Intentionally empty — non-critical localStorage parse, defaults to zero
                    }
                  }

                  return (
                    <div key={s.id} className="border-border rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{s.fullName}</h4>
                          <p className="text-muted-foreground text-xs">{s.email}</p>
                          {s.group && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {s.group}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-bold">{moduleCount}</p>
                            <p className="text-muted-foreground text-xs">{t('modules')}</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold">{quizCount}</p>
                            <p className="text-muted-foreground text-xs">{t('quizzes')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {students.length === 0 && <p className="py-4 text-center text-slate-400">{t('noPrintData')}</p>}
              </div>
            </div>

            <div className="border-border flex justify-end gap-3 border-t p-6">
              <Button variant="outline" onClick={() => setPrintPreview(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => {
                  window.print();
                  setPrintPreview(false);
                }}
              >
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
