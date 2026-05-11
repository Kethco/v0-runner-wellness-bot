"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

interface PremiumProgressRingProps {
  currentMiles: number;
  goalMiles: number;
  progressPercent: number;
  streak: number;
}

export function PremiumProgressRing({ currentMiles, goalMiles, progressPercent, streak }: PremiumProgressRingProps) {
  const [mounted, setMounted] = useState(false);
  
  // Animated counter
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });
  const displayValue = useTransform(springValue, (val) => val.toFixed(1));
  
  useEffect(() => {
    setMounted(true);
    springValue.set(currentMiles);
  }, [currentMiles, springValue]);

  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center py-8">
      {/* Glow effect behind ring */}
      <div 
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{
          background: `radial-gradient(circle, #FF2D55 0%, #FF6B00 50%, transparent 70%)`,
        }}
      />
      
      {/* SVG Progress Ring */}
      <div className="relative w-64 h-64">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
          {/* Background circle */}
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          
          {/* Animated progress circle */}
          <motion.circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: mounted ? strokeDashoffset : circumference }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            style={{
              filter: "drop-shadow(0 0 10px #FF2D55)",
            }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF2D55" />
              <stop offset="50%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#FF8A9B" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-6xl font-black tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {mounted ? <motion.span>{displayValue}</motion.span> : "0.0"}
          </motion.span>
          <span className="text-sm text-white/50 uppercase tracking-widest mt-1">Miles</span>
          
          {/* Goal badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-3 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
          >
            <span className="text-xs font-bold text-[#FF2D55]">{Math.round(progressPercent)}%</span>
            <span className="text-xs text-white/50 ml-1">of {goalMiles}mi goal</span>
          </motion.div>
        </div>
      </div>
      
      {/* Streak badge */}
      {streak > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1, type: "spring", stiffness: 200 }}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF6B00]/20 to-[#FF2D55]/20 border border-[#FF6B00]/30"
        >
          <motion.span 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 0.5, 
              repeat: Infinity, 
              repeatDelay: 2 
            }}
            className="text-xl"
          >
            🔥
          </motion.span>
          <span className="text-sm font-bold">{streak} Day Streak</span>
        </motion.div>
      )}
    </div>
  );
}
