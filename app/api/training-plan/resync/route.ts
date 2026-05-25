import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { rescheduleForLifeEvent } from "@/lib/training-plan-adjuster";

// POST: Manually trigger reschedule for an existing life event
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventId } = body;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  // Get the event
  const { data: event, error: eventError } = await supabase
    .from("life_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Trigger reschedule
  const result = await rescheduleForLifeEvent(user.id, {
    id: event.id,
    start_date: event.start_date,
    end_date: event.end_date,
    event_type: event.event_type,
    training_impact: event.training_impact,
    can_run: event.can_run,
  });

  return NextResponse.json(result);
}

// GET: Resync all life events (useful for existing events before the feature was built)
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get active training plan
  const { data: activePlan } = await supabase
    .from("training_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!activePlan) {
    return NextResponse.json({ message: "No active training plan found" });
  }

  // Get all life events for this user
  const { data: allEvents } = await supabase
    .from("life_events")
    .select("start_date, end_date, can_run, training_impact")
    .eq("user_id", user.id);

  // Get all workouts
  const { data: allWorkouts } = await supabase
    .from("planned_workouts")
    .select("id, scheduled_date, status, workout_type")
    .eq("plan_id", activePlan.id);

  if (!allWorkouts) {
    return NextResponse.json({ message: "No workouts found" });
  }

  let unblocked = 0;
  let blocked = 0;

  for (const workout of allWorkouts) {
    // Check if this workout falls within ANY blocking life event
    const isBlocked = allEvents?.some(event => 
      workout.scheduled_date >= event.start_date && 
      workout.scheduled_date <= event.end_date &&
      (!event.can_run || event.training_impact === "no_training")
    ) || false;

    if (isBlocked && workout.status === "pending") {
      // Should be blocked but isn't
      await supabase
        .from("planned_workouts")
        .update({ status: "blocked" })
        .eq("id", workout.id);
      blocked++;
    } else if (!isBlocked && workout.status === "blocked") {
      // Should NOT be blocked but is - unblock it
      await supabase
        .from("planned_workouts")
        .update({ status: "pending" })
        .eq("id", workout.id);
      unblocked++;
    }
  }

  return NextResponse.json({ 
    message: `Resync complete`,
    unblocked,
    blocked,
    totalWorkouts: allWorkouts.length,
  });
}
