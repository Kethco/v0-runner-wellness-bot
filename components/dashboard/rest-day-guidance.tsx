"use client";

import { motion } from "framer-motion";
import { 
  Moon, Droplets, StretchVertical, Heart, Footprints,
  Wind, Coffee, BedDouble, Sparkles, ChevronRight
} from "lucide-react";
import useSWR from "swr";
import { useState, useEffect } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

interface RecoveryActivity {
  id: string;
  icon: React.ElementType;
  title: string;
  duration: string;
  description: string;
  benefit: string;
  color: string;
  completed?: boolean;
}

const BASE_ACTIVITIES: RecoveryActivity[] = [
  {
    id: "stretch",
    icon: StretchVertical,
    title: "Dynamic Stretching",
    duration: "10 min",
    description: "Hip flexors, hamstrings, and calves",
    benefit: "Improves flexibility and blood flow",
    color: "#30D158",
  },
  {
    id: "foam",
    icon: Wind,
    title: "Foam Rolling",
    duration: "10-15 min",
    description: "Focus on tight spots and trigger points",
    benefit: "Releases muscle tension and knots",
    color: "#FF9500",
  },
  {
    id: "walk",
    icon: Footprints,
    title: "Light Walk",
    duration: "15-20 min",
    description: "Easy pace, enjoy being outside",
    benefit: "Promotes active recovery without stress",
    color: "#64D2FF",
  },
  {
    id: "hydrate",
    icon: Droplets,
    title: "Hydration Focus",
    duration: "All day",
    description: "Aim for 8-10 glasses of water",
    benefit: "Aids muscle recovery and reduces fatigue",
    color: "#5AC8FA",
  },
  {
    id: "sleep",
    icon: BedDouble,
    title: "Extra Sleep",
    duration: "30-60 min",
    description: "Nap or go to bed earlier tonight",
    benefit: "When you rest, you grow stronger",
    color: "#AF52DE",
  },
  {
    id: "nutrition",
    icon: Coffee,
    title: "Recovery Nutrition",
    duration: "With meals",
    description: "Protein and anti-inflammatory foods",
    benefit: "Supports muscle repair",
    color: "#FFD60A",
  },
];

function getPersonalizedActivities(data: {
  soreness: number;
  energy: number;
  sleep: number;
}): RecoveryActivity[] {
  const activities: RecoveryActivity[] = [];
  
  // Always include stretching
  activities.push(BASE_ACTIVITIES.find(a => a.id === "stretch")!);
  
  // High soreness = foam rolling priority
  if (data.soreness >= 3) {
    activities.push(BASE_ACTIVITIES.find(a => a.id === "foam")!);
  }
  
  // Low energy = hydration and nutrition
  if (data.energy <= 2) {
    activities.push(BASE_ACTIVITIES.find(a => a.id === "hydrate")!);
    activities.push(BASE_ACTIVITIES.find(a => a.id === "nutrition")!);
  }
  
  // Poor sleep = prioritize rest
  if (data.sleep <= 2) {
    activities.push(BASE_ACTIVITIES.find(a => a.id === "sleep")!);
  }
  
  // If energy is good, suggest light walk
  if (data.energy >= 3 && activities.length < 4) {
    activities.push(BASE_ACTIVITIES.find(a => a.id === "walk")!);
  }
  
  // Fill remaining with hydration if needed
  if (activities.length < 3 && !activities.find(a => a.id === "hydrate")) {
    activities.push(BASE_ACTIVITIES.find(a => a.id === "hydrate")!);
  }
  
  // Return unique activities (max 4)
  return [...new Map(activities.map(a => [a.id, a])).values()].slice(0, 4);
}

export function RestDayGuidance() {
  const { data: insightsData, isLoading } = useSWR("/api/wellness-insights", fetcher);
  const { data: checkinData } = useSWR("/api/checkins?limit=1", fetcher);
  const todayStr = new Date().toISOString().split("T")[0];
  const storageKey = `rest-day-activities-${todayStr}`;
  
  // Load completed activities from localStorage (persists for the day)
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem(storageKey);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Save to localStorage when activities change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...completedActivities]));
  }, [completedActivities, storageKey]);
  
  const todayCheckin = checkinData?.checkins?.[0];
  const hasCheckedInToday = todayCheckin?.date === todayStr;
  
  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded" />
          <div className="h-16 bg-white/5 rounded" />
        </div>
      </div>
    );
  }
  
  const weeklyStats = insightsData?.weeklyStats;
  
  // Get wellness metrics
  const sleepRating = hasCheckedInToday ? todayCheckin?.sleep_rating : 3;
  const energyLevel = hasCheckedInToday ? todayCheckin?.energy : 3;
  const sorenessLevel = hasCheckedInToday ? todayCheckin?.soreness : 1;
  
  const activities = getPersonalizedActivities({
    soreness: sorenessLevel || 1,
    energy: energyLevel || 3,
    sleep: sleepRating || 3,
  });
  
  const toggleActivity = (id: string) => {
    setCompletedActivities(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // Only count completed activities that are in the current activities list
  const validCompletedIds = activities.map(a => a.id);
  const completedCount = [...completedActivities].filter(id => validCompletedIds.includes(id)).length;
  const totalCount = activities.length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden"
    >
      {/* Top accent */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#30D158] to-transparent" />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: 'rgba(48, 209, 88, 0.2)',
                boxShadow: '0 0 20px rgba(48, 209, 88, 0.3)'
              }}
            >
              <Heart 
                className="w-5 h-5 text-[#30D158]" 
                style={{ filter: 'drop-shadow(0 0 4px rgba(48,209,88,0.6))' }} 
              />
            </div>
            Active Recovery
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {completedCount}/{totalCount}
            </span>
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#30D158] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Message */}
        <div className="bg-[#30D158]/10 border border-[#30D158]/20 rounded-xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#30D158] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/80">
                Rest days are when your body rebuilds stronger. Light activity promotes blood flow and speeds recovery.
              </p>
            </div>
          </div>
        </div>
        
        {/* Activities */}
        <div className="space-y-3">
          {activities.map((activity, i) => {
            const isCompleted = completedActivities.has(activity.id);
            return (
              <motion.button
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => toggleActivity(activity.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  isCompleted 
                    ? "bg-[#30D158]/10 border-[#30D158]/30" 
                    : "bg-[#1C1C1E] border-white/5 hover:border-white/10"
                }`}
              >
                <div 
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isCompleted ? "bg-[#30D158]/30" : ""
                  }`}
                  style={{ 
                    backgroundColor: isCompleted ? undefined : `${activity.color}20`,
                    boxShadow: `0 0 16px ${activity.color}30`
                  }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-[#30D158] flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : (
                    <activity.icon 
                      className="w-5 h-5" 
                      style={{ 
                        color: activity.color,
                        filter: `drop-shadow(0 0 4px ${activity.color})`
                      }} 
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${isCompleted ? "text-[#30D158]" : "text-white"}`}>
                      {activity.title}
                    </p>
                    <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {activity.duration}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{activity.description}</p>
                </div>
                
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  isCompleted ? "text-[#30D158] rotate-90" : "text-white/30"
                }`} />
              </motion.button>
            );
          })}
        </div>
        
        {/* Completion message */}
        {completedCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 bg-[#30D158]/20 border border-[#30D158]/30 rounded-xl text-center"
          >
            <p className="text-[#30D158] font-bold text-sm">
              Amazing! You&apos;ve completed all recovery activities today.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
