import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDoc = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  setTextColor: vi.fn(),
  setFont: vi.fn(),
  splitTextToSize: vi.fn().mockReturnValue(['line']),
  output: vi.fn().mockReturnValue(new Blob(['pdf'])),
  getNumberOfPages: vi.fn().mockReturnValue(1),
  setPage: vi.fn(),
  lastAutoTable: { finalY: 200 },
};

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(function () {
    return mockDoc;
  }),
}));

const mockAutoTable = vi.fn();
vi.mock('jspdf-autotable', () => ({
  autoTable: mockAutoTable,
}));

import {
  generateStudentReportPDF,
  generateGradebookPDF,
  generateAtRiskPDF,
  generateAnalyticsPDF,
  generateModulePerformancePDF,
  generateGroupComparisonPDF,
  generateQuizRetryPDF,
  downloadCSV,
  generateGradebookCSV,
  generateStudentReportCSV,
  generateModulePerformanceCSV,
  generateAtRiskCSV,
  generateGroupComparisonCSV,
  generateAnalyticsCSV,
} from '@/lib/export-utils';

const student = {
  fullName: 'John Doe',
  email: 'john@test.com',
  group: 'CS-101',
  course: 'SE',
  university: 'MIT',
};
const kpis = {
  modulesCompleted: 5,
  totalModules: 10,
  avgQuizScore: 85,
  engagementScore: 90,
  riskScore: 15,
};
const progress = [{ moduleId: 'm1', completed: true, score: 90 }];
const quizResults = [{ quizId: 'q1', score: 8, total: 10, percentage: 80 }];
const recommendations = [{ title: 'Keep it up', description: 'Good progress', priority: 'low' }];

describe('PDF generation functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.lastAutoTable = { finalY: 200 };
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
    const mockA = { click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockA as unknown as HTMLAnchorElement);
  });

  it('generateStudentReportPDF', async () => {
    await generateStudentReportPDF(student, kpis, progress, quizResults, recommendations);
    expect(mockDoc.text).toHaveBeenCalled();
    expect(mockAutoTable).toHaveBeenCalled();
  });

  it('generateStudentReportPDF without recommendations', async () => {
    await generateStudentReportPDF(student, kpis, progress, quizResults, []);
    expect(mockDoc.text).toHaveBeenCalled();
  });

  it('generateGradebookPDF', async () => {
    const students = [{ id: '1', fullName: 'John', email: 'j@t.com', group: 'G1', modulesCompleted: 5, quizCount: 3, avgScore: 85 }];
    await generateGradebookPDF(students);
    expect(mockAutoTable).toHaveBeenCalled();
  });

  it('generateAtRiskPDF', async () => {
    const atRisk = [{
      fullName: 'Jane', email: 'j@t.com', group: 'G1', riskScore: 80,
      reasons: ['Low engagement'], lastActiveDays: 30, modulesCompleted: 2, avgQuizScore: 40,
    }];
    await generateAtRiskPDF(atRisk);
    expect(mockAutoTable).toHaveBeenCalled();
  });

  it('generateAnalyticsPDF', async () => {
    const summary = {
      kpis: {
        totalStudents: 100, activeStudents: 80, activePercentage: 80,
        avgCompletionRate: 70, avgQuizScore: 75, totalModulesCompleted: 500,
        totalQuizAttempts: 1000, engagementScore: 85,
      },
    };
    await generateAnalyticsPDF(summary);
    expect(mockDoc.text).toHaveBeenCalled();
  });

  it('generateAnalyticsPDF with moduleDistribution param', async () => {
    const summary = {
      kpis: {
        totalStudents: 100, activeStudents: 80, activePercentage: 80,
        avgCompletionRate: 70, avgQuizScore: 75, totalModulesCompleted: 500,
        totalQuizAttempts: 1000, engagementScore: 85,
      },
    };
    const dist = [{ moduleId: 'm1', moduleName: 'Mod1', completionRate: 80, avgScore: 75 }];
    await generateAnalyticsPDF(summary, dist);
    expect(mockAutoTable).toHaveBeenCalled();
  });

  it('generateModulePerformancePDF', async () => {
    const modules = [{
      moduleId: 'm1', moduleName: 'SQL Injection', totalStudents: 50,
      completedCount: 40, completionRate: 80, avgScore: 75, difficultyIndex: 0.3,
    }];
    await generateModulePerformancePDF(modules);
    expect(mockAutoTable).toHaveBeenCalled();
  });

  it('generateGroupComparisonPDF', async () => {
    const dims = [{
      name: 'CS-101', studentCount: 30, activeStudents: 25, activeRate: 83,
      avgModulesCompleted: 5, avgCompletionRate: 70, avgQuizScore: 80,
      totalQuizAttempts: 150, topModule: 'XSS', weakestModule: 'CSRF',
    }];
    await generateGroupComparisonPDF(dims);
    expect(mockAutoTable).toHaveBeenCalled();
  });

  it('generateQuizRetryPDF with topRetryers', async () => {
    const stats = [{ category: 'XSS', totalAttempts: 10, uniqueStudents: 5 }];
    const retryers = [{ fullName: 'John', group: 'G1', retryCount: 3 }];
    await generateQuizRetryPDF(stats, retryers);
    expect(mockAutoTable).toHaveBeenCalled();
  });

  it('generateQuizRetryPDF without topRetryers', async () => {
    const stats = [{ category: 'XSS', totalAttempts: 10, uniqueStudents: 5 }];
    await generateQuizRetryPDF(stats, []);
    expect(mockAutoTable).toHaveBeenCalled();
  });
});

