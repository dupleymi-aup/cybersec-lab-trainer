import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
} from "@/lib/api-middleware";
import { parseBody } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "teacher")) return forbidden();

  try {
    const { id } = await params;
    const report = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!report || report.userId !== auth.id) {
      return unauthorized();
    }

    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

interface ScheduledReportUpdateBody {
  reportType?: string;
  frequency?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  email?: string;
  groupId?: string;
  days?: number;
  isActive?: boolean;
  lastGenerated?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "teacher")) return forbidden();

  try {
    const { id } = await params;
    const existing = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== auth.id) {
      return unauthorized();
    }

    const bodyResult = await parseBody<ScheduledReportUpdateBody>(request);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;
    const { isActive, lastGenerated, ...updates } = body ?? {};

    const report = await prisma.scheduledReport.update({
      where: { id },
      data: {
        ...(updates.reportType !== undefined && {
          reportType: updates.reportType,
        }),
        ...(updates.frequency !== undefined && {
          frequency: updates.frequency,
        }),
        ...(updates.dayOfWeek !== undefined && {
          dayOfWeek: updates.dayOfWeek,
        }),
        ...(updates.dayOfMonth !== undefined && {
          dayOfMonth: updates.dayOfMonth,
        }),
        ...(updates.email !== undefined && { email: updates.email }),
        ...(updates.groupId !== undefined && { groupId: updates.groupId }),
        ...(updates.days !== undefined && { days: updates.days }),
        ...(isActive !== undefined && { isActive }),
        ...(lastGenerated !== undefined && {
          lastGenerated: new Date(lastGenerated),
        }),
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, "teacher")) return forbidden();

  try {
    const { id } = await params;
    const existing = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== auth.id) {
      return unauthorized();
    }

    await prisma.scheduledReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
