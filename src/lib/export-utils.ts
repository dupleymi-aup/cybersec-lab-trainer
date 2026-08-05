// Build CSV from headers and rows
export function buildCSV(headers: string[], rows: string[][]): string {
  // Sanitize value to prevent CSV injection attacks (formula injection)
  // Characters like =, +, -, @, \t, \r can start formulas in Excel/Google Sheets
  const sanitize = (v: string): string => {
    const value = String(v ?? '');
    if (value.match(/^[=+\-@\t\r]/)) {
      return "'" + value; // Prefix with single quote to prevent formula execution
    }
    return value;
  };
  const escape = (v: string) => {
    const sanitized = sanitize(v);
    return `"${sanitized.replace(/"/g, '""')}"`;
  };
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

interface JsPdfWithAutoTable {
  lastAutoTable?: { finalY?: number };
}

import { resolveLocale } from './locale-utils';

function formatDate(date: Date, locale?: string): string {
  return date.toLocaleDateString(resolveLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
  student: {
    fullName: string;
    email: string;
    group: string;
    course: string;
    university: string;
  },
  kpis: {
    modulesCompleted: number;
    totalModules: number;
    avgQuizScore: number;
    engagementScore: number;
    riskScore: number;
  },
  progress: Array<{
    moduleId: string;
    completed: boolean;
    score: number | null;
  }>,
  quizResults: Array<{
    quizId: string;
    score: number;
    total: number;
    percentage: number;
  }>,
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
  }>,
  locale?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Student Report', 14, 20);

  // Student info
  doc.setFontSize(12);
  doc.text(`Name: ${student.fullName}`, 14, 35);
  doc.text(`Email: ${student.email}`, 14, 45);
  doc.text(`Group: ${student.group}`, 14, 55);
  doc.text(`Course: ${student.course}`, 14, 65);
  doc.text(`University: ${student.university}`, 14, 75);

  // KPIs
  doc.setFontSize(14);
  doc.text('Key Metrics', 14, 95);
  doc.setFontSize(10);
  doc.text(`Modules: ${kpis.modulesCompleted}/${kpis.totalModules}`, 14, 105);
  doc.text(`Avg Score: ${kpis.avgQuizScore}%`, 70, 105);
  doc.text(`Engagement: ${kpis.engagementScore}`, 126, 105);
  doc.text(`Risk Score: ${kpis.riskScore}`, 156, 105);

  // Module progress table
  doc.setFontSize(14);
  doc.text('Module Progress', 14, 120);
  const { autoTable } = await import('jspdf-autotable');
  autoTable(doc, {
    startY: 125,
    head: [['Module', 'Completed', 'Score (%)']],
    body: progress.map((p) => [p.moduleId, p.completed ? 'Yes' : 'No', p.score?.toString() ?? 'N/A']),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8 },
  });

  // Quiz results
  const finalY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || 150;
  doc.setFontSize(14);
  doc.text('Quiz Results', 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Quiz', 'Correct', 'Total', 'Percentage (%)']],
    body: quizResults.map((q) => [q.quizId, String(q.score), String(q.total), String(q.percentage)]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8 },
  });

  // Recommendations
  if (recommendations && recommendations.length > 0) {
    const recY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || 200;
    doc.setFontSize(14);
    doc.text('Recommendations', 14, recY + 10);
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
    doc.text(`CyberSec Lab Trainer — ${formatDate(new Date(), locale)} — Page ${i}/${pageCount}`, 14, 290);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, `student-report-${student.fullName.replace(/\s+/g, '-')}.pdf`);
}

