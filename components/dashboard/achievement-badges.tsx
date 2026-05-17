"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Moon, Zap, Target, Star, Mountain, Clock, Heart, Shield, X } from "lucide-react";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  earned: boolean;
  progress: number; // 0-100
  requirement: string;
}

function computeBadges(stats: {
  totalRuns: number;
  totalMiles: number;
  currentStreak: number;
  maxStreak: number;
  totalCheckins: number;
  weeklyMiles: number;
  earlyRuns: number;
  lateRuns: number;
  longRuns: number;
}): Badge[] {
  return [
    {
      id: "first_mile",
      name: "First Mile",
      description: "Log your very first run",
      icon: Star,
      color: "#FFD700",
      earned: stats.totalRuns >= 1,
      progress: Math.min((stats.totalRuns / 1) * 100, 100),
      requirement: "1 run logged",
    },
    {
      id: "ten_miler",
      name: "10-Mile Club",
      description: "Run a total of 10 miles",
      icon: Target,
      color: "#FF4500",
      earned: stats.totalMiles >= 10,
      progress: Math.min((stats.totalMiles / 10) * 100, 100),
      requirement: `${stats.totalMiles.toFixed(1)} / 10 miles`,
    },
    {
      id: "fifty_miler",
      name: "50-Mile Warrior",
      description: "Accumulate 50 total miles",
      icon: Mountain,
      color: "#30D158",
      earned: stats.totalMiles >= 50,
      progress: Math.min((stats.totalMiles / 50) * 100, 100),
      requirement: `${stats.totalMiles.toFixed(1)} / 50 miles`,
    },
    {
      id: "century",
      name: "Century Runner",
      description: "Hit 100 total miles",
      icon: Trophy,
      color: "#FF6B00",
      earned: stats.totalMiles >= 100,
      progress: Math.min((stats.totalMiles / 100) * 100, 100),
      requirement: `${stats.totalMiles.toFixed(1)} / 100 miles`,
    },
    {
      id: "streak_7",
      name: "7-Day Streak",
      description: "Check in 7 days in a row",
      icon: Flame,
      color: "#FF453A",
      earned: stats.maxStreak >= 7,
      progress: Math.min((stats.maxStreak / 7) * 100, 100),
      requirement: `${stats.maxStreak} / 7 days`,
    },
    {
      id: "streak_30",
      name: "30-Day Champion",
      description: "Maintain a 30-day check-in streak",
      icon: Shield,
      color: "#5E5CE6",
      earned: stats.maxStreak >= 30,
      progress: Math.min((stats.maxStreak / 30) * 100, 100),
      requirement: `${stats.maxStreak} / 30 days`,
    },
    {
      id: "wellness_warrior",
      name: "Wellness Warrior",
      description: "Complete 50 check-ins",
      icon: Heart,
      color: "#FF2D55",
      earned: stats.totalCheckins >= 50,
      progress: Math.min((stats.totalCheckins / 50) * 100, 100),
      requirement: `${stats.totalCheckins} / 50 check-ins`,
    },
    {
      id: "big_week",
      name: "Big Week",
      description: "Run 20+ miles in a single week",
      icon: Zap,
      color: "#FFD700",
      earned: stats.weeklyMiles >= 20,
      progress: Math.min((stats.weeklyMiles / 20) * 100, 100),
      requirement: `${stats.weeklyMiles.toFixed(1)} / 20 miles this week`,
    },
    {
      id: "early_bird",
      name: "Early Bird",
      description: "Log 5 runs before 8 AM",
      icon: Moon,
      color: "#FF9F0A",
      earned: stats.earlyRuns >= 5,
      progress: Math.min((stats.earlyRuns / 5) * 100, 100),
      requirement: `${stats.earlyRuns} / 5 early runs`,
    },
    {
      id: "endurance",
      name: "Endurance King",
      description: "Complete 5 long runs (8+ miles)",
      icon: Clock,
      color: "#AF52DE",
      earned: stats.longRuns >= 5,
      progress: Math.min((stats.longRuns / 5) * 100, 100),
      requirement: `${stats.longRuns} / 5 long runs`,
    },
  ];
}

