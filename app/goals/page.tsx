"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Target, Calendar, Clock, Trophy, Plus, Edit2, Trash2, CheckCircle2, Loader2 } from "lucide-react";

interface Goal {
  id: string;
  distance: string;
  race_name?: string;
  race_date: string;
  target_time?: string;
  actual_time?: string;
  status: "active" | "completed" | "upcoming";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newGoal, setNewGoal] = useState({
    distance: "",
    raceName: "",
    raceDate: "",
    targetTime: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const goals = data?.goals || [];

  const formatDate = (dateStr: string): string => {
    if (!mounted) return dateStr;
    return formatDateStatic(dateStr);
  };

  const activeGoal = goals.find((g) => g.status === "active");
  const upcomingGoals = goals.filter((g) => g.status === "upcoming");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const handleAddGoal = async () => {
    if (!newGoal.distance || !newGoal.raceDate) return;
    
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
          status: activeGoal ? "upcoming" : "active",
        }),
      });

      if (response.ok) {
        mutate();
        setNewGoal({ distance: "", raceName: "", raceDate: "", targetTime: "" });
        setIsDialogOpen(false);
      }
    } catch (err) {
      console.error("Failed to add goal:", err);
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
      // First, set current active goal to upcoming
      if (activeGoal) {
        await fetch("/api/goals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: activeGoal.id, status: "upcoming" }),
        });
      }
      // Then set selected goal to active
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Race Goals</h1>
            <p className="text-muted-foreground mt-1">
              Set targets and track your progress toward race day
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <div className="space-y-2">
                  <Label htmlFor="distance">Race Distance</Label>
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
                  <Label htmlFor="date">Race Date</Label>
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGoal} disabled={isSaving}>
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
                        {formatDate(activeGoal.race_date)}
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
                            {getDaysUntil(activeGoal.race_date)}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Days</div>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                          <div className="text-3xl font-bold text-foreground" suppressHydrationWarning>
                            {getWeeksUntil(activeGoal.race_date)}
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
              {/* Upcoming Goals */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    Upcoming Races
                  </CardTitle>
                  <CardDescription>Future races on your calendar</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingGoals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No upcoming races scheduled</p>
                      <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                        Add a goal race
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingGoals.map((goal) => (
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
                              {formatDate(goal.race_date)}
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
                                {getDaysUntil(goal.race_date)}
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
                                {formatDate(goal.race_date)}
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
          </>
        )}
      </main>
    </div>
  );
}

export default function GoalsPage() {
  return <GoalsPageContent />;
}
