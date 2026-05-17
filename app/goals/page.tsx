"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Calendar, Clock, Trophy, Plus, Edit2, Trash2, CheckCircle2, Loader2, Zap, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { LifeEventsManager } from "@/components/life-events-manager";

interface Goal {
  id: string;
  distance: string;
  race_name?: string;
  target_date: string;
  target_time?: string;
  actual_time?: string;
  status: "active" | "completed" | "cancelled";
  notes?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch");
  }
  return res.json();
};

const DISTANCES = ["5K", "10K", "Half Marathon", "Marathon", "Ultra"];

function getDaysUntil(dateStr: string): number {
  const raceDate = new Date(dateStr);
  const today = new Date();
  const diffTime = raceDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getWeeksUntil(dateStr: string): number {
  return Math.floor(getDaysUntil(dateStr) / 7);
}

// Helper to convert pace string "MM:SS" to seconds
function paceToSeconds(pace: string | undefined | null): number | null {
  if (!pace) return null;
  const parts = pace.split(":");
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0]);
  const seconds = parseInt(parts[1]);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

// Race time prediction using Riegel formula: T2 = T1 × (D2/D1)^1.06
// Also factors in recent training data for more accurate predictions
function predictRaceTime(
  recentRuns: { miles: number; duration_minutes?: number; pace?: string; pace_seconds?: number }[],
  targetDistance: string
): { predictedTime: string; confidence: string; basedOn: string } | null {
  // Distance in miles
  const distanceMap: Record<string, number> = {
    "5K": 3.1,
    "10K": 6.2,
    "Half Marathon": 13.1,
    "Marathon": 26.2,
    "Ultra": 31, // 50K default
  };
  
  const targetMiles = distanceMap[targetDistance];
  if (!targetMiles) return null;
  
  // Find runs with pace data, sorted by distance (prefer longer runs for prediction)
  // Support both pace (string "MM:SS") and pace_seconds (number)
  const runsWithPace = recentRuns
    .map(r => ({
      ...r,
      paceInSeconds: r.pace_seconds || paceToSeconds(r.pace)
    }))
    .filter(r => r.paceInSeconds && r.miles >= 1)
    .sort((a, b) => b.miles - a.miles);
  
  if (runsWithPace.length === 0) return null;
  
  // Use the longest recent run as base for prediction
  const baseRun = runsWithPace[0];
  const baseMiles = baseRun.miles;
  const basePaceSeconds = baseRun.paceInSeconds!;
  const baseTimeMinutes = (baseMiles * basePaceSeconds) / 60;
  
  // Riegel formula with 1.06 exponent (accounts for fatigue in longer races)
  const predictedMinutes = baseTimeMinutes * Math.pow(targetMiles / baseMiles, 1.06);
  
  // Format time
  const hours = Math.floor(predictedMinutes / 60);
  const minutes = Math.floor(predictedMinutes % 60);
  const seconds = Math.floor((predictedMinutes % 1) * 60);
  
  const predictedTime = hours > 0 
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
  
  // Confidence based on how close the base run is to target distance
  const distanceRatio = baseMiles / targetMiles;
  let confidence = "Low";
  if (distanceRatio >= 0.5) confidence = "Medium";
  if (distanceRatio >= 0.75) confidence = "High";
  if (runsWithPace.length >= 5) confidence = confidence === "Low" ? "Medium" : confidence;
  
  return {
    predictedTime,
    confidence,
    basedOn: `${baseMiles.toFixed(1)} mi run at ${Math.floor(basePaceSeconds / 60)}:${String(basePaceSeconds % 60).padStart(2, '0')}/mi`
  };
}

