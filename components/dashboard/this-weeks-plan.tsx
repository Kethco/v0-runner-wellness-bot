"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  ChevronRight,
  Play,
  SkipForward,
  RefreshCcw,
  Target,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

interface Workout {
  id: string;
  scheduled_date: string;
  day_of_week: string;
  workout_type: string;
  title: string;
  description: string;
  target_miles: number | null;
  target_pace_zone: string | null;
  status: string;
  completed_run?: { miles: number } | null;
}

interface AdjustedWorkout {
  workoutType: string;
  title: string;
  description: string;
  targetMiles?: number;
  targetPaceZone?: string;
}

interface WeekData {
  workouts: Workout[];
  todayWorkout: Workout | null;
  todayAdjustment: {
    originalWorkout: Workout;
    suggestedWorkout: AdjustedWorkout;
    recommendation: string;
    readinessScore: number;
  } | null;
  readinessScore: number | null;
  plan: {
    id: string;
    planType: string;
    currentWeek: number;
    weekFocus: string | null;
    weekType: string | null;
  } | null;
  weekStats: {
    plannedMiles: number;
    completedMiles: number;
    completionPercent: number;
  };
}

const WORKOUT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  easy: { bg: "bg-green-500/15", text: "text-green-500", icon: "green" },
  long: { bg: "bg-blue-500/15", text: "text-blue-500", icon: "blue" },
  tempo: { bg: "bg-orange-500/15", text: "text-orange-500", icon: "orange" },
  intervals: { bg: "bg-purple-500/15", text: "text-purple-500", icon: "purple" },
  recovery: { bg: "bg-teal-500/15", text: "text-teal-500", icon: "teal" },
  rest: { bg: "bg-muted", text: "text-muted-foreground", icon: "gray" },
  cross_train: { bg: "bg-cyan-500/15", text: "text-cyan-500", icon: "cyan" },
  race: { bg: "bg-amber-500/15", text: "text-amber-500", icon: "amber" },
};

