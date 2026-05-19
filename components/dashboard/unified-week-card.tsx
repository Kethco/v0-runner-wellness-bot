"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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
  ChevronRight,
  SkipForward,
  Target,
  Play,
  Moon,
  Flame,
  TrendingUp,
} from "lucide-react";
import { getLocalDateString, getUserTimezone } from "@/lib/utils";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(res => res.json());

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
    totalWeeks?: number;
    weekFocus: string | null;
    weekType: string | null;
  } | null;
  weekStats: {
    plannedMiles: number;
    completedMiles: number;
    completionPercent: number;
  };
}

const WORKOUT_ICONS: Record<string, { icon: typeof Flame; color: string }> = {
  easy: { icon: Play, color: "#30D158" },
  long: { icon: TrendingUp, color: "#0A84FF" },
  tempo: { icon: Flame, color: "#FF9F0A" },
  intervals: { icon: Zap, color: "#AF52DE" },
  recovery: { icon: Moon, color: "#64D2FF" },
  rest: { icon: Moon, color: "#8E8E93" },
  cross_train: { icon: Target, color: "#00C7BE" },
  race: { icon: Target, color: "#FFD60A" },
};

const DAY_ABBREV: Record<string, string> = {
  Monday: "M",
  Tuesday: "T",
  Wednesday: "W",
  Thursday: "T",
  Friday: "F",
  Saturday: "S",
  Sunday: "S",
};

