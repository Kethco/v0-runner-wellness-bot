"use client";

import { motion } from "framer-motion";
import { Moon, Zap, Activity, Target } from "lucide-react";

interface Checkin {
  sleep_rating?: number;
  energy?: number;
  soreness?: number;
  readiness?: number;
}

interface WellnessOrbsProps {
  checkin?: Checkin;
  hasCheckedIn: boolean;
}

const METRICS = [
  { key: "sleep_rating", label: "Sleep", Icon: Moon, color: "#AF52DE", maxValue: 5 },
  { key: "energy", label: "Energy", Icon: Zap, color: "#34C759", maxValue: 5 },
  { key: "soreness", label: "Sore", Icon: Activity, color: "#FF6B00", maxValue: 5, inverted: true },
  { key: "readiness", label: "Ready", Icon: Target, color: "#00D4FF", maxValue: 100 },
];

function getValueLabel(value: number | undefined, maxValue: number, inverted?: boolean): string {
  if (value === undefined) return "—";
  
  if (maxValue === 100) {
    return `${value}`;
  }
  
  const percentage = inverted ? (maxValue - value + 1) / maxValue : value / maxValue;
  
  if (percentage >= 0.8) return inverted ? "None" : "Great";
  if (percentage >= 0.6) return inverted ? "Low" : "Good";
  if (percentage >= 0.4) return inverted ? "Mod" : "OK";
  return inverted ? "High" : "Low";
}

export function WellnessOrbs({ checkin, hasCheckedIn }: WellnessOrbsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em]">Today&apos;s Wellness</h3>
      
      <div className="grid grid-cols-4 gap-2">
        {METRICS.map((metric, index) => {
          const value = checkin?.[metric.key as keyof Checkin] as number | undefined;
          const hasValue = value !== undefined;
          const percentage = hasValue 
            ? (metric.inverted 
                ? (metric.maxValue - value + 1) / metric.maxValue 
                : value / metric.maxValue)
            : 0;
          
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * index, type: "spring", stiffness: 300 }}
              className="flex flex-col items-center"
            >
              {/* Premium Orb */}
              <motion.div 
                className="relative w-[60px] h-[60px] rounded-full flex items-center justify-center"
                style={{
                  background: hasValue 
                    ? `radial-gradient(circle at 35% 35%, ${metric.color}25, ${metric.color}08 70%, transparent)`
                    : 'rgba(255,255,255,0.03)',
                }}
              >
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="30"
                    cy="30"
                    r="26"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                  />
                  {hasValue && (
                    <motion.circle
                      cx="30"
                      cy="30"
                      r="26"
                      fill="none"
                      stroke={metric.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 26}
                      initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - percentage) }}
                      transition={{ delay: 0.2 + index * 0.08, duration: 0.6, ease: "easeOut" }}
                      style={{
                        filter: `drop-shadow(0 0 4px ${metric.color}80)`,
                      }}
                    />
                  )}
                </svg>
                
                {/* Icon */}
                <metric.Icon 
                  className="w-5 h-5 z-10" 
                  style={{ color: hasValue ? metric.color : 'rgba(255,255,255,0.2)' }}
                />
              </motion.div>
              
              {/* Labels */}
              <span className="text-[9px] text-white/35 mt-1.5 uppercase tracking-wider font-medium">{metric.label}</span>
              <span 
                className="text-[11px] font-bold" 
                style={{ color: hasValue ? metric.color : 'rgba(255,255,255,0.2)' }}
              >
                {hasCheckedIn ? getValueLabel(value, metric.maxValue, metric.inverted) : "—"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
