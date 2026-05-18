import { SupabaseClient } from "@supabase/supabase-js";

// Standard race distances with tolerance for matching
export const RACE_DISTANCES = {
  "1_mile": { miles: 1.0, tolerance: 0.05, label: "1 Mile", shortName: "Mile" },
  "5k": { miles: 3.1, tolerance: 0.15, label: "5K", shortName: "5K" },
  "10k": { miles: 6.2, tolerance: 0.2, label: "10K", shortName: "10K" },
  "half_marathon": { miles: 13.1, tolerance: 0.3, label: "Half Marathon", shortName: "Half" },
  "marathon": { miles: 26.2, tolerance: 0.5, label: "Marathon", shortName: "Full" },
} as const;

export type DistanceKey = keyof typeof RACE_DISTANCES;

interface RunData {
  id: string;
  miles: number;
  duration_minutes?: number | null;
  pace?: string | null;
  date: string;
}

interface PRCheckResult {
  isNewPR: boolean;
  distance: DistanceKey | null;
  distanceLabel: string | null;
  newTime: string | null;
  newTimeSeconds: number | null;
  previousTime: string | null;
  previousTimeSeconds: number | null;
  improvementSeconds: number | null;
  improvementDisplay: string | null;
}

/**
 * Convert pace string (e.g., "8:30") to seconds per mile
 */
function paceToSecondsPerMile(pace: string): number {
  const parts = pace.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Convert total seconds to display format (MM:SS or HH:MM:SS)
 */
export function secondsToDisplay(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Calculate total time in seconds from run data
 */
function calculateTimeSeconds(run: RunData): number | null {
  // If we have duration in minutes, use that
  if (run.duration_minutes) {
    return run.duration_minutes * 60;
  }
  
  // If we have pace, calculate from pace and distance
  if (run.pace) {
    const secondsPerMile = paceToSecondsPerMile(run.pace);
    if (secondsPerMile > 0) {
      return Math.round(secondsPerMile * run.miles);
    }
  }
  
  return null;
}

/**
 * Match a run distance to a standard race distance
 */
function matchDistance(miles: number): DistanceKey | null {
  for (const [key, config] of Object.entries(RACE_DISTANCES)) {
    if (Math.abs(miles - config.miles) <= config.tolerance) {
      return key as DistanceKey;
    }
  }
  return null;
}

/**
 * Check if a run is a new PR and record it if so
 */
export async function checkAndRecordPR(
  supabase: SupabaseClient,
  userId: string,
  run: RunData
): Promise<PRCheckResult> {
  const result: PRCheckResult = {
    isNewPR: false,
    distance: null,
    distanceLabel: null,
    newTime: null,
    newTimeSeconds: null,
    previousTime: null,
    previousTimeSeconds: null,
    improvementSeconds: null,
    improvementDisplay: null,
  };

  // Check if this matches a standard race distance
  const distance = matchDistance(run.miles);
  if (!distance) {
    return result;
  }

  // Calculate time in seconds
  const timeSeconds = calculateTimeSeconds(run);
  if (!timeSeconds || timeSeconds <= 0) {
    return result;
  }

  result.distance = distance;
  result.distanceLabel = RACE_DISTANCES[distance].label;
  result.newTimeSeconds = timeSeconds;
  result.newTime = secondsToDisplay(timeSeconds);

  // Get current best for this distance
  const { data: currentBest } = await supabase
    .from("personal_records")
    .select("id, time_seconds, time_display")
    .eq("user_id", userId)
    .eq("distance", distance)
    .eq("is_current_best", true)
    .single();

  // Check if this is a new PR
  if (!currentBest || timeSeconds < currentBest.time_seconds) {
    result.isNewPR = true;
    
    if (currentBest) {
      result.previousTimeSeconds = currentBest.time_seconds;
      result.previousTime = currentBest.time_display;
      result.improvementSeconds = currentBest.time_seconds - timeSeconds;
      result.improvementDisplay = secondsToDisplay(result.improvementSeconds);
    }

    // Calculate pace for storage
    const paceSeconds = Math.round(timeSeconds / run.miles);
    const paceMinutes = Math.floor(paceSeconds / 60);
    const paceRemaining = paceSeconds % 60;
    const pace = `${paceMinutes}:${paceRemaining.toString().padStart(2, "0")}/mi`;

    // Insert new PR record
    const { error } = await supabase.from("personal_records").insert({
      user_id: userId,
      distance: distance,
      distance_miles: RACE_DISTANCES[distance].miles,
      time_seconds: timeSeconds,
      time_display: result.newTime,
      pace: pace,
      run_id: run.id,
      achieved_at: run.date,
      is_current_best: true,
      previous_best_seconds: currentBest?.time_seconds || null,
      improvement_seconds: result.improvementSeconds,
    });

    if (error) {
      console.error("[PR] Error recording PR:", error);
      result.isNewPR = false;
    }
  }

  return result;
}

/**
 * Get all PRs for a user (current bests only)
 */
export async function getUserPRs(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("personal_records")
    .select("*")
    .eq("user_id", userId)
    .eq("is_current_best", true)
    .order("distance_miles", { ascending: true });

  if (error) {
    console.error("[PR] Error fetching PRs:", error);
    return [];
  }

  return data || [];
}

/**
 * Get PR history for a specific distance
 */
export async function getPRHistory(
  supabase: SupabaseClient,
  userId: string,
  distance: DistanceKey
) {
  const { data, error } = await supabase
    .from("personal_records")
    .select("*")
    .eq("user_id", userId)
    .eq("distance", distance)
    .order("achieved_at", { ascending: false });

  if (error) {
    console.error("[PR] Error fetching PR history:", error);
    return [];
  }

  return data || [];
}
