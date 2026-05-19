"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function ReadinessScore() {
  const { data, isLoading } = useSWR("/api/wellness-insights", fetcher);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-5 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="w-[140px] h-[140px] rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-white/5 rounded w-32" />
            <div className="h-4 bg-white/5 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.readiness) {
    return null;
  }

  const { readiness, insights, tips } = data;
  const score = readiness.score;
  
  // Color based on score - golden/amber theme like the reference
  const getScoreColor = (s: number) => {
    if (s >= 80) return "#30D158";
    if (s >= 60) return "#FFD60A";
    if (s >= 40) return "#FF9F0A";
    return "#FF453A";
  };
  
  const getStatus = (s: number) => {
    if (s >= 80) return "Optimal";
    if (s >= 60) return "Moderate";
    if (s >= 40) return "Low";
    return "Rest";
  };
  
  const scoreColor = getScoreColor(score);
  const status = getStatus(score);
  
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] overflow-hidden"
    >
      <div className="p-5">
        {/* Main content - horizontal layout */}
        <div className="flex items-center gap-5">
          {/* Circular Score Ring */}
          <div className="relative w-[140px] h-[140px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#2C2C2E"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <motion.circle
                cx="70"
                cy="70"
                r={radius}
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className="text-4xl font-bold text-white"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {score}
              </motion.span>
              <span className="text-xs text-[#8E8E93] font-semibold uppercase tracking-wider mt-1">
                Ready
              </span>
            </div>
          </div>

          {/* Right side - Title and advice */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-lg font-bold text-white">Today&apos;s Readiness</h3>
              <span 
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${scoreColor}20`,
                  color: scoreColor 
                }}
              >
                {status}
              </span>
            </div>
            <p className="text-[#8E8E93] text-sm leading-relaxed">
              {readiness.advice || "Consider an easy run or active recovery."}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2C2C2E] my-5" />

        {/* Insights section */}
        {insights && insights.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#8E8E93]" />
              <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
                Insights From Your Data
              </span>
            </div>
            <div className="space-y-2.5">
              {insights.slice(0, 2).map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-[#FF9F0A] mt-0.5 flex-shrink-0" />
                  <p className="text-white text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery Tips section */}
        {tips && tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#8E8E93]" />
              <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
                Recovery Tips
              </span>
            </div>
            <ul className="space-y-2">
              {tips.slice(0, 2).map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#FF9F0A] mt-1">•</span>
                  <p className="text-[#AEAEB2] text-sm leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
