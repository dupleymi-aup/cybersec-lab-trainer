import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticate, unauthorized } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { parseBody } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const bodyResult = await parseBody(request);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data as Record<string, unknown>;
  const { moduleId, score, completed, userId } = body as Record<string, any>;

  if (!moduleId || score === undefined || completed === undefined) {
    return NextResponse.json(
      { error: "moduleId, score, and completed are required" },
      { status: 400 },
    );
  }

  // Use userId from body (admin/teacher only) or auth.id
  const targetUserId = userId || auth.id;

  // If userId is provided and differs from auth.id, verify the caller has permission
  if (userId && userId !== auth.id) {
    const caller = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { role: true },
    });
    if (!caller || (caller.role !== "admin" && caller.role !== "teacher")) {
      return NextResponse.json(
        {
          error:
            "Only admins and teachers can create snapshots for other users",
        },
        { status: 403 },
      );
    }
  }

  try {
    await prisma.progressSnapshot.create({
      data: {
        id: crypto.randomUUID(),
        userId: targetUserId,
        moduleId,
        score,
        completed,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error("Progress snapshot failed", { error: String(e) });
    return NextResponse.json(
      { error: "Failed to create progress snapshot" },
      { status: 500 },
    );
  }
}
