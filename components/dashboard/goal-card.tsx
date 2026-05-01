"use client";

import { Target, Calendar, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GoalCardProps {
  race?: string;
  date?: string;
  daysUntil?: number;
  targetTime?: string;
}

export function GoalCard({
  race = "Half Marathon",
  date = "May 15, 2026",
  daysUntil = 14,
  targetTime = "1:45:00",
}: GoalCardProps) {
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
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-sm font-bold">{targetTime}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Days until race</span>
          <span className="text-xl font-black text-primary">{daysUntil}</span>
        </div>
        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.max(5, 100 - daysUntil)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
