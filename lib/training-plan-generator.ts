// Training Plan Generator
// Creates periodized training plans for races based on proven methodology

export interface TrainingPlanConfig {
  raceDistance: "5K" | "10K" | "Half Marathon" | "Marathon";
  raceDate: Date;
  targetTime?: string; // e.g., "3:30:00"
  currentWeeklyMiles: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  trainingDaysPerWeek: number; // 3-6
  longRunDay: string; // "Sunday", "Saturday", etc.
}

export interface WeekPlan {
  weekNumber: number;
  weekType: "base" | "build" | "peak" | "taper" | "race";
  totalMiles: number;
  workouts: WorkoutPlan[];
  focus: string; // "Building base", "Speed development", etc.
}

export interface WorkoutPlan {
  dayOfWeek: string;
  workoutType: "easy" | "long" | "tempo" | "intervals" | "recovery" | "rest" | "cross_train" | "race";
  title: string;
  description: string;
  targetMiles?: number;
  targetDurationMinutes?: number;
  targetPaceZone?: "easy" | "moderate" | "tempo" | "threshold" | "race";
  intervals?: {
    sets: number;
    distance: string;
    rest: string;
    pace: string;
  };
}

// Distance in miles
const RACE_DISTANCES: Record<string, number> = {
  "5K": 3.1,
  "10K": 6.2,
  "Half Marathon": 13.1,
  "Marathon": 26.2,
};

// Recommended training weeks by distance and level
const TRAINING_WEEKS: Record<string, Record<string, number>> = {
  "5K": { beginner: 8, intermediate: 10, advanced: 12 },
  "10K": { beginner: 10, intermediate: 12, advanced: 14 },
  "Half Marathon": { beginner: 12, intermediate: 14, advanced: 16 },
  "Marathon": { beginner: 16, intermediate: 18, advanced: 20 },
};

// Peak weekly mileage by distance and level
const PEAK_MILEAGE: Record<string, Record<string, number>> = {
  "5K": { beginner: 20, intermediate: 30, advanced: 40 },
  "10K": { beginner: 25, intermediate: 35, advanced: 50 },
  "Half Marathon": { beginner: 30, intermediate: 40, advanced: 55 },
  "Marathon": { beginner: 40, intermediate: 50, advanced: 70 },
};

// Day abbreviations for scheduling
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getDayIndex(day: string): number {
  return DAYS_OF_WEEK.indexOf(day);
}

function getNextDay(day: string, offset: number): string {
  const index = getDayIndex(day);
  return DAYS_OF_WEEK[(index + offset) % 7];
}

// Generate the weekly structure
function generateWeeklyStructure(
  config: TrainingPlanConfig,
  totalWeeks: number,
  peakMileage: number
): WeekPlan[] {
  const weeks: WeekPlan[] = [];
  const { currentWeeklyMiles, trainingDaysPerWeek, longRunDay, raceDistance } = config;

  // Phase breakdown
  const baseWeeks = Math.floor(totalWeeks * 0.25);
  const buildWeeks = Math.floor(totalWeeks * 0.4);
  const peakWeeks = Math.floor(totalWeeks * 0.2);
  const taperWeeks = totalWeeks - baseWeeks - buildWeeks - peakWeeks - 1; // -1 for race week

  // Calculate weekly mileage progression
  const mileageIncrease = (peakMileage - currentWeeklyMiles) / (baseWeeks + buildWeeks + peakWeeks);

  for (let week = 1; week <= totalWeeks; week++) {
    let weekType: WeekPlan["weekType"];
    let weekMiles: number;
    let focus: string;

    // Determine week type and mileage
    if (week <= baseWeeks) {
      weekType = "base";
      weekMiles = currentWeeklyMiles + mileageIncrease * week;
      focus = "Building aerobic base with easy miles";
    } else if (week <= baseWeeks + buildWeeks) {
      weekType = "build";
      weekMiles = currentWeeklyMiles + mileageIncrease * week;
      // Add cutback weeks every 3-4 weeks
      if ((week - baseWeeks) % 4 === 0) {
        weekMiles *= 0.75; // Cutback week
        focus = "Recovery week - reduced volume";
      } else {
        focus = "Building fitness with quality workouts";
      }
    } else if (week <= baseWeeks + buildWeeks + peakWeeks) {
      weekType = "peak";
      weekMiles = peakMileage;
      // Cutback in peak phase too
      if ((week - baseWeeks - buildWeeks) % 3 === 0) {
        weekMiles *= 0.8;
        focus = "Recovery before peak effort";
      } else {
        focus = "Peak training - highest volume";
      }
    } else if (week === totalWeeks) {
      weekType = "race";
      weekMiles = peakMileage * 0.4;
      focus = "Race week - trust your training!";
    } else {
      weekType = "taper";
      const taperWeekNum = week - (baseWeeks + buildWeeks + peakWeeks);
      weekMiles = peakMileage * (1 - taperWeekNum * 0.15);
      focus = "Tapering - maintaining sharpness while resting";
    }

    // Round mileage
    weekMiles = Math.round(weekMiles * 10) / 10;

    // Generate workouts for this week
    const workouts = generateWeekWorkouts(
      weekType,
      weekMiles,
      trainingDaysPerWeek,
      longRunDay,
      raceDistance,
      week,
      totalWeeks
    );

    weeks.push({
      weekNumber: week,
      weekType,
      totalMiles: weekMiles,
      workouts,
      focus,
    });
  }

  return weeks;
}

