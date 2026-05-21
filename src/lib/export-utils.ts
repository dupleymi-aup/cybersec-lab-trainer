// Build CSV from headers and rows
export function buildCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

// Trigger browser download of CSV
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Trigger browser download of PDF
async function downloadPDF(pdfBlob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Generate student performance PDF report
export async function generateStudentReportPDF(
  student: { fullName: string; email: string; group: string; course: string; university: string },
  kpis: { modulesCompleted: number; totalModules: number; avgQuizScore: number; engagementScore: number; riskScore: number },
  progress: Array<{ moduleId: string; completed: boolean; score: number | null }>,
  quizResults: Array<{ quizId: string; score: number; total: number; percentage: number }>,
  recommendations: Array<{ title: string; description: string; priority: string }>
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Отчёт по студенту', 14, 20);

  // Student info
  doc.setFontSize(12);
  doc.text(`ФИО: ${student.fullName}`, 14, 35);
  doc.text(`Email: ${student.email}`, 14, 45);
  doc.text(`Группа: ${student.group}`, 14, 55);
  doc.text(`Курс: ${student.course}`, 14, 65);
  doc.text(`Университет: ${student.university}`, 14, 75);

  // KPIs
  doc.setFontSize(14);
  doc.text('Ключевые показатели', 14, 95);
  doc.setFontSize(10);
  doc.text(`Модули: ${kpis.modulesCompleted}/${kpis.totalModules}`, 14, 105);
  doc.text(`Средний балл: ${kpis.avgQuizScore}%`, 70, 105);
  doc.text(`Вовлечённость: ${kpis.engagementScore}`, 126, 105);
  doc.text(`Риск-скор: ${kpis.riskScore}`, 156, 105);

  // Module progress table
  doc.setFontSize(14);
  doc.text('Прогресс по модулям', 14, 120);
  const { autoTable } = await import('jspdf-autotable');
  autoTable(doc, {
    startY: 125,
    head: [['Модуль', 'Пройден', 'Балл (%)']],
    body: progress.map(p => [p.moduleId, p.completed ? 'Да' : 'Нет', p.score?.toString() ?? 'N/A']),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8 },
  });

  // Quiz results
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  doc.setFontSize(14);
  doc.text('Результаты квизов', 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Квиз', 'Правильных', 'Всего', 'Процент (%)']],
    body: quizResults.map(q => [q.quizId, String(q.score), String(q.total), String(q.percentage)]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8 },
  });

  // Recommendations
  if (recommendations && recommendations.length > 0) {
    const recY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFontSize(14);
    doc.text('Рекомендации', 14, recY + 10);
    doc.setFontSize(9);
    recommendations.slice(0, 5).forEach((rec, i) => {
      const y = recY + 20 + i * 15;
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${rec.title}`, 14, y);
      doc.setFont('helvetica', 'normal');
      const splitDesc = doc.splitTextToSize(rec.description, 170);
      doc.text(splitDesc, 20, y + 5);
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — ${new Date().toLocaleDateString('ru-RU')} — Стр. ${i}/${pageCount}`, 14, 290);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, `student-report-${student.fullName.replace(/\s+/g, '-')}.pdf`);
}

// Generate gradebook PDF
export async function generateGradebookPDF(
  students: Array<{ id: string; fullName: string; email: string; group: string; modulesCompleted: number; quizCount: number; avgScore: number }>,
  title: string = 'Журнал успеваемости'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')} | Всего студентов: ${students.length}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'ФИО', 'Email', 'Группа', 'Модули', 'Квизы', 'Ср. балл (%)']],
    body: students.map((s, i) => [
      String(i + 1), s.fullName, s.email, s.group,
      String(s.modulesCompleted), String(s.quizCount), s.avgScore.toFixed(1)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 10 }, 6: { halign: 'center' } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Стр. ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'gradebook.pdf');
}

