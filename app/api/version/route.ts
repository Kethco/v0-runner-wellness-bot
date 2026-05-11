import { NextResponse } from "next/server";

// This version is updated during build time
// Change this value when you deploy updates that users should see
const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 
                    process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 8) ||
                    "1.0.0";

export async function GET() {
  return NextResponse.json(
    { version: APP_VERSION },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