// Generate individual workouts for a week
function generateWeekWorkouts(
  weekType: WeekPlan["weekType"],
  totalMiles: number,
  trainingDays: number,
  longRunDay: string,
  raceDistance: string,
  weekNumber: number,
  totalWeeks: number
): WorkoutPlan[] {
  const workouts: WorkoutPlan[] = [];
  
  // Long run percentage based on race distance
  const longRunPercent = raceDistance === "Marathon" ? 0.35 : 
                         raceDistance === "Half Marathon" ? 0.30 : 0.25;
  
  const longRunMiles = Math.round(totalMiles * longRunPercent * 10) / 10;
  const remainingMiles = totalMiles - longRunMiles;
  const easyRunMiles = Math.round((remainingMiles / (trainingDays - 1)) * 10) / 10;

  // Assign long run day
  const longRunDayIndex = getDayIndex(longRunDay);

  // Determine which days are training days vs rest days
  const trainingDayIndices: number[] = [];
  
  // Always include long run day
  trainingDayIndices.push(longRunDayIndex);
  
  // Spread other training days evenly
  const daysBetween = Math.floor(7 / trainingDays);
  let currentDay = (longRunDayIndex + daysBetween) % 7;
  
  while (trainingDayIndices.length < trainingDays && trainingDayIndices.length < 6) {
    if (!trainingDayIndices.includes(currentDay)) {
      trainingDayIndices.push(currentDay);
    }
    currentDay = (currentDay + daysBetween) % 7;
    if (currentDay === longRunDayIndex) currentDay = (currentDay + 1) % 7;
  }

  // Sort training days
  trainingDayIndices.sort((a, b) => a - b);

  // Generate workout for each day
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayName = DAYS_OF_WEEK[dayIndex];
    const isTrainingDay = trainingDayIndices.includes(dayIndex);
    const isLongRunDay = dayIndex === longRunDayIndex;
    
    if (!isTrainingDay) {
      workouts.push({
        dayOfWeek: dayName,
        workoutType: "rest",
        title: "Rest Day",
        description: "Full rest or light stretching/yoga",
      });
      continue;
    }

    // Race week special handling
    if (weekType === "race") {
      if (dayIndex === longRunDayIndex) {
        workouts.push({
          dayOfWeek: dayName,
          workoutType: "race",
          title: `${raceDistance} Race Day`,
          description: "Race day! Execute your race plan and enjoy the moment.",
          targetMiles: RACE_DISTANCES[raceDistance],
          targetPaceZone: "race",
        });
      } else if (trainingDayIndices.indexOf(dayIndex) < 2) {
        workouts.push({
          dayOfWeek: dayName,
          workoutType: "easy",
          title: "Easy Shakeout",
          description: "Very easy pace, just loosening up for race day",
          targetMiles: Math.min(easyRunMiles, 3),
          targetPaceZone: "easy",
        });
      } else {
        workouts.push({
          dayOfWeek: dayName,
          workoutType: "rest",
          title: "Rest Day",
          description: "Rest and prepare for your race",
        });
      }
      continue;
    }

    // Long run day
    if (isLongRunDay) {
      workouts.push({
        dayOfWeek: dayName,
        workoutType: "long",
        title: "Long Run",
        description: weekType === "taper" 
          ? "Moderate long run - maintain endurance while tapering"
          : "Build aerobic endurance at conversational pace",
        targetMiles: longRunMiles,
        targetPaceZone: "easy",
      });
      continue;
    }

    // Quality workout day (usually mid-week for build/peak phases)
    const workoutPosition = trainingDayIndices.indexOf(dayIndex);
    const shouldDoQuality = (weekType === "build" || weekType === "peak") && 
                           workoutPosition === Math.floor(trainingDays / 2);

    if (shouldDoQuality && weekType !== "base") {
      // Alternate between tempo and intervals
      if (weekNumber % 2 === 0) {
        workouts.push({
          dayOfWeek: dayName,
          workoutType: "tempo",
          title: "Tempo Run",
          description: "Comfortably hard pace - you should be able to speak in short sentences",
          targetMiles: easyRunMiles + 1,
          targetPaceZone: "tempo",
        });
      } else {
        const intervalSets = raceDistance === "5K" ? 6 : raceDistance === "10K" ? 8 : 6;
        workouts.push({
          dayOfWeek: dayName,
          workoutType: "intervals",
          title: "Speed Work",
          description: `${intervalSets}x800m with recovery jog between`,
          targetMiles: easyRunMiles + 0.5,
          targetPaceZone: "threshold",
          intervals: {
            sets: intervalSets,
            distance: "800m",
            rest: "2:00 jog",
            pace: "5K race pace",
          },
        });
      }
      continue;
    }

    // Day after long run should be recovery or rest
    if (workoutPosition === (trainingDayIndices.indexOf(longRunDayIndex) + 1) % trainingDays) {
      workouts.push({
        dayOfWeek: dayName,
        workoutType: "recovery",
        title: "Recovery Run",
        description: "Very easy pace to promote recovery from long run",
        targetMiles: Math.min(easyRunMiles, 4),
        targetPaceZone: "easy",
      });
      continue;
    }

    // Default: easy run
    workouts.push({
      dayOfWeek: dayName,
      workoutType: "easy",
      title: "Easy Run",
      description: "Relaxed pace, building aerobic fitness",
      targetMiles: easyRunMiles,
      targetPaceZone: "easy",
    });
  }

  // Sort by day of week (Monday first)
  workouts.sort((a, b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek));

  return workouts;
}

