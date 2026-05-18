"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Run {
  date: string;
  miles: number;
}

interface ActivityHeatmapProps {
  runs: Run[];
  weeks?: number;
}

export function ActivityHeatmap({ runs, weeks = 12 }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
    
    // Create a map of date -> miles
    const runMap = new Map<string, number>();
    runs.forEach(run => {
      const dateKey = run.date.split("T")[0];
      runMap.set(dateKey, (runMap.get(dateKey) || 0) + run.miles);
    });
    
    // Find max miles for color scaling
    const maxMiles = Math.max(...Array.from(runMap.values()), 1);
    
    // Generate calendar grid
    const grid: { date: Date; miles: number; intensity: number }[][] = [];
    let currentWeek: { date: Date; miles: number; intensity: number }[] = [];
    
    // Start from the first day of the week containing startDate
    const firstDay = new Date(startDate);
    const dayOfWeek = firstDay.getDay();
    firstDay.setDate(firstDay.getDate() - dayOfWeek);
    
    const current = new Date(firstDay);
    
    while (current <= today) {
      const dateKey = current.toISOString().split("T")[0];
      const miles = runMap.get(dateKey) || 0;
      const intensity = miles > 0 ? Math.min(miles / maxMiles, 1) : 0;
      
      currentWeek.push({
        date: new Date(current),
        miles,
        intensity,
      });
      
      if (current.getDay() === 6) {
        grid.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Push remaining days
    if (currentWeek.length > 0) {
      grid.push(currentWeek);
    }
    
    return { grid, maxMiles };
  }, [runs, weeks]);

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return "bg-[#1A1A1A] border border-[#2A2A2A]";
    if (intensity < 0.25) return "bg-[#FF4500]/20 border border-[#FF4500]/30";
    if (intensity < 0.5) return "bg-[#FF4500]/40 border border-[#FF4500]/50";
    if (intensity < 0.75) return "bg-[#FF4500]/60 border border-[#FF4500]/70";
    return "bg-[#FF4500] border border-[#FF6B00]";
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabels = useMemo(() => {
    const labels: { label: string; column: number }[] = [];
    let lastMonth = -1;
    
    heatmapData.grid.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]?.date;
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: firstDayOfWeek.toLocaleDateString("en-US", { month: "short" }),
            column: weekIndex,
          });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [heatmapData.grid]);

  const totalMiles = runs.reduce((sum, r) => sum + r.miles, 0);
  const totalRuns = runs.length;
  const activeDays = new Set(runs.map(r => r.date.split("T")[0])).size;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Activity Heatmap</CardTitle>
            <CardDescription>Your running activity over the past {weeks} weeks</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{totalMiles.toFixed(1)} mi total</span>
            <span>{totalRuns} runs</span>
            <span>{activeDays} active days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            {/* Month labels */}
            <div className="flex mb-1 ml-8">
              {monthLabels.map((month, i) => (
                <div
                  key={i}
                  className="text-[10px] text-muted-foreground"
                  style={{ 
                    position: "relative",
                    left: `${month.column * 14}px`,
                    marginRight: i < monthLabels.length - 1 
                      ? `${(monthLabels[i + 1].column - month.column - 1) * 14}px` 
                      : 0
                  }}
                >
                  {month.label}
                </div>
              ))}
            </div>
            
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-1">
                {dayLabels.map((day, i) => (
                  <div 
                    key={day} 
                    className={`text-[9px] text-muted-foreground h-3 flex items-center ${
                      i % 2 === 0 ? "" : "opacity-0"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex gap-[3px]">
                {heatmapData.grid.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => {
                      const isToday = day.date.toDateString() === new Date().toDateString();
                      const isFuture = day.date > new Date();
                      
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: isFuture ? 0.3 : 1 }}
                              transition={{ 
                                delay: weekIndex * 0.02 + dayIndex * 0.01,
                                type: "spring",
                                stiffness: 200
                              }}
                              className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                                isFuture ? "opacity-30" : ""
                              } ${getIntensityColor(day.intensity)} ${
                                isToday ? "ring-2 ring-primary" : ""
                              }`}
                            />
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="bg-[#1A1A1A] border-[#2A2A2A] text-xs"
                          >
                            <p className="font-medium">
                              {day.date.toLocaleDateString("en-US", { 
                                weekday: "short",
                                month: "short", 
                                day: "numeric" 
                              })}
                            </p>
                            <p className="text-muted-foreground">
                              {day.miles > 0 
                                ? `${day.miles.toFixed(1)} miles`
                                : "No activity"
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-[2px]">
                {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
