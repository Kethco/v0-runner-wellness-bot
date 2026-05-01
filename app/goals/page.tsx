"use client";

import { useState } from "react";
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
import { Target, Calendar, Clock, Trophy, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";

interface Goal {
  id: string;
  distance: string;
  date: string;
  targetTime?: string;
  status: "active" | "completed" | "upcoming";
}

const mockGoals: Goal[] = [
  { id: "1", distance: "Half Marathon", date: "2026-09-20", targetTime: "1:45:00", status: "active" },
  { id: "2", distance: "10K", date: "2026-06-15", targetTime: "45:00", status: "upcoming" },
  { id: "3", distance: "5K", date: "2026-04-01", targetTime: "22:30", status: "completed" },
];

const DISTANCES = ["5K", "10K", "Half Marathon", "Marathon"];

function getDaysUntil(dateStr: string): number {
  const raceDate = new Date(dateStr);
  const today = new Date();
  const diffTime = raceDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getWeeksUntil(dateStr: string): number {
  return Math.floor(getDaysUntil(dateStr) / 7);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    distance: "",
    date: "",
    targetTime: "",
  });

  const activeGoal = goals.find((g) => g.status === "active");
  const upcomingGoals = goals.filter((g) => g.status === "upcoming");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const handleAddGoal = () => {
    if (!newGoal.distance || !newGoal.date) return;
    
    const goal: Goal = {
      id: Date.now().toString(),
      distance: newGoal.distance,
      date: newGoal.date,
      targetTime: newGoal.targetTime || undefined,
      status: "upcoming",
    };
    
    setGoals([...goals, goal]);
    setNewGoal({ distance: "", date: "", targetTime: "" });
    setIsDialogOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const handleCompleteGoal = (id: string) => {
    setGoals(goals.map((g) => 
      g.id === id ? { ...g, status: "completed" as const } : g
    ));
  };

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
                  <Label htmlFor="date">Race Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newGoal.date}
                    onChange={(e) => setNewGoal({ ...newGoal, date: e.target.value })}
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
                <Button onClick={handleAddGoal}>
                  Set Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
                  <h3 className="text-3xl font-bold text-foreground mb-2">{activeGoal.distance}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(activeGoal.date)}
                  </p>
                  {activeGoal.targetTime && (
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      Target: {activeGoal.targetTime}
                    </p>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="text-3xl font-bold text-primary">{getDaysUntil(activeGoal.date)}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Days</div>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="text-3xl font-bold text-foreground">{getWeeksUntil(activeGoal.date)}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Weeks</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Training Progress */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Training Progress</span>
                  <span className="text-sm font-medium text-foreground">68%</span>
                </div>
                <Progress value={68} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Based on your check-in streak and consistency over the last 30 days
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Goal
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-emerald-500 hover:text-emerald-400"
                  onClick={() => handleCompleteGoal(activeGoal.id)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
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
                        <h4 className="font-medium text-foreground">{goal.distance}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(goal.date)}
                        </p>
                        {goal.targetTime && (
                          <p className="text-sm text-muted-foreground">
                            Target: {goal.targetTime}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">{getDaysUntil(goal.date)}</div>
                          <div className="text-xs text-muted-foreground">days</div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
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
                          <h4 className="font-medium text-foreground">{goal.distance}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(goal.date)}
                          </p>
                        </div>
                      </div>
                      {goal.targetTime && (
                        <Badge variant="secondary">{goal.targetTime}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Race Predictor Card */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Race Time Predictor</CardTitle>
            <CardDescription>
              Based on your training data, here are your estimated finish times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">5K</div>
                <div className="text-xl font-bold text-foreground">22:45</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">10K</div>
                <div className="text-xl font-bold text-foreground">47:30</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Half Marathon</div>
                <div className="text-xl font-bold text-foreground">1:45:00</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Marathon</div>
                <div className="text-xl font-bold text-foreground">3:42:00</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Predictions update every Sunday based on your wellness data and training consistency
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
