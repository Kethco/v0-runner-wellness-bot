"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Flame, Play, Target, Brain, User, TrendingUp, Moon, Battery, Heart, Gauge, ChevronRight, Zap, Sparkles, Edit2, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import useSWR from "swr";
import Link from "next/link";
import { CheckInModal } from "@/components/dashboard/checkin-modal";
import { LogRunModal } from "@/components/dashboard/log-run-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomNav } from "@/components/bottom-nav";
import { celebrateMilestone, checkMilestone, celebrateStreakMilestone, checkStreakMilestone } from "@/lib/celebrations";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";
import { TrialCountdown } from "@/components/trial-expired-blocker";
import { LEDTicker } from "@/components/led-ticker";
import { ReadinessScore } from "@/components/dashboard/readiness-score";
import { RecoveryCard } from "@/components/dashboard/recovery-card";
import { GentleReminder } from "@/components/dashboard/gentle-reminder";
import { Onboarding } from "@/components/onboarding";
import { WeeklySummary } from "@/components/dashboard/weekly-summary";
import { AchievementBadges } from "@/components/dashboard/achievement-badges";
import { DashboardSkeleton } from "@/components/skeletons";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState("");
  const [localGoal, setLocalGoal] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [greeting, setGreeting] = useState({ text: "Welcome", gradient: "from-[#FF6B00] via-[#FF4500] to-[#FF2D00]" });
  
  // Compute dates directly (not in state to avoid hydration issues)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  
  // Data fetching hooks
  const { data: checkinsData, mutate: mutateCheckins } = useSWR(user ? "/api/checkins?limit=7" : null, fetcher);
  const { data: runsData, mutate: mutateRuns } = useSWR(user ? "/api/runs?days=7" : null, fetcher);
  const { data: profileData, mutate: mutateProfile } = useSWR(user ? "/api/profile" : null, fetcher);
  const { data: aiAdvice } = useSWR(user ? "/api/ai-advice" : null, fetcher);
  const { data: streakData, mutate: mutateStreak } = useSWR(user ? "/api/streak" : null, fetcher);
  
  // Ref for milestone tracking
  const prevProgressRef = useRef<number>(0);
  const prevStreakRef = useRef<number>(0);
  
  // Redirect to login if not authenticated, or to coach dashboard if coach
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    
    // Redirect coaches to coach dashboard
    if (user) {
      const userType = user.user_metadata?.user_type || user.user_metadata?.role;
      if (userType === "coach") {
        router.push("/coach");
      }
    }
  }, [authLoading, user, router]);
  
  // Set greeting on client
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);
  
  // Derived state (safe to compute after hooks)
  const runs = runsData?.runs || [];
  const checkins = checkinsData?.checkins || [];
  const profile = profileData?.profile;
  const hasCheckedInToday = checkins.some((c: { date: string }) => c.date === todayStr);
  const todayCheckin = checkins.find((c: { date: string }) => c.date === todayStr);
  const weeklyMiles = runs.reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);
  const weeklyGoal = localGoal || profile?.weekly_goal || 25;
  const progressPercent = Math.min((weeklyMiles / weeklyGoal) * 100, 100);
  const currentStreak = streakData?.streak?.current_streak || 0;

  // Show onboarding for new users (no check-ins and no runs)
  useEffect(() => {
    if (profile && !profile.onboarded && checkins.length === 0 && runs.length === 0) {
      setShowOnboarding(true);
    }
  }, [profile, checkins.length, runs.length]);

  // Check for streak milestone celebrations
  useEffect(() => {
    if (currentStreak > 0 && prevStreakRef.current > 0 && currentStreak > prevStreakRef.current) {
      const milestone = checkStreakMilestone(prevStreakRef.current, currentStreak);
      if (milestone) {
        celebrateStreakMilestone(milestone);
      }
    }
    prevStreakRef.current = currentStreak;
  }, [currentStreak]);
  
  // Check if on trial
  const plan = user?.user_metadata?.plan;
  const isOnTrial = plan === "free_trial" || plan === "coach_trial";
  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const trialDaysLeft = createdAt ? Math.ceil((new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 7;
  const showTrialBanner = isOnTrial && trialDaysLeft <= 4 && trialDaysLeft > 0;
  
  // Milestone detection effect
  useEffect(() => {
    if (prevProgressRef.current > 0 || progressPercent === 0) {
      const milestone = checkMilestone(prevProgressRef.current, progressPercent);
      if (milestone) {
        setTimeout(() => celebrateMilestone(milestone), 500);
      }
    }
    prevProgressRef.current = progressPercent;
  }, [progressPercent]);
  
  const userName = profile?.first_name || user?.user_metadata?.first_name || "Runner";
  
  // Show loading state while checking auth or redirecting
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardSkeleton />
      </div>
    );
  }

  // Chart data for last 7 days
  const chartData = last7Days.map(dateStr => {
    // Normalize run dates to YYYY-MM-DD format for comparison
    const dayRuns = runs.filter((r: { date: string }) => {
      const runDate = r.date?.split('T')[0]; // Handle both "2024-01-15" and "2024-01-15T00:00:00" formats
      return runDate === dateStr;
    });
    const miles = dayRuns.reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayLabel = localDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return { date: dateStr, miles, day: dayLabel };
  });

  const maxMiles = Math.max(...chartData.map(d => d.miles), 1);

