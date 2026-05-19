"use client";

import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
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
      <div className="relative overflow-hidden rounded-3xl bg-black p-8 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-44 h-44 rounded-full bg-white/5" />
          <div className="h-4 bg-white/5 rounded w-32" />
        </div>
      </div>
    );
  }

  if (!data?.readiness) {
    return null;
  }

  const { readiness, recoverySuggestions } = data;
  const score = readiness.score;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Golden amber color for the ring
  const ringColor = "#FFB800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-black"
    >
      {/* Ambient glow behind the ring */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] opacity-40"
        style={{ background: `radial-gradient(circle, ${ringColor} 0%, transparent 70%)` }}
      />
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Today&apos;s Readiness</h2>
          <Link 
            href="/trends"
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Large centered readiness ring */}
        <div className="flex flex-col items-center py-4">
          <div className="relative w-[180px] h-[180px]">
            {/* Multiple glow layers for depth */}
            <motion.div 
              className="absolute inset-[-40px] rounded-full"
              style={{ 
                background: `radial-gradient(circle, ${ringColor}50 0%, ${ringColor}20 30%, transparent 60%)`,
              }}
              animate={{ 
                opacity: [0.4, 0.7, 0.4],
                scale: [0.95, 1.02, 0.95]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            
            {/* Progress indicator dot at top */}
            <motion.div
              className="absolute w-4 h-4 rounded-full z-20"
              style={{ 
                backgroundColor: "#FFF",
                boxShadow: `0 0 16px ${ringColor}, 0 0 32px ${ringColor}, 0 0 48px ${ringColor}80`,
                top: '-2px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
            />
            
            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 180 180">
              {/* Background ring */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="10"
              />
              {/* Progress ring with golden glow */}
              <motion.circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
                style={{ 
                  filter: `drop-shadow(0 0 8px ${ringColor}) drop-shadow(0 0 20px ${ringColor}90) drop-shadow(0 0 40px ${ringColor}50)`,
                }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <motion.span 
                className="text-sm font-bold uppercase tracking-widest mb-1"
                style={{ color: ringColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Ready
              </motion.span>
              <motion.span
                className="text-6xl font-black text-white leading-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                {score}
              </motion.span>
              <motion.span 
                className="text-base font-semibold mt-2 px-4 py-1 rounded-full border"
                style={{ 
                  backgroundColor: `${ringColor}15`,
                  color: ringColor,
                  borderColor: `${ringColor}40`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {readiness.label}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Personalized Insights Section */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-white mb-3">Personalized Insights</h3>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white/[0.04] rounded-2xl p-4 border border-white/[0.06]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">
                  {score >= 70 ? "Focus on performance today" : "Focus on recovery today"}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  {readiness.advice}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Recovery Tips */}
        {recoverySuggestions?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-lg font-bold text-white mb-3">Recovery Tips</h3>
            <div className="space-y-2">
              {recoverySuggestions.slice(0, 2).map((tip: string, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04]"
                >
                  <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{tip}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
