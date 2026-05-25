"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Battery } from "lucide-react";
import useSWR from "swr";

interface Run {
  date: string;
  miles: number;
}

interface TrainingLoadProps {
  weeklyGoal?: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TrainingLoadIndicator({ weeklyGoal = 20 }: TrainingLoadProps) {
  // Get client's local date to avoid timezone issues
  const [clientDate, setClientDate] = useState<string>("");
  
  useEffect(() => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setClientDate(localDate);
  }, []);

  // Fetch last 4 weeks of runs, passing client date for proper timezone handling
  const { data: runsData } = useSWR(
    clientDate ? `/api/runs?days=28&clientDate=${clientDate}` : null,
    fetcher
  );

  const loadData = useMemo(() => {
    if (!clientDate) {
      return {
        currentWeek: 0,
        lastWeek: 0,
        avg4Week: 0,
        weekChange: 0,
        weeks: [0, 0, 0, 0],
        phase: "build" as const,
        riskLevel: "low" as const,
        message: "Loading...",
        recommendation: "",
        weeklyGoal,
      };
    }
    
    const runs: Run[] = runsData?.runs || [];
    
    // Parse client date for calculations
    const [year, month, day] = clientDate.split('-').map(Number);
    const now = new Date(year, month - 1, day);
    
    // Calculate weekly totals for last 4 weeks using string comparisons
    const weeks: number[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (7 * w) - now.getDay());
      const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
      
      // Use string comparison to avoid timezone issues
      const weekMiles = runs
        .filter(r => {
          const runDateStr = r.date.split('T')[0];
          return runDateStr >= weekStartStr && runDateStr <= weekEndStr;
        })
        .reduce((sum, r) => sum + r.miles, 0);
      
      weeks.unshift(weekMiles);
    }
    
    // Current week is the last element
    const currentWeek = weeks[3] || 0;
    const lastWeek = weeks[2] || 0;
    const avg4Week = weeks.reduce((a, b) => a + b, 0) / 4;
    
    // Calculate week-over-week change
    const weekChange = lastWeek > 0 ? ((currentWeek - lastWeek) / lastWeek) * 100 : 0;
    
    // Determine training phase and risk level
    let phase: "recovery" | "build" | "peak" | "overtraining" = "build";
    let riskLevel: "low" | "moderate" | "high" = "low";
    let message = "";
    let recommendation = "";
    
    // Overtraining detection: >30% increase week-over-week or >130% of average
    if (weekChange > 30 || currentWeek > avg4Week * 1.3) {
      phase = "overtraining";
      riskLevel = "high";
      message = "Training load is high";
      recommendation = "Consider an easy day or rest to prevent injury";
    }
    // Recovery week: current week significantly below average (<70%)
    else if (currentWeek < avg4Week * 0.7 && currentWeek < weeklyGoal * 0.7) {
      phase = "recovery";
      riskLevel = "low";
      message = "Recovery week";
      recommendation = "Great time to rebuild energy for harder efforts";
    }
    // Build phase: steady progress, moderate load
    else if (weekChange >= -10 && weekChange <= 20) {
      phase = "build";
      riskLevel = "low";
      message = "Building phase";
      recommendation = "Consistent progress - keep it up!";
    }
    // Peak: at or above goal, steady
    else if (currentWeek >= weeklyGoal) {
      phase = "peak";
      riskLevel = "moderate";
      message = "Peak training";
      recommendation = "You're at peak load - prioritize recovery";
    }
    
    return {
      currentWeek,
      lastWeek,
      avg4Week,
      weekChange,
      weeks,
      phase,
      riskLevel,
      message,
      recommendation,
      weeklyGoal,
    };
  }, [runsData, weeklyGoal]);

  const phaseConfig = {
    recovery: {
      color: "text-[#30D158]",
      bgColor: "bg-[#30D158]/20",
      borderColor: "border-[#30D158]/30",
      icon: Battery,
      gradient: "from-[#30D158]/20 to-transparent",
    },
    build: {
      color: "text-[#0A84FF]",
      bgColor: "bg-[#0A84FF]/20",
      borderColor: "border-[#0A84FF]/30",
      icon: TrendingUp,
      gradient: "from-[#0A84FF]/20 to-transparent",
    },
    peak: {
      color: "text-[#FF9500]",
      bgColor: "bg-[#FF9500]/20",
      borderColor: "border-[#FF9500]/30",
      icon: Zap,
      gradient: "from-[#FF9500]/20 to-transparent",
    },
    overtraining: {
      color: "text-[#FF453A]",
      bgColor: "bg-[#FF453A]/20",
      borderColor: "border-[#FF453A]/30",
      icon: AlertTriangle,
      gradient: "from-[#FF453A]/20 to-transparent",
    },
  };

  const config = phaseConfig[loadData.phase];
  const Icon = config.icon;

  // Calculate bar heights for mini chart (normalize to max)
  const maxWeek = Math.max(...loadData.weeks, loadData.weeklyGoal, 1);
  const barHeights = loadData.weeks.map(w => (w / maxWeek) * 100);
  const goalHeight = (loadData.weeklyGoal / maxWeek) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card card-lift p-4 border ${config.borderColor}`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-2xl pointer-events-none`} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Training Load</h3>
              <p className={`text-xs ${config.color}`}>{loadData.message}</p>
            </div>
          </div>
          
          {/* Week-over-week change */}
          <div className="flex items-center gap-1">
            {loadData.weekChange > 5 ? (
              <TrendingUp className="w-3.5 h-3.5 text-[#30D158]" />
            ) : loadData.weekChange < -5 ? (
              <TrendingDown className="w-3.5 h-3.5 text-[#FF453A]" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-[#8E8E93]" />
            )}
            <span className={`text-xs font-medium ${
              loadData.weekChange > 5 ? "text-[#30D158]" : 
              loadData.weekChange < -5 ? "text-[#FF453A]" : "text-[#8E8E93]"
            }`}>
              {loadData.weekChange > 0 ? "+" : ""}{loadData.weekChange.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Mini 4-week chart */}
        <div className="relative flex items-end gap-1.5 h-16 mb-3">
          {/* Goal line - positioned within chart area */}
          <div 
            className="absolute left-0 right-0 border-t border-dashed border-white/30 z-10"
            style={{ bottom: `${Math.min(goalHeight, 95)}%` }}
          >
            <span className="absolute -top-3 right-0 text-[8px] text-[#8E8E93]">Goal</span>
          </div>
          
          {loadData.weeks.map((miles, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${barHeights[i]}%` }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`w-full rounded-t-sm ${
                  i === 3 ? config.bgColor : "bg-white/10"
                } ${i === 3 ? config.borderColor + " border-t-2" : ""}`}
                style={{ minHeight: miles > 0 ? 4 : 0 }}
              />
            </div>
          ))}
        </div>
        
        {/* Week labels */}
        <div className="flex gap-1.5 mb-3 -mt-1">
          {loadData.weeks.map((_, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[9px] text-[#8E8E93]">
                {i === 3 ? "This" : i === 2 ? "Last" : `-${3 - i}w`}
              </span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="text-center flex-1">
            <p className="text-xs text-[#8E8E93]">This Week</p>
            <p className="text-sm font-bold text-white">{loadData.currentWeek.toFixed(1)} mi</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center flex-1">
            <p className="text-xs text-[#8E8E93]">4-Week Avg</p>
            <p className="text-sm font-bold text-white">{loadData.avg4Week.toFixed(1)} mi</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center flex-1">
            <p className="text-xs text-[#8E8E93]">Goal</p>
            <p className="text-sm font-bold text-white">{loadData.weeklyGoal} mi</p>
          </div>
        </div>

        {/* Recommendation */}
        <p className="text-[10px] text-[#8E8E93] mt-2 text-center italic">
          {loadData.recommendation}
        </p>
      </div>
    </motion.div>
  );
}
