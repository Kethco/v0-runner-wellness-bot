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
      <div className="rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#2A2A2A]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#2A2A2A] rounded w-24" />
            <div className="h-3 bg-[#2A2A2A] rounded w-40" />
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
      className="rounded-2xl bg-[#141414] border border-[#2A2A2A] overflow-hidden"
    >
      {/* Header accent */}
      <div 
        className="h-1"
        style={{ 
          background: `linear-gradient(to right, ${readiness.color}, ${readiness.color}80)` 
        }}
      />
      
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Circular Score */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#2A2A2A"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={readiness.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-2xl font-black text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {score}
              </motion.span>
              <span className="text-[9px] text-[#8E8E93] uppercase tracking-wider">Ready</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-lg">Today&apos;s Readiness</h3>
              <span 
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${readiness.color}20`,
                  color: readiness.color 
                }}
              >
                {readiness.label}
              </span>
            </div>
            <p className="text-[#8E8E93] text-sm">{readiness.advice}</p>
            
            {!readiness.hasCheckedIn && (
              <Link 
                href="#checkin"
                className="inline-flex items-center gap-1 text-xs text-[#FF4500] mt-2 hover:underline"
              >
                <AlertCircle className="w-3 h-3" />
                Check in for accurate score
              </Link>
            )}
          </div>
        </div>

        {/* Patterns & Insights */}
        {(patterns?.length > 0 || recoverySuggestions?.length > 0) && (
          <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
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