describe('downloadCSV', () => {
  it('should create blob and trigger download', () => {
    const mockA = { click: vi.fn(), href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockA as unknown as HTMLAnchorElement);
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();

    downloadCSV('a,b\n1,2', 'test.csv');
    expect(mockA.click).toHaveBeenCalled();
    expect(mockA.download).toBe('test.csv');
  });
});

describe('CSV generator functions', () => {
  it('generateGradebookCSV', () => {
    const students = [{
      id: '1', fullName: 'John', email: 'j@t.com', group: 'G1',
      modulesCompleted: 5, quizCount: 3, avgScore: 85.0, lastActive: '2024-01-01',
    }];
    const csv = generateGradebookCSV(students, []);
    expect(csv).toContain('Name');
    expect(csv).toContain('John');
    expect(csv).toContain('85.0');
  });

  it('generateStudentReportCSV', () => {
    const csv = generateStudentReportCSV(
      student,
      progress,
      quizResults,
    );
    expect(csv).toContain('Student Report: John Doe');
    expect(csv).toContain('Module Progress');
    expect(csv).toContain('Quiz Results');
  });

  it('generateModulePerformanceCSV', () => {
    const modules = [{
      moduleId: 'm1', moduleName: 'SQL', totalStudents: 50,
      completedCount: 40, completionRate: 80, avgScore: 75, difficultyIndex: 0.3,
    }];
    const csv = generateModulePerformanceCSV(modules);
    expect(csv).toContain('Module');
    expect(csv).toContain('SQL');
  });

  it('generateAtRiskCSV', () => {
    const atRisk = [{
      fullName: 'Jane', email: 'j@t.com', group: 'G1', course: 'SE',
      university: 'MIT', riskScore: 80, reasons: ['Low score'],
      lastActiveDays: 30, modulesCompleted: 2, avgQuizScore: 40, trend: 'declining',
    }];
    const csv = generateAtRiskCSV(atRisk);
    expect(csv).toContain('Name');
    expect(csv).toContain('Jane');
  });

  it('generateGroupComparisonCSV with group dimension', () => {
    const dims = [{
      name: 'CS-101', studentCount: 30, activeStudents: 25, activeRate: 83,
      avgModulesCompleted: 5, avgCompletionRate: 70, avgQuizScore: 80,
      totalQuizAttempts: 150, topModule: 'XSS', weakestModule: 'CSRF',
    }];
    const csv = generateGroupComparisonCSV(dims, 'group');
    expect(csv).toContain('Group');
    expect(csv).toContain('CS-101');
  });

  it('generateGroupComparisonCSV with course dimension', () => {
    const dims = [{
      name: 'SE', studentCount: 30, activeStudents: 25, activeRate: 83,
      avgModulesCompleted: 5, avgCompletionRate: 70, avgQuizScore: 80,
      totalQuizAttempts: 150, topModule: 'XSS', weakestModule: 'CSRF',
    }];
    const csv = generateGroupComparisonCSV(dims, 'course');
    expect(csv).toContain('Course');
  });

  it('generateGroupComparisonCSV with university dimension', () => {
    const dims = [{
      name: 'MIT', studentCount: 30, activeStudents: 25, activeRate: 83,
      avgModulesCompleted: 5, avgCompletionRate: 70, avgQuizScore: 80,
      totalQuizAttempts: 150, topModule: 'XSS', weakestModule: 'CSRF',
    }];
    const csv = generateGroupComparisonCSV(dims, 'university');
    expect(csv).toContain('University');
  });

  it('generateAnalyticsCSV', () => {
    const summary = {
      kpis: {
        totalStudents: 100, activeStudents: 80, activePercentage: 80,
        avgCompletionRate: 70, avgQuizScore: 75, totalModulesCompleted: 500,
        totalQuizAttempts: 1000, engagementScore: 85,
      },
    };
    const dist = [{ moduleId: 'm1', moduleName: 'Mod1', completionRate: 80, avgScore: 75 }];
    const csv = generateAnalyticsCSV(summary, dist);
    expect(csv).toContain('Analytics Report');
    expect(csv).toContain('Mod1');
  });
});
