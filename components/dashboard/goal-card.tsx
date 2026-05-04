"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Target, Calendar, Timer, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Goal {
  id: string;
  distance: string;
  race_name?: string;
  target_date: string;
  target_time?: string;
  status: string;
}

const DISTANCES = ["5K", "10K", "Half Marathon", "Marathon", "Ultra"];

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function GoalCard() {
  const { data, mutate } = useSWR<{ goals: Goal[] }>("/api/goals", fetcher);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    distance: "",
    raceName: "",
    raceDate: "",
    targetTime: "",
  });

  // Find the active goal
  const activeGoal = data?.goals?.find(g => g.status === "active");
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  
  // Calculate days until race
  const calculateDaysUntil = (dateStr: string) => {
    const raceDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    raceDate.setHours(0, 0, 0, 0);
    return Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const daysUntil = activeGoal?.target_date ? calculateDaysUntil(activeGoal.target_date) : null;

  const handleAddGoal = async () => {
    setError(null); // Clear any previous error first
    
    if (!newGoal.distance || !newGoal.raceDate) {
      setError("Please fill in Race Distance and Race Date");
      return;
    }

    setIsSaving(true);
    console.log("[v0] Saving goal:", newGoal);

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

      console.log("[v0] Goal API response:", response.status);
      if (response.ok) {
        console.log("[v0] Goal saved successfully");
        setNewGoal({ distance: "", raceName: "", raceDate: "", targetTime: "" });
        setIsDialogOpen(false);
        mutate(); // Refresh goals data
      } else {
        const errorData = await response.json();
        console.log("[v0] Goal save error:", errorData);
        if (errorData.error === "Unauthorized") {
          setError("Please log in to save your goal");
        } else {
          setError(errorData.error || "Failed to save goal. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to save goal. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  // Show empty state if no active goal
  if (!activeGoal) {
    return (
      <Card className="bg-card border-border p-4 relative overflow-hidden">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No goal race set</p>
          <p className="text-xs text-muted-foreground mb-3">
            Set a goal to track your training progress
          </p>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="w-3 h-3" />
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
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
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
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border p-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12" />
      
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold">{activeGoal.race_name || activeGoal.distance}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{activeGoal.distance}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-bold">{formatDate(activeGoal.target_date)}</p>
          </div>
        </div>
        {activeGoal.target_time && (
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-bold">{activeGoal.target_time}</p>
            </div>
          </div>
        )}
      </div>

      {daysUntil !== null && daysUntil > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Days until race</span>
            <span className="text-xl font-black text-primary">{daysUntil}</span>
          </div>
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.max(5, Math.min(95, 100 - (daysUntil / 365) * 100))}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
