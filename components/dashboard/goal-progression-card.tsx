"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  distance: string;
  race_name?: string;
  target_date: string;
  target_time?: string;
  status: string;
}

interface TrainingPlan {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  weekly_structure?: Array<{
    weekNumber: number;
    totalMiles: number;
    weekType?: string;
  }>;
}

interface LifeEvent {
  id: string;
  start_date: string;
  end_date: string;
  event_type: string;
  can_run: boolean;
  training_impact: string;
}

interface WeekStats {
  plannedMiles: number;
  completedMiles: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

// Distance in miles for each race type
const RACE_DISTANCES: Record<string, number> = {
  "5K": 3.1,
  "10K": 6.2,
  "Half Marathon": 13.1,
  "Marathon": 26.2,
  "Ultra": 50,
};

export function GoalProgressionCard() {
  const { data: goalsData } = useSWR<{ goals: Goal[] }>("/api/goals", fetcher);
  const { data: planData } = useSWR<{ plan?: TrainingPlan; weeklyBreakdown?: Array<{ weekNumber: number; totalMiles: number }> }>("/api/training-plan", fetcher);
  const { data: weekData } = useSWR<{ weekStats: WeekStats; plan?: { currentWeek: number } }>("/api/training-plan/week", fetcher);
  const { data: runsData } = useSWR<{ runs: Array<{ miles: number; date: string }> }>("/api/runs?days=90", fetcher);
  const { data: eventsData } = useSWR<{ events: LifeEvent[] }>("/api/life-events", fetcher);

  const activeGoal = goalsData?.goals?.find(g => g.status === "active" || g.status === "upcoming");
  const plan = planData?.plan;
  const weeklyBreakdown = planData?.weeklyBreakdown;
  const currentWeek = weekData?.plan?.currentWeek || 1;
  const weekStats = weekData?.weekStats;
  const lifeEvents = eventsData?.events || [];

  // Calculate days until race
  const daysUntilRace = activeGoal?.target_date
    ? Math.ceil((new Date(activeGoal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate weeks until race
  const weeksUntilRace = daysUntilRace ? Math.ceil(daysUntilRace / 7) : null;

  // Calculate total miles trained in last 90 days
  const totalMilesLast90Days = runsData?.runs?.reduce((sum, r) => sum + Number(r.miles), 0) || 0;

  // Calculate weekly average
  const weeklyAverage = totalMilesLast90Days / 12; // ~12 weeks in 90 days

  // Get expected weekly miles for current week from plan
  const expectedWeeklyMiles = weeklyBreakdown?.find(w => w.weekNumber === currentWeek)?.totalMiles || 0;

  // Calculate training compliance (actual vs planned this week)
  const thisWeekCompliance = weekStats && weekStats.plannedMiles > 0
    ? Math.round((weekStats.completedMiles / weekStats.plannedMiles) * 100)
    : 100;

  // Count remaining blocked days due to life events
  const today = new Date().toISOString().split("T")[0];
  const blockedDaysRemaining = lifeEvents
    .filter(e => !e.can_run || e.training_impact === "no_training")
    .filter(e => e.end_date >= today)
    .reduce((days, e) => {
      const start = new Date(Math.max(new Date(e.start_date).getTime(), Date.now()));
      const end = new Date(e.end_date);
      return days + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

  // Estimate if goal is achievable
  // Factors: weeks remaining, current weekly mileage, blocked days, race distance
  const raceDistance = activeGoal?.distance ? RACE_DISTANCES[activeGoal.distance] || 26.2 : 26.2;
  
  // A simple heuristic: should be running at least 2-3x race distance per week in peak training
  const peakWeeklyTarget = raceDistance * 2.5;
  const currentProgress = weeklyAverage / peakWeeklyTarget;
  
  // Adjust for blocked training days
  const trainingDaysLost = blockedDaysRemaining;
  const adjustedProgress = currentProgress * (1 - (trainingDaysLost / (weeksUntilRace || 12) / 7) * 0.5);

  // Determine goal status
  type GoalStatus = "on_track" | "at_risk" | "behind" | "no_goal";
  let goalStatus: GoalStatus = "on_track";
  let statusMessage = "";
  let statusColor = "text-emerald-500";
  let bgColor = "bg-emerald-500/10";
  let borderColor = "border-emerald-500/30";

  if (!activeGoal) {
    goalStatus = "no_goal";
    statusMessage = "Set a goal to track your progress";
  } else if (daysUntilRace && daysUntilRace < 0) {
    goalStatus = "on_track";
    statusMessage = "Race day has passed!";
  } else if (adjustedProgress >= 0.7 && thisWeekCompliance >= 70) {
    goalStatus = "on_track";
    statusMessage = "You're on track for race day";
    statusColor = "text-emerald-500";
    bgColor = "bg-emerald-500/10";
    borderColor = "border-emerald-500/30";
  } else if (adjustedProgress >= 0.5 || thisWeekCompliance >= 50) {
    goalStatus = "at_risk";
    statusMessage = blockedDaysRemaining > 7 
      ? `${blockedDaysRemaining} blocked days may impact training`
      : "Slightly behind, but recoverable";
    statusColor = "text-amber-500";
    bgColor = "bg-amber-500/10";
    borderColor = "border-amber-500/30";
  } else {
    goalStatus = "behind";
    statusMessage = "Training volume needs attention";
    statusColor = "text-red-500";
    bgColor = "bg-red-500/10";
    borderColor = "border-red-500/30";
  }

  if (!activeGoal) {
    return (
      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold">Goal Progress</p>
            <p className="text-xs text-muted-foreground">No active goal set</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          Set a race goal to track your training progress
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
    <Card className={cn("bg-card border-border p-4 relative overflow-hidden", borderColor)}>
      {/* Status banner */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cn("absolute top-0 left-0 right-0 h-1 origin-left", bgColor.replace("/10", ""))} 
      />
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColor)}
          >
            {goalStatus === "on_track" && <CheckCircle2 className={cn("w-4 h-4", statusColor)} />}
            {goalStatus === "at_risk" && <AlertTriangle className={cn("w-4 h-4", statusColor)} />}
            {goalStatus === "behind" && <TrendingDown className={cn("w-4 h-4", statusColor)} />}
          </motion.div>
          <div>
            <p className="text-sm font-bold">{activeGoal.race_name || activeGoal.distance}</p>
            <p className={cn("text-xs font-medium", statusColor)}>{statusMessage}</p>
          </div>
        </div>
        {daysUntilRace !== null && daysUntilRace > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-right"
          >
            <p className="text-2xl font-black">{daysUntilRace}</p>
            <p className="text-[10px] text-muted-foreground uppercase">days left</p>
          </motion.div>
        )}
      </motion.div>

      {/* Progress metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-secondary/50 rounded-lg p-3"
        >
          <div className="flex items-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase">Weekly Avg</p>
          </div>
          <p className="text-lg font-bold">{weeklyAverage.toFixed(1)} mi</p>
          <p className="text-[10px] text-muted-foreground">
            Target: {expectedWeeklyMiles > 0 ? `${expectedWeeklyMiles} mi` : `~${peakWeeklyTarget.toFixed(0)} mi peak`}
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-secondary/50 rounded-lg p-3"
        >
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase">This Week</p>
          </div>
          <p className="text-lg font-bold">{thisWeekCompliance}%</p>
          <p className="text-[10px] text-muted-foreground">
            {weekStats?.completedMiles?.toFixed(1) || 0} / {weekStats?.plannedMiles?.toFixed(1) || 0} mi
          </p>
        </motion.div>
      </div>

      {/* Life events impact */}
      {blockedDaysRemaining > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={cn("rounded-lg p-3 mb-3", bgColor, borderColor, "border")}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs font-medium">{blockedDaysRemaining} training days blocked</p>
              <p className="text-[10px] text-muted-foreground">
                Miles redistributed to available days
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-muted-foreground uppercase">Training Readiness</p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className={cn("text-xs font-bold", statusColor)}
          >
            {Math.round(adjustedProgress * 100)}%
          </motion.p>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.round(adjustedProgress * 100))}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className={cn("h-full rounded-full", bgColor.replace("/10", ""))}
          />
        </div>
      </div>
    </Card>
    </motion.div>
  );
}
