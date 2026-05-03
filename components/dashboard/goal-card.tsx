"use client";

import { Target, Calendar, Timer, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GoalCardProps {
  race?: string;
  date?: string;
  targetTime?: string;
}

export function GoalCard({ race, date, targetTime }: GoalCardProps) {
  // Calculate days until race if date is provided
  const daysUntil = date ? Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Show empty state if no goal is set
  if (!race || !date) {
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
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="w-3 h-3" />
            Add Goal
          </Button>
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
          <p className="text-xs font-bold">Goal Race</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{race}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-bold">{date}</p>
          </div>
        </div>
        {targetTime && (
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-bold">{targetTime}</p>
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
