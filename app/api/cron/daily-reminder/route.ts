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

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Get users with phones who have morning notifications enabled (or not explicitly disabled)
    // Default to sending if notification_morning is null (new users)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, phone, notification_morning")
      .not("phone", "is", null)
      .or("notification_morning.is.null,notification_morning.eq.true");

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
    let skippedRestDay = 0;
    let skippedLifeEvent = 0;

    for (const profile of profiles || []) {
      if (checkedInUserIds.has(profile.id)) {
        skipped++;
        continue;
      }

      // Check if today is a rest day for this user
      const { data: userPlan } = await supabase
        .from("training_plans")
        .select("id")
        .eq("user_id", profile.id)
        .eq("status", "active")
        .maybeSingle();
      
      if (userPlan) {
        const { data: todayWorkout } = await supabase
          .from("planned_workouts")
          .select("workout_type, status")
          .eq("plan_id", userPlan.id)
          .eq("scheduled_date", todayStr)
          .maybeSingle();
        
        if (todayWorkout?.workout_type === "rest") {
          skippedRestDay++;
          continue;
        }
      }

      // Check if today falls within a blocking life event
      const { data: blockingEvent } = await supabase
        .from("life_events")
        .select("id")
        .eq("user_id", profile.id)
        .lte("start_date", todayStr)
        .gte("end_date", todayStr)
        .or("can_run.eq.false,training_impact.eq.no_training")
        .maybeSingle();

      if (blockingEvent) {
        skippedLifeEvent++;
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

    console.log(`[Cron] Daily reminders sent: ${sent}, skipped (already checked in): ${skipped}, skipped (rest day): ${skippedRestDay}, skipped (life event): ${skippedLifeEvent}`);

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      skippedRestDay,
      skippedLifeEvent,
      total: profiles?.length || 0,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
