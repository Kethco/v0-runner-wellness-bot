"use client";

import { Moon, Thermometer, Battery, Zap, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.ok ? res.json() : null);

function getSleepLabel(rating: number): string {
  if (rating >= 4) return "Great";
  if (rating >= 3) return "Good";
  if (rating >= 2) return "Fair";
  return "Poor";
}

function getSorenessLabel(level: number): string {
  if (level <= 1) return "None";
  if (level <= 2) return "Low";
  if (level <= 3) return "Moderate";
  return "High";
}

function getEnergyLabel(level: number): string {
  if (level >= 4) return "High";
  if (level >= 3) return "Good";
  if (level >= 2) return "Low";
  return "Tired";
}

export function WellnessMetrics() {
  const { data: checkinData } = useSWR("/api/checkins?limit=1", fetcher, {
    refreshInterval: 30000,
  });
  
  const { data: runsData } = useSWR("/api/runs?days=30", fetcher, {
    refreshInterval: 60000,
  });

  const todayCheckin = checkinData?.checkins?.[0];
  const isToday = todayCheckin?.date === new Date().toISOString().split("T")[0];
  
  // Calculate monthly miles from runs data
  const monthlyMiles = runsData?.runs?.reduce((sum: number, r: { miles: number }) => 
    sum + Number(r.miles), 0) || 0;

  // Default values for no check-in
  const sleep = isToday ? (todayCheckin?.sleep_rating || 3) : 0;
  const soreness = isToday ? (todayCheckin?.soreness || 1) : 0;
  const energy = isToday ? (todayCheckin?.energy || 3) : 0;
  const readiness = isToday ? (todayCheckin?.readiness || 3) : 0;

  const metrics = [
    {
      icon: Moon,
      label: "Sleep",
      value: isToday ? getSleepLabel(sleep) : "--",
      score: isToday ? (sleep / 5) * 100 : 0,
      color: "oklch(0.65 0.20 280)", // Purple
    },
    {
      icon: Thermometer,
      label: "Soreness",
      value: isToday ? getSorenessLabel(soreness) : "--",
      score: isToday ? ((5 - soreness) / 4) * 100 : 0, // Inverse - lower soreness is better
      color: "oklch(0.75 0.18 60)", // Orange
    },
    {
      icon: Battery,
      label: "Energy",
      value: isToday ? getEnergyLabel(energy) : "--",
      score: isToday ? (energy / 5) * 100 : 0,
      color: "oklch(0.70 0.18 150)", // Green
    },
    {
      icon: Zap,
      label: "Readiness",
      value: isToday ? `${Math.round((readiness / 5) * 100)}` : "--",
      score: isToday ? (readiness / 5) * 100 : 0,
      color: "oklch(0.65 0.22 25)", // Primary red
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Today&apos;s Wellness
        </p>
        {!isToday && (
          <p className="text-xs text-muted-foreground mb-3">
            Complete your daily check-in to see today&apos;s metrics
          </p>
        )}
        <div className="space-y-2">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <Card
                key={i}
                className="flex items-center gap-3 border-white/10 px-4 py-3 hover:border-emerald-500/30 transition-colors cursor-pointer bg-gradient-to-br from-emerald-500/[0.02] to-transparent"
                style={{ backgroundColor: 'rgba(13, 13, 13, 0.97)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `color-mix(in oklch, ${m.color} 20%, transparent)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm md:text-xs font-bold tracking-wide uppercase text-muted-foreground">
                      {m.label}
                    </span>
                    <span className="text-sm font-black">{m.value}</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.score}%`,
                        backgroundColor: m.color,
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Performance
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Card className="border-white/10 p-4 hover:border-emerald-500/30 transition-colors cursor-pointer bg-gradient-to-br from-emerald-500/[0.02] to-transparent" style={{ backgroundColor: 'rgba(13, 13, 13, 0.97)' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: "color-mix(in oklch, oklch(0.70 0.18 150) 20%, transparent)" }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.70 0.18 150)" }} />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              Monthly Miles
            </p>
            <p className="text-xl font-black">
              {monthlyMiles.toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-1">mi</span>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
