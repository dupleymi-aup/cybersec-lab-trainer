import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
} from "@/lib/api-middleware";

// GET /api/login-activity/[userId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const { userId } = await params;

  // Users can only see their own activity, teachers/admins can see any
  if (auth.id !== userId && !requireRole(auth.role, "teacher")) {
    return forbidden();
  }

  const activities = await prisma.loginActivity.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return NextResponse.json({
    activities: activities.map((a) => ({
      id: a.id,
      userId: a.userId,
      email: a.email,
      ip: a.ip,
      userAgent: a.userAgent,
      success: a.success,
      timestamp: a.timestamp.toISOString(),
    })),
  });
}
