"use client";

import { motion } from "framer-motion";
import { Activity, TrendingUp, Moon, Battery, Heart, ChevronRight } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function ReadinessScore() {
  const { data, isLoading } = useSWR("/api/wellness-insights", fetcher);

  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded w-24" />
            <div className="h-6 bg-white/5 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.readiness) {
    return null;
  }

  const { readiness, breakdown } = data;
  const score = readiness.score;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#30D158";
    if (score >= 60) return "#FFD60A";
    if (score >= 40) return "#FF9F0A";
    return "#FF453A";
  };
  
  const scoreColor = getScoreColor(score);

  const factors = [
    { icon: Moon, label: "Sleep", value: breakdown?.sleep || 0, color: "#AF52DE" },
    { icon: Battery, label: "Energy", value: breakdown?.energy || 0, color: "#30D158" },
    { icon: Heart, label: "Soreness", value: breakdown?.soreness || 0, color: "#FF6B6B" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden"
    >
      {/* Top accent line */}
      <div 
        className="h-[2px]" 
        style={{ background: `linear-gradient(to right, transparent, ${scoreColor}, transparent)` }}
      />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/40" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">Today&apos;s Readiness</span>
          </div>
          <Link 
            href="/trends"
            className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors"
          >
            Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Main content */}
        <div className="flex items-center gap-5">
          {/* Score ring */}
          <div className="relative w-[88px] h-[88px] flex-shrink-0">
            {/* Glow effect */}
            <div 
              className="absolute inset-[-8px] rounded-full blur-xl opacity-30"
              style={{ backgroundColor: scoreColor }}
            />
            
            <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              <motion.circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }}
              />
            </svg>
            
            {/* Center score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-2xl font-black text-white"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {score}
              </motion.span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-lg font-bold"
                style={{ color: scoreColor }}
              >
                {readiness.label}
              </span>
              {score >= 70 && (
                <TrendingUp className="w-4 h-4 text-[#30D158]" />
              )}
            </div>
            <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
              {readiness.advice}
            </p>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
          {factors.map((factor, i) => (
            <motion.div
              key={factor.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-2"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${factor.color}20` }}
              >
                <factor.icon 
                  className="w-4 h-4" 
                  style={{ color: factor.color }}
                />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wide">{factor.label}</p>
                <p className="text-sm font-bold text-white">{factor.value}/5</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
