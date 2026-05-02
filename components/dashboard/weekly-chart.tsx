"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const weekData = [
  { day: "MON", miles: 3.1, active: false, pace: "8:42", duration: "27:00", feeling: "Good" },
  { day: "TUE", miles: 0, active: false, pace: "-", duration: "-", feeling: "Rest day" },
  { day: "WED", miles: 5.4, active: false, pace: "8:15", duration: "44:30", feeling: "Strong" },
  { day: "THU", miles: 4.2, active: false, pace: "8:30", duration: "35:42", feeling: "Okay" },
  { day: "FRI", miles: 0, active: false, pace: "-", duration: "-", feeling: "Rest day" },
  { day: "SAT", miles: 8.6, active: false, pace: "8:55", duration: "1:16:45", feeling: "Long run" },
  { day: "SUN", miles: 6.0, active: true, pace: "9:10", duration: "55:00", feeling: "Recovery" },
];

const maxMiles = Math.max(...weekData.map((d) => d.miles));
const totalMiles = weekData.reduce((acc, d) => acc + d.miles, 0);
const goalMiles = 30;
const progress = Math.round((totalMiles / goalMiles) * 100);

export function WeeklyChart() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm md:text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              This Week
            </p>
            <CardTitle className="text-4xl font-black tracking-tight">
              {totalMiles.toFixed(1)}
              <span className="text-lg font-normal text-muted-foreground ml-1">miles</span>
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-3 py-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Week 17
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
          {weekData.map((d, i) => (
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
                      backgroundColor: d.active || selectedDay === i
                        ? "var(--primary)"
                        : `color-mix(in oklch, var(--primary) ${20 + (d.miles / maxMiles) * 40}%, transparent)`,
                    }}
                  />
                ) : (
                  <div className={`w-full h-1 bg-border rounded ${selectedDay === i ? 'bg-muted-foreground' : ''}`} />
                )}
              </div>
              <span className={`text-xs font-bold tracking-widest uppercase ${selectedDay === i ? 'text-primary' : 'text-muted-foreground'}`}>
                {d.day}
              </span>
            </div>
          ))}
        </div>

        {/* Selected day details */}
        {selectedDay !== null && (
          <div className="bg-secondary rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">{weekData[selectedDay].day}</span>
              <span className="text-xs text-muted-foreground">{weekData[selectedDay].feeling}</span>
            </div>
            {weekData[selectedDay].miles > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Distance</p>
                  <p className="text-lg font-bold text-foreground">{weekData[selectedDay].miles} mi</p>
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
                <p className="text-sm font-black">{d.miles}mi</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {d.day}
                </p>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
