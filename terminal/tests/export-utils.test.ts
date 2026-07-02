import { describe, it, expect } from 'vitest';
import {
  generateGradebookCSV,
  generateStudentReportCSV,
  generateModulePerformanceCSV,
  generateAtRiskCSV,
  generateGroupComparisonCSV,
  generateAnalyticsCSV,
} from '@/lib/export-utils';

describe('generateGradebookCSV', () => {
  const students = [
    { id: '1', fullName: 'Иван Петров', email: 'ivan@test.com', group: 'Б-123', modulesCompleted: 5, quizCount: 10, avgScore: 85.5, lastActive: '2026-06-01' },
    { id: '2', fullName: 'Мария Смирнова', email: 'maria@test.com', group: 'Б-123', modulesCompleted: 3, quizCount: 7, avgScore: 72.3, lastActive: '2026-05-28' },
  ];

  it('should include header row with all columns', () => {
    const csv = generateGradebookCSV(students, []);
    expect(csv).toContain('ФИО');
    expect(csv).toContain('Email');
    expect(csv).toContain('Группа');
    expect(csv).toContain('Средний балл');
  });

  it('should include student data rows', () => {
    const csv = generateGradebookCSV(students, []);
    expect(csv).toContain('Иван Петров');
    expect(csv).toContain('ivan@test.com');
    expect(csv).toContain('85.5');
    expect(csv).toContain('Мария Смирнова');
  });

  it('should handle empty students array', () => {
    const csv = generateGradebookCSV([], []);
    expect(csv).toContain('ФИО');
    expect(csv).not.toContain('Иван');
  });
});

describe('generateStudentReportCSV', () => {
  const student = { fullName: 'Иван Петров', email: 'ivan@test.com', group: 'Б-123', course: '3', university: 'МГУ' };
  const progress = [
    { moduleId: 'owasp', completed: true, score: 90 },
    { moduleId: 'sql-injection', completed: false, score: null },
  ];
  const quizResults = [
    { quizId: 'sql', score: 8, total: 10, percentage: 80 },
    { quizId: 'xss', score: 5, total: 10, percentage: 50 },
  ];

  it('should contain student info header', () => {
    const csv = generateStudentReportCSV(student, progress, quizResults);
    expect(csv).toContain('Иван Петров');
    expect(csv).toContain('ivan@test.com');
    expect(csv).toContain('МГУ');
  });

  it('should contain module progress section', () => {
    const csv = generateStudentReportCSV(student, progress, quizResults);
    expect(csv).toContain('Прогресс по модулям');
    expect(csv).toContain('owasp');
    expect(csv).toContain('sql-injection');
  });

  it('should contain quiz results section', () => {
    const csv = generateStudentReportCSV(student, progress, quizResults);
    expect(csv).toContain('Результаты квизов');
    expect(csv).toContain('sql');
    expect(csv).toContain('xss');
  });

  it('should handle score null as N/A', () => {
    const csv = generateStudentReportCSV(student, progress, quizResults);
    expect(csv).toContain('N/A');
  });
});

describe('generateModulePerformanceCSV', () => {
  const modules = [
    { moduleId: 'owasp', moduleName: 'OWASP Top 10', totalStudents: 30, completedCount: 20, completionRate: 66.7, avgScore: 75.5, difficultyIndex: 0.6 },
    { moduleId: 'xss', moduleName: 'XSS', totalStudents: 30, completedCount: 25, completionRate: 83.3, avgScore: 82.0, difficultyIndex: 0.4 },
  ];

  it('should include module headers', () => {
    const csv = generateModulePerformanceCSV(modules);
    expect(csv).toContain('Модуль');
    expect(csv).toContain('Завершение (%)');
    expect(csv).toContain('Ср. балл (%)');
  });

  it('should include module data', () => {
    const csv = generateModulePerformanceCSV(modules);
    expect(csv).toContain('OWASP Top 10');
    expect(csv).toContain('XSS');
    expect(csv).toContain('66.7');
  });

  it('should handle empty modules', () => {
    const csv = generateModulePerformanceCSV([]);
    expect(csv).toContain('Модуль');
  });
});

