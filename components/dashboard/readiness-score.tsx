"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Moon, Zap, Activity, TrendingUp, TrendingDown, Minus,
  Sparkles, CheckCircle2
} from "lucide-react";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

function getScoreColor(score: number): string {
  if (score >= 85) return "#30D158";
  if (score >= 70) return "#32D74B";
  if (score >= 50) return "#FFD60A";
  if (score >= 30) return "#FF9500";
  return "#FF453A";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Peak";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Low";
  return "Rest";
}

function getTrend(current: number, average: number): "up" | "down" | "stable" {
  const diff = current - average;
  if (diff > 0.3) return "up";
  if (diff < -0.3) return "down";
  return "stable";
}

export function ReadinessScore() {
  // Get client's local date
  const [clientDate, setClientDate] = useState<string>("");
  
  useEffect(() => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setClientDate(localDate);
  }, []);

  const { data } = useSWR(clientDate ? `/api/wellness-insights?clientDate=${clientDate}` : null, fetcher);
  const { data: checkinData } = useSWR(clientDate ? `/api/checkins?limit=1&clientDate=${clientDate}` : null, fetcher);
  
  const todayCheckin = checkinData?.checkins?.[0];
  // Use client's local date instead of server UTC
  const hasCheckedInToday = clientDate && todayCheckin?.date === clientDate;
  
  // Return empty fragment if still loading
  if (!clientDate || !data) {
    return <></>;
  }
  
  // If user hasn't checked in today, show a prompt instead of stale data
  if (!data?.readiness?.hasCheckedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white/40">--</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">Recovery Score</span>
            </div>
            <p className="text-xs text-white/50 mb-3">Check in today to see your score</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const { readiness, patterns: insights, recoverySuggestions: tips, weeklyStats } = data;
  const score = readiness.score;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  
  // Calculate the circle progress
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Get individual metrics from today's check-in
  const sleepRating = todayCheckin?.sleep_rating || 3;
  const energyLevel = todayCheckin?.energy || 3;
  const sorenessLevel = todayCheckin?.soreness || 1;
  
  // Calculate trends
  const avgSleep = parseFloat(weeklyStats?.avgSleep || "3");
  const avgEnergy = parseFloat(weeklyStats?.avgEnergy || "3");
  
  const sleepTrend = hasCheckedInToday ? getTrend(sleepRating, avgSleep) : "stable";
  const energyTrend = hasCheckedInToday ? getTrend(energyLevel, avgEnergy) : "stable";
  
  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-[#30D158]" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-[#FF453A]" />;
    return <Minus className="w-3 h-3 text-white/40" />;
  };

  return (
    <div className="glass-card-glow overflow-hidden">
      {/* Top accent gradient */}
      <div 
        className="h-[2px]" 
        style={{ 
          background: `linear-gradient(90deg, transparent, ${scoreColor}, transparent)` 
        }} 
      />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${scoreColor}20`,
                boxShadow: `0 0 20px ${scoreColor}30`
              }}
            >
              <Sparkles 
                className="w-5 h-5" 
                style={{ 
                  color: scoreColor,
                  filter: `drop-shadow(0 0 4px ${scoreColor})`
                }} 
              />
            </div>
            Recovery Score
          </h3>
          {!hasCheckedInToday && (
            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-full">
              Check in for accuracy
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-5">
          {/* Score Ring */}
          <div className="relative w-28 h-28 flex-shrink-0">
            {/* Glow effect */}
            <div 
              className="absolute inset-[-6px] rounded-full opacity-50"
              style={{ 
                background: `radial-gradient(circle, ${scoreColor}30 0%, transparent 70%)`,
              }}
            />
            
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background track */}
              <circle 
                cx="50" cy="50" r="42" 
                stroke="rgba(255,255,255,0.08)" 
                strokeWidth="8" 
                fill="none" 
              />
              {/* Progress arc */}
              <circle
                cx="50" cy="50" r="42"
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ filter: `drop-shadow(0 0 8px ${scoreColor})`, transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white leading-none">
                {score}
              </span>
              <span 
                className="text-[10px] font-bold uppercase tracking-wider mt-1"
                style={{ color: scoreColor }}
              >
                {scoreLabel}
              </span>
            </div>
          </div>
          
          {/* Metrics Breakdown */}
          <div className="flex-1 space-y-3">
            {/* Sleep */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#AF52DE]/20 flex items-center justify-center">
                <Moon className="w-4 h-4 text-[#AF52DE]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Sleep</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={sleepTrend} />
                    <span className="text-sm font-bold text-white">{sleepRating}/5</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#AF52DE]"
                    style={{ width: `${(sleepRating / 5) * 100}%`, transition: 'width 0.3s ease-out' }}
                  />
                </div>
              </div>
            </div>
            
            {/* Energy */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFD60A]/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#FFD60A]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Energy</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={energyTrend} />
                    <span className="text-sm font-bold text-white">{energyLevel}/5</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#FFD60A]"
                    style={{ width: `${(energyLevel / 5) * 100}%`, transition: 'width 0.3s ease-out' }}
                  />
                </div>
              </div>
            </div>
            
            {/* Soreness */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF9500]/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#FF9500]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Soreness</span>
                  <span className="text-sm font-bold text-white">
                    {sorenessLevel === 1 ? "None" : sorenessLevel === 2 ? "Mild" : sorenessLevel === 3 ? "Moderate" : "High"}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: sorenessLevel <= 2 ? "#30D158" : sorenessLevel === 3 ? "#FFD60A" : "#FF453A",
                      width: `${(sorenessLevel / 4) * 100}%`,
                      transition: 'width 0.3s ease-out'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Advice */}
        <div 
          className="mt-5 p-4 rounded-xl border"
          style={{ 
            backgroundColor: `${scoreColor}10`,
            borderColor: `${scoreColor}30`
          }}
        >
          <p className="text-sm text-white/80">{readiness.advice}</p>
        </div>
        
        {/* Insights section */}
        {insights && insights.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Insights
              </span>
            </div>
            <div className="space-y-2">
              {insights.slice(0, 2).map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-[#FF9F0A] mt-0.5 flex-shrink-0" />
                  <p className="text-white/70 text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery Tips section */}
        {tips && tips.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-white/40" />
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Recovery Tips
              </span>
            </div>
            <ul className="space-y-2">
              {tips.slice(0, 2).map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#30D158] mt-1">•</span>
                  <p className="text-white/60 text-sm leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
