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
