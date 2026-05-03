"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogRunModal } from "./log-run-modal";
import useSWR from "swr";

interface Run {
  id: string;
  date: string;
  miles: number;
  pace: string | null;
  duration_minutes: number | null;
  feeling: string | null;
  notes: string | null;
}

interface DayData {
  day: string;
  date: string;
  miles: number;
  pace: string;
  duration: string;
  feeling: string;
  runs: Run[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatDuration(minutes: number | null): string {
  if (!minutes) return "-";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:00`;
  }
  return `${mins}:00`;
}

export function WeeklyChart() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [todayIndex, setTodayIndex] = useState<number>(-1); // -1 means not yet calculated
  const [isClient, setIsClient] = useState(false);
  
  const { data, mutate } = useSWR("/api/runs?days=7", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate week number and today's index on client only to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
    setWeekNumber(weekNum);
    setTodayIndex(now.getDay());
  }, []);

  // Build week data from runs - use fixed date for SSR consistency
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
  
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  const weekData: DayData[] = days.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    const dateStr = date.toISOString().split("T")[0];
    
    const dayRuns = data?.runs?.filter((r: Run) => r.date === dateStr) || [];
    const totalMiles = dayRuns.reduce((sum: number, r: Run) => sum + Number(r.miles), 0);
    
    // Get first run's pace and feeling for display
    const firstRun = dayRuns[0];
    
    return {
      day,
      date: dateStr,
      miles: totalMiles,
      pace: firstRun?.pace || "-",
      duration: formatDuration(firstRun?.duration_minutes),
      feeling: dayRuns.length === 0 ? "Rest day" : (firstRun?.feeling || "Run"),
      runs: dayRuns,
    };
  });

  const maxMiles = Math.max(...weekData.map((d) => d.miles), 1);
  const totalMiles = weekData.reduce((acc, d) => acc + d.miles, 0);
  const goalMiles = 30; // TODO: Make this configurable per user
  const progress = Math.round((totalMiles / goalMiles) * 100);

  

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-sm md:text-xs font-medium uppercase tracking-widest text-muted-foreground">
                This Week
              </p>
              <LogRunModal onRunLogged={() => mutate()} />
            </div>
            <CardTitle className="text-4xl font-black tracking-tight">
              {totalMiles.toFixed(1)}
              <span className="text-lg font-normal text-muted-foreground ml-1">miles</span>
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-3 py-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {isClient ? `Week ${weekNumber}` : "Week"}
              </span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-2xl font-black text-primary">{progress}%</span>
              <span className="text-sm md:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Goal
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm md:text-xs text-muted-foreground mb-2">
            <span>{totalMiles.toFixed(1)} mi</span>
            <span>{goalMiles} mi goal</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-28 mb-4">
          {weekData.map((d, i) => {
            const isToday = i === todayIndex;
            return (
              <div 
                key={i} 
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => setSelectedDay(selectedDay === i ? null : i)}
              >
                <div className="w-full relative h-20 flex items-end">
                  {d.miles > 0 ? (
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 hover:scale-105 ${selectedDay === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
                      style={{
                        height: `${(d.miles / maxMiles) * 100}%`,
                        backgroundColor: isToday || selectedDay === i
                          ? "var(--primary)"
                          : `color-mix(in oklch, var(--primary) ${20 + (d.miles / maxMiles) * 40}%, transparent)`,
                      }}
                    />
                  ) : (
                    <div className={`w-full h-1 bg-border rounded ${selectedDay === i ? 'bg-muted-foreground' : ''}`} />
                  )}
                </div>
                <span className={`text-xs font-bold tracking-widest uppercase ${isToday ? 'text-primary' : selectedDay === i ? 'text-primary' : 'text-muted-foreground'}`}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected day details */}
        {selectedDay !== null && (
          <div className="bg-secondary rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">{weekData[selectedDay].day}</span>
              <span className="text-xs text-muted-foreground capitalize">{weekData[selectedDay].feeling}</span>
            </div>
            {weekData[selectedDay].miles > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Distance</p>
                  <p className="text-lg font-bold text-foreground">{weekData[selectedDay].miles.toFixed(1)} mi</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pace</p>
                  <p className="text-lg font-bold text-foreground">{weekData[selectedDay].pace}/mi</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
                  <p className="text-lg font-bold text-foreground">{weekData[selectedDay].duration}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No run recorded - rest and recovery day</p>
            )}
          </div>
        )}

        {/* Milestones */}
        <div className="flex gap-4 flex-wrap">
          {weekData
            .filter((d) => d.miles > 0)
            .map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-sm font-black">{d.miles.toFixed(1)}mi</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {d.day}
                </p>
              </div>
            ))}
          {weekData.filter(d => d.miles > 0).length === 0 && (
            <p className="text-sm text-muted-foreground">No runs logged this week. Click &quot;Log Run&quot; to get started!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
