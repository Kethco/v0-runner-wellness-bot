"use client";

import { ChevronRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.ok ? res.json() : { runs: [] });

const RUN_TYPE_LABELS: Record<string, string> = {
  easy: "Easy",
  tempo: "Tempo",
  long: "Long Run",
  interval: "Intervals",
  recovery: "Recovery",
  fartlek: "Fartlek",
  hills: "Hills",
  race: "Race",
};

function formatRunDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}:00`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, "0")}:00`;
}

function getFeelingColor(feeling?: string): string {
  switch (feeling) {
    case "easy": return "text-green-400";
    case "moderate": return "text-blue-400";
    case "hard": return "text-orange-400";
    case "max": return "text-red-400";
    default: return "text-muted-foreground";
  }
}

function getFeelingLabel(feeling?: string): string {
  switch (feeling) {
    case "easy": return "Great";
    case "moderate": return "Good";
    case "hard": return "Hard";
    case "max": return "Max";
    default: return "";
  }
}

interface Run {
  id: string;
  date: string;
  miles: number;
  pace?: string;
  duration_minutes?: number;
  run_type?: string;
  feeling?: string;
  notes?: string;
}

export function RecentRuns() {
  const { data, isLoading } = useSWR("/api/runs?days=30", fetcher, {
    refreshInterval: 30000,
  });

  const runs: Run[] = data?.runs || [];

  // Don't show loading skeleton - parent handles initial load
  if (isLoading) {
    return null;
  }

  if (runs.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Recent Runs
          </p>
        </div>
        <Card className="border-white/10 p-8 text-center bg-gradient-to-br from-blue-500/[0.03] to-transparent" style={{ backgroundColor: 'rgba(13, 13, 13, 0.97)' }}>
          <Activity className="w-8 h-8 text-white/40 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1 text-white">No runs logged yet</p>
          <p className="text-xs text-white/50">
            Log your first run to start tracking your training
          </p>
        </Card>
      </div>
    );
  }

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
        {runs.slice(0, 4).map((run) => (
          <Card
            key={run.id}
            className="border-white/10 hover:border-blue-500/30 p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 group bg-gradient-to-br from-blue-500/[0.02] to-transparent hover:shadow-lg hover:shadow-blue-500/5"
            style={{ backgroundColor: 'rgba(13, 13, 13, 0.97)' }}
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <Activity className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-bold leading-tight truncate">
                  {RUN_TYPE_LABELS[run.run_type || "easy"] || "Run"}
                </p>
                {run.feeling && (
                  <span className={`text-xs font-semibold ${getFeelingColor(run.feeling)} ml-2`}>
                    {getFeelingLabel(run.feeling)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {run.run_type ? RUN_TYPE_LABELS[run.run_type] : "Run"} · {formatRunDate(run.date)}
              </p>
            </div>
            <div className="hidden sm:flex gap-6 text-right shrink-0">
              <div>
                <p className="text-sm font-black">
                  {run.miles.toFixed(1)}
                  <span className="text-[10px] text-muted-foreground font-normal">mi</span>
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  Dist
                </p>
              </div>
              {run.pace && (
                <div>
                  <p className="text-sm font-black">{run.pace}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Pace
                  </p>
                </div>
              )}
              {run.duration_minutes && (
                <div>
                  <p className="text-sm font-black">{formatDuration(run.duration_minutes)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Time
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