function formatDateStatic(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function GoalsPageContent() {
  const { data, error, mutate, isLoading } = useSWR<{ goals: Goal[] }>("/api/goals", fetcher);
  const { data: runsData } = useSWR<{ runs: { miles: number; duration_minutes?: number; pace?: string; pace_seconds?: number; date: string }[] }>("/api/runs?days=30", fetcher);
  // Fetch all runs for PR calculation (365 days to capture full history)
  const { data: allRunsData } = useSWR<{ runs: { miles: number; duration_minutes?: number; pace?: string; date: string }[] }>("/api/runs?days=365", fetcher);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [createTrainingPlan, setCreateTrainingPlan] = useState(true);
  const [trainingPlanConfig, setTrainingPlanConfig] = useState({
    experienceLevel: "intermediate" as "beginner" | "intermediate" | "advanced",
    currentWeeklyMiles: 15,
    trainingDaysPerWeek: 5,
    longRunDay: "Sunday",
  });
  const [newGoal, setNewGoal] = useState({
    distance: "",
    raceName: "",
    raceDate: "",
    targetTime: "",
  });
  
  const recentRuns = runsData?.runs || [];
  const allRuns = allRunsData?.runs || [];
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const goals = data?.goals || [];

  const formatDate = (dateStr: string): string => {
    if (!mounted) return dateStr;
    return formatDateStatic(dateStr);
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const activeGoal = activeGoals[0]; // Primary active goal
  const otherActiveGoals = activeGoals.slice(1); // Other active goals
  const completedGoals = goals.filter((g) => g.status === "completed");
  const completedGoalsCount = completedGoals.length;

  const handleAddGoal = async () => {
    setSaveError(null);
    
    if (!newGoal.distance || !newGoal.raceDate) {
      setSaveError("Please fill in Race Distance and Race Date");
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distance: newGoal.distance,
          raceName: newGoal.raceName || null,
          raceDate: newGoal.raceDate,
          targetTime: newGoal.targetTime || null,
          status: "active",
        }),
      });

      if (response.ok) {
        const goalData = await response.json();
        
        // Create training plan if requested
        if (createTrainingPlan && goalData.goal?.id) {
          try {
            await fetch("/api/training-plan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                goalId: goalData.goal.id,
                raceDistance: newGoal.distance,
                raceDate: newGoal.raceDate,
                targetTime: newGoal.targetTime || null,
                ...trainingPlanConfig,
              }),
            });
          } catch (planErr) {
            console.error("Failed to create training plan:", planErr);
          }
        }
        
        mutate();
        setNewGoal({ distance: "", raceName: "", raceDate: "", targetTime: "" });
        setCreateTrainingPlan(true);
        setSaveError(null);
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error === "Unauthorized" 
          ? "Please log in again to save your goal" 
          : errorData.error || "Failed to save goal. Please try again.");
      }
    } catch (err) {
      setSaveError("Failed to save goal. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const response = await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        mutate();
      }
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleCompleteGoal = async (id: string) => {
    try {
      const response = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed" }),
      });
      if (response.ok) {
        mutate();
      }
    } catch (err) {
      console.error("Failed to complete goal:", err);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      // Set selected goal to active
      const response = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "active" }),
      });
      if (response.ok) {
        mutate();
      }
    } catch (err) {
      console.error("Failed to set active goal:", err);
    }
  };

  // Check if user is unauthorized
  const isUnauthorized = error?.message === "Unauthorized";

