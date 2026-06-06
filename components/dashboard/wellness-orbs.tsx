"use client";

import { motion } from "framer-motion";
import { Moon, Battery, Heart, Gauge } from "lucide-react";

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
  { key: "sleep_rating", label: "SLEEP", Icon: Moon, color: "#AF52DE", maxValue: 5 },
  { key: "energy", label: "ENERGY", Icon: Battery, color: "#34C759", maxValue: 5 },
  { key: "soreness", label: "SORE", Icon: Heart, color: "#30D158", maxValue: 5 },
  { key: "readiness", label: "READY", Icon: Gauge, color: "#FF9F0A", maxValue: 5 },
];

export function WellnessOrbs({ checkin, hasCheckedIn }: WellnessOrbsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#1F1F23] border border-white/[0.08] p-5 shadow-lg shadow-black/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold text-lg">Today&apos;s Wellness</h3>
        {hasCheckedIn && (
          <span className="text-[#30D158] text-sm font-semibold px-3 py-1 bg-[#30D158]/10 rounded-full border border-[#30D158]/20">
            Logged
          </span>
        )}
      </div>
      
      {/* Metric Rings */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map((metric, index) => {
          const value = checkin?.[metric.key as keyof Checkin] as number | undefined;
          const hasValue = value !== undefined && hasCheckedIn;
          const percentage = hasValue ? value / metric.maxValue : 0;
          
          const radius = 32;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percentage * circumference);
          
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
            >
              {/* Ring with Icon Inside */}
              <div className="relative w-[72px] h-[72px]">
                {/* Progress Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  {/* Background ring */}
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="5"
                  />
                  {/* Progress arc */}
                  {hasValue && (
                    <motion.circle
                      cx="36"
                      cy="36"
                      r={radius}
                      fill="none"
                      stroke={metric.color}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                    />
                  )}
                </svg>
                
                {/* Centered Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <metric.Icon 
                    className="w-6 h-6" 
                    style={{ 
                      color: hasValue ? metric.color : 'rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
              </div>
              
              {/* Value */}
              <div className="mt-2 text-center">
                <span className="text-xl font-bold text-white">
                  {hasValue ? value : "—"}
                </span>
                {hasValue && (
                  <span className="text-sm text-[#8E8E93]">/5</span>
                )}
              </div>
              
              {/* Label */}
              <span className="text-[10px] text-[#8E8E93] font-semibold uppercase tracking-wider mt-0.5">
                {metric.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