// Main function to generate a complete training plan
export function generateTrainingPlan(config: TrainingPlanConfig): {
  totalWeeks: number;
  peakMileage: number;
  weeks: WeekPlan[];
  summary: {
    startDate: Date;
    endDate: Date;
    totalMiles: number;
    avgWeeklyMiles: number;
  };
} {
  const { raceDistance, raceDate, currentWeeklyMiles, experienceLevel } = config;

  // Calculate weeks until race
  const today = new Date();
  const weeksUntilRace = Math.floor((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));

  // Get recommended training duration
  const recommendedWeeks = TRAINING_WEEKS[raceDistance][experienceLevel];
  const totalWeeks = Math.min(weeksUntilRace, recommendedWeeks);

  if (totalWeeks < 4) {
    throw new Error("Not enough time to create a training plan. Need at least 4 weeks.");
  }

  // Get peak mileage target
  const targetPeakMileage = PEAK_MILEAGE[raceDistance][experienceLevel];
  // Adjust based on current fitness - don't increase more than 10% per week
  const maxSafeIncrease = currentWeeklyMiles * Math.pow(1.1, totalWeeks * 0.6);
  const peakMileage = Math.min(targetPeakMileage, maxSafeIncrease);

  // Generate weekly structure
  const weeks = generateWeeklyStructure(config, totalWeeks, peakMileage);

  // Calculate summary stats
  const totalMiles = weeks.reduce((sum, w) => sum + w.totalMiles, 0);
  const avgWeeklyMiles = Math.round((totalMiles / totalWeeks) * 10) / 10;

  // Calculate start date (work backward from race date)
  const startDate = new Date(raceDate);
  startDate.setDate(startDate.getDate() - (totalWeeks * 7));

  return {
    totalWeeks,
    peakMileage,
    weeks,
    summary: {
      startDate,
      endDate: raceDate,
      totalMiles: Math.round(totalMiles),
      avgWeeklyMiles,
    },
  };
}

