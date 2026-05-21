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

const REPORT_GENERATORS: Record<string, (days: number, groupId?: string) => Promise<Blob | null>> = {
  gradebook: async (days, groupId) => {
    // Fetch gradebook data and generate PDF
    const { getGradebook } = await import('./analytics-api');
    const data = await getGradebook(days, groupId);
    if (!data.students?.length) return null;

    const students = data.students.map((s: any) => ({
      fullName: s.fullName,
      email: s.email,
      group: s.group,
      modules: s.modules || [],
      avgScore: s.avgScore || 0,
    }));

    return generateGradebookPDF(students, data.modules || [], groupId || 'all');
  },

  'at-risk': async (days, groupId) => {
    const { getAtRiskStudents } = await import('./analytics-api');
    const data = await getAtRiskStudents(days, groupId);
    if (!data.students?.length) return null;

    return generateAtRiskPDF(
      data.students.map((s: any) => ({
        userId: s.userId,
        fullName: s.fullName,
        group: s.group,
        riskScore: s.riskScore,
        reasons: s.reasons || [],
      })),
      days
    );
  },

  analytics: async (days, groupId) => {
    const { getComprehensiveSummary } = await import('./auth-store');
    const summary = await getComprehensiveSummary(days, groupId);

    return generateAnalyticsPDF(
      summary.kpis,
      summary.moduleDistribution || [],
      summary.trends,
      groupId || 'all'
    );
  },

  'module-performance': async (days, groupId) => {
    const { getModulePerformance } = await import('./analytics-api');
    const data = await getModulePerformance(days, groupId);

    return generateModulePerformancePDF(data || [], groupId || 'all');
  },

  'group-comparison': async (days, groupId) => {
    const { getGroupComparison } = await import('./analytics-api');
    const data = await getGroupComparison(days);

    return generateGroupComparisonPDF(data || [], groupId || 'all');
  },

  'quiz-retry': async (days, groupId) => {
    const { getQuizRetryAnalytics } = await import('./analytics-api');
    const data = await getQuizRetryAnalytics(days, groupId);

    return generateQuizRetryPDF(
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

      const pdfBlob = await generator(report.days, report.groupId || undefined);
      if (!pdfBlob) {
        console.warn(`No data for report ${report.id} (${report.reportType})`);
        results.skipped++;
        continue;
      }

      // Save PDF to disk (in a real app, this would upload to S3 or send via email)
      await saveReport(report, pdfBlob, now);

      // Update lastGenerated timestamp
      await prisma.scheduledReport.update({
        where: { id: report.id },
        data: { lastGenerated: now },
      });

      // Send email notification if configured
      if (report.email) {
        await sendEmailNotification(report, pdfBlob, now);
      }

      results.success++;
      console.log(`Report ${report.id} (${report.reportType}) generated successfully`);
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

async function saveReport(
  report: ScheduledReportRecord,
  pdfBlob: Blob,
  now: Date
): Promise<void> {
  // In a browser environment, we trigger a download
  // In a Node.js environment, we would write to disk
  if (typeof window !== 'undefined') {
    const filename = `${report.reportType}_${now.toISOString().split('T')[0]}.pdf`;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // Node.js environment — write to /reports/ directory
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
}

async function sendEmailNotification(
  report: ScheduledReportRecord,
  pdfBlob: Blob,
  now: Date
): Promise<void> {
  // Placeholder for email sending logic
  // In production, integrate with SendGrid, Resend, or nodemailer
  console.log(`Email notification would be sent to ${report.email} for report ${report.id}`);

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
if (typeof window === 'undefined' && require.main === module) {
  runScheduledReports()
    .then((results) => {
      console.log('Report runner completed:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Report runner failed:', error);
      process.exit(1);
    });
}
