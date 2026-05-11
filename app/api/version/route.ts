import { NextResponse } from "next/server";

// Manual version - increment this when you deploy important updates
// Format: YYYY.MM.DD.patch (e.g., "2026.05.11.1")
export const APP_VERSION = "2026.05.11.1";

export async function GET() {
  return NextResponse.json(
    { 
      version: APP_VERSION,
      buildTime: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev"
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
