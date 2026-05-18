"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar, Activity, Flame, Zap } from "lucide-react";
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

const RACE_DISTANCES: Record<string, number> = {
  "5K": 3.1,
  "10K": 6.2,
  "Half Marathon": 13.1,
  "Marathon": 26.2,
  "Ultra": 50,
};

// Animated counter component
function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (value - startValue) * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <span>{displayValue}</span>;
}

// Pulsing dot component
function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", color)} />
      <span className={cn("relative inline-flex rounded-full h-2 w-2", color)} />
    </span>
  );
}

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

  const daysUntilRace = activeGoal?.target_date
    ? Math.ceil((new Date(activeGoal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const weeksUntilRace = daysUntilRace ? Math.ceil(daysUntilRace / 7) : null;
  const totalMilesLast90Days = runsData?.runs?.reduce((sum, r) => sum + Number(r.miles), 0) || 0;
  const weeklyAverage = totalMilesLast90Days / 12;
  const expectedWeeklyMiles = weeklyBreakdown?.find(w => w.weekNumber === currentWeek)?.totalMiles || 0;

  const thisWeekCompliance = weekStats && weekStats.plannedMiles > 0
    ? Math.round((weekStats.completedMiles / weekStats.plannedMiles) * 100)
    : 100;

  const today = new Date().toISOString().split("T")[0];
  const blockedDaysRemaining = lifeEvents
    .filter(e => !e.can_run || e.training_impact === "no_training")
    .filter(e => e.end_date >= today)
    .reduce((days, e) => {
      const start = new Date(Math.max(new Date(e.start_date).getTime(), Date.now()));
      const end = new Date(e.end_date);
      return days + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

  const raceDistance = activeGoal?.distance ? RACE_DISTANCES[activeGoal.distance] || 26.2 : 26.2;
  const peakWeeklyTarget = raceDistance * 2.5;
  const currentProgress = weeklyAverage / peakWeeklyTarget;
  const trainingDaysLost = blockedDaysRemaining;
  const adjustedProgress = currentProgress * (1 - (trainingDaysLost / (weeksUntilRace || 12) / 7) * 0.5);

  type GoalStatus = "on_track" | "at_risk" | "behind" | "no_goal";
  let goalStatus: GoalStatus = "on_track";
  let statusMessage = "";
  let statusColor = "text-emerald-400";
  let bgColor = "bg-emerald-500";
  let glowColor = "shadow-emerald-500/50";

  if (!activeGoal) {
    goalStatus = "no_goal";
    statusMessage = "Set a goal to track your progress";
  } else if (daysUntilRace && daysUntilRace < 0) {
    goalStatus = "on_track";
    statusMessage = "Race day has passed!";
  } else if (adjustedProgress >= 0.7 && thisWeekCompliance >= 70) {
    goalStatus = "on_track";
    statusMessage = "You're crushing it!";
    statusColor = "text-emerald-400";
    bgColor = "bg-emerald-500";
    glowColor = "shadow-emerald-500/50";
  } else if (adjustedProgress >= 0.5 || thisWeekCompliance >= 50) {
    goalStatus = "at_risk";
    statusMessage = blockedDaysRemaining > 7 
      ? `${blockedDaysRemaining} blocked days - stay focused`
      : "Slightly behind, but recoverable";
    statusColor = "text-amber-400";
    bgColor = "bg-amber-500";
    glowColor = "shadow-amber-500/50";
  } else {
    goalStatus = "behind";
    statusMessage = "Training needs attention";
    statusColor = "text-red-400";
    bgColor = "bg-red-500";
    glowColor = "shadow-red-500/50";
  }

  if (!activeGoal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border-[#2A2A2A] p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FF4500]/5 via-transparent to-transparent" />
          <div className="relative flex flex-col items-center justify-center py-8 text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4500] to-[#FF6B00] flex items-center justify-center mb-4 shadow-lg shadow-[#FF4500]/30"
            >
              <Target className="w-8 h-8 text-white" />
            </motion.div>
            <p className="text-lg font-bold text-white mb-1">No Goal Set</p>
            <p className="text-sm text-[#8E8E93]">Add a race goal to track your journey</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  const progressPercent = Math.min(100, Math.round(adjustedProgress * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0D0D0D] border-[#2A2A2A] p-0 relative overflow-hidden">
        {/* Animated background gradient */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(ellipse at 0% 0%, rgba(255,69,0,0.15) 0%, transparent 50%)",
              "radial-gradient(ellipse at 100% 100%, rgba(255,69,0,0.15) 0%, transparent 50%)",
              "radial-gradient(ellipse at 0% 100%, rgba(255,69,0,0.15) 0%, transparent 50%)",
              "radial-gradient(ellipse at 0% 0%, rgba(255,69,0,0.15) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Top status bar with glow */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-1 origin-left shadow-lg", bgColor, glowColor)}
        />

        <div className="p-5 relative">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Animated status icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center relative",
                  "bg-gradient-to-br shadow-lg",
                  goalStatus === "on_track" && "from-emerald-500 to-emerald-600 shadow-emerald-500/30",
                  goalStatus === "at_risk" && "from-amber-500 to-amber-600 shadow-amber-500/30",
                  goalStatus === "behind" && "from-red-500 to-red-600 shadow-red-500/30"
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={goalStatus}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {goalStatus === "on_track" && <Flame className="w-6 h-6 text-white" />}
                    {goalStatus === "at_risk" && <AlertTriangle className="w-6 h-6 text-white" />}
                    {goalStatus === "behind" && <TrendingDown className="w-6 h-6 text-white" />}
                  </motion.div>
                </AnimatePresence>
                
                {/* Pulse ring for on_track */}
                {goalStatus === "on_track" && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-emerald-500"
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <div>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="text-lg font-bold text-white"
                >
                  {activeGoal.race_name || activeGoal.distance}
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="flex items-center gap-2"
                >
                  <PulsingDot color={bgColor} />
                  <p className={cn("text-sm font-medium", statusColor)}>{statusMessage}</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Days countdown with animation */}
            {daysUntilRace !== null && daysUntilRace > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 150, delay: 0.5 }}
                className="text-right bg-[#1F1F1F] rounded-xl px-4 py-2 border border-[#2A2A2A]"
              >
                <motion.p 
                  className="text-3xl font-black bg-gradient-to-r from-[#FF4500] to-[#FF6B00] bg-clip-text text-transparent"
                >
                  <AnimatedNumber value={daysUntilRace} duration={1} />
                </motion.p>
                <p className="text-[10px] text-[#6E6E73] uppercase tracking-wider font-semibold">days to go</p>
              </motion.div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="bg-[#1F1F1F]/80 backdrop-blur rounded-xl p-4 border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF4500]/20 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-[#FF4500]" />
                </div>
                <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider font-semibold">Weekly Avg</p>
              </div>
              <p className="text-2xl font-black text-white">
                {weeklyAverage.toFixed(1)} <span className="text-sm font-normal text-[#6E6E73]">mi</span>
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-1">
                Target: {expectedWeeklyMiles > 0 ? `${expectedWeeklyMiles} mi` : `~${peakWeeklyTarget.toFixed(0)} mi peak`}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="bg-[#1F1F1F]/80 backdrop-blur rounded-xl p-4 border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider font-semibold">This Week</p>
              </div>
              <p className="text-2xl font-black text-white">
                <AnimatedNumber value={thisWeekCompliance} duration={1.2} />
                <span className="text-sm font-normal text-[#6E6E73]">%</span>
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-1">
                {weekStats?.completedMiles?.toFixed(1) || 0} / {weekStats?.plannedMiles?.toFixed(1) || 0} mi
              </p>
            </motion.div>
          </div>

          {/* Life events warning */}
          <AnimatePresence>
            {blockedDaysRemaining > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <motion.div 
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-amber-400">{blockedDaysRemaining} training days blocked</p>
                      <p className="text-xs text-[#8E8E93]">Miles redistributed to available days</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#8E8E93] font-semibold uppercase tracking-wider">Training Readiness</p>
              <motion.p 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 1 }}
                className={cn("text-sm font-black", statusColor)}
              >
                <AnimatedNumber value={progressPercent} duration={1.5} />%
              </motion.p>
            </div>
            <div className="h-3 bg-[#1F1F1F] rounded-full overflow-hidden border border-[#2A2A2A]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "h-full rounded-full relative overflow-hidden",
                  "bg-gradient-to-r",
                  goalStatus === "on_track" && "from-emerald-500 to-emerald-400",
                  goalStatus === "at_risk" && "from-amber-500 to-amber-400",
                  goalStatus === "behind" && "from-red-500 to-red-400"
                )}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
