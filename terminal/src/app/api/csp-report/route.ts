import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // CSP violation reports can come in two formats:
    // 1. Standard format: { "csp-report": { ... } }
    // 2. Chrome legacy format: direct report object
    const report = body['csp-report'] || body;

    // Log the violation for monitoring
    const violation = {
      timestamp: new Date().toISOString(),
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
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    };

    // In development, log to console for visibility
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Violation]', JSON.stringify(violation, null, 2));
    }

    // In production, log to structured logging system
    // This can be integrated with external monitoring (Sentry, Datadog, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Log to stdout for log aggregation systems
      console.warn(JSON.stringify({
        level: 'warn',
        message: 'CSP violation detected',
        ...violation,
      }));
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    // Accept malformed reports silently to prevent CSP reporting from causing errors
    return new NextResponse(null, { status: 204 });
  }
}
