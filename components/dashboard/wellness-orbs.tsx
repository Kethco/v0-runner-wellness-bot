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
  { key: "soreness", label: "Sore", Icon: Activity, color: "#FF6B6B", maxValue: 5, inverted: true },
  { key: "readiness", label: "Ready", Icon: Target, color: "#00D4FF", maxValue: 100 },
];

function getValueLabel(value: number | undefined, maxValue: number, inverted?: boolean): string {
  if (value === undefined) return "—";
  
  if (maxValue === 100) {
    return `${value}`;
  }
  
  return `${value}/${maxValue}`;
}

export function WellnessOrbs({ checkin, hasCheckedIn }: WellnessOrbsProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-white font-bold text-lg">Today&apos;s Wellness</h3>
      
      <div className="flex items-center justify-between gap-2">
        {METRICS.map((metric, index) => {
          const value = checkin?.[metric.key as keyof Checkin] as number | undefined;
          const hasValue = value !== undefined;
          const percentage = hasValue 
            ? (metric.inverted 
                ? (metric.maxValue - value + 1) / metric.maxValue 
                : value / metric.maxValue)
            : 0;
          
          const circumference = 2 * Math.PI * 32;
          const strokeDashoffset = circumference - (percentage * circumference);
          
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
            >
              {/* Large Ring with Icon */}
              <div className="relative w-[72px] h-[72px]">
                {/* Glow effect */}
                {hasValue && (
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      background: `radial-gradient(circle, ${metric.color}30 0%, transparent 70%)`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                  />
                )}
                
                {/* Progress Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  {/* Background ring */}
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="5"
                  />
                  {/* Progress arc */}
                  {hasValue && (
                    <motion.circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke={metric.color}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                      style={{
                        filter: `drop-shadow(0 0 8px ${metric.color})`,
                      }}
                    />
                  )}
                </svg>
                
                {/* Floating icon above ring */}
                <motion.div 
                  className="absolute -top-1 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: hasValue ? `${metric.color}25` : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <metric.Icon 
                      className="w-3.5 h-3.5" 
                      style={{ 
                        color: hasValue ? metric.color : 'rgba(255,255,255,0.3)',
                        filter: hasValue ? `drop-shadow(0 0 4px ${metric.color})` : 'none'
                      }}
                    />
                  </div>
                </motion.div>
                
                {/* Center value */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="text-base font-bold"
                    style={{ color: hasValue ? metric.color : 'rgba(255,255,255,0.3)' }}
                  >
                    {hasCheckedIn ? getValueLabel(value, metric.maxValue, metric.inverted) : "—"}
                  </span>
                </div>
              </div>
              
              {/* Label */}
              <span className="text-xs text-[#8E8E93] mt-2 font-semibold">{metric.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
