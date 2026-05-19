"use client";

import { motion } from "framer-motion";
import { Gauge, TrendingUp, AlertCircle, CheckCircle2, Zap } from "lucide-react";
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
      <div className="rounded-2xl border border-white/10 p-5 animate-pulse" style={{ backgroundColor: 'rgba(13, 13, 13, 0.97)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded w-24" />
            <div className="h-3 bg-white/5 rounded w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.readiness) {
    return null;
  }

  const { readiness, patterns, recoverySuggestions } = data;
  const score = readiness.score;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden"
    >
      {/* Subtle top accent line */}
      <div 
        className="h-[2px] opacity-80"
        style={{ 
          background: `linear-gradient(to right, ${readiness.color}, ${readiness.color}40, transparent)` 
        }}
      />
      
      <div className="p-5">
        <div className="flex items-center gap-5">
          {/* Premium Circular Score with glow */}
          <div className="relative w-[88px] h-[88px] flex-shrink-0">
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-30"
              style={{ backgroundColor: readiness.color }}
            />
            <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 64 64">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="5"
              />
              {/* Progress circle */}
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={`url(#readiness-gradient-${score})`}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 6px ${readiness.color}60)` }}
              />
              <defs>
                <linearGradient id={`readiness-gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={readiness.color} />
                  <stop offset="100%" stopColor={readiness.color} stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <motion.span
                className="text-[28px] font-black text-white tracking-tight"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {score}
              </motion.span>
              <span className="text-[8px] text-[#AEAEB2] uppercase tracking-[0.15em] font-semibold">Ready</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-white font-bold text-base">Today&apos;s Readiness</h3>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: `${readiness.color}20`,
                  color: readiness.color,
                  borderColor: `${readiness.color}40`
                }}
              >
                {readiness.label}
              </span>
            </div>
            <p className="text-[#C7C7CC] text-[13px] leading-relaxed">{readiness.advice}</p>
            
            {!readiness.hasCheckedIn && (
              <Link 
                href="#checkin"
                className="inline-flex items-center gap-1.5 text-[11px] text-[#FF4500] mt-2.5 hover:text-[#FF6B00] transition-colors font-medium"
              >
                <AlertCircle className="w-3 h-3" />
                Check in for accurate score
              </Link>
            )}
          </div>
        </div>

        {/* Patterns & Insights */}
        {(patterns?.length > 0 || recoverySuggestions?.length > 0) && (
          <div className="mt-4 pt-4 border-t border-border">
            {patterns?.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-[10px] text-[#6E6E73] uppercase tracking-wider font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Insights from your data
                </p>
                {patterns.slice(0, 2).map((pattern: string, i: number) => (
                  <div 
                    key={i}
                    className="flex items-start gap-2 text-sm text-[#AEAEB2]"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#FFD60A] mt-0.5 flex-shrink-0" />
                    <span>{pattern}</span>
                  </div>
                ))}
              </div>
            )}
            
            {recoverySuggestions?.length > 0 && readiness.score < 70 && (
              <div className="space-y-2">
                <p className="text-[10px] text-[#6E6E73] uppercase tracking-wider font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Recovery tips
                </p>
                {recoverySuggestions.slice(0, 2).map((tip: string, i: number) => (
                  <div 
                    key={i}
                    className="flex items-start gap-2 text-sm text-[#AEAEB2]"
                  >
                    <span className="text-[#30D158]">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
