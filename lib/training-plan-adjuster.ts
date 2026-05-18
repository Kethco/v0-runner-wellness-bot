// Training Plan Adjuster
// Handles automatic rescheduling of workouts based on life events and wellness

import { createClient } from "@/lib/supabase/server";

interface LifeEvent {
  id: string;
  start_date: string;
  end_date: string;
  event_type: string;
  training_impact: string;
  can_run: boolean;
}

interface PlannedWorkout {
  id: string;
  plan_id: string;
  user_id: string;
  scheduled_date: string;
  original_date: string | null;
  workout_type: string;
  title: string;
  target_miles: number | null;
  status: string;
}

interface AdjustmentResult {
  success: boolean;
  adjustments: {
    workoutId: string;
    originalDate: string;
    newDate: string | null;
    action: "rescheduled" | "skipped" | "reduced";
    reason: string;
  }[];
  errors: string[];
}

// Reschedule workouts that conflict with a life event
export async function rescheduleForLifeEvent(
  userId: string,
  event: LifeEvent
): Promise<AdjustmentResult> {
  const supabase = await createClient();
  const adjustments: AdjustmentResult["adjustments"] = [];
  const errors: string[] = [];

  // Get active training plan
  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .select("id, start_date, end_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (planError || !plan) {
    return { success: false, adjustments: [], errors: ["No active training plan found"] };
  }

  // Get workouts that fall within the event dates
  const { data: affectedWorkouts, error: workoutsError } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_id", plan.id)
    .gte("scheduled_date", event.start_date)
    .lte("scheduled_date", event.end_date)
    .eq("status", "planned")
    .order("scheduled_date", { ascending: true });

  if (workoutsError) {
    return { success: false, adjustments: [], errors: [workoutsError.message] };
  }

  if (!affectedWorkouts || affectedWorkouts.length === 0) {
    return { success: true, adjustments: [], errors: [] };
  }

  // Get all workouts in the plan to find available slots
  const { data: allWorkouts } = await supabase
    .from("planned_workouts")
    .select("scheduled_date, workout_type")
    .eq("plan_id", plan.id)
    .order("scheduled_date", { ascending: true });

  const scheduledDates = new Set(allWorkouts?.map(w => w.scheduled_date) || []);

  // Process each affected workout
  for (const workout of affectedWorkouts) {
    const workoutDate = new Date(workout.scheduled_date);
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);

    // Determine action based on training impact
    if (!event.can_run || event.training_impact === "none") {
      // Can't run at all - try to reschedule before the event
      const newDate = findAvailableSlotBefore(
        workout,
        eventStart,
        scheduledDates,
        new Date(plan.start_date)
      );

      if (newDate) {
        // Reschedule before the event
        const { error: updateError } = await supabase
          .from("planned_workouts")
          .update({
            scheduled_date: newDate,
            original_date: workout.original_date || workout.scheduled_date,
            status: "rescheduled",
            adjustment_reason: `${event.event_type}: ${event.start_date} - ${event.end_date}`,
            adjusted_at: new Date().toISOString(),
            adjusted_by: "system",
          })
          .eq("id", workout.id);

        if (!updateError) {
          scheduledDates.add(newDate);
          scheduledDates.delete(workout.scheduled_date);
          adjustments.push({
            workoutId: workout.id,
            originalDate: workout.scheduled_date,
            newDate,
            action: "rescheduled",
            reason: `Moved before ${event.event_type}`,
          });
        } else {
          errors.push(`Failed to reschedule ${workout.title}: ${updateError.message}`);
        }
      } else {
        // No slot available before - try after the event
        const newDateAfter = findAvailableSlotAfter(
          workout,
          eventEnd,
          scheduledDates,
          new Date(plan.end_date)
        );

        if (newDateAfter) {
          const { error: updateError } = await supabase
            .from("planned_workouts")
            .update({
              scheduled_date: newDateAfter,
              original_date: workout.original_date || workout.scheduled_date,
              status: "rescheduled",
              adjustment_reason: `${event.event_type}: ${event.start_date} - ${event.end_date}`,
              adjusted_at: new Date().toISOString(),
              adjusted_by: "system",
            })
            .eq("id", workout.id);

          if (!updateError) {
            scheduledDates.add(newDateAfter);
            scheduledDates.delete(workout.scheduled_date);
            adjustments.push({
              workoutId: workout.id,
              originalDate: workout.scheduled_date,
              newDate: newDateAfter,
              action: "rescheduled",
              reason: `Moved after ${event.event_type}`,
            });
          } else {
            errors.push(`Failed to reschedule ${workout.title}: ${updateError.message}`);
          }
        } else {
          // No available slots - skip the workout
          const { error: skipError } = await supabase
            .from("planned_workouts")
            .update({
              status: "skipped",
              adjustment_reason: `No available slots due to ${event.event_type}`,
              adjusted_at: new Date().toISOString(),
              adjusted_by: "system",
            })
            .eq("id", workout.id);

          if (!skipError) {
            adjustments.push({
              workoutId: workout.id,
              originalDate: workout.scheduled_date,
              newDate: null,
              action: "skipped",
              reason: `Skipped due to ${event.event_type} - no available slots`,
            });
          } else {
            errors.push(`Failed to skip ${workout.title}: ${skipError.message}`);
          }
        }
      }
    } else if (event.training_impact === "reduced") {
      // Can run but reduced - reduce intensity/distance
      const { error: reduceError } = await supabase
        .from("planned_workouts")
        .update({
          target_miles: workout.target_miles ? Math.round(workout.target_miles * 0.5 * 10) / 10 : null,
          workout_type: workout.workout_type === "intervals" || workout.workout_type === "tempo" 
            ? "easy" 
            : workout.workout_type,
          title: `${workout.title} (Reduced)`,
          description: `Modified due to ${event.event_type}. Keep it easy.`,
          status: "modified",
          adjustment_reason: `Reduced intensity during ${event.event_type}`,
          adjusted_at: new Date().toISOString(),
          adjusted_by: "system",
        })
        .eq("id", workout.id);

      if (!reduceError) {
        adjustments.push({
          workoutId: workout.id,
          originalDate: workout.scheduled_date,
          newDate: workout.scheduled_date,
          action: "reduced",
          reason: `Reduced intensity during ${event.event_type}`,
        });
      } else {
        errors.push(`Failed to reduce ${workout.title}: ${reduceError.message}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    adjustments,
    errors,
  };
}

// Find an available slot before the event
function findAvailableSlotBefore(
  workout: PlannedWorkout,
  eventStart: Date,
  scheduledDates: Set<string>,
  planStart: Date
): string | null {
  const workoutDate = new Date(workout.scheduled_date);
  
  // Look for slots in the 7 days before the event
  for (let daysBack = 1; daysBack <= 7; daysBack++) {
    const candidateDate = new Date(eventStart);
    candidateDate.setDate(candidateDate.getDate() - daysBack);
    
    // Don't go before plan start
    if (candidateDate < planStart) break;
    
    // Don't reschedule to a date before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (candidateDate < today) break;
    
    const dateStr = candidateDate.toISOString().split("T")[0];
    
    // Check if slot is available
    if (!scheduledDates.has(dateStr)) {
      return dateStr;
    }
  }
  
  return null;
}

// Find an available slot after the event
function findAvailableSlotAfter(
  workout: PlannedWorkout,
  eventEnd: Date,
  scheduledDates: Set<string>,
  planEnd: Date
): string | null {
  // Look for slots in the 7 days after the event
  for (let daysAfter = 1; daysAfter <= 7; daysAfter++) {
    const candidateDate = new Date(eventEnd);
    candidateDate.setDate(candidateDate.getDate() + daysAfter);
    
    // Don't go past plan end
    if (candidateDate > planEnd) break;
    
    const dateStr = candidateDate.toISOString().split("T")[0];
    
    // Check if slot is available
    if (!scheduledDates.has(dateStr)) {
      return dateStr;
    }
  }
  
  return null;
}

// Get pending adjustments that need user review
export async function getPendingAdjustments(userId: string) {
  const supabase = await createClient();

  const { data: workouts, error } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["rescheduled", "modified", "skipped"])
    .not("adjustment_reason", "is", null)
    .order("adjusted_at", { ascending: false })
    .limit(20);

  if (error) {
    return { adjustments: [], error: error.message };
  }

  return { adjustments: workouts || [], error: null };
}

// Apply wellness-based adjustment to today's workout
export async function applyWellnessAdjustment(
  userId: string,
  workoutId: string,
  adjustedWorkout: {
    workoutType: string;
    title: string;
    description: string;
    targetMiles: number;
    targetPaceZone: string;
  },
  readinessScore: number
) {
  const supabase = await createClient();

  const { data: workout, error } = await supabase
    .from("planned_workouts")
    .update({
      workout_type: adjustedWorkout.workoutType,
      title: adjustedWorkout.title,
      description: adjustedWorkout.description,
      target_miles: adjustedWorkout.targetMiles,
      target_pace_zone: adjustedWorkout.targetPaceZone,
      status: "modified",
      adjustment_reason: `Low readiness (${readinessScore}/5)`,
      adjusted_at: new Date().toISOString(),
      adjusted_by: "user_accepted",
    })
    .eq("id", workoutId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, workout };
}
