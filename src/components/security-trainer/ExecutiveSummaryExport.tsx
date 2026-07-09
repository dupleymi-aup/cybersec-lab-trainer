'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getComprehensiveSummary } from '@/lib/auth-store';
import { useDateFormatter } from '@/lib/format';
import { modules } from '@/lib/data';
import { logger } from '@/lib/logger';

async function downloadPDF(pdfBlob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExecutiveSummaryExport({ groupId, days }: { groupId?: string; days?: number }) {
  const t = useTranslations('executiveSummary');
  const formatDate = useDateFormatter();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      const summary = await getComprehensiveSummary(days || 30, groupId);
      const { kpis, trends, moduleDistribution, topPerformers, recentActivity, scoreDistribution } = summary;

      // Title page
      doc.setFontSize(24);
      doc.setTextColor(99, 102, 241);
      doc.text('CyberSec Lab Trainer', 105, 60, { align: 'center' });
      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.text(t('finalReport'), 105, 80, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(150);
      doc.text(t('period', { days: days || 30 }), 105, 100, { align: 'center' });
      doc.text(
        t('generationDate', { date: new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) }),
        105,
        110,
        { align: 'center' },
      );
      if (groupId) {
        doc.text(t('group', { groupId }), 105, 120, { align: 'center' });
      }

      // Page 2: KPIs
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text(t('keyMetrics'), 14, 20);

      const kpiData = [
        [
          t('totalStudents'),
          String(kpis.totalStudents),
          trends.students === 'up' ? '+' : trends.students === 'down' ? '-' : '',
        ],
        [
          t('active'),
          `${kpis.activePercentage}%`,
          trends.activity === 'up' ? '+' : trends.activity === 'down' ? '-' : '',
        ],
        [
          t('avgCompletion'),
          `${kpis.avgCompletionRate}%`,
          trends.completion === 'up' ? '+' : trends.completion === 'down' ? '-' : '',
        ],
        [
          t('avgQuizScore'),
          `${kpis.avgQuizScore}%`,
          trends.quizScore === 'up' ? '+' : trends.quizScore === 'down' ? '-' : '',
        ],
        [t('modulesCompleted'), String(kpis.totalModulesCompleted), ''],
        [t('quizAttempts'), String(kpis.totalQuizAttempts), ''],
        [t('engagement'), String(kpis.engagementScore), ''],
      ];

      autoTable(doc, {
        startY: 30,
        head: [[t('metric'), t('value'), t('trend')]],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 11 },
        columnStyles: { 0: { fontStyle: 'bold' }, 2: { halign: 'center' } },
      });

      // Page 3: Score Distribution
      doc.addPage();
      doc.setFontSize(16);
      doc.text(t('scoreDistribution'), 14, 20);

      const scoreData = [
        [t('excellent'), String(scoreDistribution.excellent)],
        [t('good'), String(scoreDistribution.good)],
        [t('average'), String(scoreDistribution.average)],
        [t('poor'), String(scoreDistribution.poor)],
        [t('notAttempted'), String(scoreDistribution.notAttempted)],
      ].filter(([, v]) => parseInt(v) > 0);

      autoTable(doc, {
        startY: 30,
        head: [[t('category'), t('studentCount')]],
        body: scoreData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 11 },
      });

      // Page 4: Module Performance
      doc.addPage();
      doc.setFontSize(16);
      doc.text(t('moduleProgress'), 14, 20);

      const moduleTable = moduleDistribution.map((m) => {
        const mod = modules.find((mod) => mod.id === m.moduleId);
        return [mod?.title || m.moduleId, `${Math.round(m.completionRate)}%`, `${Math.round(m.avgScore)}%`];
      });

      autoTable(doc, {
        startY: 30,
        head: [[t('module'), t('completion'), t('avgScore')]],
        body: moduleTable,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 10 },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
      });

      // Page 5: Top Performers
      if (topPerformers.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text(t('topStudents'), 14, 20);

        const topTable = topPerformers
          .slice(0, 10)
          .map((s, i) => [String(i + 1), s.fullName, s.group || '—', `${s.score}%`]);

        autoTable(doc, {
          startY: 30,
          head: [[t('number'), t('fullName'), t('groupHeader'), t('score')]],
          body: topTable,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          styles: { fontSize: 10 },
          columnStyles: { 0: { halign: 'center' }, 3: { halign: 'center' } },
        });
      }

      // Page 6: Recent Activity
      if (recentActivity.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text(t('recentActivity'), 14, 20);

        const activityTable = recentActivity.slice(0, 15).map((a) => [a.fullName, a.details, formatDate(a.timestamp)]);

        autoTable(doc, {
          startY: 30,
          head: [[t('student'), t('action'), t('date')]],
          body: activityTable,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          styles: { fontSize: 9 },
          columnStyles: { 2: { halign: 'center' } },
        });
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(t('footer', { current: i, total: pageCount }), 14, 290);
      }

      const pdfBlob = doc.output('blob');
      const date = new Date().toISOString().split('T')[0];
      await downloadPDF(pdfBlob, `executive-summary-${date}.pdf`);
      toast.success(t('reportDownloaded'));
    } catch (error) {
      toast.error(t('generationError'));
      logger.error('ExecutiveSummaryExport PDF generation failed', { error });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={generating} variant="outline" size="sm" className="gap-2">
      {generating ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
      {generating ? t('generating') : t('exportPdf')}
    </Button>
  );
}
