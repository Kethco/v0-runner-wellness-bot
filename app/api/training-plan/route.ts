import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateTrainingPlan, TrainingPlanConfig } from "@/lib/training-plan-generator";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeWorkouts = searchParams.get("includeWorkouts") === "true";

  // Get active training plan
  const { data: plan, error } = await supabase
    .from("training_plans")
    .select(`
      *,
      goal:goals(*)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json({ plan: null });
  }

  // Calculate current week
  const startDate = new Date(plan.start_date);
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1);
  
  // Calculate total weeks
  const endDate = new Date(plan.end_date);
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.ceil(totalDays / 7);

  if (!includeWorkouts) {
    return NextResponse.json({ 
      plan,
      currentWeek,
      totalWeeks,
    });
  }

  // Get all workouts for this plan
  const { data: workouts, error: workoutsError } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_id", plan.id)
    .order("scheduled_date", { ascending: true });

  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  // Group workouts by week
  const weeklyBreakdown = [];
  for (let week = 1; week <= totalWeeks; week++) {
    const weekWorkouts = workouts?.filter(w => w.week_number === week) || [];
    const totalMiles = weekWorkouts.reduce((sum, w) => sum + (w.target_miles || 0), 0);
    
    // Determine week type based on position in plan
    let weekType = "base";
    const weekPercent = week / totalWeeks;
    if (weekPercent <= 0.3) weekType = "base";
    else if (weekPercent <= 0.6) weekType = "build";
    else if (weekPercent <= 0.85) weekType = "peak";
    else if (weekPercent < 1) weekType = "taper";
    else weekType = "race";

    weeklyBreakdown.push({
      weekNumber: week,
      weekType,
      totalMiles,
      workouts: weekWorkouts,
    });
  }

  return NextResponse.json({ 
    plan,
    workouts,
    currentWeek,
    totalWeeks,
    weeklyBreakdown,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  const {
    goalId,
    raceDistance,
    raceDate,
    targetTime,
    currentWeeklyMiles = 15,
    experienceLevel = "intermediate",
    trainingDaysPerWeek = 5,
    longRunDay = "Sunday",
  } = body;

  // Validate required fields
  if (!raceDistance || !raceDate) {
    return NextResponse.json(
      { error: "Race distance and date are required" },
      { status: 400 }
    );
  }

  // Generate the training plan
  const config: TrainingPlanConfig = {
    raceDistance,
    raceDate: new Date(raceDate),
    targetTime,
    currentWeeklyMiles,
    experienceLevel,
    trainingDaysPerWeek,
    longRunDay,
  };

  let generatedPlan;
  try {
    generatedPlan = generateTrainingPlan(config);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate plan" },
      { status: 400 }
    );
  }

  // Deactivate any existing active plans
  await supabase
    .from("training_plans")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Create the training plan
  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .insert({
      user_id: user.id,
      goal_id: goalId || null,
      plan_type: raceDistance,
      experience_level: experienceLevel,
      start_date: generatedPlan.summary.startDate.toISOString().split("T")[0],
      end_date: generatedPlan.summary.endDate.toISOString().split("T")[0],
      target_time: targetTime,
      peak_weekly_miles: generatedPlan.peakMileage,
      starting_weekly_miles: currentWeeklyMiles,
      training_days_per_week: trainingDaysPerWeek,
      long_run_day: longRunDay,
      weekly_structure: generatedPlan.weeks,
      status: "active",
    })
    .select()
    .single();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  // Create individual workout entries
  const workouts: Array<{
    plan_id: string;
    user_id: string;
    scheduled_date: string;
    week_number: number;
    day_of_week: string;
    workout_type: string;
    title: string;
    description: string;
    target_miles: number | null;
    target_duration_minutes: number | null;
    target_pace_zone: string | null;
    intervals: object | null;
    status: string;
  }> = [];

  const startDate = new Date(generatedPlan.summary.startDate);
  
  for (const week of generatedPlan.weeks) {
    for (const workout of week.workouts) {
      // Calculate the actual date for this workout
      const dayIndex = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(workout.dayOfWeek);
      const workoutDate = new Date(startDate);
      workoutDate.setDate(startDate.getDate() + (week.weekNumber - 1) * 7 + dayIndex);

      workouts.push({
        plan_id: plan.id,
        user_id: user.id,
        scheduled_date: workoutDate.toISOString().split("T")[0],
        week_number: week.weekNumber,
        day_of_week: workout.dayOfWeek,
        workout_type: workout.workoutType,
        title: workout.title,
        description: workout.description,
        target_miles: workout.targetMiles || null,
        target_duration_minutes: workout.targetDurationMinutes || null,
        target_pace_zone: workout.targetPaceZone || null,
        intervals: workout.intervals || null,
        status: "planned",
      });
    }
  }

  // Insert all workouts
  const { error: workoutsError } = await supabase
    .from("planned_workouts")
    .insert(workouts);

  if (workoutsError) {
    // Rollback the plan if workouts fail
    await supabase.from("training_plans").delete().eq("id", plan.id);
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  // Update the goal to indicate it has a training plan
  if (goalId) {
    await supabase
      .from("goals")
      .update({ has_training_plan: true })
      .eq("id", goalId);
  }

  return NextResponse.json({
    plan,
    summary: generatedPlan.summary,
    totalWeeks: generatedPlan.totalWeeks,
    peakMileage: generatedPlan.peakMileage,
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("id");

  if (!planId) {
    return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
  }

  // Get the plan to find associated goal
  const { data: plan } = await supabase
    .from("training_plans")
    .select("goal_id")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  // Delete the plan (workouts will cascade delete due to FK)
  const { error } = await supabase
    .from("training_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update the goal to indicate no training plan
  if (plan?.goal_id) {
    await supabase
      .from("goals")
      .update({ has_training_plan: false })
      .eq("id", plan.goal_id);
  }

  return NextResponse.json({ success: true });
}
