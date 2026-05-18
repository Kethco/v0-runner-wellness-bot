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

  // Get date range for this week (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Get life events first
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

  // Get this week's workouts from the training plan's weekly_structure
  let allWorkouts: any[] = [];
  let weekMonday = monday;
  let planWeekNumber = 1;
  
  if (plan && plan.weekly_structure) {
    const startDate = new Date(plan.start_date);
    const todayMs = today.getTime();
    const startMs = startDate.getTime();
    const daysSinceStart = Math.floor((todayMs - startMs) / (24 * 60 * 60 * 1000));
    
    // If plan hasn't started yet, show week 1 with the plan's start date
    if (daysSinceStart < 0) {
      planWeekNumber = 1;
      const planStartDay = startDate.getDay();
      const planMondayOffset = planStartDay === 0 ? -6 : 1 - planStartDay;
      weekMonday = new Date(startDate);
      weekMonday.setDate(startDate.getDate() + planMondayOffset);
    } else {
      planWeekNumber = Math.floor(daysSinceStart / 7) + 1;
    }
    
    // Get ALL weeks' workouts for redistribution (same as training plan page)
    const weekStructure = plan.weekly_structure as any[];
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    weekStructure.forEach((week: any) => {
      if (week.workouts) {
        // Calculate Monday for this week
        const weekStartDate = new Date(plan.start_date);
        weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);
        const weekDay = weekStartDate.getDay();
        const weekMondayOffset = weekDay === 0 ? -6 : 1 - weekDay;
        const weekMon = new Date(weekStartDate);
        weekMon.setDate(weekStartDate.getDate() + weekMondayOffset);
        
        week.workouts.forEach((workout: any, index: number) => {
          const dayIndex = dayOrder.indexOf(workout.dayOfWeek);
          const workoutDate = new Date(weekMon);
          workoutDate.setDate(weekMon.getDate() + dayIndex);
          
          allWorkouts.push({
            id: `week-${week.weekNumber}-${index}`,
            scheduled_date: workoutDate.toISOString().split("T")[0],
            day_of_week: workout.dayOfWeek,
            workout_type: workout.workoutType,
            title: workout.title,
            description: workout.description,
            target_miles: workout.targetMiles,
            target_pace_zone: workout.targetPaceZone,
            intervals: workout.intervals,
            status: "pending",
            completed_run: [],
          });
        });
      }
    });
  }
  
  // Apply redistribution (same logic as training plan page)
  const { adjustedWorkouts } = redistributeTraining(allWorkouts, lifeEvents || []);
  
  // Calculate this week's Monday based on plan start
  const thisWeekMondayStr = weekMonday.toISOString().split("T")[0];
  const thisWeekSundayDate = new Date(weekMonday);
  thisWeekSundayDate.setDate(weekMonday.getDate() + 6);
  const thisWeekSundayStr = thisWeekSundayDate.toISOString().split("T")[0];
  
  // Filter to just this week's workouts AFTER redistribution
  const processedWorkouts = adjustedWorkouts.filter(w => 
    w.scheduled_date >= thisWeekMondayStr && w.scheduled_date <= thisWeekSundayStr
  );

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
  let todayWorkout = processedWorkouts?.find(w => w.scheduled_date === todayStr);
  let todayAdjustment = null;
  
  if (todayWorkout && todayWorkout.status !== "blocked" && readinessScore !== null && readinessScore <= 3) {
    const { adjustedWorkout, recommendation } = adjustWorkoutForReadiness(
      {
        dayOfWeek: todayWorkout.day_of_week,
        workoutType: todayWorkout.workoutType,
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
