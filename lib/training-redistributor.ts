/**
 * Smart Training Redistribution
 * 
 * When workouts are skipped due to life events, this redistributes
 * the training load to nearby available days to keep the runner
 * on track for their race goal.
 */

interface Workout {
  id: string;
  scheduled_date: string;
  day_of_week: string;
  workout_type: string;
  title: string;
  description: string;
  target_miles: number | null;
  target_duration_minutes: number | null;
  target_pace_zone: string | null;
  status: string;
  week_number: number;
  blocked_reason?: string;
}

interface LifeEvent {
  start_date: string;
  end_date: string;
  event_type: string;
  can_run: boolean;
  training_impact: string;
}

interface RedistributionResult {
  adjustedWorkouts: Workout[];
  summary: {
    skippedMiles: number;
    redistributedMiles: number;
    adjustments: Array<{
      date: string;
      originalMiles: number;
      addedMiles: number;
      reason: string;
    }>;
  };
}

// Workout type priority - higher priority workouts should be preserved
const WORKOUT_PRIORITY: Record<string, number> = {
  long_run: 5,
  tempo: 4,
  intervals: 4,
  race_pace: 4,
  easy: 2,
  recovery: 1,
  rest: 0,
  cross_training: 1,
};

// Maximum miles to add to a single day (to prevent overtraining)
const MAX_ADDITIONAL_MILES_PER_DAY = 2;

// Days before/after the event to look for redistribution
const REDISTRIBUTION_WINDOW_DAYS = 7;

