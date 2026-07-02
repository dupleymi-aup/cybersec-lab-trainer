'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getComprehensiveSummary } from '@/lib/auth-store';
import { modules } from '@/lib/data';

async function downloadPDF(pdfBlob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExecutiveSummaryExport({ groupId, days }: { groupId?: string; days?: number }) {
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
      doc.text('Итоговый отчёт', 105, 80, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(150);
      doc.text(`Период: ${days || 30} дней`, 105, 100, { align: 'center' });
      doc.text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 110, { align: 'center' });
      if (groupId) {
        doc.text(`Группа: ${groupId}`, 105, 120, { align: 'center' });
      }

      // Page 2: KPIs
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Ключевые показатели', 14, 20);

      const kpiData = [
        ['Всего студентов', String(kpis.totalStudents), trends.students === 'up' ? '+' : trends.students === 'down' ? '-' : ''],
        ['Активных', `${kpis.activePercentage}%`, trends.activity === 'up' ? '+' : trends.activity === 'down' ? '-' : ''],
        ['Ср. завершение', `${kpis.avgCompletionRate}%`, trends.completion === 'up' ? '+' : trends.completion === 'down' ? '-' : ''],
        ['Ср. балл квизов', `${kpis.avgQuizScore}%`, trends.quizScore === 'up' ? '+' : trends.quizScore === 'down' ? '-' : ''],
        ['Модулей завершено', String(kpis.totalModulesCompleted), ''],
        ['Попыток квизов', String(kpis.totalQuizAttempts), ''],
        ['Вовлечённость', String(kpis.engagementScore), ''],
      ];

      autoTable(doc, {
        startY: 30,
        head: [['Показатель', 'Значение', 'Тренд']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 11 },
        columnStyles: { 0: { fontStyle: 'bold' }, 2: { halign: 'center' } },
      });

      // Page 3: Score Distribution
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Распределение баллов', 14, 20);

      const scoreData = [
        ['Отлично (90%+)', String(scoreDistribution.excellent)],
        ['Хорошо (70-89%)', String(scoreDistribution.good)],
        ['Средне (50-69%)', String(scoreDistribution.average)],
        ['Плохо (<50%)', String(scoreDistribution.poor)],
        ['Не attempted', String(scoreDistribution.notAttempted)],
      ].filter(([, v]) => parseInt(v) > 0);

      autoTable(doc, {
        startY: 30,
        head: [['Категория', 'Количество студентов']],
        body: scoreData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 11 },
      });

      // Page 4: Module Performance
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Прогресс по модулям', 14, 20);

      const moduleTable = moduleDistribution.map((m) => {
        const mod = modules.find((mod) => mod.id === m.moduleId);
        return [mod?.title || m.moduleId, `${Math.round(m.completionRate)}%`, `${Math.round(m.avgScore)}%`];
      });

      autoTable(doc, {
        startY: 30,
        head: [['Модуль', 'Завершение', 'Ср. балл']],
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
        doc.text('Топ студентов', 14, 20);

        const topTable = topPerformers.slice(0, 10).map((s, i) => [
          String(i + 1),
          s.fullName,
          s.group || '—',
          `${s.score}%`,
        ]);

        autoTable(doc, {
          startY: 30,
          head: [['#', 'ФИО', 'Группа', 'Балл']],
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
        doc.text('Последняя активность', 14, 20);

        const activityTable = recentActivity.slice(0, 15).map((a) => [
          a.fullName,
          a.details,
          new Date(a.timestamp).toLocaleDateString('ru-RU'),
        ]);

        autoTable(doc, {
          startY: 30,
          head: [['Студент', 'Действие', 'Дата']],
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
        doc.text(`CyberSec Lab Trainer — Стр. ${i}/${pageCount}`, 14, 290);
      }

      const pdfBlob = doc.output('blob');
      const date = new Date().toISOString().split('T')[0];
      await downloadPDF(pdfBlob, `executive-summary-${date}.pdf`);
      toast.success('Итоговый отчёт скачан');
    } catch (error) {
      toast.error('Ошибка генерации отчёта');
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') console.error('[ExecutiveSummaryExport] PDF generation failed:', error);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={generating} variant="outline" size="sm" className="gap-2">
      {generating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <FileDown size={16} />
      )}
      {generating ? 'Генерация...' : 'Экспорт PDF'}
    </Button>
  );
}
