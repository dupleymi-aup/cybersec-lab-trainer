import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const report = body["csp-report"] || body;

    logger.warn("CSP violation detected", {
      documentUri: report["document-uri"] || report.documentUrl,
      violatedDirective:
        report["violated-directive"] || report.effectiveDirective,
      effectiveDirective: report["effective-directive"],
      originalPolicy: report["original-policy"],
      sourceFile: report["source-file"],
      lineNumber: report["line-number"],
      columnNumber: report["column-number"],
      statusCode: report["status-code"],
      referrer: report.referrer,
      blockedUri: report["blocked-uri"],
      disposition: report.disposition,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
