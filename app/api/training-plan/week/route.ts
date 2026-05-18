import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { adjustWorkoutForReadiness } from "@/lib/training-plan-generator";

// Get this week's workouts with wellness adjustments
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get date range for this week (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Get workouts for this week
  const { data: workouts, error: workoutsError } = await supabase
    .from("planned_workouts")
    .select(`
      *,
      completed_run:runs(*)
    `)
    .eq("user_id", user.id)
    .gte("scheduled_date", monday.toISOString().split("T")[0])
    .lte("scheduled_date", sunday.toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true });

  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  // Get life events to check for blocked dates
  const { data: lifeEvents } = await supabase
    .from("life_events")
    .select("start_date, end_date, event_type, can_run")
    .eq("user_id", user.id);

  // Mark workouts that fall during life events as blocked
  const processedWorkouts = (workouts || []).map(workout => {
    const blockingEvent = lifeEvents?.find(event => 
      !event.can_run && 
      workout.scheduled_date >= event.start_date && 
      workout.scheduled_date <= event.end_date
    );
    
    if (blockingEvent && workout.status !== "skipped" && workout.status !== "completed") {
      return {
        ...workout,
        status: "blocked",
        blocked_reason: `${blockingEvent.event_type}: ${blockingEvent.start_date} - ${blockingEvent.end_date}`,
      };
    }
    return workout;
  });

  // Get today's check-in for readiness score
  const todayStr = today.toISOString().split("T")[0];
  const { data: todayCheckin } = await supabase
    .from("checkins")
    .select("readiness, energy, soreness, sleep_rating")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .maybeSingle();

  // Calculate composite readiness if we have a check-in
  let readinessScore: number | null = null;
  if (todayCheckin) {
    const scores = [
      todayCheckin.readiness,
      todayCheckin.energy,
      todayCheckin.sleep_rating,
      todayCheckin.soreness ? 6 - todayCheckin.soreness : null, // Invert soreness
    ].filter((s): s is number => s != null);
    
    if (scores.length > 0) {
      readinessScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  // Get active training plan info
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, plan_type, start_date, end_date, weekly_structure")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // Calculate current week number
  let currentWeekNumber: number | null = null;
  let currentWeekPlan = null;
  
  if (plan) {
    const startDate = new Date(plan.start_date);
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    currentWeekNumber = Math.floor(daysSinceStart / 7) + 1;
    
    if (plan.weekly_structure && Array.isArray(plan.weekly_structure)) {
      currentWeekPlan = plan.weekly_structure.find((w: { weekNumber: number }) => w.weekNumber === currentWeekNumber);
    }
  }

  // Find today's workout and apply adjustments if needed
  let todayWorkout = processedWorkouts?.find(w => w.scheduled_date === todayStr);
  let todayAdjustment = null;
  
  if (todayWorkout && todayWorkout.status !== "blocked" && readinessScore !== null && readinessScore <= 3) {
    const { adjustedWorkout, recommendation } = adjustWorkoutForReadiness(
      {
        dayOfWeek: todayWorkout.day_of_week,
        workoutType: todayWorkout.workout_type,
        title: todayWorkout.title,
        description: todayWorkout.description,
        targetMiles: todayWorkout.target_miles,
        targetPaceZone: todayWorkout.target_pace_zone,
        intervals: todayWorkout.intervals,
      },
      readinessScore
    );
    
    todayAdjustment = {
      originalWorkout: todayWorkout,
      suggestedWorkout: adjustedWorkout,
      recommendation,
      readinessScore,
    };
  }

  // Calculate weekly stats (exclude blocked workouts from planned)
  const plannedMiles = processedWorkouts?.reduce((sum, w) => {
    if (w.status === "blocked") return sum;
    return sum + (w.target_miles || 0);
  }, 0) || 0;
  const completedMiles = processedWorkouts?.reduce((sum, w) => {
    if (w.status === "completed" && w.completed_run) {
      return sum + (w.completed_run.miles || 0);
    }
    return sum;
  }, 0) || 0;

  return NextResponse.json({
    workouts: processedWorkouts || [],
    todayWorkout,
    todayAdjustment,
    readinessScore,
    plan: plan ? {
      id: plan.id,
      planType: plan.plan_type,
      currentWeek: currentWeekNumber,
      weekFocus: currentWeekPlan?.focus || null,
      weekType: currentWeekPlan?.weekType || null,
    } : null,
    weekStats: {
      plannedMiles: Math.round(plannedMiles * 10) / 10,
      completedMiles: Math.round(completedMiles * 10) / 10,
      completionPercent: plannedMiles > 0 ? Math.round((completedMiles / plannedMiles) * 100) : 0,
    },
  });
}

// Update a workout (reschedule, skip, complete)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workoutId, action, newDate, runId, reason } = body;

  if (!workoutId || !action) {
    return NextResponse.json({ error: "Workout ID and action required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  switch (action) {
    case "complete":
      updates.status = "completed";
      if (runId) updates.completed_run_id = runId;
      break;
    
    case "skip":
      updates.status = "skipped";
      updates.adjustment_reason = reason || "user_request";
      updates.adjusted_at = new Date().toISOString();
      updates.adjusted_by = "user";
      break;
    
    case "reschedule":
      if (!newDate) {
        return NextResponse.json({ error: "New date required for reschedule" }, { status: 400 });
      }
      // Get the original date first
      const { data: originalWorkout } = await supabase
        .from("planned_workouts")
        .select("scheduled_date, original_date")
        .eq("id", workoutId)
        .single();
      
      updates.status = "rescheduled";
      updates.original_date = originalWorkout?.original_date || originalWorkout?.scheduled_date;
      updates.scheduled_date = newDate;
      updates.adjustment_reason = reason || "user_request";
      updates.adjusted_at = new Date().toISOString();
      updates.adjusted_by = "user";
      break;
    
    case "accept_adjustment":
      // Accept AI-suggested adjustment
      updates.status = "modified";
      updates.adjustment_reason = "low_readiness";
      updates.adjusted_at = new Date().toISOString();
      updates.adjusted_by = "ai";
      if (body.adjustedWorkout) {
        updates.workout_type = body.adjustedWorkout.workoutType;
        updates.title = body.adjustedWorkout.title;
        updates.description = body.adjustedWorkout.description;
        updates.target_miles = body.adjustedWorkout.targetMiles;
        updates.target_pace_zone = body.adjustedWorkout.targetPaceZone;
      }
      break;
    
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: workout, error } = await supabase
    .from("planned_workouts")
    .update(updates)
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workout });
}