export function redistributeTraining(
  allWorkouts: Workout[],
  lifeEvents: LifeEvent[]
): RedistributionResult {
  // Sort workouts by date
  const sortedWorkouts = [...allWorkouts].sort((a, b) => 
    a.scheduled_date.localeCompare(b.scheduled_date)
  );

  // Find blocked/skipped workouts due to life events
  const blockedWorkouts: Workout[] = [];
  const availableWorkouts: Workout[] = [];

  for (const workout of sortedWorkouts) {
    const isBlocked = lifeEvents.some(event => {
      const shouldBlock = !event.can_run || event.training_impact === "no_training";
      const inDateRange = workout.scheduled_date >= event.start_date && 
                          workout.scheduled_date <= event.end_date;
      return shouldBlock && inDateRange;
    }) || workout.status === "skipped" || workout.status === "blocked";

    if (isBlocked && workout.workout_type !== "rest") {
      blockedWorkouts.push(workout);
    } else if (
      workout.status !== "completed" && 
      workout.workout_type !== "rest" &&
      !isBlocked
    ) {
      availableWorkouts.push(workout);
    }
  }

  // Calculate total miles lost
  const skippedMiles = blockedWorkouts.reduce(
    (sum, w) => sum + (w.target_miles || 0), 
    0
  );

  // Create a map to track adjustments to each workout
  const adjustmentMap = new Map<string, { 
    workout: Workout; 
    addedMiles: number;
    reason: string;
  }>();

  // Try to redistribute miles from blocked workouts
  let redistributedMiles = 0;

  for (const blockedWorkout of blockedWorkouts) {
    if (!blockedWorkout.target_miles || blockedWorkout.target_miles <= 0) {
      continue;
    }

    const blockedDate = new Date(blockedWorkout.scheduled_date);
    let milesToRedistribute = blockedWorkout.target_miles;

    // Find available days within the redistribution window
    // Prioritize days BEFORE the blocked workout (front-loading training)
    const candidateDays = availableWorkouts
      .filter(w => {
        const wDate = new Date(w.scheduled_date);
        const daysDiff = Math.abs(
          (wDate.getTime() - blockedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff <= REDISTRIBUTION_WINDOW_DAYS && wDate < blockedDate;
      })
      .sort((a, b) => {
        // Sort by proximity to blocked date (closer = better)
        const aDiff = Math.abs(
          new Date(a.scheduled_date).getTime() - blockedDate.getTime()
        );
        const bDiff = Math.abs(
          new Date(b.scheduled_date).getTime() - blockedDate.getTime()
        );
        return aDiff - bDiff;
      });

    // If no days before, try days after
    if (candidateDays.length === 0) {
      const afterDays = availableWorkouts
        .filter(w => {
          const wDate = new Date(w.scheduled_date);
          const daysDiff = Math.abs(
            (wDate.getTime() - blockedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysDiff <= REDISTRIBUTION_WINDOW_DAYS && wDate > blockedDate;
        })
        .sort((a, b) => {
          const aDiff = Math.abs(
            new Date(a.scheduled_date).getTime() - blockedDate.getTime()
          );
          const bDiff = Math.abs(
            new Date(b.scheduled_date).getTime() - blockedDate.getTime()
          );
          return aDiff - bDiff;
        });
      candidateDays.push(...afterDays);
    }

    // Distribute miles across candidate days
    for (const candidate of candidateDays) {
      if (milesToRedistribute <= 0) break;

      const existing = adjustmentMap.get(candidate.id);
      const currentAddedMiles = existing?.addedMiles || 0;
      const remainingCapacity = MAX_ADDITIONAL_MILES_PER_DAY - currentAddedMiles;

      if (remainingCapacity > 0) {
        const milesToAdd = Math.min(milesToRedistribute, remainingCapacity);
        
        // Calculate actual day name from scheduled_date instead of using stored day_of_week
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let blockedDayName = blockedWorkout.day_of_week;
        if (blockedWorkout.scheduled_date) {
          const [y, m, d] = blockedWorkout.scheduled_date.split('-').map(Number);
          const blockedDate = new Date(y, m - 1, d);
          blockedDayName = dayNames[blockedDate.getDay()];
        }
        
        adjustmentMap.set(candidate.id, {
          workout: candidate,
          addedMiles: currentAddedMiles + milesToAdd,
          reason: `+${milesToAdd.toFixed(1)}mi from ${blockedDayName} (${blockedWorkout.workout_type})`,
        });

        milesToRedistribute -= milesToAdd;
        redistributedMiles += milesToAdd;
      }
    }
  }

  // Apply adjustments to create the final workout list
  const adjustedWorkouts = sortedWorkouts.map(workout => {
    const adjustment = adjustmentMap.get(workout.id);
    if (adjustment) {
      return {
        ...workout,
        target_miles: (workout.target_miles || 0) + adjustment.addedMiles,
        title: workout.title + ` (+${adjustment.addedMiles.toFixed(1)}mi)`,
        adjustment_note: adjustment.reason,
      };
    }
    return workout;
  });

  // Build summary
  const adjustments = Array.from(adjustmentMap.values()).map(adj => ({
    date: adj.workout.scheduled_date,
    originalMiles: adj.workout.target_miles || 0,
    addedMiles: adj.addedMiles,
    reason: adj.reason,
  }));

  return {
    adjustedWorkouts,
    summary: {
      skippedMiles,
      redistributedMiles,
      adjustments,
    },
  };
}

/**
 * Get a summary message about how training was redistributed
 */
export function getRedistributionMessage(summary: RedistributionResult["summary"]): string {
  if (summary.skippedMiles === 0) {
    return "";
  }

  const percentRecovered = summary.skippedMiles > 0 
    ? Math.round((summary.redistributedMiles / summary.skippedMiles) * 100)
    : 0;

  if (summary.redistributedMiles === 0) {
    return `${summary.skippedMiles.toFixed(1)} miles skipped due to life events. Unable to redistribute - consider extending your training plan.`;
  }

  if (percentRecovered >= 90) {
    return `Training adjusted: ${summary.redistributedMiles.toFixed(1)} of ${summary.skippedMiles.toFixed(1)} skipped miles redistributed to nearby days. You're still on track!`;
  }

  return `Training adjusted: ${summary.redistributedMiles.toFixed(1)} of ${summary.skippedMiles.toFixed(1)} skipped miles redistributed. ${(summary.skippedMiles - summary.redistributedMiles).toFixed(1)} miles could not be recovered.`;
}