export function AchievementBadges() {
  const { data: runsData } = useSWR("/api/runs?days=365", fetcher);
  const { data: streakData } = useSWR("/api/streak", fetcher);
  const { data: checkinsData } = useSWR("/api/checkins?limit=365", fetcher);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const runs = runsData?.runs || [];
  const checkins = checkinsData?.checkins || [];

  const totalMiles = runs.reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyMiles = runs
    .filter((r: { date: string }) => new Date(r.date) >= weekAgo)
    .reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);

  const earlyRuns = runs.filter((r: { created_at: string }) => {
    const hour = new Date(r.created_at).getHours();
    return hour < 8;
  }).length;

  const longRuns = runs.filter((r: { miles: number }) => r.miles >= 8).length;

  const stats = {
    totalRuns: runs.length,
    totalMiles,
    currentStreak: streakData?.streak?.current_streak || 0,
    maxStreak: streakData?.streak?.longest_streak || streakData?.streak?.current_streak || 0,
    totalCheckins: checkins.length,
    weeklyMiles,
    earlyRuns,
    lateRuns: 0,
    longRuns,
  };

  const badges = computeBadges(stats);
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-[#141414] border border-[#2A2A2A] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FF6B00]/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <h3 className="text-white font-bold">Achievements</h3>
                <p className="text-xs text-[#6E6E73]">{earnedCount} of {badges.length} earned</p>
              </div>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF6B00] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(earnedCount / badges.length) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <span className="text-xs text-[#8E8E93] font-mono">{Math.round((earnedCount / badges.length) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Badge grid */}
        <div className="p-4">
          <div className="grid grid-cols-5 gap-3">
            {badges.map((badge, i) => (
              <motion.button
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => setSelectedBadge(badge)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  badge.earned
                    ? "shadow-lg"
                    : "opacity-40"
                }`}
                  style={{
                    backgroundColor: badge.earned ? `${badge.color}20` : "#1A1A1A",
                    borderWidth: 1,
                    borderColor: badge.earned ? `${badge.color}40` : "#2A2A2A",
                    boxShadow: badge.earned ? `0 4px 12px ${badge.color}30` : "none",
                  }}
                >
                  <badge.icon className="w-5 h-5" style={{ color: badge.earned ? badge.color : "#4A4A4A" }} />
                  
                  {/* Progress ring for unearned */}
                  {!badge.earned && badge.progress > 0 && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="22" fill="none" stroke={badge.color} strokeWidth="2" strokeDasharray={`${badge.progress * 1.38} 138`} strokeLinecap="round" opacity={0.4} />
                    </svg>
                  )}
                </div>
                <p className={`text-[9px] font-medium text-center leading-tight ${badge.earned ? "text-[#C7C7CC]" : "text-[#4A4A4A]"}`}>
                  {badge.name}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1C1E] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-xs text-center"
            >
              <button onClick={() => setSelectedBadge(null)} className="absolute top-3 right-3 text-[#6E6E73]">
                <X className="w-5 h-5" />
              </button>
              
              <motion.div
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  backgroundColor: selectedBadge.earned ? `${selectedBadge.color}20` : "#1A1A1A",
                  borderWidth: 2,
                  borderColor: selectedBadge.earned ? selectedBadge.color : "#2A2A2A",
                }}
                animate={selectedBadge.earned ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <selectedBadge.icon className="w-10 h-10" style={{ color: selectedBadge.earned ? selectedBadge.color : "#4A4A4A" }} />
              </motion.div>

              <h3 className="text-white font-bold text-xl mb-1">{selectedBadge.name}</h3>
              <p className="text-[#8E8E93] text-sm mb-4">{selectedBadge.description}</p>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="w-full h-2.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: selectedBadge.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedBadge.progress}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
              <p className="text-xs text-[#6E6E73]">{selectedBadge.requirement}</p>

              {selectedBadge.earned && (
                <div className="mt-4 py-2 px-4 rounded-full bg-[#30D158]/15 inline-block">
                  <p className="text-[#30D158] text-sm font-semibold">Earned!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
