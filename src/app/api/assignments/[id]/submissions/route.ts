import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticate, unauthorized, forbidden } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true, createdBy: true, group: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Students can view only their own submissions
    if (auth.role === "student") {
      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: id, userId: auth.id },
        orderBy: { submittedAt: "desc" },
      });
      return NextResponse.json(submissions);
    }

    // Teachers can only view submissions for their own assignments
    if (auth.role === "teacher" && assignment.createdBy !== auth.id) {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const graded = searchParams.get("graded");

    const where: Record<string, unknown> = { assignmentId: id };
    if (userId) where.userId = userId;
    if (graded === "true") where.submittedAt = { not: null };
    if (graded === "false") where.submittedAt = null;

    const submissions = await prisma.assignmentSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            group: true,
            role: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    logger.error("Failed to fetch submissions", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
