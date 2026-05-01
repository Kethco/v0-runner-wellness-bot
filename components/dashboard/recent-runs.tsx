"use client";

import { ChevronRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const runs = [
  {
    title: "Morning Run",
    subtitle: "Easy · Today 6:12 AM",
    dist: "6.0",
    pace: "8:24",
    time: "50:24",
    feel: "Great",
    feelColor: "text-green-400",
  },
  {
    title: "Easy Recovery",
    subtitle: "Recovery · Yesterday 7:00 AM",
    dist: "4.2",
    pace: "9:10",
    time: "38:30",
    feel: "Good",
    feelColor: "text-blue-400",
  },
  {
    title: "Tempo Intervals",
    subtitle: "Hard · Apr 25 5:45 AM",
    dist: "5.4",
    pace: "7:48",
    time: "42:08",
    feel: "Hard",
    feelColor: "text-orange-400",
  },
  {
    title: "Long Run",
    subtitle: "Long · Apr 23 7:30 AM",
    dist: "8.6",
    pace: "8:55",
    time: "1:16:43",
    feel: "Great",
    feelColor: "text-green-400",
  },
];

export function RecentRuns() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Recent Runs
        </p>
        <Button
          variant="ghost"
          className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto hover:bg-transparent hover:text-primary/80"
        >
          All
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      <div className="space-y-2">
        {runs.map((run, i) => (
          <Card
            key={i}
            className="bg-card border-border hover:border-primary/40 p-4 flex items-center gap-4 cursor-pointer transition-colors group"
          >
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <Activity className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-bold leading-tight truncate">{run.title}</p>
                <span className={`text-xs font-semibold ${run.feelColor} ml-2`}>
                  {run.feel}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{run.subtitle}</p>
            </div>
            <div className="hidden sm:flex gap-6 text-right shrink-0">
              <div>
                <p className="text-sm font-black">
                  {run.dist}
                  <span className="text-[10px] text-muted-foreground font-normal">mi</span>
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  Dist
                </p>
              </div>
              <div>
                <p className="text-sm font-black">{run.pace}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  Pace
                </p>
              </div>
              <div>
                <p className="text-sm font-black">{run.time}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  Time
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
