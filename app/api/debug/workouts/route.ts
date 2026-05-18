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
    return NextResponse.json({ error: "No active plan" });
  }

  // Get all life events where can_run is false
  const { data: events } = await supabase
    .from("life_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("can_run", false);

  if (!events || events.length === 0) {
    return NextResponse.json({ message: "No life events where running is blocked" });
  }

  let totalUpdated = 0;
  const updates = [];

  for (const event of events) {
    // Find all workouts during this event
    const { data: workouts } = await supabase
      .from("planned_workouts")
      .select("id, scheduled_date, workout_type")
      .eq("plan_id", plan.id)
      .gte("scheduled_date", event.start_date)
      .lte("scheduled_date", event.end_date)
      .neq("status", "skipped");

    if (workouts && workouts.length > 0) {
      // Update each workout to skipped
      for (const workout of workouts) {
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
  }

  return NextResponse.json({
    message: `Marked ${totalUpdated} workout(s) as skipped`,
    updates,
  });
}