describe('generateAtRiskCSV', () => {
  const students = [
    { fullName: 'Иван Петров', email: 'ivan@test.com', group: 'Б-123', course: '3', university: 'МГУ', riskScore: 85, reasons: ['Низкая активность', 'Просроченные дедлайны'], lastActiveDays: 14, modulesCompleted: 1, avgQuizScore: 45, trend: 'worsening' },
    { fullName: 'Анна Иванова', email: 'anna@test.com', group: 'Б-124', course: '2', university: 'МФТИ', riskScore: 30, reasons: [], lastActiveDays: 3, modulesCompleted: 4, avgQuizScore: 70, trend: 'stable' },
  ];

  it('should include risk headers', () => {
    const csv = generateAtRiskCSV(students);
    expect(csv).toContain('ФИО');
    expect(csv).toContain('Риск-скор');
    expect(csv).toContain('Причины');
    expect(csv).toContain('Тренд');
  });

  it('should include student risk data', () => {
    const csv = generateAtRiskCSV(students);
    expect(csv).toContain('Иван Петров');
    expect(csv).toContain('85');
    expect(csv).toContain('Низкая активность');
    expect(csv).toContain('worsening');
  });

  it('should join multiple reasons with semicolon', () => {
    const csv = generateAtRiskCSV(students);
    expect(csv).toContain('Низкая активность; Просроченные дедлайны');
  });
});

describe('generateGroupComparisonCSV', () => {
  const dimensions = [
    { name: 'Б-123', studentCount: 15, activeStudents: 12, activeRate: 80, avgModulesCompleted: 4.5, avgCompletionRate: 60, avgQuizScore: 75, totalQuizAttempts: 120, topModule: 'XSS', weakestModule: 'CSRF' },
    { name: 'Б-124', studentCount: 12, activeStudents: 8, activeRate: 66.7, avgModulesCompleted: 3.2, avgCompletionRate: 45, avgQuizScore: 68, totalQuizAttempts: 85, topModule: 'OWASP', weakestModule: 'SQL Injection' },
  ];

  it('should include comparison headers with group label', () => {
    const csv = generateGroupComparisonCSV(dimensions, 'group');
    expect(csv).toContain('Группа');
    expect(csv).toContain('Студенты');
    expect(csv).toContain('Лучший модуль');
    expect(csv).toContain('Слабый модуль');
  });

  it('should include dimension data', () => {
    const csv = generateGroupComparisonCSV(dimensions, 'group');
    expect(csv).toContain('Б-123');
    expect(csv).toContain('Б-124');
    expect(csv).toContain('CSRF');
  });
});

describe('generateAnalyticsCSV', () => {
  const summary = {
    kpis: { totalStudents: 50, activeStudents: 35, activePercentage: 70, avgCompletionRate: 55.5, avgQuizScore: 72.3, totalModulesCompleted: 180, totalQuizAttempts: 450, engagementScore: 7.5 },
  };
  const moduleDistribution = [
    { moduleId: 'owasp', moduleName: 'OWASP Top 10', completionRate: 66.7, avgScore: 75 },
    { moduleId: 'xss', moduleName: 'XSS', completionRate: 80, avgScore: 82 },
  ];

  it('should include analytics header', () => {
    const csv = generateAnalyticsCSV(summary, moduleDistribution);
    expect(csv).toContain('Аналитический отчёт');
  });

  it('should include KPI data', () => {
    const csv = generateAnalyticsCSV(summary, moduleDistribution);
    expect(csv).toContain('Всего студентов');
    expect(csv).toContain('50');
    expect(csv).toContain('Активных студентов');
    expect(csv).toContain('35');
  });

  it('should include module distribution', () => {
    const csv = generateAnalyticsCSV(summary, moduleDistribution);
    expect(csv).toContain('OWASP Top 10');
    expect(csv).toContain('XSS');
    expect(csv).toContain('66.7');
  });
});
