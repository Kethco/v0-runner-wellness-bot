"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/dashboard/navbar";
import { redistributeTraining, getRedistributionMessage } from "@/lib/training-redistributor";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Play,
  Moon,
  Flame,
  TrendingUp,
  Target,
  Clock,
  MapPin,
  Loader2,
  X,
} from "lucide-react";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(res => res.json());

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
  adjustment_note?: string;
}

interface TrainingPlan {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  target_time: string | null;
  peak_weekly_miles: number;
  status: string;
  goal?: {
    race_name: string;
    target_date: string;
  };
}

interface PlanData {
  plan: TrainingPlan;
  workouts: Workout[];
  currentWeek: number;
  totalWeeks: number;
  weeklyBreakdown: Array<{
    weekNumber: number;
    weekType: string;
    totalMiles: number;
    workouts: Workout[];
  }>;
}

const WORKOUT_ICONS: Record<string, { icon: typeof Flame; color: string; bg: string }> = {
  easy: { icon: Play, color: "#30D158", bg: "bg-green-500/15" },
  long: { icon: TrendingUp, color: "#0A84FF", bg: "bg-blue-500/15" },
  tempo: { icon: Flame, color: "#FF9F0A", bg: "bg-orange-500/15" },
  intervals: { icon: Zap, color: "#AF52DE", bg: "bg-purple-500/15" },
  recovery: { icon: Moon, color: "#64D2FF", bg: "bg-cyan-500/15" },
  rest: { icon: Moon, color: "#8E8E93", bg: "bg-muted" },
  cross_train: { icon: Target, color: "#00C7BE", bg: "bg-teal-500/15" },
  race: { icon: Target, color: "#FFD60A", bg: "bg-amber-500/15" },
};

const WEEK_TYPE_COLORS: Record<string, string> = {
  base: "bg-blue-500/20 text-blue-400",
  build: "bg-orange-500/20 text-orange-400",
  peak: "bg-red-500/20 text-red-400",
  taper: "bg-green-500/20 text-green-400",
  race: "bg-amber-500/20 text-amber-400",
};

