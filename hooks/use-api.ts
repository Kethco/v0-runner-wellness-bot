"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // Return null for 401 (not authenticated) - this is expected before login
    if (res.status === 401) {
      return null;
    }
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};

// Check-ins
export function useCheckins(days: number = 7) {
  return useSWR(`/api/checkins?days=${days}`, fetcher);
}

export function useTodayCheckin() {
  return useSWR("/api/checkins?days=1", fetcher, {
    revalidateOnFocus: true,
  });
}

export function useCreateCheckin() {
  return useSWRMutation(
    "/api/checkins",
    async (url: string, { arg }: { arg: CheckinData }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      if (!res.ok) throw new Error("Failed to create check-in");
      return res.json();
    }
  );
}

// Streak
export function useStreak() {
  return useSWR("/api/streak", fetcher);
}

// Goals
export function useGoals() {
  return useSWR("/api/goals", fetcher);
}

export function useCreateGoal() {
  return useSWRMutation(
    "/api/goals",
    async (url: string, { arg }: { arg: GoalData }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    }
  );
}

export function useUpdateGoal() {
  return useSWRMutation(
    "/api/goals",
    async (url: string, { arg }: { arg: { id: string; data: Partial<GoalData> } }) => {
      const res = await fetch(`${url}/${arg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg.data),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
    }
  );
}

export function useDeleteGoal() {
  return useSWRMutation(
    "/api/goals",
    async (url: string, { arg }: { arg: string }) => {
      const res = await fetch(`${url}/${arg}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    }
  );
}

// Trends
export function useTrends(days: number = 7) {
  return useSWR(`/api/trends?days=${days}`, fetcher);
}

// Profile
export function useProfile() {
  return useSWR("/api/profile", fetcher);
}

export function useUpdateProfile() {
  return useSWRMutation(
    "/api/profile",
    async (url: string, { arg }: { arg: Partial<ProfileData> }) => {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    }
  );
}

// Coach athletes
export function useAthletes() {
  return useSWR("/api/coach/athletes", fetcher);
}

// Types
export interface CheckinData {
  sleep_rating?: number;
  sleep_hours?: number;
  feeling?: "great" | "good" | "okay" | "tired" | "exhausted";
  energy?: number;
  soreness?: number;
  soreness_location?: string;
  readiness?: number;
  notes?: string;
  is_afternoon_update?: boolean;
}

export interface GoalData {
  distance: string;
  race_name?: string;
  target_date: string;
  target_time?: string;
  status?: "active" | "completed" | "cancelled";
  completed_time?: string;
}

export interface ProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  is_coach?: boolean;
  privacy_mode?: "solo" | "coach";
  notification_morning?: boolean;
  notification_afternoon?: boolean;
}

export interface Checkin {
  id: string;
  user_id: string;
  date: string;
  sleep_rating: number | null;
  sleep_hours: number | null;
  feeling: string | null;
  energy: number | null;
  soreness: number | null;
  soreness_location: string | null;
  readiness: number | null;
  notes: string | null;
  is_afternoon_update: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  distance: string;
  race_name: string | null;
  target_date: string;
  target_time: string | null;
  status: "active" | "completed" | "cancelled";
  completed_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  timezone: string;
  is_coach: boolean;
  coach_id: string | null;
  privacy_mode: "solo" | "coach";
  notification_morning: boolean;
  notification_afternoon: boolean;
  created_at: string;
  updated_at: string;
}
