import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  scheduledReport: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  getPrisma: () => mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { mockSendReportEmail } = vi.hoisted(() => ({
  mockSendReportEmail: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
  sendReportEmail: mockSendReportEmail,
}));

vi.mock('@/lib/analytics-api', () => ({
  getGradebook: vi.fn(),
  getAtRiskStudents: vi.fn(),
  getComprehensiveSummary: vi.fn(),
  getModulePerformance: vi.fn(),
  getGroupComparison: vi.fn(),
  getQuizRetryAnalytics: vi.fn(),
}));

vi.mock('@/lib/export-utils', () => ({
  generateGradebookPDF: vi.fn().mockResolvedValue(new Blob(['pdf'])),
  generateAtRiskPDF: vi.fn().mockResolvedValue(new Blob(['pdf'])),
  generateAnalyticsPDF: vi.fn().mockResolvedValue(new Blob(['pdf'])),
  generateModulePerformancePDF: vi.fn().mockResolvedValue(new Blob(['pdf'])),
  generateGroupComparisonPDF: vi.fn().mockResolvedValue(new Blob(['pdf'])),
  generateQuizRetryPDF: vi.fn().mockResolvedValue(new Blob(['pdf'])),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('node:path', () => ({
  join: vi.fn((...parts: string[]) => parts.join('/')),
}));

import { runScheduledReports } from '@/lib/report-runner';
import { getGradebook } from '@/lib/analytics-api';
import { sendReportEmail } from '@/lib/email';
import { writeFileSync } from 'node:fs';

const NOW = new Date('2026-08-05T10:00:00.000Z'); // Wednesday (getDay() === 3), day of month 5

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    id: 'report-1',
    userId: 'user-1',
    reportType: 'gradebook',
    frequency: 'weekly',
    dayOfWeek: 3,
    dayOfMonth: null,
    email: '',
    groupId: '',
    days: 30,
    isActive: true,
    lastGenerated: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getGradebook).mockResolvedValue({
    students: [{ id: 's1', fullName: 'John', email: 'j@t.com', group: 'G1', moduleScores: {}, avgQuizScore: 85 }],
  });
  mockPrisma.scheduledReport.findMany.mockResolvedValue([makeReport()]);
  mockPrisma.scheduledReport.update.mockResolvedValue({});
  mockSendReportEmail.mockResolvedValue(true);
});

describe('runScheduledReports', () => {
  it('skips reports whose schedule does not match today', async () => {
    mockPrisma.scheduledReport.findMany.mockResolvedValue([makeReport({ dayOfWeek: 1 })]);

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 0, skipped: 1, failed: 0 });
    expect(mockPrisma.scheduledReport.update).not.toHaveBeenCalled();
  });

  it('skips reports already generated today', async () => {
    mockPrisma.scheduledReport.findMany.mockResolvedValue([makeReport({ lastGenerated: NOW })]);

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 0, skipped: 1, failed: 0 });
  });

  it('saves the report to disk when no email is configured', async () => {
    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 1, skipped: 0, failed: 0 });
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(mockSendReportEmail).not.toHaveBeenCalled();
    expect(mockPrisma.scheduledReport.update).toHaveBeenCalledWith({
      where: { id: 'report-1' },
      data: { lastGenerated: NOW },
    });
  });

  it('emails the report when an email is configured', async () => {
    mockPrisma.scheduledReport.findMany.mockResolvedValue([makeReport({ email: 'teacher@example.com' })]);

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 1, skipped: 0, failed: 0 });
    expect(mockSendReportEmail).toHaveBeenCalledTimes(1);
    const [to, reportType, filename, blob] = vi.mocked(sendReportEmail).mock.calls[0];
    expect(to).toBe('teacher@example.com');
    expect(reportType).toBe('gradebook');
    expect(filename).toBe('gradebook.pdf');
    expect(blob).toBeInstanceOf(Blob);
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it('falls back to saving to disk when email sending fails', async () => {
    mockSendReportEmail.mockResolvedValue(false);
    mockPrisma.scheduledReport.findMany.mockResolvedValue([makeReport({ email: 'teacher@example.com' })]);

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 1, skipped: 0, failed: 0 });
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('skips report generation when the report has no data', async () => {
    vi.mocked(getGradebook).mockResolvedValue({ students: [] });

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 0, skipped: 1, failed: 0 });
    expect(mockPrisma.scheduledReport.update).not.toHaveBeenCalled();
  });

  it('counts unknown report types as failed', async () => {
    mockPrisma.scheduledReport.findMany.mockResolvedValue([makeReport({ reportType: 'unknown-type' })]);

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 0, skipped: 0, failed: 1 });
  });

  it('handles generator errors and marks the report as failed', async () => {
    vi.mocked(getGradebook).mockRejectedValue(new Error('boom'));

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 0, skipped: 0, failed: 1 });
    expect(mockPrisma.scheduledReport.update).not.toHaveBeenCalled();
  });

  it('supports daily and monthly frequencies', async () => {
    mockPrisma.scheduledReport.findMany.mockResolvedValue([
      makeReport({ id: 'daily', frequency: 'daily' }),
      makeReport({ id: 'monthly', frequency: 'monthly', dayOfMonth: 5 }),
    ]);

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 2, skipped: 0, failed: 0 });
  });

  it('only runs active reports', async () => {
    mockPrisma.scheduledReport.findMany.mockResolvedValue([makeReport({ isActive: false })]);

    const results = await runScheduledReports(NOW);

    expect(results).toEqual({ success: 0, skipped: 0, failed: 0 });
    expect(mockPrisma.scheduledReport.update).not.toHaveBeenCalled();
  });
});