// Generate at-risk students PDF
export async function generateAtRiskPDF(
  atRiskStudents: Array<{ fullName: string; email: string; group: string; riskScore: number; reasons: string[]; lastActiveDays: number; modulesCompleted: number; avgQuizScore: number }>
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.setTextColor(239, 68, 68);
  doc.text('Студенты с признаками риска', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Всего: ${atRiskStudents.length} | Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'ФИО', 'Email', 'Группа', 'Риск', 'Неактивен (дн.)', 'Модули', 'Ср. балл (%)', 'Причины']],
    body: atRiskStudents.map((s, i) => [
      String(i + 1), s.fullName, s.email, s.group,
      String(s.riskScore), String(s.lastActiveDays),
      String(s.modulesCompleted), String(s.avgQuizScore),
      s.reasons.join('; ')
    ]),
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
    styles: { fontSize: 8 },
    didParseCell: (data: any) => {
      if (data.column.index === 4 && Number(data.cell.raw) >= 70) {
        data.cell.styles.textColor = [239, 68, 68];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Стр. ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'at-risk-students.pdf');
}

// Generate comprehensive analytics PDF
export async function generateAnalyticsPDF(
  summary: { kpis: { totalStudents: number; activeStudents: number; activePercentage: number; avgCompletionRate: number; avgQuizScore: number; totalModulesCompleted: number; totalQuizAttempts: number; engagementScore: number } },
  moduleDistribution: Array<{ moduleId: string; moduleName: string; completionRate: number; avgScore: number }>
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Аналитический отчёт', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 30);

  // KPIs
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text('Ключевые показатели', 14, 45);
  doc.setFontSize(10);
  const kpis = summary.kpis;
  const kpiData = [
    ['Всего студентов', String(kpis.totalStudents)],
    ['Активных', `${kpis.activePercentage}%`],
    ['Ср. завершение', `${kpis.avgCompletionRate}%`],
    ['Ср. балл квизов', `${kpis.avgQuizScore}%`],
    ['Модулей завершено', String(kpis.totalModulesCompleted)],
    ['Попыток квизов', String(kpis.totalQuizAttempts)],
    ['Вовлечённость', String(kpis.engagementScore)],
  ];

  let y = 55;
  kpiData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
    y += 8;
  });

  // Module distribution table
  doc.setFontSize(14);
  doc.text('Прогресс по модулям', 14, y + 10);
  autoTable(doc, {
    startY: y + 15,
    head: [['Модуль', 'Завершение (%)', 'Ср. балл (%)']],
    body: moduleDistribution.map(m => [m.moduleName, String(m.completionRate), String(m.avgScore)]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Стр. ${i}/${pageCount}`, 14, 290);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'analytics-report.pdf');
}

// Generate module performance PDF
export async function generateModulePerformancePDF(
  modules: Array<{ moduleId: string; moduleName: string; totalStudents: number; completedCount: number; completionRate: number; avgScore: number; difficultyIndex: number }>,
  title: string = 'Производительность модулей'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')} | Всего модулей: ${modules.length}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Модуль', 'Всего студентов', 'Завершили', 'Завершение (%)', 'Ср. балл (%)', 'Сложность']],
    body: modules.map((m, i) => [
      String(i + 1), m.moduleName, String(m.totalStudents), String(m.completedCount),
      String(m.completionRate), String(m.avgScore), String(m.difficultyIndex)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 10 }, 4: { halign: 'center' }, 5: { halign: 'center' } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Стр. ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'module-performance.pdf');
}

// Generate group comparison PDF
export async function generateGroupComparisonPDF(
  dimensions: Array<{ name: string; studentCount: number; activeStudents: number; activeRate: number; avgModulesCompleted: number; avgCompletionRate: number; avgQuizScore: number; totalQuizAttempts: number; topModule: string; weakestModule: string }>,
  dimensionType: string = 'group',
  title: string = 'Сравнение групп'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  const label = dimensionType === 'group' ? 'Групп' : dimensionType === 'course' ? 'Курсов' : 'Университетов';
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')} | Всего ${label}: ${dimensions.length}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', dimensionType === 'group' ? 'Группа' : dimensionType === 'course' ? 'Курс' : 'Университет', 'Студенты', 'Активные', 'Активность (%)', 'Ср. модулей', 'Завершение (%)', 'Ср. балл (%)', 'Попытки квизов']],
    body: dimensions.map((d, i) => [
      String(i + 1), d.name, String(d.studentCount), String(d.activeStudents),
      String(d.activeRate), String(d.avgModulesCompleted), String(d.avgCompletionRate),
      String(d.avgQuizScore), String(d.totalQuizAttempts)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 10 } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Стр. ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'group-comparison.pdf');
}

// Generate quiz retry PDF
export async function generateQuizRetryPDF(
  retryData: { categoryRetryStats: Array<{ category: string; totalAttempts: number; uniqueStudents: number }>; topRetryers: Array<{ fullName: string; group: string; retryCount: number }>; totalRetries: number; totalUniqueQuizzes: number },
  title: string = 'Анализ повторов квизов'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')} | Повторов: ${retryData.totalRetries} | Уникальных квизов: ${retryData.totalUniqueQuizzes}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Категория', 'Попытки', 'Студенты']],
    body: retryData.categoryRetryStats.map((c, i) => [
      String(i + 1), c.category, String(c.totalAttempts), String(c.uniqueStudents)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 10 } },
  });

  const retryTableY = (doc as any).lastAutoTable?.finalY || 60;
  if (retryData.topRetryers.length > 0) {
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('Топ студентов по повторам', 14, retryTableY + 10);
    autoTable(doc, {
      startY: retryTableY + 15,
      head: [['#', 'ФИО', 'Группа', 'Повторы']],
      body: retryData.topRetryers.slice(0, 20).map((r, i) => [
        String(i + 1), r.fullName, r.group, String(r.retryCount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 10 } },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Стр. ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'quiz-retry.pdf');
}

// Generate gradebook CSV string
export function generateGradebookCSV(
  students: Array<{ id: string; fullName: string; email: string; group: string; modulesCompleted: number; quizCount: number; avgScore: number; lastActive: string }>,
  _modules: string[]
): string {
  const headers = ['ФИО', 'Email', 'Группа', 'Модули пройдено', 'Квизов пройдено', 'Средний балл (%)', 'Последняя активность'];
  const rows = students.map(s => [
    s.fullName, s.email, s.group, String(s.modulesCompleted), String(s.quizCount),
    s.avgScore.toFixed(1), s.lastActive
  ]);
  return buildCSV(headers, rows);
}

// Generate student report CSV string
export function generateStudentReportCSV(
  student: { fullName: string; email: string; group: string; course: string; university: string },
  progress: Array<{ moduleId: string; completed: boolean; score: number | null }>,
  quizResults: Array<{ quizId: string; score: number; total: number; percentage: number }>
): string {
  const lines: string[] = [];
  lines.push(`Отчёт по студенту: ${student.fullName}`);
  lines.push(`Email: ${student.email}, Группа: ${student.group}, Курс: ${student.course}, Университет: ${student.university}`);
  lines.push('');
  lines.push('Прогресс по модулям');
  lines.push(buildCSV(['Модуль', 'Пройден', 'Балл (%)'],
    progress.map(p => [p.moduleId, p.completed ? 'Да' : 'Нет', p.score?.toString() ?? 'N/A'])
  ));
  lines.push('');
  lines.push('Результаты квизов');
  lines.push(buildCSV(['Квиз', 'Правильных', 'Всего', 'Процент (%)'],
    quizResults.map(q => [q.quizId, String(q.score), String(q.total), String(q.percentage)])
  ));
  return lines.join('\n');
}

// Generate module performance CSV
export function generateModulePerformanceCSV(
  modules: Array<{ moduleId: string; moduleName: string; totalStudents: number; completedCount: number; completionRate: number; avgScore: number; difficultyIndex: number }>
): string {
  const headers = ['Модуль', 'Всего студентов', 'Завершили', 'Завершение (%)', 'Ср. балл (%)', 'Индекс сложности'];
  const rows = modules.map(m => [
    m.moduleName, String(m.totalStudents), String(m.completedCount),
    String(m.completionRate), String(m.avgScore), String(m.difficultyIndex)
  ]);
  return buildCSV(headers, rows);
}

// Generate at-risk students CSV
export function generateAtRiskCSV(
  atRiskStudents: Array<{ fullName: string; email: string; group: string; course: string; university: string; riskScore: number; reasons: string[]; lastActiveDays: number; modulesCompleted: number; avgQuizScore: number; trend: string }>
): string {
  const headers = ['ФИО', 'Email', 'Группа', 'Курс', 'Университет', 'Риск-скор', 'Причины', 'Неактивен (дн.)', 'Модули', 'Ср. балл (%)', 'Тренд'];
  const rows = atRiskStudents.map(s => [
    s.fullName, s.email, s.group, s.course, s.university,
    String(s.riskScore), s.reasons.join('; '), String(s.lastActiveDays),
    String(s.modulesCompleted), String(s.avgQuizScore), s.trend
  ]);
  return buildCSV(headers, rows);
}

// Generate group comparison CSV
export function generateGroupComparisonCSV(
  dimensions: Array<{ name: string; studentCount: number; activeStudents: number; activeRate: number; avgModulesCompleted: number; avgCompletionRate: number; avgQuizScore: number; totalQuizAttempts: number; topModule: string; weakestModule: string }>,
  dimension: string
): string {
  const headers = [dimension === 'group' ? 'Группа' : dimension === 'course' ? 'Курс' : 'Университет', 'Студенты', 'Активные', 'Активность (%)', 'Ср. модулей', 'Завершение (%)', 'Ср. балл (%)', 'Попытки квизов', 'Лучший модуль', 'Слабый модуль'];
  const rows = dimensions.map(d => [
    d.name, String(d.studentCount), String(d.activeStudents), String(d.activeRate),
    String(d.avgModulesCompleted), String(d.avgCompletionRate), String(d.avgQuizScore),
    String(d.totalQuizAttempts), d.topModule, d.weakestModule
  ]);
  return buildCSV(headers, rows);
}

// Generate comprehensive analytics CSV
export function generateAnalyticsCSV(
  summary: { kpis: { totalStudents: number; activeStudents: number; activePercentage: number; avgCompletionRate: number; avgQuizScore: number; totalModulesCompleted: number; totalQuizAttempts: number; engagementScore: number } },
  moduleDistribution: Array<{ moduleId: string; moduleName: string; completionRate: number; avgScore: number }>
): string {
  const lines: string[] = [];
  lines.push('Аналитический отчёт');
  lines.push(`Дата: ${new Date().toLocaleDateString('ru-RU')}`);
  lines.push('');
  lines.push('Ключевые показатели');
  lines.push(buildCSV(
    ['Показатель', 'Значение'],
    [
      ['Всего студентов', String(summary.kpis.totalStudents)],
      ['Активных студентов', String(summary.kpis.activeStudents)],
      ['Активность (%)', `${summary.kpis.activePercentage}%`],
      ['Ср. завершение (%)', `${summary.kpis.avgCompletionRate}%`],
      ['Ср. балл квизов (%)', `${summary.kpis.avgQuizScore}%`],
      ['Модулей завершено', String(summary.kpis.totalModulesCompleted)],
      ['Попыток квизов', String(summary.kpis.totalQuizAttempts)],
      ['Индекс вовлечённости', String(summary.kpis.engagementScore)],
    ]
  ));
  lines.push('');
  lines.push('Прогресс по модулям');
  lines.push(buildCSV(
    ['Модуль', 'Завершение (%)', 'Ср. балл (%)'],
    moduleDistribution.map(m => [m.moduleName, String(m.completionRate), String(m.avgScore)])
  ));
  return lines.join('\n');
}
