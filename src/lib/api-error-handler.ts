import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

/**
 * Wraps an API route handler in try/catch to prevent unhandled 500 errors.
 * If the handler throws, returns a proper 500 JSON response and logs the error.
 */
export function withErrorHandler<
  T extends (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (req: NextRequest, ...args: unknown[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      logger.error("API route error", {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  }) as T;
}
