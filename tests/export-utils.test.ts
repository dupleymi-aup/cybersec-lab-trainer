import { describe, it, expect } from 'vitest';
import {
  buildCSV,
  generateGradebookCSV,
  generateStudentReportCSV,
  generateModulePerformanceCSV,
  generateAtRiskCSV,
  generateGroupComparisonCSV,
  generateAnalyticsCSV,
} from '@/lib/export-utils';

describe('buildCSV', () => {
  it('builds simple CSV from headers and rows', () => {
    const result = buildCSV(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']]);
    expect(result).toContain('"Name","Age"');
    expect(result).toContain('"Alice","30"');
    expect(result).toContain('"Bob","25"');
  });

  it('handles empty rows', () => {
    const result = buildCSV(['Col1'], []);
    expect(result).toBe('"Col1"');
  });

  it('escapes double quotes', () => {
    const result = buildCSV(['Val'], [['he said "hello"']]);
    expect(result).toContain('"he said ""hello"""');
  });

  it('sanitizes CSV injection with = prefix', () => {
    const result = buildCSV(['Val'], [['=SUM(A1:A10)']]);
    expect(result).toContain("'=SUM(A1:A10)");
  });

  it('sanitizes CSV injection with + prefix', () => {
    const result = buildCSV(['Val'], [['+cmd']]);
    expect(result).toContain("'+cmd");
  });

  it('sanitizes CSV injection with - prefix', () => {
    const result = buildCSV(['Val'], [['-cmd']]);
    expect(result).toContain("'-cmd");
  });

  it('sanitizes CSV injection with @ prefix', () => {
    const result = buildCSV(['Val'], [['@SUM(1,1)']]);
    expect(result).toContain("'@SUM(1,1)");
  });

  it('sanitizes CSV injection with tab prefix', () => {
    const result = buildCSV(['Val'], [['\tcmd']]);
    expect(result).toContain("'\tcmd");
  });

  it('sanitizes CSV injection with carriage return prefix', () => {
    const result = buildCSV(['Val'], [['\rcmd']]);
    expect(result).toContain("'\rcmd");
  });

  it('does not sanitize safe values', () => {
    const result = buildCSV(['Val'], [['hello world']]);
    expect(result).toContain('"hello world"');
  });

  it('handles undefined/null values', () => {
    const result = buildCSV(['A', 'B'], [[undefined as any, null as any]]);
    expect(result).toContain('""');
  });

  it('handles multiple rows', () => {
    const result = buildCSV(['X'], [['1'], ['2'], ['3']]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(4);
  });
});

describe('generateGradebookCSV', () => {
  it('generates CSV with headers and student data', () => {
    const students = [
      {
        id: '1', fullName: 'Alice', email: 'a@test.com', group: 'G1',
        modulesCompleted: 5, quizCount: 10, avgScore: 85.5, lastActive: '2026-01-01',
      },
    ];
    const result = generateGradebookCSV(students, ['m1', 'm2']);
    expect(result).toContain('Name');
    expect(result).toContain('Alice');
    expect(result).toContain('85.5');
    expect(result).toContain('a@test.com');
  });

  it('handles empty student list', () => {
    const result = generateGradebookCSV([], []);
    expect(result).toContain('Name');
    const lines = result.split('\n');
    expect(lines).toHaveLength(1);
  });
});

describe('generateStudentReportCSV', () => {
  it('generates CSV with student info and progress', () => {
    const student = {
      fullName: 'Bob', email: 'b@test.com', group: 'G1',
      course: 'CS', university: 'MIT',
    };
    const progress = [
      { moduleId: 'm1', completed: true, score: 90 },
      { moduleId: 'm2', completed: false, score: null },
    ];
    const quizResults = [
      { quizId: 'q1', score: 8, total: 10, percentage: 80 },
    ];
    const result = generateStudentReportCSV(student, progress, quizResults);
    expect(result).toContain('Student Report: Bob');
    expect(result).toContain('Email: b@test.com');
    expect(result).toContain('Module Progress');
    expect(result).toContain('Quiz Results');
    expect(result).toContain('m1');
    expect(result).toContain('q1');
  });
});

describe('generateModulePerformanceCSV', () => {
  it('generates CSV with module data', () => {
    const modules = [
      {
        moduleId: 'm1', moduleName: 'SQL Injection', totalStudents: 50,
        completedCount: 30, completionRate: 60, avgScore: 75, difficultyIndex: 0.3,
      },
    ];
    const result = generateModulePerformanceCSV(modules);
    expect(result).toContain('Module');
    expect(result).toContain('SQL Injection');
    expect(result).toContain('60');
    expect(result).toContain('75');
  });

  it('handles empty modules', () => {
    const result = generateModulePerformanceCSV([]);
    expect(result).toContain('Module');
  });
});

describe('generateAtRiskCSV', () => {
  it('generates CSV with at-risk student data', () => {
    const students = [
      {
        fullName: 'Charlie', email: 'c@test.com', group: 'G1',
        course: 'CS', university: 'MIT', riskScore: 85,
        reasons: ['No activity', 'Low scores'], lastActiveDays: 30,
        modulesCompleted: 1, avgQuizScore: 40, trend: 'declining',
      },
    ];
    const result = generateAtRiskCSV(students);
    expect(result).toContain('Name');
    expect(result).toContain('Charlie');
    expect(result).toContain('85');
    expect(result).toContain('No activity; Low scores');
    expect(result).toContain('declining');
  });
});

describe('generateGroupComparisonCSV', () => {
  it('generates CSV with group comparison data', () => {
    const dimensions = [
      {
        name: 'G1', studentCount: 25, activeStudents: 20, activeRate: 80,
        avgModulesCompleted: 5, avgCompletionRate: 65, avgQuizScore: 78,
        totalQuizAttempts: 100, topModule: 'SQL', weakestModule: 'XSS',
      },
    ];
    const result = generateGroupComparisonCSV(dimensions, 'group');
    expect(result).toContain('Group');
    expect(result).toContain('G1');
    expect(result).toContain('SQL');
  });

  it('uses "Course" header for course dimension', () => {
    const result = generateGroupComparisonCSV([], 'course');
    expect(result).toContain('Course');
  });

  it('uses "University" header for university dimension', () => {
    const result = generateGroupComparisonCSV([], 'university');
    expect(result).toContain('University');
  });
});

describe('generateAnalyticsCSV', () => {
  it('generates comprehensive analytics CSV', () => {
    const summary = {
      kpis: {
        totalStudents: 100, activeStudents: 80, activePercentage: 80,
        avgCompletionRate: 65, avgQuizScore: 75, totalModulesCompleted: 400,
        totalQuizAttempts: 500, engagementScore: 72,
      },
    };
    const moduleDistribution = [
      { moduleId: 'm1', moduleName: 'SQL', completionRate: 70, avgScore: 80 },
    ];
    const result = generateAnalyticsCSV(summary, moduleDistribution);
    expect(result).toContain('Analytics Report');
    expect(result).toContain('Key Metrics');
    expect(result).toContain('Total Students');
    expect(result).toContain('Module Progress');
    expect(result).toContain('SQL');
  });
});
