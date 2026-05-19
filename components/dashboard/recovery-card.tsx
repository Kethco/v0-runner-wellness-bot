"use client";

import { motion } from "framer-motion";
import { 
  Moon, Droplets, StretchVertical, Heart, Coffee, 
  Footprints, BedDouble, ThermometerSnowflake,
  Sparkles, ChevronRight
} from "lucide-react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

interface RecoveryTip {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  priority: "high" | "medium" | "low";
}

function getRecoveryTips(data: {
  soreness: number;
  energy: number;
  sleep: number;
  hardRunsRecent: number;
  milesSoFar: number;
  isRestDay: boolean;
}): RecoveryTip[] {
  const tips: RecoveryTip[] = [];
  
  // High soreness tips
  if (data.soreness >= 4) {
    tips.push({
      icon: StretchVertical,
      title: "Foam Rolling",
      description: "Spend 10 minutes on tight areas",
      color: "#FF9500",
      priority: "high",
    });
    tips.push({
      icon: ThermometerSnowflake,
      title: "Contrast Shower",
      description: "Alternate hot and cold to reduce inflammation",
      color: "#64D2FF",
      priority: "high",
    });
  }
  
  // Low energy tips
  if (data.energy <= 2) {
    tips.push({
      icon: Coffee,
      title: "Check Nutrition",
      description: "Are you eating enough carbs and protein?",
      color: "#FFD60A",
      priority: "high",
    });
    tips.push({
      icon: Droplets,
      title: "Stay Hydrated",
      description: "Aim for 8+ glasses of water today",
      color: "#64D2FF",
      priority: "medium",
    });
  }
  
  // Poor sleep tips
  if (data.sleep <= 2) {
    tips.push({
      icon: BedDouble,
      title: "Prioritize Sleep",
      description: "Aim for 8 hours tonight - it's essential",
      color: "#AF52DE",
      priority: "high",
    });
    tips.push({
      icon: Moon,
      title: "Wind Down Early",
      description: "No screens 30 min before bed",
      color: "#5E5CE6",
      priority: "medium",
    });
  }
  
  // Heavy training load
  if (data.hardRunsRecent >= 2) {
    tips.push({
      icon: Footprints,
      title: "Active Recovery",
      description: "A short walk is better than sitting",
      color: "#30D158",
      priority: "medium",
    });
  }
  
  // Rest day celebration
  if (data.isRestDay) {
    tips.push({
      icon: Heart,
      title: "Rest Day Win",
      description: "Your body is rebuilding stronger",
      color: "#FF2D55",
      priority: "low",
    });
  }
  
  // General wellness if not much else
  if (tips.length < 2) {
    tips.push({
      icon: StretchVertical,
      title: "Light Stretching",
      description: "5 minutes keeps you mobile",
      color: "#30D158",
      priority: "low",
    });
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 3);
}

export function RecoveryCard() {
  const { data: insightsData, isLoading } = useSWR("/api/wellness-insights", fetcher);
  const { data: runsData } = useSWR("/api/runs?days=1", fetcher);
  
  const hasRunToday = runsData?.runs?.some((r: { date: string }) => {
    const today = new Date().toISOString().split("T")[0];
    return r.date?.split("T")[0] === today;
  });
  
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 p-5 animate-pulse" style={{ backgroundColor: 'rgba(13, 13, 13, 0.97)' }}>
        <div className="h-4 bg-white/5 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-white/5 rounded" />
          <div className="h-12 bg-white/5 rounded" />
        </div>
      </div>
    );
  }
  
  const readiness = insightsData?.readiness;
  const weeklyStats = insightsData?.weeklyStats;
  
  // Don't show if readiness is high (they don't need recovery tips)
  if (!readiness || readiness.score >= 80) {
    return null;
  }
  
  const tips = getRecoveryTips({
    soreness: 5 - (readiness.score / 20), // Estimate from readiness
    energy: parseFloat(weeklyStats?.avgEnergy || "3"),
    sleep: parseFloat(weeklyStats?.avgSleep || "3"),
    hardRunsRecent: weeklyStats?.runs >= 5 ? 2 : weeklyStats?.runs >= 3 ? 1 : 0,
    milesSoFar: weeklyStats?.miles || 0,
    isRestDay: !hasRunToday,
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden"
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#AF52DE]/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#AF52DE]" />
            </div>
            Recovery Focus
          </h3>
          <span className="text-[10px] text-[#AEAEB2] bg-[#2A2A2A] px-2.5 py-1 rounded-full font-medium border border-[#3A3A3A]">
            {tips.filter(t => t.priority === "high").length} priorities
          </span>
        </div>
        
        <div className="space-y-2.5">
          {tips.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${tip.color}20` }}
              >
                <tip.icon className="w-4.5 h-4.5" style={{ color: tip.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[13px]">{tip.title}</p>
                <p className="text-[#AEAEB2] text-[11px] truncate">{tip.description}</p>
              </div>
              {tip.priority === "high" && (
                <span className="text-[9px] text-[#FF9500] bg-[#FF9500]/15 px-2 py-0.5 rounded-full font-bold border border-[#FF9500]/30">
                  Priority
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Rest day message if applicable */}
      {!hasRunToday && (
        <div className="px-5 py-3 bg-[#30D158]/12 border-t border-[#30D158]/25">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-[#30D158]" />
            <p className="text-[#30D158] text-[12px] font-medium">
              Rest days build strength. You&apos;re doing great!
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
