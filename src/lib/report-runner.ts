/**
 * Report Runner — generates scheduled reports and saves them to disk.
 * Designed to be called from a cron job or Next.js API route.
 *
 * Usage:
 *   node --loader ts-node/esm src/lib/report-runner.ts
 * Or from a Next.js API route that runs on a schedule.
 */

import { prisma } from './db';
import {
  generateGradebookPDF,
  generateAtRiskPDF,
  generateAnalyticsPDF,
  generateModulePerformancePDF,
  generateGroupComparisonPDF,
  generateQuizRetryPDF,
} from './export-utils';

interface ScheduledReportRecord {
  id: string;
  userId: string;
  reportType: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  email: string;
  groupId: string;
  days: number;
  isActive: boolean;
  lastGenerated: Date | null;
  createdAt: Date;
}

interface GradebookStudent {
  id: string;
  fullName: string;
  email: string;
  group: string;
  modulesCompleted: number;
  quizCount: number;
  avgScore: number;
}

interface AtRiskStudent {
  fullName: string;
  email: string;
  group: string;
  riskScore: number;
}

const REPORT_GENERATORS: Record<string, (days: number, groupId?: string) => Promise<void>> = {
  gradebook: async (days, groupId): Promise<void> => {
    const { getGradebook } = await import('./analytics-api');
    const data = await getGradebook({ groupId: groupId || undefined, days });
    if (!data.students?.length) return;

    const students = data.students.map((s: GradebookStudent) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      group: s.group,
      modulesCompleted: s.modulesCompleted || 0,
      quizCount: s.quizCount || 0,
      avgScore: s.avgScore || 0,
    }));

    await generateGradebookPDF(students, (data.modules || []).map((m: { moduleId: string }) => m.moduleId), groupId || 'all');
  },

  'at-risk': async (days, groupId): Promise<void> => {
    const { getAtRiskStudents } = await import('./analytics-api');
    const data = await getAtRiskStudents(days, groupId);
    if (!data.atRiskStudents?.length) return;

    await generateAtRiskPDF(
      data.atRiskStudents.map((s: AtRiskStudent) => ({
        fullName: s.fullName,
        email: s.email || '',
        group: s.group,
        riskScore: s.riskScore,
        reasons: s.reasons || [],
        lastActiveDays: s.lastActiveDays || 0,
        modulesCompleted: s.modulesCompleted || 0,
        avgQuizScore: s.avgQuizScore || 0,
      })),
      days
    );
  },

  analytics: async (days, groupId): Promise<void> => {
    const { getComprehensiveSummary } = await import('./analytics-api');
    const summary = await getComprehensiveSummary(days, groupId);

    await generateAnalyticsPDF(
      summary,
      summary.moduleDistribution || [],
      summary.trends,
      groupId || 'all'
    );
  },

  'module-performance': async (days, groupId): Promise<void> => {
    const { getModulePerformance } = await import('./analytics-api');
    const data = await getModulePerformance(days, groupId);

    await generateModulePerformancePDF(data || [], groupId || 'all');
  },

  'group-comparison': async (days, groupId): Promise<void> => {
    const { getGroupComparison } = await import('./analytics-api');
    const data = await getGroupComparison(days);

    await generateGroupComparisonPDF(data.dimensions || [], groupId || 'all');
  },

  'quiz-retry': async (days, groupId): Promise<void> => {
    const { getQuizRetryAnalytics } = await import('./analytics-api');
    const data = await getQuizRetryAnalytics(days, groupId);

    await generateQuizRetryPDF(
      data.categoryRetryStats || [],
      data.topRetryers || [],
      groupId || 'all'
    );
  },
};

export async function runScheduledReports(now: Date = new Date()): Promise<{
  success: number;
  skipped: number;
  failed: number;
}> {
  const results = { success: 0, skipped: 0, failed: 0 };

  // Get all active scheduled reports
  const reports: ScheduledReportRecord[] = await prisma.scheduledReport.findMany({
    where: { isActive: true },
  });

  const dayOfWeek = now.getDay(); // 0-6
  const dayOfMonth = now.getDate(); // 1-31

  for (const report of reports) {
    try {
      // Check if this report should run today
      const shouldRun = shouldExecuteReport(report, dayOfWeek, dayOfMonth);
      if (!shouldRun) {
        results.skipped++;
        continue;
      }

      // Check if already generated today
      if (report.lastGenerated) {
        const lastGen = new Date(report.lastGenerated);
        const sameDay =
          lastGen.getFullYear() === now.getFullYear() &&
          lastGen.getMonth() === now.getMonth() &&
          lastGen.getDate() === now.getDate();
        if (sameDay) {
          results.skipped++;
          continue;
        }
      }

      // Generate the report
      const generator = REPORT_GENERATORS[report.reportType];
      if (!generator) {
        console.error(`Unknown report type: ${report.reportType}`);
        results.failed++;
        continue;
      }

      await generator(report.days, report.groupId || undefined);

      // Update lastGenerated timestamp
      await prisma.scheduledReport.update({
        where: { id: report.id },
        data: { lastGenerated: now },
      });

      // Send email notification if configured
      if (report.email) {
        await sendEmailNotification(report, new Blob(), now);
      }

      results.success++;
    } catch (error) {
      console.error(`Failed to generate report ${report.id}:`, error);
      results.failed++;
    }
  }

  return results;
}

function shouldExecuteReport(
  report: ScheduledReportRecord,
  dayOfWeek: number,
  dayOfMonth: number
): boolean {
  switch (report.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return report.dayOfWeek === dayOfWeek;
    case 'monthly':
      return report.dayOfMonth === dayOfMonth;
    default:
      return false;
  }
}

async function _saveReport(
  report: ScheduledReportRecord,
  pdfBlob: Blob,
  now: Date
): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const reportsDir = path.join(process.cwd(), 'reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `${report.reportType}_${now.toISOString().split('T')[0]}.pdf`;
  const filePath = path.join(reportsDir, filename);

  const buffer = Buffer.from(await pdfBlob.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

async function sendEmailNotification(
  report: ScheduledReportRecord,
  _pdfBlob: Blob,
  _now: Date
): Promise<void> {
  // Placeholder for email sending logic
  // In production, integrate with SendGrid, Resend, or nodemailer
  console.warn(`[Email] Notification would be sent to ${report.email} for report ${report.id}`);

  // Example with nodemailer:
  // const nodemailer = await import('nodemailer');
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({
  //   from: 'reports@cybersec-lab.com',
  //   to: report.email,
  //   subject: `Отчёт: ${report.reportType}`,
  //   text: `Автоматический отчёт за ${now.toLocaleDateString('ru-RU')}`,
  //   attachments: [{ filename: 'report.pdf', content: await pdfBlob.arrayBuffer() }],
  // });
}

// Run if executed directly
if (typeof process !== 'undefined' && process.argv[1] && (process.argv[1].endsWith('report-runner.ts') || process.argv[1].endsWith('report-runner.js'))) {
  runScheduledReports()
    .then((results) => {
      console.warn('Report runner completed:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Report runner failed:', error);
      process.exit(1);
    });
}
