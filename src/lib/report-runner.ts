/**
 * Report Runner — generates scheduled reports and saves them to disk.
 * Designed to be called from a cron job or Next.js API route.
 *
 * Usage:
 *   node --loader ts-node/esm src/lib/report-runner.ts
 * Or from a Next.js API route that runs on a schedule.
 */

import { getPrisma } from './db';
import { logger } from './logger';
import { sendReportEmail } from './email';
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
  moduleScores: Record<string, { completed: boolean; score: number | null }>;
  avgQuizScore: number;
  lastActive: string | null;
}

interface AtRiskStudent {
  userId: string;
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
  quizAttempts: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface GeneratedReport {
  blob: Blob;
  filename: string;
}

const REPORT_GENERATORS: Record<string, (days: number, groupId?: string) => Promise<GeneratedReport | null>> = {
  gradebook: async (days, groupId): Promise<GeneratedReport | null> => {
    const { getGradebook } = await import('./analytics-api');
    const data = await getGradebook({ groupId: groupId || undefined, days });
    if (!data.students?.length) return null;

    const students = data.students.map((s: GradebookStudent) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      group: s.group,
      modulesCompleted: Object.values(s.moduleScores || {}).filter((m) => m.completed).length,
      quizCount: 0, // API doesn't provide quiz count separately
      avgScore: s.avgQuizScore || 0,
    }));

    const blob = await generateGradebookPDF(students, undefined, 'buffer');
    return blob ? { blob, filename: 'gradebook.pdf' } : null;
  },

  'at-risk': async (days, groupId): Promise<GeneratedReport | null> => {
    const { getAtRiskStudents } = await import('./analytics-api');
    const data = await getAtRiskStudents(days, groupId);
    if (!data.atRiskStudents?.length) return null;

    const blob = await generateAtRiskPDF(
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
      undefined,
      'buffer',
    );
    return blob ? { blob, filename: 'at-risk-students.pdf' } : null;
  },

  analytics: async (days, groupId): Promise<GeneratedReport | null> => {
    const { getComprehensiveSummary } = await import('./analytics-api');
    const summary = await getComprehensiveSummary(days, groupId);

    const blob = await generateAnalyticsPDF(summary, summary.moduleDistribution || [], undefined, 'buffer');
    return blob ? { blob, filename: 'analytics-report.pdf' } : null;
  },

  'module-performance': async (days, groupId): Promise<GeneratedReport | null> => {
    const { getModulePerformance } = await import('./analytics-api');
    const data = await getModulePerformance(days, groupId);

    const blob = await generateModulePerformancePDF(data || [], undefined, 'buffer');
    return blob ? { blob, filename: 'module-performance.pdf' } : null;
  },

  'group-comparison': async (days): Promise<GeneratedReport | null> => {
    const { getGroupComparison } = await import('./analytics-api');
    const data = await getGroupComparison(days);

    const blob = await generateGroupComparisonPDF(data.dimensions || [], undefined, 'buffer');
    return blob ? { blob, filename: 'group-comparison.pdf' } : null;
  },

  'quiz-retry': async (days, groupId): Promise<GeneratedReport | null> => {
    const { getQuizRetryAnalytics } = await import('./analytics-api');
    const data = await getQuizRetryAnalytics(days, groupId);

    const blob = await generateQuizRetryPDF(data.categoryRetryStats || [], data.topRetryers || [], undefined, 'buffer');
    return blob ? { blob, filename: 'quiz-retry.pdf' } : null;
  },
};

export async function runScheduledReports(now: Date = new Date()): Promise<{
  success: number;
  skipped: number;
  failed: number;
}> {
  const results = { success: 0, skipped: 0, failed: 0 };

  // Get all active scheduled reports
  const reports: ScheduledReportRecord[] = await getPrisma().scheduledReport.findMany({
    where: { isActive: true },
  });

  const dayOfWeek = now.getDay(); // 0-6
  const dayOfMonth = now.getDate(); // 1-31

  for (const report of reports) {
    try {
      // Defensive double-check: skip inactive reports regardless of the query filter
      if (!report.isActive) {
        continue;
      }

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
        logger.error(`Unknown report type: ${report.reportType}`);
        results.failed++;
        continue;
      }

      const generated = await generator(report.days, report.groupId || undefined);
      if (!generated) {
        // No data for the selected range — nothing to produce, don't mark as failed
        results.skipped++;
        continue;
      }

      // Send email notification if configured, otherwise store to disk
      if (report.email) {
        const sent = await sendReportEmail(report.email, report.reportType, generated.filename, generated.blob);
        if (!sent) {
          await saveReportToDisk(report, generated.blob, now);
        }
      } else {
        await saveReportToDisk(report, generated.blob, now);
      }

      // Update lastGenerated timestamp
      await getPrisma().scheduledReport.update({
        where: { id: report.id },
        data: { lastGenerated: now },
      });

      results.success++;
    } catch (error) {
      logger.error(`Failed to generate report ${report.id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      results.failed++;
    }
  }

  return results;
}

function shouldExecuteReport(report: ScheduledReportRecord, dayOfWeek: number, dayOfMonth: number): boolean {
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

async function saveReportToDisk(report: ScheduledReportRecord, pdfBlob: Blob, now: Date): Promise<void> {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const reportsDir = path.join(process.cwd(), 'reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `${report.reportType}_${now.toISOString().split('T')[0]}.pdf`;
  const filePath = path.join(reportsDir, filename);

  const buffer = Buffer.from(await pdfBlob.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

// Run if executed directly
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('report-runner.ts') || process.argv[1].endsWith('report-runner.js'))
) {
  runScheduledReports()
    .then((results) => {
      logger.info('Report runner completed', { results });
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Report runner failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    });
}
