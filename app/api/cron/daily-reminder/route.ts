import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDailyReminderSMS } from "@/lib/sms/sender";

// This endpoint should be called by a cron job every morning at 7am
// Configure in vercel.json or use an external cron service

export async function GET(request: NextRequest) {
  // Verify request is from Vercel Cron
  // Vercel automatically adds CRON_SECRET header for cron jobs
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow if: no secret configured (dev), or secret matches, or it's from Vercel cron
  const isVercelCron = request.headers.get("x-vercel-cron") === "true";
  
  if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    console.log("[Cron] Unauthorized request - not from Vercel cron");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  console.log("[Cron] Starting daily reminder job");

  try {
    // Use service role to access all users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users with phone numbers who haven't checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, phone")
      .not("phone", "is", null)
      .eq("notification_morning", true);

    if (profilesError) {
      console.error("[Cron] Error fetching profiles:", profilesError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Get today's check-ins to exclude users who already checked in
    const { data: todayCheckins } = await supabase
      .from("checkins")
      .select("user_id")
      .gte("created_at", today.toISOString());

    const checkedInUserIds = new Set(todayCheckins?.map((c) => c.user_id) || []);

    // Send reminders to users who haven't checked in
    let sent = 0;
    let skipped = 0;

    for (const profile of profiles || []) {
      if (checkedInUserIds.has(profile.id)) {
        skipped++;
        continue;
      }

      if (profile.phone) {
        const success = await sendDailyReminderSMS(
          profile.phone,
          profile.first_name || "Runner",
          0 // Streak will be calculated separately if needed
        );
        if (success) sent++;
      }
    }

    console.log(`[Cron] Daily reminders sent: ${sent}, skipped: ${skipped}`);

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      total: profiles?.length || 0,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
