import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the active plan
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ error: "No active plan" });
  }

  // Get all workouts for this plan
  const { data: workouts, error } = await supabase
    .from("planned_workouts")
    .select("id, scheduled_date, original_date, status, workout_type, title, adjustment_reason")
    .eq("plan_id", plan.id)
    .order("scheduled_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get life events
  const { data: events } = await supabase
    .from("life_events")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json({
    plan,
    totalWorkouts: workouts?.length,
    workouts: workouts?.map(w => ({
      id: w.id.slice(0, 8),
      fullId: w.id,
      date: w.scheduled_date,
      originalDate: w.original_date,
      status: w.status,
      type: w.workout_type,
      reason: w.adjustment_reason,
    })),
    lifeEvents: events?.map(e => ({
      id: e.id,
      type: e.event_type,
      start: e.start_date,
      end: e.end_date,
      canRun: e.can_run,
      impact: e.training_impact,
    })),
  });
}

// POST: Force skip workouts during life events
export async function POST() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the active plan
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ error: "No active plan", userId: user.id });
  }

  // Get ALL life events
  const { data: events } = await supabase
    .from("life_events")
    .select("*")
    .eq("user_id", user.id);

  if (!events || events.length === 0) {
    return NextResponse.json({ message: "No life events found", planId: plan.id });
  }

  // Get ALL workouts for this plan (no filtering)
  const { data: allWorkouts } = await supabase
    .from("planned_workouts")
    .select("id, scheduled_date, status, workout_type")
    .eq("plan_id", plan.id);

  if (!allWorkouts || allWorkouts.length === 0) {
    return NextResponse.json({ 
      message: "No workouts found in plan", 
      planId: plan.id,
      events: events.map(e => ({ start: e.start_date, end: e.end_date }))
    });
  }

  let totalUpdated = 0;
  const updates: { date: string; type: string; action: string }[] = [];
  const debugMatches: string[] = [];

  for (const event of events) {
    // Filter workouts in JavaScript to avoid Supabase date issues
    const workoutsInRange = allWorkouts.filter(w => {
      const wDate = w.scheduled_date;
      const inRange = wDate >= event.start_date && wDate <= event.end_date;
      const notSkipped = w.status !== "skipped";
      if (inRange) {
        debugMatches.push(`${wDate} in ${event.start_date}-${event.end_date}, status=${w.status}, skip=${!notSkipped}`);
      }
      return inRange && notSkipped;
    });

    // Update each workout to skipped
    for (const workout of workoutsInRange) {
      const { error: updateError } = await supabase
        .from("planned_workouts")
        .update({
          status: "skipped",
          adjustment_reason: `Life event: ${event.event_type} (${event.start_date} - ${event.end_date})`,
          adjusted_at: new Date().toISOString(),
          adjusted_by: "system",
        })
        .eq("id", workout.id);

      if (!updateError) {
        totalUpdated++;
        updates.push({
          date: workout.scheduled_date,
          type: workout.workout_type,
          action: "skipped",
        });
      }
    }
  }

  return NextResponse.json({
    message: `Marked ${totalUpdated} workout(s) as skipped`,
    updates,
    debug: {
      totalWorkoutsInPlan: allWorkouts.length,
      sampleDates: allWorkouts.slice(0, 10).map(w => w.scheduled_date),
      events: events.map(e => ({ type: e.event_type, start: e.start_date, end: e.end_date })),
      matches: debugMatches,
    }
  });
}
