"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const weekData = [
  { day: "MON", miles: 3.1, active: false },
  { day: "TUE", miles: 0, active: false },
  { day: "WED", miles: 5.4, active: false },
  { day: "THU", miles: 4.2, active: false },
  { day: "FRI", miles: 0, active: false },
  { day: "SAT", miles: 8.6, active: false },
  { day: "SUN", miles: 6.0, active: true },
];

const maxMiles = Math.max(...weekData.map((d) => d.miles));
const totalMiles = weekData.reduce((acc, d) => acc + d.miles, 0);
const goalMiles = 30;
const progress = Math.round((totalMiles / goalMiles) * 100);

export function WeeklyChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
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
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Week 17
              </span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-2xl font-black text-primary">{progress}%</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Goal
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
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
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative h-20 flex items-end">
                {d.miles > 0 ? (
                  <div
                    className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
                    style={{
                      height: `${(d.miles / maxMiles) * 100}%`,
                      backgroundColor: d.active
                        ? "var(--primary)"
                        : `color-mix(in oklch, var(--primary) ${20 + (d.miles / maxMiles) * 40}%, transparent)`,
                    }}
                  />
                ) : (
                  <div className="w-full h-1 bg-border rounded" />
                )}
              </div>
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                {d.day}
              </span>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div className="flex gap-4 flex-wrap">
          {weekData
            .filter((d) => d.miles > 0)
            .map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-sm font-black">{d.miles}mi</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {d.day}
                </p>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