// Generate gradebook PDF
export async function generateGradebookPDF(
  students: Array<{
    id: string;
    fullName: string;
    email: string;
    group: string;
    modulesCompleted: number;
    quizCount: number;
    avgScore: number;
  }>,
  locale?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Gradebook', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Date: ${formatDate(new Date(), locale)} | Total Students: ${students.length}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Name', 'Email', 'Group', 'Modules', 'Quizzes', 'Avg Score (%)']],
    body: students.map((s, i) => [
      String(i + 1),
      s.fullName,
      s.email,
      s.group,
      String(s.modulesCompleted),
      String(s.quizCount),
      s.avgScore.toFixed(1),
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
    doc.text(`CyberSec Lab Trainer — Page ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'gradebook.pdf');
}

// Generate at-risk students PDF
export async function generateAtRiskPDF(
  atRiskStudents: Array<{
    fullName: string;
    email: string;
    group: string;
    riskScore: number;
    reasons: string[];
    lastActiveDays: number;
    modulesCompleted: number;
    avgQuizScore: number;
  }>,
  locale?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.setTextColor(239, 68, 68);
  doc.text('At-Risk Students', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Total: ${atRiskStudents.length} | Date: ${formatDate(new Date(), locale)}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Name', 'Email', 'Group', 'Risk', 'Inactive (days)', 'Modules', 'Avg Score (%)', 'Reasons']],
    body: atRiskStudents.map((s, i) => [
      String(i + 1),
      s.fullName,
      s.email,
      s.group,
      String(s.riskScore),
      String(s.lastActiveDays),
      String(s.modulesCompleted),
      String(s.avgQuizScore),
      s.reasons.join('; '),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
    styles: { fontSize: 8 },
    didParseCell: (cellData) => {
      if (cellData.column.index === 4 && Number(cellData.cell.raw) >= 70) {
        cellData.cell.styles.textColor = [239, 68, 68];
        cellData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Page ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'at-risk-students.pdf');
}

// Generate comprehensive analytics PDF
export async function generateAnalyticsPDF(
  summary: {
    kpis: {
      totalStudents: number;
      activeStudents: number;
      activePercentage: number;
      avgCompletionRate: number;
      avgQuizScore: number;
      totalModulesCompleted: number;
      totalQuizAttempts: number;
      engagementScore: number;
    };
    moduleDistribution?: Array<{
      moduleId: string;
      moduleName: string;
      completionRate: number;
      avgScore: number;
    }>;
  },
  moduleDistribution?: Array<{
    moduleId: string;
    moduleName: string;
    completionRate: number;
    avgScore: number;
  }>,
  locale?: string,
): Promise<void> {
  const dist = moduleDistribution || summary.moduleDistribution || [];
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Analytics Report', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Date: ${formatDate(new Date(), locale)}`, 14, 30);

  // KPIs
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text('Key Metrics', 14, 45);
  doc.setFontSize(10);
  const kpis = summary.kpis;
  const kpiData = [
    ['Total Students', String(kpis.totalStudents)],
    ['Active', `${kpis.activePercentage}%`],
    ['Avg Completion', `${kpis.avgCompletionRate}%`],
    ['Avg Quiz Score', `${kpis.avgQuizScore}%`],
    ['Modules Completed', String(kpis.totalModulesCompleted)],
    ['Quiz Attempts', String(kpis.totalQuizAttempts)],
    ['Engagement', String(kpis.engagementScore)],
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
  doc.text('Module Progress', 14, y + 10);
  autoTable(doc, {
    startY: y + 15,
    head: [['Module', 'Completion (%)', 'Avg Score (%)']],
    body: dist.map((m) => [m.moduleName, String(m.completionRate), String(m.avgScore)]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Page ${i}/${pageCount}`, 14, 290);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'analytics-report.pdf');
}

// Generate module performance PDF
export async function generateModulePerformancePDF(
  modules: Array<{
    moduleId: string;
    moduleName: string;
    totalStudents: number;
    completedCount: number;
    completionRate: number;
    avgScore: number;
    difficultyIndex: number;
  }>,
  locale?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Module Performance', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Date: ${formatDate(new Date(), locale)} | Total Modules: ${modules.length}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Module', 'Total Students', 'Completed', 'Completion (%)', 'Avg Score (%)', 'Difficulty']],
    body: modules.map((m, i) => [
      String(i + 1),
      m.moduleName,
      String(m.totalStudents),
      String(m.completedCount),
      String(m.completionRate),
      String(m.avgScore),
      String(m.difficultyIndex),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CyberSec Lab Trainer — Page ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'module-performance.pdf');
}

// Generate group comparison PDF
export async function generateGroupComparisonPDF(
  dimensions: Array<{
    name: string;
    studentCount: number;
    activeStudents: number;
    activeRate: number;
    avgModulesCompleted: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    totalQuizAttempts: number;
    topModule: string;
    weakestModule: string;
  }>,
  locale?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Group Comparison', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Date: ${formatDate(new Date(), locale)} | Total Groups: ${dimensions.length}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [
      [
        '#',
        'Group',
        'Students',
        'Active',
        'Activity (%)',
        'Avg Modules',
        'Completion (%)',
        'Avg Score (%)',
        'Quiz Attempts',
      ],
    ],
    body: dimensions.map((d, i) => [
      String(i + 1),
      d.name,
      String(d.studentCount),
      String(d.activeStudents),
      String(d.activeRate),
      String(d.avgModulesCompleted),
      String(d.avgCompletionRate),
      String(d.avgQuizScore),
      String(d.totalQuizAttempts),
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
    doc.text(`CyberSec Lab Trainer — Page ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'group-comparison.pdf');
}

// Generate quiz retry PDF
export async function generateQuizRetryPDF(
  categoryRetryStats: Array<{
    category: string;
    totalAttempts: number;
    uniqueStudents: number;
  }>,
  topRetryers: Array<{
    fullName: string;
    group: string;
    retryCount: number;
  }> = [],
  locale?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  const totalRetries = categoryRetryStats.reduce((sum, c) => sum + c.totalAttempts, 0);
  const totalUniqueQuizzes = categoryRetryStats.length;

  doc.setFontSize(16);
  doc.text('Quiz Retry Analysis', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(
    `Date: ${formatDate(new Date(), locale)} | Retries: ${totalRetries} | Unique Quizzes: ${totalUniqueQuizzes}`,
    14,
    30,
  );

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Category', 'Attempts', 'Students']],
    body: categoryRetryStats.map((c, i) => [
      String(i + 1),
      c.category,
      String(c.totalAttempts),
      String(c.uniqueStudents),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 10 } },
  });

  const retryTableY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || 60;
  if (topRetryers.length > 0) {
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('Top Students by Retries', 14, retryTableY + 10);
    autoTable(doc, {
      startY: retryTableY + 15,
      head: [['#', 'Name', 'Group', 'Retries']],
      body: topRetryers.slice(0, 20).map((r, i) => [String(i + 1), r.fullName, r.group, String(r.retryCount)]),
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
    doc.text(`CyberSec Lab Trainer — Page ${i}/${pageCount}`, 14, 200);
  }

  const pdfBlob = doc.output('blob');
  await downloadPDF(pdfBlob, 'quiz-retry.pdf');
}

// Generate gradebook CSV string
export function generateGradebookCSV(
  students: Array<{
    id: string;
    fullName: string;
    email: string;
    group: string;
    modulesCompleted: number;
    quizCount: number;
    avgScore: number;
    lastActive: string;
  }>,
): string {
  const headers = [
    'Name',
    'Email',
    'Group',
    'Modules Completed',
    'Quizzes Completed',
    'Avg Score (%)',
    'Last Active',
  ];
  const rows = students.map((s) => [
    s.fullName,
    s.email,
    s.group,
    String(s.modulesCompleted),
    String(s.quizCount),
    s.avgScore.toFixed(1),
    s.lastActive,
  ]);
  return buildCSV(headers, rows);
}

// Generate student report CSV string
export function generateStudentReportCSV(
  student: {
    fullName: string;
    email: string;
    group: string;
    course: string;
    university: string;
  },
  progress: Array<{
    moduleId: string;
    completed: boolean;
    score: number | null;
  }>,
  quizResults: Array<{
    quizId: string;
    score: number;
    total: number;
    percentage: number;
  }>,
): string {
  const lines: string[] = [];
  lines.push(`Student Report: ${student.fullName}`);
  lines.push(
    `Email: ${student.email}, Group: ${student.group}, Course: ${student.course}, University: ${student.university}`,
  );
  lines.push('');
  lines.push('Module Progress');
  lines.push(
    buildCSV(
      ['Module', 'Completed', 'Score (%)'],
      progress.map((p) => [p.moduleId, p.completed ? 'Yes' : 'No', p.score?.toString() ?? 'N/A']),
    ),
  );
  lines.push('');
  lines.push('Quiz Results');
  lines.push(
    buildCSV(
      ['Quiz', 'Correct', 'Total', 'Percentage (%)'],
      quizResults.map((q) => [q.quizId, String(q.score), String(q.total), String(q.percentage)]),
    ),
  );
  return lines.join('\n');
}

// Generate module performance CSV
export function generateModulePerformanceCSV(
  modules: Array<{
    moduleId: string;
    moduleName: string;
    totalStudents: number;
    completedCount: number;
    completionRate: number;
    avgScore: number;
    difficultyIndex: number;
  }>,
): string {
  const headers = ['Module', 'Total Students', 'Completed', 'Completion (%)', 'Avg Score (%)', 'Difficulty Index'];
  const rows = modules.map((m) => [
    m.moduleName,
    String(m.totalStudents),
    String(m.completedCount),
    String(m.completionRate),
    String(m.avgScore),
    String(m.difficultyIndex),
  ]);
  return buildCSV(headers, rows);
}

// Generate at-risk students CSV
export function generateAtRiskCSV(
  atRiskStudents: Array<{
    fullName: string;
    email: string;
    group: string;
    course: string;
    university: string;
    riskScore: number;
    reasons: string[];
    lastActiveDays: number;
    modulesCompleted: number;
    avgQuizScore: number;
    trend: string;
  }>,
): string {
  const headers = [
    'Name',
    'Email',
    'Group',
    'Course',
    'University',
    'Risk Score',
    'Reasons',
    'Inactive (days)',
    'Modules',
    'Avg Score (%)',
    'Trend',
  ];
  const rows = atRiskStudents.map((s) => [
    s.fullName,
    s.email,
    s.group,
    s.course,
    s.university,
    String(s.riskScore),
    s.reasons.join('; '),
    String(s.lastActiveDays),
    String(s.modulesCompleted),
    String(s.avgQuizScore),
    s.trend,
  ]);
  return buildCSV(headers, rows);
}

// Generate group comparison CSV
export function generateGroupComparisonCSV(
  dimensions: Array<{
    name: string;
    studentCount: number;
    activeStudents: number;
    activeRate: number;
    avgModulesCompleted: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    totalQuizAttempts: number;
    topModule: string;
    weakestModule: string;
  }>,
  dimension: string,
): string {
  const headers = [
    dimension === 'group' ? 'Group' : dimension === 'course' ? 'Course' : 'University',
    'Students',
    'Active',
    'Activity (%)',
    'Avg Modules',
    'Completion (%)',
    'Avg Score (%)',
    'Quiz Attempts',
    'Top Module',
    'Weakest Module',
  ];
  const rows = dimensions.map((d) => [
    d.name,
    String(d.studentCount),
    String(d.activeStudents),
    String(d.activeRate),
    String(d.avgModulesCompleted),
    String(d.avgCompletionRate),
    String(d.avgQuizScore),
    String(d.totalQuizAttempts),
    d.topModule,
    d.weakestModule,
  ]);
  return buildCSV(headers, rows);
}

// Generate comprehensive analytics CSV
export function generateAnalyticsCSV(
  summary: {
    kpis: {
      totalStudents: number;
      activeStudents: number;
      activePercentage: number;
      avgCompletionRate: number;
      avgQuizScore: number;
      totalModulesCompleted: number;
      totalQuizAttempts: number;
      engagementScore: number;
    };
  },
  moduleDistribution: Array<{
    moduleId: string;
    moduleName: string;
    completionRate: number;
    avgScore: number;
  }>,
): string {
  const lines: string[] = [];
  lines.push('Analytics Report');
  lines.push(`Date: ${formatDate(new Date())}`);
  lines.push('');
  lines.push('Key Metrics');
  lines.push(
    buildCSV(
      ['Metric', 'Value'],
      [
        ['Total Students', String(summary.kpis.totalStudents)],
        ['Active Students', String(summary.kpis.activeStudents)],
        ['Activity (%)', `${summary.kpis.activePercentage}%`],
        ['Avg Completion (%)', `${summary.kpis.avgCompletionRate}%`],
        ['Avg Quiz Score (%)', `${summary.kpis.avgQuizScore}%`],
        ['Modules Completed', String(summary.kpis.totalModulesCompleted)],
        ['Quiz Attempts', String(summary.kpis.totalQuizAttempts)],
        ['Engagement Index', String(summary.kpis.engagementScore)],
      ],
    ),
  );
  lines.push('');
  lines.push('Module Progress');
  lines.push(
    buildCSV(
      ['Module', 'Completion (%)', 'Avg Score (%)'],
      moduleDistribution.map((m) => [m.moduleName, String(m.completionRate), String(m.avgScore)]),
    ),
  );
  return lines.join('\n');
}
