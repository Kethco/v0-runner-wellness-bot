"use client";

import { motion } from "framer-motion";

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
  { key: "sleep_rating", label: "Sleep", icon: "🌙", color: "#AF52DE", maxValue: 5 },
  { key: "energy", label: "Energy", icon: "⚡", color: "#34C759", maxValue: 5 },
  { key: "soreness", label: "Soreness", icon: "💪", color: "#FF6B00", maxValue: 5, inverted: true },
  { key: "readiness", label: "Readiness", icon: "🎯", color: "#00D4FF", maxValue: 100 },
];

function getValueLabel(value: number | undefined, maxValue: number, inverted?: boolean): string {
  if (value === undefined) return "—";
  
  if (maxValue === 100) {
    return `${value}`;
  }
  
  const percentage = inverted ? (maxValue - value + 1) / maxValue : value / maxValue;
  
  if (percentage >= 0.8) return inverted ? "None" : "Great";
  if (percentage >= 0.6) return inverted ? "Low" : "Good";
  if (percentage >= 0.4) return inverted ? "Moderate" : "OK";
  return inverted ? "High" : "Low";
}

export function WellnessOrbs({ checkin, hasCheckedIn }: WellnessOrbsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Wellness Metrics</h3>
      
      <div className="grid grid-cols-4 gap-3">
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
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, type: "spring" }}
              className="flex flex-col items-center"
            >
              {/* Orb */}
              <motion.div 
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: hasValue 
                    ? `radial-gradient(circle at 30% 30%, ${metric.color}40, ${metric.color}10)`
                    : 'rgba(255,255,255,0.05)',
                }}
                animate={hasValue ? {
                  boxShadow: [
                    `0 0 0 0 ${metric.color}00`,
                    `0 0 20px 5px ${metric.color}30`,
                    `0 0 0 0 ${metric.color}00`,
                  ],
                } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  {hasValue && (
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke={metric.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 28}
                      initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - percentage) }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                      style={{
                        filter: `drop-shadow(0 0 4px ${metric.color})`,
                      }}
                    />
                  )}
                </svg>
                
                {/* Icon */}
                <span className="text-xl z-10">{metric.icon}</span>
              </motion.div>
              
              {/* Labels */}
              <span className="text-[10px] text-white/40 mt-2 uppercase tracking-wider">{metric.label}</span>
              <span className="text-xs font-bold" style={{ color: hasValue ? metric.color : 'rgba(255,255,255,0.3)' }}>
                {hasCheckedIn ? getValueLabel(value, metric.maxValue, metric.inverted) : "—"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
