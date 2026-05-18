import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { adjustWorkoutForReadiness } from "@/lib/training-plan-generator";
import { redistributeTraining } from "@/lib/training-redistributor";

// Get this week's workouts with wellness adjustments and redistribution
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Get life events
  const { data: lifeEvents } = await supabase
    .from("life_events")
    .select("start_date, end_date, event_type, can_run, training_impact")
    .eq("user_id", user.id);

  // Get active training plan
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, plan_type, start_date, end_date, weekly_structure")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({
      workouts: [],
      todayWorkout: null,
      todayAdjustment: null,
      readinessScore: null,
      plan: null,
      weekStats: { plannedMiles: 0, completedMiles: 0, completionPercent: 0 },
    });
  }

  // Calculate current week number
  const startDate = new Date(plan.start_date);
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const planWeekNumber = daysSinceStart < 0 ? 1 : Math.floor(daysSinceStart / 7) + 1;

  // Get ALL workouts from planned_workouts table (same as training-plan API)
  const { data: allWorkouts } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_id", plan.id)
    .order("scheduled_date", { ascending: true });

  if (!allWorkouts || allWorkouts.length === 0) {
    return NextResponse.json({
      workouts: [],
      todayWorkout: null,
      todayAdjustment: null,
      readinessScore: null,
      plan: { id: plan.id, planType: plan.plan_type, currentWeek: planWeekNumber },
      weekStats: { plannedMiles: 0, completedMiles: 0, completionPercent: 0 },
    });
  }

  // Apply redistribution (same as training plan page does on client side)
  const { adjustedWorkouts } = redistributeTraining(allWorkouts, lifeEvents || []);

  // Mark blocked workouts (same as training plan page)
  const processedAllWorkouts = adjustedWorkouts.map(workout => {
    const blockingEvent = lifeEvents?.find(event => {
      const shouldBlock = !event.can_run || event.training_impact === "no_training";
      const inDateRange = workout.scheduled_date >= event.start_date && 
                          workout.scheduled_date <= event.end_date;
      return shouldBlock && inDateRange;
    });
    
    if (blockingEvent && workout.status !== "skipped" && workout.status !== "completed") {
      return {
        ...workout,
        status: "blocked",
        blocked_reason: `${blockingEvent.event_type}: ${blockingEvent.start_date} - ${blockingEvent.end_date}`,
      };
    }
    return workout;
  });

  // Filter to the current week
  const thisWeekWorkouts = processedAllWorkouts.filter(w => w.week_number === planWeekNumber);

  // Get actual runs for this week to calculate completed miles
  // For runs, use the scheduled_date range from the workouts being displayed
  // This handles both current week (plan started) and preview week (plan not started)
  const workoutDates = thisWeekWorkouts.map(w => w.scheduled_date).filter(Boolean);
  const minWorkoutDate = workoutDates.length > 0 ? workoutDates.sort()[0] : todayStr;
  const maxWorkoutDate = workoutDates.length > 0 ? workoutDates.sort().reverse()[0] : todayStr;
  
  // Also fetch runs for TODAY regardless of plan week (for immediate feedback)
  const { data: weekRuns } = await supabase
    .from("runs")
    .select("id, date, miles, run_type")
    .eq("user_id", user.id)
    .or(`and(date.gte.${minWorkoutDate},date.lte.${maxWorkoutDate}),date.eq.${todayStr}`);
  
  console.log("[v0] Week API - todayStr:", todayStr, "minWorkoutDate:", minWorkoutDate, "maxWorkoutDate:", maxWorkoutDate);
  console.log("[v0] Week API - weekRuns:", weekRuns);

  // Create a map of runs by date for easy lookup
  const runsByDate: Record<string, { miles: number; run_type: string }[]> = {};
  (weekRuns || []).forEach(run => {
    if (!runsByDate[run.date]) runsByDate[run.date] = [];
    runsByDate[run.date].push({ miles: run.miles, run_type: run.run_type });
  });

  // Attach run data to workouts and mark completed
  const workoutsWithRuns = thisWeekWorkouts.map(workout => {
    const runsOnDate = runsByDate[workout.scheduled_date] || [];
    const completedMilesForDay = runsOnDate.reduce((sum, r) => sum + Number(r.miles), 0);
    const isCompleted = completedMilesForDay > 0;
    
    return {
      ...workout,
      completed_miles: completedMilesForDay,
      runs: runsOnDate,
      status: isCompleted ? "completed" : workout.status,
    };
  });

  // Get today's check-in for readiness score
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
      todayCheckin.soreness ? 6 - todayCheckin.soreness : null,
    ].filter((s): s is number => s != null);
    
    if (scores.length > 0) {
      readinessScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  // Get current week plan details from the already-fetched plan
  let currentWeekPlan = null;
  if (plan && plan.weekly_structure && Array.isArray(plan.weekly_structure)) {
    currentWeekPlan = plan.weekly_structure.find((w: { weekNumber: number }) => w.weekNumber === planWeekNumber);
  }

  // Find today's workout and apply adjustments if needed
  let todayWorkout = workoutsWithRuns?.find(w => w.scheduled_date === todayStr);
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
  const plannedMiles = workoutsWithRuns?.reduce((sum, w) => {
    if (w.status === "blocked") return sum;
    return sum + (w.target_miles || 0);
  }, 0) || 0;
  
  // Calculate completed miles from actual runs this week
  const completedMiles = (weekRuns || []).reduce((sum, r) => sum + Number(r.miles), 0);

  return NextResponse.json({
    workouts: workoutsWithRuns || [],
    todayWorkout,
    todayAdjustment,
    readinessScore,
    plan: plan ? {
      id: plan.id,
      planType: plan.plan_type,
      currentWeek: planWeekNumber,
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
