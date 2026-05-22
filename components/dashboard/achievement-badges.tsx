"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Moon, Zap, Target, Star, Mountain, Clock, Heart, Shield, X, Sparkles, Share2 } from "lucide-react";
import useSWR from "swr";
import { useShareCard } from "@/hooks/use-share-card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

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
  progress: number;
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
  const { user } = useAuth();
  const { data: runsData } = useSWR(user ? "/api/runs?days=365" : null);
  const { data: streakData } = useSWR(user ? "/api/streak" : null);
  const { data: checkinsData } = useSWR(user ? "/api/checkins?limit=365" : null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { shareToSocial } = useShareCard();

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
  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);
  const earnedCount = earnedBadges.length;

  // Trigger confetti when badge is selected and earned
  useEffect(() => {
    if (selectedBadge?.earned) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedBadge]);

  return (
    <>
      <div className="glass-card-premium overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center border border-amber-500/20">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Achievements</h3>
                <p className="text-[12px] text-white/60">
                  <span className="text-amber-400 font-semibold">{earnedCount}</span> of {badges.length} unlocked
                </p>
              </div>
            </div>
            
            {/* Progress ring */}
            <div className="relative w-11 h-11">
              <svg className="w-11 h-11 -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <motion.circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 113" }}
                  animate={{ strokeDasharray: `${(earnedCount / badges.length) * 113} 113` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-amber-400">{Math.round((earnedCount / badges.length) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Earned badges section */}
        {earnedBadges.length > 0 && (
          <div className="p-4 border-b border-white/[0.04]">
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-[0.12em] mb-3">
              Unlocked
            </p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="relative group/badge transition-transform duration-200 hover:scale-105"
                >
                  {/* Hover glow */}
                  <div 
                    className="absolute inset-0 rounded-xl blur-md opacity-0 group-hover/badge:opacity-40 transition-opacity duration-200"
                    style={{ backgroundColor: badge.color }}
                  />
                  
                  <div 
                    className="relative w-11 h-11 rounded-xl flex items-center justify-center border-2"
                    style={{
                      backgroundColor: `${badge.color}20`,
                      borderColor: `${badge.color}60`,
                    }}
                  >
                    <badge.icon className="w-5 h-5" style={{ color: badge.color }} />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    <span className="text-[9px] bg-[#1A1A1A] px-2 py-0.5 rounded text-white/80 border border-white/10">{badge.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unearned badges section */}
        {unearnedBadges.length > 0 && (
          <div className="p-4">
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.12em] mb-3">In Progress</p>
            <div className="flex flex-wrap gap-2">
              {unearnedBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="relative group/badge transition-transform duration-200 hover:scale-105"
                >
                  <div 
                    className="relative w-9 h-9 rounded-lg flex items-center justify-center border-2 border-white/20 bg-white/[0.08]"
                  >
                    <badge.icon className="w-4 h-4 text-white/50" />
                    
                    {/* Background ring track */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="16" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="2.5" 
                      />
                    </svg>
                    
                    {/* Progress ring */}
                    {badge.progress > 0 && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke={badge.color}
                          strokeWidth="2.5" 
                          strokeLinecap="round"
                          strokeDasharray={`${badge.progress * 1.01} 101`}
                          opacity={0.8}
                        />
                      </svg>
                    )}
                  </div>
                  
                  {/* Progress label */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                    <span className="text-[8px] text-white/50">{Math.round(badge.progress)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedBadge(null)}
          >
            {/* Confetti for earned badges */}
            {showConfetti && selectedBadge.earned && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(50)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ["#FFD700", "#FF6B00", "#30D158", "#FF453A", "#5E5CE6"][i % 5],
                      left: `${Math.random() * 100}%`,
                    }}
                    initial={{ y: -20, opacity: 1, scale: 1 }}
                    animate={{
                      y: window.innerHeight + 20,
                      opacity: [1, 1, 0],
                      rotate: Math.random() * 720,
                      x: Math.random() * 200 - 100,
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      delay: Math.random() * 0.5,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
            )}

            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-b from-[#1C1C1E] to-[#0A0A0A] border-2 rounded-3xl p-8 w-full max-w-sm text-center overflow-hidden"
              style={{
                borderColor: selectedBadge.earned ? selectedBadge.color : "#2A2A2A",
                boxShadow: selectedBadge.earned ? `0 0 60px ${selectedBadge.color}30` : "none",
              }}
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedBadge(null)} 
                className="absolute top-4 right-4 text-[#6E6E73] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Badge icon */}
              <motion.div
                className="relative w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  backgroundColor: selectedBadge.earned ? `${selectedBadge.color}30` : "#1A1A1A",
                  borderWidth: 3,
                  borderColor: selectedBadge.earned ? selectedBadge.color : "#2A2A2A",
                  boxShadow: selectedBadge.earned ? `0 0 40px ${selectedBadge.color}50` : "none",
                }}
                animate={selectedBadge.earned ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 40px ${selectedBadge.color}50`,
                    `0 0 60px ${selectedBadge.color}70`,
                    `0 0 40px ${selectedBadge.color}50`,
                  ],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <selectedBadge.icon 
                  className="w-12 h-12" 
                  style={{ color: selectedBadge.earned ? selectedBadge.color : "#4A4A4A" }} 
                />
                
                {/* Sparkle ring for earned */}
                {selectedBadge.earned && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2"
                    style={{ borderColor: selectedBadge.color }}
                    animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Badge name with gradient for earned */}
              <motion.h3 
                className="font-black text-2xl mb-2"
                style={{
                  color: selectedBadge.earned ? selectedBadge.color : "#8E8E93",
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {selectedBadge.name}
              </motion.h3>
              
              <motion.p 
                className="text-[#8E8E93] mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {selectedBadge.description}
              </motion.p>

              {/* Progress bar */}
              <motion.div 
                className="mb-4"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-full h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full relative"
                    style={{ backgroundColor: selectedBadge.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedBadge.progress}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  >
                    {/* Shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 1.5, delay: 1, repeat: Infinity, repeatDelay: 2 }}
                    />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.p 
                className="text-sm text-[#6E6E73]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {selectedBadge.requirement}
              </motion.p>

              {/* Earned badge */}
              {selectedBadge.earned && (
                <motion.div 
                  className="mt-6 flex flex-col items-center gap-3"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.7 }}
                >
                  <div 
                    className="inline-flex items-center gap-2 py-3 px-6 rounded-full font-bold"
                    style={{ 
                      backgroundColor: `${selectedBadge.color}20`,
                      color: selectedBadge.color,
                    }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Star className="w-5 h-5" />
                    </motion.span>
                    UNLOCKED!
                  </div>
                  
                  {/* Share button for earned badges */}
                  <Button
                    onClick={async () => {
                      const success = await shareToSocial({
                        type: "achievement",
                        title: selectedBadge.name,
                        subtitle: selectedBadge.description,
                      });
                      if (success) {
                        toast({
                          title: "Shared!",
                          description: "Your achievement has been shared",
                        });
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-[#3A3A3A] hover:bg-[#2A2A2A] text-white/70 gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Achievement
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </>
  );
}