return (
  <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[70px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Header with Progress Ring */}
          <div className="flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-[#2A2A2A]"
                />
                {/* Progress circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(completedGoalsCount / Math.max(goals.length, 1)) * 175.9} 175.9`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF4500" />
                    <stop offset="100%" stopColor="#FFD700" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">{completedGoalsCount}</span>
                <span className="text-[9px] text-muted-foreground">of {goals.length}</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Race Goals</h1>
              <p className="text-muted-foreground text-sm">
                {goals.length === 0 
                  ? "Set your first race target" 
                  : completedGoalsCount === goals.length && goals.length > 0
                    ? "All goals completed!"
                    : `${goals.length - completedGoalsCount} active goal${goals.length - completedGoalsCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setSaveError(null);
            }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Set a New Goal Race</DialogTitle>
                <DialogDescription>
                  What race are you training for? Set your target and countdown.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {saveError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {saveError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="distance">Race Distance <span className="text-destructive">*</span></Label>
                  <Select value={newGoal.distance} onValueChange={(v) => setNewGoal({ ...newGoal, distance: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTANCES.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="raceName">Race Name (optional)</Label>
                  <Input
                    id="raceName"
                    placeholder="e.g. Boston Marathon"
                    value={newGoal.raceName}
                    onChange={(e) => setNewGoal({ ...newGoal, raceName: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Race Date <span className="text-destructive">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    value={newGoal.raceDate}
                    onChange={(e) => setNewGoal({ ...newGoal, raceDate: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetTime">Target Time (optional)</Label>
                  <Input
                    id="targetTime"
                    placeholder="e.g. 1:45:00"
                    value={newGoal.targetTime}
                    onChange={(e) => setNewGoal({ ...newGoal, targetTime: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              
              {/* Training Plan Option */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="createPlan" className="font-medium">Generate Training Plan</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create a personalized training schedule for this race
                    </p>
                  </div>
                  <Switch
                    id="createPlan"
                    checked={createTrainingPlan}
                    onCheckedChange={setCreateTrainingPlan}
                  />
                </div>
                
                {createTrainingPlan && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Experience Level</Label>
                      <Select
                        value={trainingPlanConfig.experienceLevel}
                        onValueChange={(v) => setTrainingPlanConfig({
                          ...trainingPlanConfig,
                          experienceLevel: v as "beginner" | "intermediate" | "advanced"
                        })}
                      >
                        <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Current Weekly Miles</Label>
                      <Input
                        type="number"
                        value={trainingPlanConfig.currentWeeklyMiles}
                        onChange={(e) => setTrainingPlanConfig({
                          ...trainingPlanConfig,
                          currentWeeklyMiles: parseInt(e.target.value) || 15
                        })}
                        className="h-9 text-sm bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Training Days/Week</Label>
                      <Select
                        value={String(trainingPlanConfig.trainingDaysPerWeek)}
                        onValueChange={(v) => setTrainingPlanConfig({
                          ...trainingPlanConfig,
                          trainingDaysPerWeek: parseInt(v)
                        })}
                      >
                        <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="4">4 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="6">6 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Long Run Day</Label>
                      <Select
                        value={trainingPlanConfig.longRunDay}
                        onValueChange={(v) => setTrainingPlanConfig({
                          ...trainingPlanConfig,
                          longRunDay: v
                        })}
                      >
                        <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button"
                  disabled={isSaving}
                  onClick={handleAddGoal}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Set Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isUnauthorized ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Please Log In</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Log in to view and manage your race goals.
              </p>
              <Button onClick={() => window.location.href = "/auth"}>
                Log In
              </Button>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Unable to Load Goals</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There was an error loading your goals. Please refresh the page or try again later.
              </p>
              <Button variant="outline" onClick={() => mutate()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Race Goals Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Set your first race goal to start tracking your training progress and countdown to race day.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
{/* Race Prediction Card */}
  {activeGoal && (
    <Card className="mb-6 border-[#00D4FF]/30 bg-gradient-to-br from-[#00D4FF]/10 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00D4FF]/20">
            <Zap className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <CardTitle className="text-lg">Race Prediction</CardTitle>
            <CardDescription>AI-powered time prediction for {activeGoal.distance}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(() => {
          const prediction = predictRaceTime(recentRuns, activeGoal.distance);
          if (!prediction || recentRuns.length < 1) return (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-2">
                Log runs with pace data to unlock your {activeGoal.distance} prediction.
              </p>
              <p className="text-xs text-muted-foreground">
                We use the Riegel formula to predict your race time based on training.
              </p>
            </div>
          );
          return (
            <>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Predicted Finish Time</p>
                  <p className="text-4xl font-bold text-[#00D4FF]">{prediction.predictedTime}</p>
                </div>
                <div className="text-right">
                  <Badge variant={prediction.confidence === "High" ? "default" : prediction.confidence === "Medium" ? "secondary" : "outline"} className="mb-2">
                    {prediction.confidence} Confidence
                  </Badge>
                  <p className="text-xs text-muted-foreground">{recentRuns.length} runs analyzed</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-[#1A1A1A] rounded-lg p-3">
                <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
                <span>Based on: {prediction.basedOn}</span>
              </div>
              {activeGoal.target_time && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Your target:</span>
                    <span className="font-bold text-lg">{activeGoal.target_time}</span>
                  </div>
                  <p className="text-sm mt-2">
                    {prediction.predictedTime < activeGoal.target_time ? (
                      <span className="text-green-500 font-medium">You&apos;re ahead of your goal pace!</span>
                    ) : (
                      <span className="text-yellow-500 font-medium">Keep training - every run counts!</span>
                    )}
                  </p>
                </div>
              )}
            </>
          );
        })()}
      </CardContent>
    </Card>
  )}

  {/* Active Goal */}
  {activeGoal && (
  <Card className="mb-8 border-primary/50 bg-gradient-to-br from-primary/10 to-transparent">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Current Goal</CardTitle>
                        <CardDescription>Your primary race target</CardDescription>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-3xl font-bold text-foreground mb-2">
                        {activeGoal.race_name || activeGoal.distance}
                      </h3>
                      {activeGoal.race_name && (
                        <p className="text-lg text-muted-foreground mb-2">{activeGoal.distance}</p>
                      )}
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(activeGoal.target_date)}
                      </p>
                      {activeGoal.target_time && (
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          Target: {activeGoal.target_time}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-secondary rounded-lg">
                          <div className="text-3xl font-bold text-primary" suppressHydrationWarning>
                            {getDaysUntil(activeGoal.target_date)}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Days</div>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                          <div className="text-3xl font-bold text-foreground" suppressHydrationWarning>
                            {getWeeksUntil(activeGoal.target_date)}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Weeks</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-emerald-500 hover:text-emerald-400"
                      onClick={() => handleCompleteGoal(activeGoal.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Complete
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteGoal(activeGoal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Other Active Goals */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    Other Goals
                  </CardTitle>
                  <CardDescription>Additional race goals</CardDescription>
                </CardHeader>
                <CardContent>
                  {otherActiveGoals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No other goals</p>
                      <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                        Add a goal race
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {otherActiveGoals.map((goal) => (
                        <div 
                          key={goal.id} 
                          className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-foreground">
                              {goal.race_name || goal.distance}
                            </h4>
                            {goal.race_name && (
                              <p className="text-sm text-muted-foreground">{goal.distance}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {formatDate(goal.target_date)}
                            </p>
                            {goal.target_time && (
                              <p className="text-sm text-muted-foreground">
                                Target: {goal.target_time}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-foreground" suppressHydrationWarning>
                                {getDaysUntil(goal.target_date)}
                              </div>
                              <div className="text-xs text-muted-foreground">days</div>
                            </div>
                            <div className="flex flex-col gap-1">
                              {!activeGoal && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:text-primary"
                                  onClick={() => handleSetActive(goal.id)}
                                  title="Set as active"
                                >
                                  <Target className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteGoal(goal.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completed Goals */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Completed Races
                  </CardTitle>
                  <CardDescription>Your achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  {completedGoals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No completed races yet</p>
                      <p className="text-sm">Keep training!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedGoals.map((goal) => (
                        <div 
                          key={goal.id} 
                          className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-full">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">
                                {goal.race_name || goal.distance}
                              </h4>
                              {goal.race_name && (
                                <p className="text-sm text-muted-foreground">{goal.distance}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {formatDate(goal.target_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {goal.actual_time && (
                              <Badge variant="default">{goal.actual_time}</Badge>
                            )}
                            {goal.target_time && !goal.actual_time && (
                              <Badge variant="secondary">{goal.target_time}</Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteGoal(goal.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Life Events Manager */}
            <LifeEventsManager />
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

export default function GoalsPage() {
  return <GoalsPageContent />;
}