// CountUp component for animated number
function CountUp({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  
  useState(() => {
    let start = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  });
  
  return <>{count}</>;
}

interface UnifiedWeekCardProps {
  weeklyMiles: number;
  weeklyGoal: number;
  runsData: Array<{ date: string; miles: number }>;
}

export function UnifiedWeekCard({ weeklyMiles, weeklyGoal, runsData }: UnifiedWeekCardProps) {
  // Get user's timezone for API calls
  const timezone = getUserTimezone();
  const { data: planData, isLoading, mutate } = useSWR<WeekData>(
    `/api/training-plan/week?tz=${encodeURIComponent(timezone)}`, 
    fetcher
  );
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Use local timezone for today's date
  const todayStr = getLocalDateString(timezone);

  // Check if we have an active training plan
  const hasPlan = planData?.plan && planData?.workouts?.length > 0;
  
  // Calculate progress based on plan or manual goal
  const plannedMiles = hasPlan ? planData!.weekStats.plannedMiles : weeklyGoal;
  const completedMiles = hasPlan ? planData!.weekStats.completedMiles : weeklyMiles;

  // Build chart data - ALWAYS show current calendar week (Mon-Sun containing today)
  // Overlay plan workouts and completed runs on matching dates
  const chartData = (() => {
    const days = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Calculate current calendar week (Monday to Sunday) using local timezone
    const today = new Date();
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(today.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    
    // Create a map of workouts by scheduled_date from the plan
    const workoutsByDate: Record<string, any> = {};
    if (hasPlan && planData?.workouts) {
      planData.workouts.forEach(w => {
        if (w.scheduled_date) {
          workoutsByDate[w.scheduled_date] = w;
        }
      });
    }
    
    return days.map((day, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      
      // Check if there's a planned workout for this date
      const workout = workoutsByDate[dateStr];
      
      // Check for completed runs on this date from runsData prop
      const dayRuns = runsData.filter(r => r.date === dateStr);
      const completedMilesFromRuns = dayRuns.reduce((sum, r) => sum + r.miles, 0);
      
      // Use workout completed_miles if available, otherwise use runsData
      const completedMiles = workout?.completed_miles || completedMilesFromRuns;
      const targetMiles = workout?.target_miles || 0;
      
      // Determine workout type and status
      const workoutType = workout?.workout_type || (completedMiles > 0 ? "easy" : "rest");
      const workoutIcon = WORKOUT_ICONS[workoutType] || WORKOUT_ICONS.easy;
      const isCompleted = completedMiles > 0;
      const isSkipped = workout?.status === "skipped" || workout?.status === "blocked";
      const isRestDay = workoutType === "rest" && targetMiles === 0 && completedMiles === 0;
      
      // Show completed miles if any, otherwise target miles
      const miles = completedMiles > 0 ? completedMiles : targetMiles;
      
      return {
        day,
        date: dateStr,
        miles,
        targetMiles,
        completedMiles,
        type: workoutType,
        color: workoutIcon.color,
        isToday: dateStr === todayStr,
        isCompleted,
        isPast: dateStr < todayStr,
        isSkipped,
        isRestDay,
        title: workout?.title || "",
      };
    });
  })();

  const maxMiles = Math.max(...chartData.map(d => d.miles), 1);
  
  // Calculate totals from chartData for accurate display
  const totalPlannedMiles = chartData.reduce((sum, d) => {
    if (d.isSkipped) return sum;
    return sum + (d.targetMiles || 0);
  }, 0);
  
  const totalCompletedMiles = chartData.reduce((sum, d) => sum + (d.completedMiles || 0), 0);
  
  // Use chartData totals for display (more accurate for current calendar week)
  const displayPlannedMiles = totalPlannedMiles > 0 ? totalPlannedMiles : weeklyGoal;
  const displayCompletedMiles = totalCompletedMiles;
  const progressPercent = displayPlannedMiles > 0 
    ? Math.min(100, Math.round((displayCompletedMiles / displayPlannedMiles) * 100))
    : 0;

  // Handle adjustment actions
  const handleAcceptAdjustment = async () => {
    if (!planData?.todayAdjustment) return;
    setActionLoading(true);
    try {
      await fetch("/api/training-plan/week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId: planData.todayAdjustment.originalWorkout.id,
          action: "accept_adjustment",
          adjustedWorkout: planData.todayAdjustment.suggestedWorkout,
        }),
      });
      mutate();
      setShowAdjustmentDialog(false);
    } catch (e) {
      console.error("Failed to accept adjustment:", e);
    }
    setActionLoading(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card relative overflow-hidden"
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF4500] to-transparent" />
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <p className="text-white text-xs font-bold uppercase tracking-widest">This Week</p>
                {hasPlan && planData?.plan && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-2.5 bg-[#FF4500]/20 text-[#FF6B00] border border-[#FF4500]/40 font-bold">
                    Week {planData.plan.currentWeek}{planData.plan.totalWeeks ? `/${planData.plan.totalWeeks}` : ""}
                  </Badge>
                )}
              </div>
              {/* Date range */}
              <p className="text-sm text-[#8E8E93] font-medium mb-4">
                {(() => {
                  const now = new Date();
                  const weekStart = new Date(now);
                  const dayOfWeek = now.getDay();
                  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                  weekStart.setDate(now.getDate() + mondayOffset);
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;
                })()}
              </p>
              {/* Mileage display */}
              <div className="flex items-baseline gap-2">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-5xl font-black text-white tracking-tight"
                >
                  {displayCompletedMiles.toFixed(1)}
                </motion.span>
                <span className="text-white/40 text-xl font-semibold">
                  / {displayPlannedMiles.toFixed(0)} mi
                </span>
              </div>
              {hasPlan && planData?.plan?.weekType && (
                <p className="text-sm text-white/50 mt-3 font-medium">
                  <span className="text-[#FF6B00] font-bold capitalize">{planData.plan.weekType}</span>
                  {planData.plan.weekFocus ? ` · ${planData.plan.weekFocus}` : ""}
                </p>
              )}
            </div>
            
            {/* Progress Ring with Glow */}
            <div className="relative w-24 h-24 flex-shrink-0">
              {/* Glow effect */}
              <motion.div 
                className="absolute inset-[-8px] rounded-full"
                style={{ 
                  background: 'radial-gradient(circle, rgba(255,69,0,0.3) 0%, transparent 70%)',
                }}
                animate={{ 
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
              
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
                <motion.circle
                  cx="50" cy="50" r="42"
                  stroke="url(#progress-gradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${progressPercent * 2.64} 264` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,69,0,0.6))' }}
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF4500" />
                    <stop offset="100%" stopColor="#FF9F0A" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span 
                  className="text-2xl font-black text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <CountUp target={Math.round(progressPercent)} />%
                </motion.span>
              </div>
            </div>
          </div>

          {/* Wellness Alert (if low readiness) */}
          {hasPlan && planData?.todayAdjustment && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20 backdrop-blur-sm"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/70 leading-relaxed">{planData.todayAdjustment.recommendation}</p>
                  <button
                    onClick={() => setShowAdjustmentDialog(true)}
                    className="text-[11px] text-amber-400 mt-1.5 hover:text-amber-300 transition-colors font-medium"
                  >
                    View adjusted workout →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Today's Workout Card */}
          {hasPlan && planData?.todayWorkout && planData.todayWorkout.workout_type !== "rest" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-5 p-4 rounded-xl bg-[#1C1C1E] border border-white/10 hover:border-white/15 transition-all"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${WORKOUT_ICONS[planData.todayWorkout.workout_type]?.color || "#FF4500"}20`,
                    boxShadow: `0 0 20px ${WORKOUT_ICONS[planData.todayWorkout.workout_type]?.color || "#FF4500"}30`
                  }}
                >
                  {(() => {
                    const IconComponent = WORKOUT_ICONS[planData.todayWorkout.workout_type]?.icon || Play;
                    return <IconComponent 
                      className="w-5 h-5" 
                      style={{ 
                        color: WORKOUT_ICONS[planData.todayWorkout.workout_type]?.color || "#FF4500",
                        filter: `drop-shadow(0 0 4px ${WORKOUT_ICONS[planData.todayWorkout.workout_type]?.color || "#FF4500"})`
                      }} 
                    />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    Today · {planData.todayWorkout.title}
                  </p>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {planData.todayWorkout.target_miles ? `${planData.todayWorkout.target_miles} mi` : ""} 
                    {planData.todayWorkout.target_pace_zone ? ` · ${planData.todayWorkout.target_pace_zone} pace` : ""}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>
            </motion.div>
          )}

          {/* Weekly Workout Strip */}
          <div className="flex items-end justify-between gap-2 bg-[#0A0A0A] rounded-xl p-4 -mx-1">
            {chartData.map((day, i) => {
              // Use logarithmic scale for better visualization
              const normalizedMiles = day.miles > 0 ? Math.log(day.miles + 1) / Math.log(maxMiles + 1) : 0;
              const barHeight = day.miles > 0 ? Math.max(normalizedMiles * 48 + 16, 20) : 16;
              
              // Determine bar style based on status
              const isRestDay = day.type === "rest" && day.miles === 0;
              const isLifeEventBlocked = day.isSkipped && day.miles > 0;
              
              // Bar color logic with glowing effects
              const getBarStyles = () => {
                if (day.isCompleted) {
                  return {
                    background: 'linear-gradient(to top, #30D158, #4ADE80)',
                    boxShadow: '0 0 12px rgba(48, 209, 88, 0.5)',
                  };
                }
                if (isLifeEventBlocked) {
                  return {
                    background: 'linear-gradient(to top, #F59E0B, #FBBF24)',
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)',
                  };
                }
                if (day.isSkipped && !isLifeEventBlocked) {
                  return {
                    background: '#EF4444',
                    opacity: 0.5,
                  };
                }
                if (isRestDay) {
                  return {
                    background: '#2A2A2A',
                    border: '1px solid #3A3A3A',
                  };
                }
                if (day.isToday && day.miles > 0) {
                  return {
                    background: 'linear-gradient(to top, #FF4500, #FF6B00)',
                    boxShadow: '0 0 16px rgba(255, 69, 0, 0.6)',
                  };
                }
                if (day.isPast && day.miles > 0) {
                  return {
                    background: '#4A4A4A',
                  };
                }
                if (day.miles > 0) {
                  return {
                    background: 'linear-gradient(to top, rgba(255,69,0,0.5), rgba(255,107,0,0.3))',
                  };
                }
                return {
                  background: '#1C1C1E',
                };
              };
              
              // Label color logic
              const getLabelColor = () => {
                if (isLifeEventBlocked) return "text-amber-400 line-through font-bold";
                if (day.isSkipped) return "text-red-400 line-through font-bold";
                if (day.isCompleted) return "text-[#30D158] font-bold";
                if (day.isToday) return "text-[#FF6B00] font-bold";
                if (isRestDay) return "text-white/40 font-semibold";
                return "text-white/70 font-semibold";
              };
              
              return (
                <div key={`${day.date}-${i}`} className="flex-1 flex flex-col items-center min-w-[38px]">
                  {/* Miles or Rest label */}
                  <span className={`text-xs mb-2 whitespace-nowrap ${getLabelColor()}`}>
                    {isRestDay ? "Rest" : day.miles > 0 ? day.miles.toFixed(1) : "Rest"}
                  </span>
                  
                  {/* Bar */}
                  <div className="w-full h-14 flex items-end justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: barHeight }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                      className="w-full max-w-[30px] rounded-t-lg"
                      style={getBarStyles()}
                    />
                  </div>
                  
                  {/* Day label */}
                  <span className={`text-xs font-bold mt-2 ${
                    day.isToday ? "text-[#FF6B00]" 
                    : day.isCompleted ? "text-[#30D158]" 
                    : isLifeEventBlocked ? "text-amber-400"
                    : day.isSkipped ? "text-red-400" 
                    : "text-white/50"
                  }`}>
                    {day.day}
                  </span>
                  
                  {/* Status indicator */}
                  <div className="h-4 flex items-center justify-center mt-1">
                    {day.isCompleted && (
                      <CheckCircle2 className="w-3 h-3 text-[#30D158]" style={{ filter: 'drop-shadow(0 0 4px rgba(48,209,88,0.5))' }} />
                    )}
                    {isLifeEventBlocked && (
                      <Calendar className="w-3 h-3 text-amber-400" />
                    )}
                    {day.isSkipped && !isLifeEventBlocked && (
                      <SkipForward className="w-3 h-3 text-red-400" />
                    )}
                    {day.isToday && !day.isCompleted && !day.isSkipped && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" style={{ boxShadow: '0 0 8px rgba(255,107,0,0.8)' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Full Plan Link */}
          {hasPlan && (
            <Link href="/training-plan" className="block mt-5">
              <Button 
                variant="ghost" 
                className="w-full h-10 text-sm text-white/60 hover:text-white hover:bg-white/5 font-semibold"
              >
                View Full Training Plan <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}

          {/* No Plan CTA */}
          {!hasPlan && !isLoading && (
            <Link href="/goals" className="block mt-5">
              <Button 
                variant="ghost" 
                className="w-full h-10 text-sm text-[#FF4500] hover:text-[#FF6B00] hover:bg-[#FF4500]/10 font-semibold"
              >
                <Target className="w-4 h-4 mr-1.5" />
                Set Up Training Plan
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="sm:max-w-md bg-[#1C1C1E] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle>Suggested Workout Adjustment</DialogTitle>
            <DialogDescription>
              Based on your readiness score of {planData?.todayAdjustment?.readinessScore || 0}/100
            </DialogDescription>
          </DialogHeader>
          
          {planData?.todayAdjustment && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-[#2A2A2A]">
                <p className="text-xs text-[#8E8E93] mb-1">Original Plan</p>
                <p className="text-sm font-medium text-white">{planData.todayAdjustment.originalWorkout.title}</p>
                <p className="text-xs text-[#AEAEB2]">
                  {planData.todayAdjustment.originalWorkout.target_miles} mi
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <SkipForward className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-[#30D158]/10 border border-[#30D158]/30">
                <p className="text-xs text-[#30D158] mb-1">Suggested Instead</p>
                <p className="text-sm font-medium text-white">{planData.todayAdjustment.suggestedWorkout.title}</p>
                <p className="text-xs text-[#AEAEB2]">
                  {planData.todayAdjustment.suggestedWorkout.targetMiles} mi • {planData.todayAdjustment.suggestedWorkout.description}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)}>
              Keep Original
            </Button>
            <Button 
              onClick={handleAcceptAdjustment} 
              disabled={actionLoading}
              className="bg-[#30D158] hover:bg-[#30D158]/90"
            >
              {actionLoading ? "Updating..." : "Accept Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
