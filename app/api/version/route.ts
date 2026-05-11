import { NextResponse } from "next/server";

// Use Vercel's deployment ID - this changes automatically with each deployment
// Falls back to git commit SHA, then to a timestamp-based version
const DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID 
  || process.env.VERCEL_GIT_COMMIT_SHA 
  || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  || `dev-${Date.now()}`;

export async function GET() {
  return NextResponse.json(
    { 
      version: DEPLOYMENT_ID,
      timestamp: Date.now()
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
