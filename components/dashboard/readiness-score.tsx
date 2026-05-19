"use client";

import { motion } from "framer-motion";
import { TrendingUp, AlertCircle, CheckCircle2, Zap } from "lucide-react";
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
      <div className="premium-card p-6 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full bg-white/5" />
          <div className="h-4 bg-white/5 rounded w-24" />
        </div>
      </div>
    );
  }

  if (!data?.readiness) {
    return null;
  }

  const { readiness, patterns, recoverySuggestions } = data;
  const score = readiness.score;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden"
    >
      <div className="p-6">
        {/* Large centered readiness ring */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-[140px] h-[140px]">
            {/* Outer glow */}
            <motion.div 
              className="absolute inset-[-20px] rounded-full"
              style={{ 
                background: `radial-gradient(circle, ${readiness.color}40 0%, ${readiness.color}15 40%, transparent 70%)`,
              }}
              animate={{ 
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            
            {/* Progress indicator dot */}
            <motion.div
              className="absolute w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: readiness.color,
                boxShadow: `0 0 12px ${readiness.color}, 0 0 24px ${readiness.color}`,
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            />
            
            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              {/* Background ring */}
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              {/* Progress ring */}
              <motion.circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke={readiness.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                style={{ 
                  filter: `drop-shadow(0 0 12px ${readiness.color}) drop-shadow(0 0 24px ${readiness.color}80)`,
                }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: readiness.color }}
              >
                Ready
              </span>
              <motion.span
                className="text-5xl font-black text-white"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                {score}
              </motion.span>
              <span 
                className="text-sm font-semibold mt-1 px-3 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${readiness.color}20`,
                  color: readiness.color,
                }}
              >
                {readiness.label}
              </span>
            </div>
          </div>
        </div>

        {/* Advice card */}
        <div className="bg-[#1C1C1E] rounded-xl p-4 border border-white/5">
          <p className="text-white/90 text-sm leading-relaxed">{readiness.advice}</p>
          
          {!readiness.hasCheckedIn && (
            <Link 
              href="#checkin"
              className="inline-flex items-center gap-1.5 text-xs text-[#FF4500] mt-3 hover:text-[#FF6B00] transition-colors font-semibold"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Check in for accurate score
            </Link>
          )}
        </div>

        {/* Insights section */}
        {patterns?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-[#6E6E73] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Insights
            </p>
            {patterns.slice(0, 2).map((pattern: string, i: number) => (
              <div 
                key={i}
                className="flex items-start gap-2.5 text-sm text-white/70 bg-[#1C1C1E] rounded-lg p-3"
              >
                <Zap className="w-4 h-4 text-[#FFD60A] mt-0.5 flex-shrink-0" />
                <span>{pattern}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Recovery tips */}
        {recoverySuggestions?.length > 0 && readiness.score < 70 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-[#6E6E73] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recovery Tips
            </p>
            {recoverySuggestions.slice(0, 2).map((tip: string, i: number) => (
              <div 
                key={i}
                className="flex items-start gap-2.5 text-sm text-white/70 bg-[#1C1C1E] rounded-lg p-3"
              >
                <span className="text-[#30D158] font-bold">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
