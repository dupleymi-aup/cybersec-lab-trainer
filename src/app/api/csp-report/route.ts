import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const cspReportBodySchema = z.object({
  'csp-report': z
    .object({
      'document-uri': z.string().max(2048).optional(),
      'violated-directive': z.string().max(512).optional(),
      'effective-directive': z.string().max(512).optional(),
      'original-policy': z.string().max(4096).optional(),
      'source-file': z.string().max(2048).optional(),
      'line-number': z.number().int().optional(),
      'column-number': z.number().int().optional(),
      'status-code': z.number().int().optional(),
      referrer: z.string().max(2048).optional(),
      'blocked-uri': z.string().max(2048).optional(),
      disposition: z.string().max(64).optional(),
    })
    .passthrough()
    .optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = cspReportBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new NextResponse(null, { status: 204 });
    }

    const report = parsed.data['csp-report'] || parsed.data;

    logger.warn('CSP violation detected', {
      documentUri: report['document-uri'] || report.documentUrl,
      violatedDirective: report['violated-directive'] || report.effectiveDirective,
      effectiveDirective: report['effective-directive'],
      originalPolicy: report['original-policy'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      statusCode: report['status-code'],
      referrer: report.referrer,
      blockedUri: report['blocked-uri'],
      disposition: report.disposition,
      userAgent: request.headers.get('user-agent') ?? undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.warn('CSP report parse failed', { error: error instanceof Error ? error.message : 'Unknown' });
    return new NextResponse(null, { status: 204 });
  }
}
