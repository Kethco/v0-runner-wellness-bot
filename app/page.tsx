"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Flame, Play, Target, Brain, User, TrendingUp, Moon, Battery, Heart, Gauge, ChevronRight, Zap, Sparkles, Check, X } from "lucide-react";
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
import { PersonalRecordsCard } from "@/components/dashboard/personal-records";
import { UnifiedWeekCard } from "@/components/dashboard/unified-week-card";
import { CountingNumber } from "@/components/ui/animated-number";
import { RaceCountdown } from "@/components/dashboard/race-countdown";

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
  const { data: weekPlanData, mutate: mutateWeekPlan } = useSWR(user ? "/api/training-plan/week" : null, fetcher);
  
  // Get today's workout from the week plan
  const todayWorkout = weekPlanData?.todayWorkout;
  
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
      <div className="min-h-screen bg-background">
        <DashboardSkeleton />
      </div>
    );
  }

return (
  <div className={`min-h-screen bg-background text-foreground pb-20 ${showTrialBanner ? "pt-10" : ""}`}>
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

      {/* Premium Header */}
      <header className="fixed-header-safe z-50">
        {/* Gradient border line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF4500]/60 to-transparent" />
        
        {/* Main header content */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FF6B00] p-[2px]"
                style={{ boxShadow: '0 0 16px rgba(255,69,0,0.4)' }}
              >
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-base font-bold text-white">
                    {userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Online indicator */}
              <div 
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#30D158] rounded-full border-2 border-black"
                style={{ boxShadow: '0 0 8px rgba(48,209,88,0.5)' }}
              />
            </div>
            
            {/* Greeting */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-[#FF6B00] uppercase tracking-[0.2em] mb-0.5">
                {greeting.text}
              </p>
              <h1 className="text-xl font-black text-white tracking-tight truncate">{userName}</h1>
            </div>
            
            {/* Right side badges */}
            <div className="flex items-center gap-3">
              {/* Trial Countdown */}
              <TrialCountdown />
              
              {/* Streak Badge */}
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-1.5 bg-gradient-to-r from-[#FF4500] to-[#FF6B00] px-3 py-2 rounded-full"
                style={{ boxShadow: '0 0 20px rgba(255,69,0,0.4)' }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1, 1.15, 1],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Flame className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} />
                </motion.div>
                <span className="relative text-white font-bold text-sm">
                  <CountingNumber value={currentStreak} duration={1} />
                </span>
              </motion.div>
            </div>
          </div>
          
          {/* Quick stats row */}
          <div className="flex items-center gap-4 mt-3 ml-16">
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-[#30D158]" style={{ filter: 'drop-shadow(0 0 4px rgba(48,209,88,0.5))' }} />
              <span className="text-white/50 font-medium">
                <CountingNumber 
                  value={weekPlanData?.weekStats?.completedMiles ?? weeklyMiles} 
                  decimals={1} 
                  duration={1}
                  suffix=" mi this week"
                />
              </span>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-3.5 h-3.5 text-[#FFD700]" style={{ filter: 'drop-shadow(0 0 4px rgba(255,214,0,0.5))' }} />
                <span className="text-white/50 font-medium">
                  <CountingNumber value={currentStreak} duration={1} suffix=" day streak" />
                </span>
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

      <main className="px-5 py-6 space-y-6 mt-[175px]">
        {/* Unified This Week Card */}
        <UnifiedWeekCard 
          weeklyMiles={weeklyMiles} 
          weeklyGoal={weeklyGoal} 
          runsData={runs.map((r: { date: string; miles: number }) => ({ date: r.date, miles: r.miles }))}
        />

        {/* Race Countdown - Only shows when race is <= 30 days away */}
        <RaceCountdown />

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4"
        >
          <LogRunModal onRunLogged={() => { mutateRuns(); mutateWeekPlan(); }}>
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#FF4500] to-[#FF6B00] transition-all"
              style={{ boxShadow: '0 0 30px rgba(255,69,0,0.4)' }}
            >
              <div 
                className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
                style={{ boxShadow: 'inset 0 0 12px rgba(255,255,255,0.1)' }}
              >
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-lg">Log Run</p>
                <p className="text-white/60 text-xs font-medium">Record activity</p>
              </div>
            </motion.button>
          </LogRunModal>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02 }}
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
            className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all ${
              hasCheckedInToday 
                ? "bg-[#0D0D0D] border border-[#30D158]/40" 
                : "bg-gradient-to-br from-[#30D158] to-[#34C759]"
            }`}
            style={{ 
              boxShadow: hasCheckedInToday 
                ? '0 0 20px rgba(48,209,88,0.2)' 
                : '0 0 30px rgba(48,209,88,0.4)' 
            }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              hasCheckedInToday ? "bg-[#30D158]/20" : "bg-white/20"
            }`}>
              <Activity 
                className={`w-6 h-6 ${hasCheckedInToday ? "text-[#30D158]" : "text-white"}`}
                style={hasCheckedInToday ? { filter: 'drop-shadow(0 0 4px rgba(48,209,88,0.6))' } : {}}
              />
            </div>
            <div className="text-left">
              <p className={`font-bold text-lg ${hasCheckedInToday ? "text-[#30D158]" : "text-white"}`}>
                {hasCheckedInToday ? "Done!" : "Check In"}
              </p>
              <p className={`text-xs font-medium ${hasCheckedInToday ? "text-white/40" : "text-white/60"}`}>
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

        {/* Wellness Metrics */}
        {todayCheckin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            className="premium-card overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#30D158] to-transparent" />
            
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">Today&apos;s Wellness</h3>
                <span className="text-xs font-bold text-[#30D158] px-3 py-1.5 bg-[#30D158]/15 rounded-full border border-[#30D158]/30">
                  Logged
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                <MetricOrb icon={Moon} label="Sleep" value={todayCheckin.sleep_rating} color="#AF52DE" />
                <MetricOrb icon={Battery} label="Energy" value={todayCheckin.energy} color="#30D158" />
                <MetricOrb icon={Heart} label="Sore" value={todayCheckin.soreness} color="#FF6B6B" />
                <MetricOrb icon={Gauge} label="Ready" value={todayCheckin.readiness} color="#00D4FF" />
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Coach Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="premium-card relative overflow-hidden"
        >
          {/* Gradient accent line at top */}
          <div className="h-[2px] bg-gradient-to-r from-[#FF4500] via-[#00D4FF] to-[#AF52DE]" />
          
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#00D4FF]/15 to-[#AF52DE]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4 mb-4">
              {/* Pulsing Brain Icon */}
              <div className="relative w-12 h-12">
                {/* Pulsing glow rings */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#AF52DE] opacity-30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.15, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Main brain container */}
                <div 
                  className="relative w-full h-full rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#AF52DE] flex items-center justify-center overflow-hidden"
                  style={{ boxShadow: '0 0 24px rgba(0, 212, 255, 0.4)' }}
                >
                  <Brain className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} />
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  AI Coach
                  <Sparkles className="w-4 h-4 text-[#00D4FF]" style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.6))' }} />
                </h3>
                <p className="text-white/40 text-sm">Your personalized guidance</p>
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
            
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {runs.slice(0, 3).map((run: { id: string; miles: number; date: string; run_type: string; pace?: string }, i: number) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex-shrink-0 w-[140px] p-4 rounded-xl bg-[#0D0D0D] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div 
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${getRunStyles(run.run_type).bg}`}
                    style={{ boxShadow: `0 0 16px ${getRunStyles(run.run_type).glow || 'rgba(255,69,0,0.3)'}` }}
                  >
                    <Zap className={`w-5 h-5 ${getRunStyles(run.run_type).text}`} />
                  </div>
                  <p className="text-white font-bold text-lg">{run.miles} mi</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {new Date(run.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievement Badges */}
        <AchievementBadges />

        {/* Personal Records Card */}
        <PersonalRecordsCard />
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
          todayWorkout={todayWorkout}
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
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number;
  color: string;
  maxValue?: number;
}) {
  const percent = (value / maxValue) * 100;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center"
    >
      {/* Circular progress with icon inside */}
      <div className="relative w-[72px] h-[72px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
          <motion.circle
            cx="36" cy="36" r={radius}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        
        {/* Centered icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
      
      {/* Value below */}
      <div className="mt-2 text-center">
        <span className="text-xl font-bold text-white">{value}</span>
        <span className="text-sm text-[#8E8E93]">/{maxValue}</span>
      </div>
      
      {/* Label */}
      <p className="text-[10px] text-[#8E8E93] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
    </motion.div>
  );
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
  case "easy": return { bg: "bg-[#30D158]/20", text: "text-[#30D158]", glow: "rgba(48,209,88,0.3)" };
  case "tempo": return { bg: "bg-[#FF9F0A]/20", text: "text-[#FF9F0A]", glow: "rgba(255,159,10,0.3)" };
  case "interval": return { bg: "bg-[#FF453A]/20", text: "text-[#FF453A]", glow: "rgba(255,69,58,0.3)" };
  case "long": return { bg: "bg-[#BF5AF2]/20", text: "text-[#BF5AF2]", glow: "rgba(191,90,242,0.3)" };
  case "race": return { bg: "bg-[#FF4500]/20", text: "text-[#FF4500]", glow: "rgba(255,69,0,0.3)" };
  default: return { bg: "bg-[#00D4FF]/20", text: "text-[#00D4FF]", glow: "rgba(0,212,255,0.3)" };
  }
  }