// Get workout for a specific date
export function getWorkoutForDate(weeks: WeekPlan[], startDate: Date, targetDate: Date): WorkoutPlan | null {
  const daysSinceStart = Math.floor((targetDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekIndex = Math.floor(daysSinceStart / 7);
  const dayOfWeek = DAYS_OF_WEEK[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1]; // Adjust for Monday-start

  if (weekIndex < 0 || weekIndex >= weeks.length) {
    return null;
  }

  const week = weeks[weekIndex];
  return week.workouts.find(w => w.dayOfWeek === dayOfWeek) || null;
}

// Get current week's plan
export function getCurrentWeekPlan(weeks: WeekPlan[], startDate: Date): WeekPlan | null {
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekIndex = Math.floor(daysSinceStart / 7);

  if (weekIndex < 0 || weekIndex >= weeks.length) {
    return null;
  }

  return weeks[weekIndex];
}

// Adjust workout based on readiness score
export function adjustWorkoutForReadiness(
  workout: WorkoutPlan,
  readinessScore: number
): { adjustedWorkout: WorkoutPlan; recommendation: string } {
  // Clone the workout
  const adjusted = { ...workout };
  let recommendation = "";

  if (readinessScore <= 2) {
    // Low readiness - significantly reduce or rest
    if (workout.workoutType === "intervals" || workout.workoutType === "tempo") {
      adjusted.workoutType = "easy";
      adjusted.title = "Modified: Easy Run";
      adjusted.description = "Converted from quality workout due to low readiness. Listen to your body.";
      adjusted.targetMiles = Math.min(workout.targetMiles || 4, 4);
      adjusted.targetPaceZone = "easy";
      adjusted.intervals = undefined;
      recommendation = "Your readiness is low. I've converted today's hard workout to an easy run. Consider resting if you're still tired.";
    } else if (workout.workoutType === "long") {
      adjusted.targetMiles = (workout.targetMiles || 10) * 0.6;
      adjusted.description = "Shortened long run due to low readiness. Don't push through fatigue.";
      recommendation = "Your readiness is low. I've shortened your long run by 40%. Rest is important too.";
    } else if (workout.workoutType === "easy") {
      adjusted.targetMiles = Math.min(workout.targetMiles || 4, 3);
      adjusted.description = "Keep it very easy today. Walking breaks are okay.";
      recommendation = "Take it very easy today or consider a rest day. Your body needs recovery.";
    }
  } else if (readinessScore === 3) {
    // Medium readiness - slight modifications
    if (workout.workoutType === "intervals" || workout.workoutType === "tempo") {
      adjusted.targetMiles = (workout.targetMiles || 5) * 0.85;
      adjusted.description += " (Slightly reduced volume due to moderate readiness)";
      recommendation = "Moderate readiness - proceed with the workout but listen to your body. Consider reducing intensity if needed.";
    } else if (workout.workoutType === "long") {
      adjusted.targetMiles = (workout.targetMiles || 10) * 0.85;
      recommendation = "Moderate readiness - I've slightly reduced your long run. No need to be a hero.";
    }
  } else {
    // High readiness (4-5) - proceed as planned or push slightly
    if (readinessScore === 5) {
      recommendation = "Excellent readiness! You're primed for a great workout. Consider pushing slightly if you feel good.";
    } else {
      recommendation = "Good readiness. Proceed with the planned workout.";
    }
  }

  return { adjustedWorkout: adjusted, recommendation };
}