export default function TrainingPlanPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const { data, isLoading, error } = useSWR<PlanData>(
    user ? "/api/training-plan?includeWorkouts=true" : null,
    fetcher
  );

  // Fetch life events separately for client-side blocking
  const { data: lifeEventsData } = useSWR<{ events: Array<{ 
    start_date: string; 
    end_date: string; 
    event_type: string;
    can_run: boolean;
    training_impact: string;
  }> }>(
    user ? "/api/life-events" : null,
    fetcher
  );

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.plan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-5 py-6 mt-16 pb-24">
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No Training Plan</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create a race goal with a training plan to see your personalized schedule here.
              </p>
              <Button onClick={() => router.push("/goals")}>
                <Target className="w-4 h-4 mr-2" />
                Set Up Training Plan
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  const { plan, currentWeek, totalWeeks, weeklyBreakdown } = data;
  const activeWeek = selectedWeek !== null ? selectedWeek : currentWeek;
  
  // Get life events for blocking and redistribution
  const lifeEvents = lifeEventsData?.events || [];
  
  // Get all workouts across all weeks for redistribution calculation
  const allWorkouts = weeklyBreakdown.flatMap(w => w.workouts);
  
  // Apply smart redistribution across the entire plan
  const { adjustedWorkouts, summary: redistributionSummary } = redistributeTraining(
    allWorkouts,
    lifeEvents
  );
  
  // Get the adjusted workouts for the active week
  const weekData = weeklyBreakdown.find(w => w.weekNumber === activeWeek);
  const processedWeekData = weekData ? {
    ...weekData,
    workouts: weekData.workouts.map(originalWorkout => {
      // Find the adjusted version of this workout
      const adjusted = adjustedWorkouts.find(w => w.id === originalWorkout.id);
      if (!adjusted) return originalWorkout;
      
      // Check if this workout is blocked
      const isBlocked = lifeEvents.some(event => {
        const shouldBlock = !event.can_run || event.training_impact === "no_training";
        const inDateRange = adjusted.scheduled_date >= event.start_date && 
                            adjusted.scheduled_date <= event.end_date;
        return shouldBlock && inDateRange;
      }) || adjusted.status === "skipped";
      
      if (isBlocked) {
        return {
          ...adjusted,
          status: "blocked",
          blocked_reason: `Life event`,
        };
      }
      
      return adjusted;
    })
  } : null;
  
  const redistributionMessage = getRedistributionMessage(redistributionSummary);
  
  const today = new Date().toISOString().split("T")[0];

  // Calculate days until race
  const raceDate = plan.goal?.target_date || plan.end_date;
  const daysUntilRace = Math.ceil((new Date(raceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      <main className="px-5 py-6 mt-16 space-y-6">
        {/* Plan Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="goal-card-border relative overflow-hidden p-5"
        >
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FF4500] rounded-full blur-[100px] opacity-20" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2 bg-[#FF4500]/15 text-[#FF4500] border-0">
                  {plan.plan_type}
                </Badge>
                <h1 className="text-2xl font-bold text-white">
                  {plan.goal?.race_name || `${plan.plan_type} Training`}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-[#AEAEB2]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(raceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {plan.target_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Goal: {plan.target_time}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-3xl font-black text-white">{daysUntilRace}</p>
                <p className="text-xs text-[#AEAEB2]">days to go</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#8E8E93] mb-1">
                <span>Week {currentWeek} of {totalWeeks}</span>
                <span>{Math.round((currentWeek / totalWeeks) * 100)}% complete</span>
              </div>
              <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentWeek / totalWeeks) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#FF4500] to-[#FFD700] rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Training Redistribution Alert */}
        {redistributionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className={`border ${
              redistributionSummary.redistributedMiles >= redistributionSummary.skippedMiles * 0.9
                ? "border-green-500/30 bg-green-500/10"
                : "border-amber-500/30 bg-amber-500/10"
            }`}>
              <AlertDescription className={`text-sm ${
                redistributionSummary.redistributedMiles >= redistributionSummary.skippedMiles * 0.9
                  ? "text-green-400"
                  : "text-amber-400"
              }`}>
                {redistributionMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Week Selector */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Training Schedule</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={activeWeek <= 1}
                  onClick={() => setSelectedWeek(Math.max(1, activeWeek - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[80px] text-center">
                  Week {activeWeek}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={activeWeek >= totalWeeks}
                  onClick={() => setSelectedWeek(Math.min(totalWeeks, activeWeek + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {processedWeekData && (
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`text-xs ${WEEK_TYPE_COLORS[processedWeekData.weekType] || "bg-muted text-muted-foreground"}`}>
                  {processedWeekData.weekType.charAt(0).toUpperCase() + processedWeekData.weekType.slice(1)} Week
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {processedWeekData.totalMiles.toFixed(1)} miles planned
                </span>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {/* Week Mini-map */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
              {weeklyBreakdown.map((week) => (
                <button
                  key={week.weekNumber}
                  onClick={() => setSelectedWeek(week.weekNumber)}
                  className={`shrink-0 w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    week.weekNumber === activeWeek
                      ? "bg-[#FF4500] text-white"
                      : week.weekNumber === currentWeek
                      ? "bg-[#FF4500]/20 text-[#FF4500] ring-1 ring-[#FF4500]"
                      : week.weekNumber < currentWeek
                      ? "bg-[#30D158]/20 text-[#30D158]"
                      : "bg-[#2A2A2A] text-[#8E8E93]"
                  }`}
                >
                  {week.weekNumber}
                </button>
              ))}
            </div>

            {/* Workouts List */}
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {processedWeekData?.workouts.map((workout, i) => {
                  const workoutStyle = WORKOUT_ICONS[workout.workout_type] || WORKOUT_ICONS.easy;
                  const IconComponent = workoutStyle.icon;
                  const isToday = workout.scheduled_date === today;
                  const isPast = workout.scheduled_date < today;
                  const isCompleted = workout.status === "completed";
                  const isBlocked = workout.status === "blocked" || workout.status === "skipped";
                  const isRest = workout.workout_type === "rest";

                  return (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border transition-all ${
                        isBlocked
                          ? "bg-red-500/10 border-red-500/30 opacity-60"
                          : isToday
                          ? "bg-[#FF4500]/10 border-[#FF4500]/30 ring-1 ring-[#FF4500]"
                          : isCompleted
                          ? "bg-[#30D158]/10 border-[#30D158]/30"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isBlocked ? "bg-red-500/20" : isCompleted ? "bg-[#30D158]" : workoutStyle.bg
                          }`}
                        >
                          {isBlocked ? (
                            <X className="w-5 h-5 text-red-500" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <IconComponent className="w-5 h-5" style={{ color: workoutStyle.color }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${
                              isBlocked ? "text-red-500" : isCompleted ? "text-[#30D158]" : "text-foreground"
                            }`}>
                              {workout.day_of_week}
                            </p>
                            {isBlocked && (
                              <Badge className="text-[10px] h-4 bg-red-500/20 text-red-500">Blocked</Badge>
                            )}
                            {workout.adjustment_note && !isBlocked && (
                              <Badge className="text-[10px] h-4 bg-blue-500/20 text-blue-400">Adjusted</Badge>
                            )}
                            {isToday && !isBlocked && (
                              <Badge className="text-[10px] h-4 bg-[#FF4500] text-white">Today</Badge>
                            )}
                            {isCompleted && (
                              <Badge className="text-[10px] h-4 bg-[#30D158]/20 text-[#30D158]">Done</Badge>
                            )}
                          </div>
                          
                          <p className={`text-base font-medium mt-0.5 ${
                            isBlocked ? "text-red-500/70 line-through" : isRest ? "text-muted-foreground" : "text-foreground"
                          }`}>
                            {workout.title}
                          </p>
                          
                          {workout.adjustment_note && !isBlocked && (
                            <p className="text-xs text-blue-400/70 mt-1">
                              {workout.adjustment_note}
                            </p>
                          )}
                          
                          {isBlocked && workout.blocked_reason && (
                            <p className="text-xs text-red-500/70 mt-1">
                              {workout.blocked_reason}
                            </p>
                          )}
                          
                          {!isRest && !isBlocked && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {workout.target_miles && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {workout.target_miles} mi
                                </span>
                              )}
                              {workout.target_duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {workout.target_duration_minutes} min
                                </span>
                              )}
                              {workout.target_pace_zone && (
                                <span className="capitalize">{workout.target_pace_zone} pace</span>
                              )}
                            </div>
                          )}
                          
                          {workout.description && !isRest && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {workout.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{plan.peak_weekly_miles}</p>
              <p className="text-xs text-muted-foreground">Peak Miles/Wk</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalWeeks}</p>
              <p className="text-xs text-muted-foreground">Total Weeks</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[#30D158]">{currentWeek}</p>
              <p className="text-xs text-muted-foreground">Current Week</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
