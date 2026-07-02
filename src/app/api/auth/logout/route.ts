import { NextResponse } from "next/server";
import { deleteAuthCookie } from "@/lib/cookie-auth";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    deleteAuthCookie(response);
    return response;
  } catch (error) {
    logger.error("Logout failed", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
