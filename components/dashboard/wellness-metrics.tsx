"use client";

import { Moon, Thermometer, Battery, Zap, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const metrics = [
  {
    icon: Moon,
    label: "Sleep",
    value: "7.5h",
    score: 82,
    color: "oklch(0.65 0.20 280)", // Purple
  },
  {
    icon: Thermometer,
    label: "Soreness",
    value: "Low",
    score: 78,
    color: "oklch(0.75 0.18 60)", // Orange
  },
  {
    icon: Battery,
    label: "Energy",
    value: "High",
    score: 91,
    color: "oklch(0.70 0.18 150)", // Green
  },
  {
    icon: Zap,
    label: "Readiness",
    value: "88",
    score: 88,
    color: "oklch(0.65 0.22 25)", // Primary red
  },
];

const statCards = [
  {
    icon: TrendingUp,
    label: "Monthly Miles",
    value: "94.7",
    unit: "mi",
    color: "oklch(0.70 0.18 150)", // Green
  },
];

export function WellnessMetrics() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Today&apos;s Wellness
        </p>
        <div className="space-y-2">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <Card
                key={i}
                className="flex items-center gap-3 bg-card border-border px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer"
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
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={i}
                className="bg-card border-border p-4 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `color-mix(in oklch, ${s.color} 20%, transparent)` }}
                >
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  {s.label}
                </p>
                <p className="text-xl font-black">
                  {s.value}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{s.unit}</span>
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
