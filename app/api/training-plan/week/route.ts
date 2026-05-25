import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

  // Get timezone from query params (sent by client) or default to UTC
  const { searchParams } = new URL(request.url);
  const timezone = searchParams.get("tz") || "UTC";
  
  // Calculate today's date in user's timezone
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format

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

  // Calculate current week number using user's timezone
  const startDate = new Date(plan.start_date);
  const todayDate = new Date(todayStr + "T12:00:00Z"); // Use noon to avoid timezone edge cases
  const daysSinceStart = Math.floor((todayDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
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
      console.log(`[v0] Checking workout ${workout.scheduled_date} against event ${event.start_date}-${event.end_date}: shouldBlock=${shouldBlock}, inDateRange=${inDateRange}`);
      return shouldBlock && inDateRange;
    });
    
    if (blockingEvent && workout.status !== "skipped" && workout.status !== "completed") {
      console.log(`[v0] Blocking workout on ${workout.scheduled_date} due to event: ${blockingEvent.start_date}-${blockingEvent.end_date}`);
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
  // Calculate the current calendar week boundaries (Monday to Sunday) using user's timezone
  const calendarDate = new Date(todayStr + "T12:00:00Z");
  const dayOfWeek = calendarDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate week start (Monday) and week end (Sunday) for the current calendar week
  // If today is Sunday (0), go back 6 days to get Monday. Otherwise go back (dayOfWeek - 1) days.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStartDate = new Date(calendarDate);
  weekStartDate.setDate(calendarDate.getDate() - daysToMonday);
  const weekStartStr = weekStartDate.toISOString().split('T')[0];
  
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6); // Sunday
  const weekEndStr = weekEndDate.toISOString().split('T')[0];
  
  // Fetch runs only for the current calendar week
  const { data: weekRuns } = await supabase
    .from("runs")
    .select("id, date, miles, run_type")
    .eq("user_id", user.id)
    .gte("date", weekStartStr)
    .lte("date", weekEndStr);

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
  
  // Suggest adjustment if workout exists, not blocked/modified/completed, and readiness score is low (3 or below)
  // Don't suggest if already modified (user already accepted an adjustment)
  const canSuggestAdjustment = todayWorkout && 
    todayWorkout.status !== "blocked" && 
    todayWorkout.status !== "modified" && 
    todayWorkout.status !== "completed" &&
    readinessScore !== null && 
    readinessScore <= 3;
    
  if (canSuggestAdjustment) {
    // Strip ALL existing (+X.Xmi) suffixes from title - keep replacing until none left
    let cleanTitle = todayWorkout.title || '';
    while (/\(\+[\d.]+mi\)/.test(cleanTitle)) {
      cleanTitle = cleanTitle.replace(/\s*\(\+[\d.]+mi\)/g, '');
    }
    cleanTitle = cleanTitle.trim();
    
    const { adjustedWorkout, recommendation } = adjustWorkoutForReadiness(
      {
        dayOfWeek: todayWorkout.day_of_week,
        workoutType: todayWorkout.workout_type,
        title: cleanTitle,
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

  // First verify the workout belongs to the user via the training plan
  const { data: workoutCheck, error: checkError } = await supabase
    .from("planned_workouts")
    .select("id, plan_id")
    .eq("id", workoutId)
    .single();

  if (checkError || !workoutCheck) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  // Verify the plan belongs to the user
  const { data: planCheck } = await supabase
    .from("training_plans")
    .select("user_id")
    .eq("id", workoutCheck.plan_id)
    .eq("user_id", user.id)
    .single();

  if (!planCheck) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Use service client to bypass RLS for the update
  const serviceClient = createServiceClient();
  
  const { data: workout, error } = await serviceClient
    .from("planned_workouts")
    .update(updates)
    .eq("id", workoutId)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  
  if (!workout) {
    return NextResponse.json({ error: "Update returned no data" }, { status: 500 });
  }

  return NextResponse.json({ workout, success: true, updatedFields: Object.keys(updates) });
}

// POST handler for workout actions (skip, adjust)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, workoutId, reason, adjustedWorkout } = body;

  if (!workoutId || !action) {
    return NextResponse.json({ error: "Workout ID and action required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    adjusted_at: new Date().toISOString(),
  };

  switch (action) {
    case "skip":
      updates.status = "skipped";
      updates.adjustment_reason = reason || "user_request";
      updates.adjusted_by = "user";
      break;
    
    case "adjust":
      if (!adjustedWorkout) {
        return NextResponse.json({ error: "Adjusted workout data required" }, { status: 400 });
      }
      updates.status = "modified";
      updates.workout_type = adjustedWorkout.workoutType;
      updates.title = adjustedWorkout.title;
      updates.description = adjustedWorkout.description;
      updates.target_miles = adjustedWorkout.targetMiles;
      updates.target_pace_zone = adjustedWorkout.targetPaceZone;
      updates.adjustment_reason = reason || "wellness_adjustment";
      updates.adjusted_by = "user_accepted";
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

  return NextResponse.json({ workout, success: true });
}