return (
  <div className={`min-h-screen bg-black text-white pb-20 ${showTrialBanner ? "pt-10" : ""}`}>
      {/* Onboarding for new users */}
      {showOnboarding && (
        <Onboarding 
          userName={userName} 
          onComplete={() => {
            setShowOnboarding(false);
            mutateProfile();
          }} 
        />
      )}

      {/* Premium Header with Glassmorphism */}
      <header className="fixed-header-safe z-50">
        {/* Gradient border line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF4500]/50 to-transparent" />
        
        {/* Main header content */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FF6B00] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#1A1A1A] flex items-center justify-center">
                  <span className="text-lg font-bold bg-gradient-to-br from-[#FF4500] to-[#FFD700] bg-clip-text text-transparent">
                    {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#30D158] rounded-full border-2 border-black" />
            </div>
            
            {/* Greeting with shimmer effect */}
            <div className="flex-1 min-w-0">
              <motion.p 
                className="text-sm font-semibold bg-gradient-to-r from-[#FF6B00] via-[#FFD700] to-[#FF6B00] bg-clip-text text-transparent bg-[length:200%_100%]"
                animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                {greeting.text}
              </motion.p>
              <h1 className="text-lg font-bold text-white tracking-tight truncate">{userName}</h1>
            </div>
            
            {/* Right side badges */}
            <div className="flex items-center gap-2">
              {/* Trial Countdown */}
              <TrialCountdown />
              
              {/* Streak Badge - Premium version */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-1.5 bg-gradient-to-r from-[#FF4500] to-[#FF6B00] px-3 py-1.5 rounded-full shadow-lg shadow-[#FF4500]/30"
              >
                {/* Subtle pulse behind */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF6B00]"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="relative"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <Flame className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,200,0,0.8)]" />
                </motion.div>
                <span className="relative text-white font-black text-base">{currentStreak}</span>
              </motion.div>
            </div>
          </div>
          
          {/* Quick stats row */}
          <div className="flex items-center gap-4 mt-2 ml-[60px]">
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3 h-3 text-[#30D158]" />
              <span className="text-[#8E8E93]">{weeklyMiles.toFixed(1)} mi this week</span>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Zap className="w-3 h-3 text-[#FFD700]" />
                <span className="text-[#8E8E93]">{currentStreak} day streak</span>
              </div>
            )}
          </div>
        </div>
        
        {/* LED Stadium Ticker */}
        <LEDTicker 
          streak={currentStreak} 
          weeklyMiles={weeklyMiles} 
          userName={userName} 
        />
      </header>

      <main className="px-5 py-6 space-y-6 mt-[165px]">
        {/* Hero Stats Card with Animated Border */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="goal-card-border relative overflow-hidden p-6"
        >
          {/* Inner glow effect */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FF4500] rounded-full blur-[100px] opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[#AEAEB2] text-sm font-semibold uppercase tracking-wider">This Week</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-6xl font-black text-white"
                  >
                    {weeklyMiles.toFixed(1)}
                  </motion.span>
                  <button 
                    onClick={() => { setNewGoalValue(String(weeklyGoal)); setShowGoalModal(true); }}
                    className="text-[#AEAEB2] text-xl font-semibold hover:text-[#FF4500] transition-colors flex items-center gap-1"
                  >
                    / {weeklyGoal} mi
                    <Edit2 className="w-3 h-3 opacity-50" />
                  </button>
                </div>
              </div>
              
              {/* Progress Ring */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#2A2A2A" strokeWidth="10" fill="none" />
                  <motion.circle
                    cx="50" cy="50" r="40"
                    stroke="url(#gradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 251" }}
                    animate={{ strokeDasharray: `${progressPercent * 2.51} 251` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF4500" />
                      <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span 
                    className="text-2xl font-black text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <CountUp target={Math.round(progressPercent)} />%
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Weekly Bar Chart */}
            <div className="flex items-end justify-between gap-2 mt-2">
              {chartData.map((day) => {
                const isToday = day.date === todayStr;
                // Calculate bar height in pixels (max 80px)
                const barHeightPx = day.miles > 0 ? Math.max((day.miles / maxMiles) * 80, 8) : 4;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    {/* Miles label above bar */}
                    <span
                      className={`text-[10px] font-bold mb-1 ${
                        isToday ? "text-[#FF6B00]" : "text-[#8E8E93]"
                      }`}
                    >
                      {day.miles > 0 ? day.miles.toFixed(1) : "0"}
                    </span>
                    
                    {/* Bar */}
                    <div className="w-full h-20 flex items-end justify-center">
                      <div
                        style={{ height: `${barHeightPx}px` }}
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                          isToday 
                            ? "bg-gradient-to-t from-[#FF4500] to-[#FF6B00] shadow-lg shadow-[#FF4500]/40" 
                            : "bg-[#FF4500]/60"
                        }`}
                      />
                    </div>
                    
                    {/* Day label */}
                    <span className={`text-[9px] font-bold mt-1.5 ${
                      isToday ? "text-[#FF6B00]" : "text-[#AEAEB2]"
                    }`}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4"
        >
          <LogRunModal onRunLogged={() => mutateRuns()}>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#FF4500] to-[#FF6B00] shadow-xl shadow-[#FF4500]/40"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Play className="w-7 h-7 text-white fill-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-xl">Log Run</p>
                <p className="text-white/80 text-sm font-medium">Record activity</p>
              </div>
            </motion.button>
          </LogRunModal>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              hapticLight();
              if (hasCheckedInToday) {
                toast({
                  title: "Already checked in!",
                  description: "You've already completed your wellness check-in today. Come back tomorrow!",
                });
              } else {
                setShowCheckinModal(true);
              }
            }}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl shadow-xl transition-all ${
              hasCheckedInToday 
                ? "bg-[#1C1C1E] border-2 border-[#30D158] shadow-[#30D158]/20" 
                : "bg-gradient-to-br from-[#30D158] to-[#34C759] shadow-[#30D158]/40"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              hasCheckedInToday ? "bg-[#30D158]/20" : "bg-white/20 backdrop-blur"
            }`}>
              <Activity className={`w-7 h-7 ${hasCheckedInToday ? "text-[#30D158]" : "text-white"}`} />
            </div>
            <div className="text-left">
              <p className={`font-bold text-xl ${hasCheckedInToday ? "text-[#30D158]" : "text-white"}`}>
                {hasCheckedInToday ? "Done!" : "Check In"}
              </p>
              <p className={`text-sm font-medium ${hasCheckedInToday ? "text-[#AEAEB2]" : "text-white/80"}`}>
                {hasCheckedInToday ? "All set today" : "Daily wellness"}
              </p>
            </div>
          </motion.button>
        </motion.div>

        {/* Gentle Reminder (shows when needed) */}
        <GentleReminder />

        {/* Readiness Score Card */}
        <ReadinessScore />

        {/* Recovery Card (shows when readiness is low) */}
        <RecoveryCard />

        {/* Weekly Wellness Summary (shows Sun/Mon) */}
        <WeeklySummary />

        {/* Achievement Badges */}
        <AchievementBadges />

        {/* Wellness Metrics */}
        {todayCheckin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            className="rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Today&apos;s Wellness</h3>
              <span className="text-[#30D158] text-sm font-semibold px-3 py-1 bg-[#30D158]/10 rounded-full">Logged</span>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <MetricOrb icon={Moon} label="Sleep" value={todayCheckin.sleep_rating} color="#BF5AF2" />
              <MetricOrb icon={Battery} label="Energy" value={todayCheckin.energy} color="#30D158" />
              <MetricOrb icon={Heart} label="Sore" value={todayCheckin.soreness} color="#FF9F0A" />
              <MetricOrb icon={Gauge} label="Ready" value={todayCheckin.readiness} color="#00D4FF" />
            </div>
          </motion.div>
        )}

        {/* AI Coach Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="relative overflow-hidden rounded-2xl bg-[#141414] border border-[#2A2A2A] p-5"
        >
          {/* Gradient accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF4500] via-[#00D4FF] to-[#AF52DE]" />
          
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#FF4500]/10 to-[#00D4FF]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              {/* Pulsing Brain Icon */}
              <div className="relative w-12 h-12">
                {/* Pulsing glow rings */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#00D4FF] opacity-20"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.1, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#00D4FF] opacity-10"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.05, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />
                
                {/* Main brain container */}
                <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-[#FF4500] to-[#00D4FF] flex items-center justify-center overflow-hidden shadow-lg shadow-[#FF4500]/20">
                  {/* Neural connection dots */}
                  <motion.div
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{ top: '20%', left: '25%' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{ top: '35%', right: '20%' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.div
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{ bottom: '30%', left: '30%' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  />
                  <motion.div
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{ bottom: '25%', right: '25%' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
                  />
                  
                  <Brain className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  AI Coach
                  <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                </h3>
                <p className="text-[#6E6E73] text-sm">Your personalized guidance companion</p>
              </div>
            </div>
            
            <ExpandableAdvice advice={aiAdvice?.advice} />
          </div>
        </motion.div>

        {/* Recent Runs */}
        {runs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Recent Runs</h3>
              <Link href="/runs">
                <motion.div whileHover={{ x: 4 }} className="flex items-center gap-1 text-[#FF4500] font-semibold text-sm">
                  View all <ChevronRight className="w-4 h-4" />
                </motion.div>
              </Link>
            </div>
            
            <div className="space-y-3">
              {runs.slice(0, 3).map((run: { id: string; miles: number; date: string; run_type: string; pace?: string }, i: number) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#3A3A3C] hover:border-[#3A3A3C] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRunStyles(run.run_type).bg}`}>
                      <Zap className={`w-6 h-6 ${getRunStyles(run.run_type).text}`} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{run.miles} mi</p>
                      <p className="text-[#AEAEB2] text-sm font-medium capitalize">{run.run_type || "Run"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{run.pace || "--"}</p>
                    <p className="text-[#8E8E93] text-sm">
                      {new Date(run.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Check-in Modal */}
      {showCheckinModal && (
        <CheckInModal 
          isOpen={showCheckinModal} 
onClose={() => {
      setShowCheckinModal(false);
      mutateCheckins();
      mutateStreak();
      }}
        />
      )}

      {/* Weekly Goal Modal */}
      <Dialog open={showGoalModal} onOpenChange={setShowGoalModal}>
        <DialogContent className="bg-[#1C1C1E] border-[#3A3A3C] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Set Weekly Goal</DialogTitle>
            <DialogDescription className="text-[#AEAEB2]">
              How many miles do you want to run each week?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-3 my-4">
            <input
              type="number"
              value={newGoalValue}
              onChange={(e) => setNewGoalValue(e.target.value)}
              placeholder="25"
              className="flex-1 bg-[#2C2C2E] border border-[#3A3A3C] rounded-xl px-4 py-3 text-white text-2xl font-bold text-center focus:outline-none focus:border-[#FF4500]"
              min="1"
              max="200"
            />
            <span className="text-[#AEAEB2] text-lg font-semibold">miles</span>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGoalModal(false)}
              className="flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white hover:bg-[#3A3A3C]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const goal = parseInt(newGoalValue);
                if (goal > 0 && goal <= 200) {
                  // Always save locally first for immediate feedback
                  setLocalGoal(goal);
                  setShowGoalModal(false);
                  
                  // Then try to save to server
                  try {
                    const res = await fetch("/api/profile", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ weekly_goal: goal })
                    });
                    if (res.ok) {
                      await mutateProfile();
                    }
                  } catch (err) {
                    // Silent fail - local state already updated
                  }
                }
              }}
              className="flex-1 bg-gradient-to-r from-[#FF4500] to-[#FF6B00] text-white hover:opacity-90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
</Dialog>
  </div>
  );
}

function ExpandableAdvice({ advice }: { advice?: string }) {
  const [expanded, setExpanded] = useState(false);
  const defaultText = "Complete your daily check-in to receive personalized training insights.";
  const displayText = advice || defaultText;
  
  return (
    <div>
      <p className={`text-[#E5E5EA] text-base leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
        {displayText}
      </p>
      
      {advice && advice.length > 100 && (
        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-[#00D4FF] font-semibold text-sm mt-4"
        >
          {expanded ? "Show less" : "Get full advice"}
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </motion.button>
      )}
    </div>
  );
}

function MetricOrb({ icon: Icon, label, value, color, maxValue = 5 }: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  maxValue?: number;
}) {
  const percent = (value / maxValue) * 100;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center gap-1"
    >
      {/* Circular progress with icon */}
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} stroke="#2A2A2A" strokeWidth="5" fill="none" />
          <motion.circle
            cx="32" cy="32" r={radius}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${(percent / 100) * circumference} ${circumference}` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      
      {/* Value with scale */}
      <div className="text-center">
        <p className="text-white font-bold text-lg leading-tight">{value}<span className="text-[#8E8E93] text-xs font-medium">/{maxValue}</span></p>
        <p className="text-[#AEAEB2] text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
    </motion.div>
  );
}

function CountUp({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (target === 0) return;
    
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    const stepDuration = duration / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [target]);
  
  return <>{count}</>;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: "Good morning", gradient: "from-[#FFD700] via-[#FFA500] to-[#FF8C00]" };
  }
  if (hour >= 12 && hour < 17) {
    return { text: "Good afternoon", gradient: "from-[#FF6B00] via-[#FF4500] to-[#FF2D00]" };
  }
  if (hour >= 17 && hour < 21) {
    return { text: "Good evening", gradient: "from-[#AF52DE] via-[#BF5AF2] to-[#FF2D55]" };
  }
  return { text: "Good night", gradient: "from-[#0A84FF] via-[#00D4FF] to-[#5AC8FA]" };
}

function getRunStyles(type: string) {
  switch (type?.toLowerCase()) {
    case "easy": return { bg: "bg-[#30D158]/20", text: "text-[#30D158]" };
    case "tempo": return { bg: "bg-[#FF9F0A]/20", text: "text-[#FF9F0A]" };
    case "interval": return { bg: "bg-[#FF453A]/20", text: "text-[#FF453A]" };
    case "long": return { bg: "bg-[#BF5AF2]/20", text: "text-[#BF5AF2]" };
    case "race": return { bg: "bg-[#FF4500]/20", text: "text-[#FF4500]" };
    default: return { bg: "bg-[#00D4FF]/20", text: "text-[#00D4FF]" };
  }
}
