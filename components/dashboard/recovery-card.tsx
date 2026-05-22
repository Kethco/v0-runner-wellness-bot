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
  
  // High soreness tips (4-5)
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
  } else if (data.soreness >= 3) {
    // Moderate soreness (3)
    tips.push({
      icon: StretchVertical,
      title: "Gentle Stretching",
      description: "Focus on tight muscles for 5-10 minutes",
      color: "#FF9500",
      priority: "medium",
    });
  }
  
  // Low energy tips (1-2)
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
  } else if (data.energy <= 3) {
    // Moderate energy (3)
    tips.push({
      icon: Droplets,
      title: "Hydration Check",
      description: "Water boosts energy - drink up!",
      color: "#64D2FF",
      priority: "medium",
    });
  }
  
  // Poor sleep tips (1-2)
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
  } else if (data.sleep <= 3) {
    // Moderate sleep (3)
    tips.push({
      icon: Moon,
      title: "Sleep Quality",
      description: "A bit more rest could help recovery",
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
  const { data: insightsData } = useSWR("/api/wellness-insights");
  const { data: runsData } = useSWR("/api/runs?days=1");
  
  const hasRunToday = runsData?.runs?.some((r: { date: string }) => {
    const today = new Date().toISOString().split("T")[0];
    return r.date?.split("T")[0] === today;
  });
  
  const readiness = insightsData?.readiness;
  const weeklyStats = insightsData?.weeklyStats;
  const todayCheckin = insightsData?.todayCheckin;
  
  // Don't show if no data or readiness is high - parent handles loading state
  if (!readiness || readiness.score >= 80) {
    return <></>;
  }
  
  // Use actual check-in data, with fallbacks
  const tips = getRecoveryTips({
    soreness: todayCheckin?.soreness ?? 1,
    energy: todayCheckin?.energy ?? 3,
    sleep: todayCheckin?.sleep ?? 3,
    hardRunsRecent: weeklyStats?.runs >= 5 ? 2 : weeklyStats?.runs >= 3 ? 1 : 0,
    milesSoFar: weeklyStats?.miles || 0,
    isRestDay: !hasRunToday,
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-glow overflow-hidden"
    >
      {/* Top accent */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#AF52DE] to-transparent" />
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: 'rgba(175, 82, 222, 0.2)',
                boxShadow: '0 0 20px rgba(175, 82, 222, 0.3)'
              }}
            >
              <Sparkles className="w-5 h-5 text-[#AF52DE]" style={{ filter: 'drop-shadow(0 0 4px rgba(175,82,222,0.6))' }} />
            </div>
            Recovery Focus
          </h3>
          <span className="text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-full font-semibold border border-white/10">
            {tips.filter(t => t.priority === "high").length} priorities
          </span>
        </div>
        
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-[#1C1C1E] border border-white/5 hover:border-white/10 transition-all"
            >
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: `${tip.color}20`,
                  boxShadow: `0 0 16px ${tip.color}30`
                }}
              >
                <tip.icon 
                  className="w-5 h-5" 
                  style={{ 
                    color: tip.color,
                    filter: `drop-shadow(0 0 4px ${tip.color})`
                  }} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{tip.title}</p>
                <p className="text-white/50 text-xs mt-0.5">{tip.description}</p>
              </div>
              {tip.priority === "high" && (
                <span 
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${tip.color}20`,
                    color: tip.color,
                    border: `1px solid ${tip.color}40`
                  }}
                >
                  Priority
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Rest day message if applicable */}
      {!hasRunToday && (
        <div className="px-5 py-4 bg-[#30D158]/10 border-t border-[#30D158]/20">
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-[#30D158]" style={{ filter: 'drop-shadow(0 0 4px rgba(48,209,88,0.5))' }} />
            <p className="text-[#30D158] text-sm font-semibold">
              Rest days build strength. You&apos;re doing great!
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