const DAY_ABBREV: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export function ThisWeeksPlan() {
  // Get client timezone and today's date
  const [clientTimezone, setClientTimezone] = useState<string>("");
  const [clientToday, setClientToday] = useState<string>("");
  
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setClientTimezone(tz);
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setClientToday(localDate);
  }, []);

  const { data, error, isLoading, mutate } = useSWR<WeekData>(
    clientTimezone ? `/api/training-plan/week?tz=${encodeURIComponent(clientTimezone)}` : null,
    fetcher
  );
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Show prompt to create a plan if none exists
  if (!isLoading && (!data?.plan || !data?.workouts?.length)) {
    return (
      <Card className="border-border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <CardContent className="py-8 text-center relative">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Training Plan Active</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
            Create a race goal with a training plan to see your personalized weekly workouts here.
          </p>
          <Link href="/goals">
            <Button size="sm" className="gap-2">
              <Target className="w-4 h-4" />
              Set Up Training Plan
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || error || !data) {
    return null;
  }

  const { workouts, todayWorkout, todayAdjustment, plan, weekStats, readinessScore } = data;
  // Use client's local today, not server's
  const today = clientToday;

  const handleAcceptAdjustment = async () => {
    if (!todayAdjustment) return;
    setActionLoading(true);
    try {
      console.log("[v0] Accepting adjustment for workout:", todayAdjustment.originalWorkout.id);
      console.log("[v0] Adjusted workout data:", todayAdjustment.suggestedWorkout);
      
      const response = await fetch("/api/training-plan/week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId: todayAdjustment.originalWorkout.id,
          action: "accept_adjustment",
          adjustedWorkout: todayAdjustment.suggestedWorkout,
        }),
      });
      
      const responseData = await response.json();
      console.log("[v0] Accept response:", response.ok, responseData);
      
      if (!response.ok) {
        console.error("[v0] Failed to accept adjustment:", responseData);
        alert("Failed to save adjustment: " + (responseData.error || "Unknown error"));
      } else {
        console.log("[v0] Adjustment saved, refreshing data...");
        await mutate();
        setShowAdjustmentDialog(false);
      }
    } catch (e) {
      console.error("[v0] Failed to accept adjustment:", e);
      alert("Failed to save adjustment. Please try again.");
    }
    setActionLoading(false);
  };

  const handleSkipWorkout = async (workoutId: string) => {
    setActionLoading(true);
    try {
      await fetch("/api/training-plan/week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId,
          action: "skip",
          reason: "user_request",
        }),
      });
      mutate();
    } catch (e) {
      console.error("[v0] Failed to skip workout:", e);
    }
    setActionLoading(false);
  };

  return (
    <>
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/15">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">This Week&apos;s Plan</CardTitle>
                {plan && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Week {plan.currentWeek} - {plan.weekType ? plan.weekType.charAt(0).toUpperCase() + plan.weekType.slice(1) : "Training"}
                  </p>
                )}
              </div>
            </div>
            <Link href="/goals">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                Full Plan <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Readiness Alert */}
          {todayAdjustment && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Low readiness detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {todayAdjustment.recommendation}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setShowAdjustmentDialog(true)}
                    >
                      View Suggestion
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Week Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weekly Progress</span>
              <span className="font-medium">
                {weekStats.completedMiles} / {weekStats.plannedMiles} mi
              </span>
            </div>
            <Progress value={weekStats.completionPercent} className="h-2" />
          </div>

          {/* Weekly Workout Strip - All 7 days (Monday to Sunday) */}
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayAbbr, index) => {
              // Calculate date for this day using client's today
              // Parse client's today date
              if (!clientToday) return null;
              const [year, month, day] = clientToday.split('-').map(Number);
              const todayDate = new Date(year, month - 1, day);
              const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
              
              // Calculate Monday of this week (week starts on Monday)
              // If today is Sunday (0), go back 6 days. Otherwise go back (dayOfWeek - 1) days.
              const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              const monday = new Date(todayDate);
              monday.setDate(todayDate.getDate() - daysToMonday);
              
              const date = new Date(monday);
              date.setDate(monday.getDate() + index);
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              
              // Find workout for this day
              const workout = workouts.find(w => w.scheduled_date === dateStr);
              
              // Use clientToday for comparison, not the 'today' variable which might be stale
              const isToday = dateStr === clientToday;
              const isRest = !workout || workout.workout_type === "rest";
              const isCompleted = workout?.status === "completed";
              const isSkipped = workout?.status === "skipped" || workout?.status === "blocked";

              return (
                <div
                  key={dateStr}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-center ${
                    isToday ? "ring-2 ring-primary" : ""
                  } ${
                    isCompleted
                      ? "bg-green-500/15"
                      : isSkipped
                      ? "bg-red-500/10"
                      : isRest
                      ? "bg-muted/30"
                      : "bg-primary/10"
                  }`}
                >
                  <p className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {dayAbbr}
                  </p>
                  <p className={`text-sm font-bold mt-1 ${
                    isCompleted ? "text-green-500" : isSkipped ? "text-red-500 line-through" : isRest ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {isRest ? "-" : workout?.target_miles || 0}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Today's Workout Details */}
          {todayWorkout && todayWorkout.workout_type !== "rest" && todayWorkout.status === "planned" && (
            <div className="p-3 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${WORKOUT_TYPE_COLORS[todayWorkout.workout_type]?.bg} ${WORKOUT_TYPE_COLORS[todayWorkout.workout_type]?.text} border-0 text-xs`}>
                    Today
                  </Badge>
                  <span className="font-medium text-sm">{todayWorkout.title}</span>
                </div>
                {todayWorkout.target_miles && (
                  <span className="text-sm text-muted-foreground">
                    {todayWorkout.target_miles} mi
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {todayWorkout.description}
              </p>
              <div className="flex gap-2">
                <Link href="/runs" className="flex-1">
                  <Button size="sm" className="w-full h-8 text-xs">
                    <Play className="w-3 h-3 mr-1" /> Log Run
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => handleSkipWorkout(todayWorkout.id)}
                  disabled={actionLoading}
                >
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* Week Focus */}
          {plan?.weekFocus && (
            <div className="flex items-center gap-2 pt-1">
              <Target className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{plan.weekFocus}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Workout Adjustment Suggested
            </DialogTitle>
            <DialogDescription>
              Based on your readiness score of {todayAdjustment?.readinessScore}/5, I recommend adjusting today&apos;s workout.
            </DialogDescription>
          </DialogHeader>

          {todayAdjustment && (
            <div className="space-y-4">
              {/* Original Plan */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Original Plan</p>
                <p className="font-medium">{todayAdjustment.originalWorkout.title}</p>
                <p className="text-sm text-muted-foreground">
                  {todayAdjustment.originalWorkout.target_miles} miles - {todayAdjustment.originalWorkout.workout_type}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <RefreshCcw className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Suggested Adjustment */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-600 mb-1">Suggested Instead</p>
                <p className="font-medium">
                  {(todayAdjustment.suggestedWorkout.title || '').replace(/\s*\(\+[\d.]+mi\)/g, '')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {todayAdjustment.suggestedWorkout.targetMiles} mi &bull; {todayAdjustment.suggestedWorkout.description}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {todayAdjustment.recommendation}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAdjustmentDialog(false)}
            >
              Keep Original
            </Button>
            <Button
              onClick={handleAcceptAdjustment}
              disabled={actionLoading}
            >
              Accept Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
