"use client";

import { useEffect, useState } from "react";
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export default function Dashboard() {
  const { user } = useAuth();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState("");
  const [localGoal, setLocalGoal] = useState<number | null>(null);
  
  // Check if on trial (to adjust for fixed banner)
  const plan = user?.user_metadata?.plan;
  const isOnTrial = plan === "free_trial" || plan === "coach_trial";
  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const trialDaysLeft = createdAt ? Math.ceil((new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 7;
  const showTrialBanner = isOnTrial && trialDaysLeft <= 4 && trialDaysLeft > 0;
  
  const { data: checkinsData, mutate: mutateCheckins } = useSWR("/api/checkins?limit=7", fetcher);
  const { data: runsData, mutate: mutateRuns } = useSWR("/api/runs?days=7", fetcher);
  const { data: profileData, mutate: mutateProfile } = useSWR("/api/profile", fetcher);
  const { data: aiAdvice } = useSWR("/api/ai-advice", fetcher);
  
  // Use local timezone for today's date
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const runs = runsData?.runs || [];
  const checkins = checkinsData?.checkins || [];
  const hasCheckedInToday = checkins.some((c: { date: string }) => c.date === todayStr);
  const todayCheckin = checkins.find((c: { date: string }) => c.date === todayStr);
  const profile = profileData?.profile;
  
  const weeklyMiles = runs.reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);
  const weeklyGoal = localGoal || profile?.weekly_goal || 25;
  const progressPercent = Math.min((weeklyMiles / weeklyGoal) * 100, 100);
  const currentStreak = profile?.current_streak || checkins.length;

  const userName = profile?.first_name || user?.user_metadata?.first_name || "Runner";
  const greeting = getGreeting();

  // Chart data for last 7 days using local timezone
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });

  const chartData = last7Days.map(dateStr => {
    const dayRuns = runs.filter((r: { date: string }) => r.date === dateStr);
    const miles = dayRuns.reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return { date: dateStr, miles, day: localDate.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0) };
  });

  const maxMiles = Math.max(...chartData.map(d => d.miles), 1);

return (
  <div className={`min-h-screen bg-black text-white pb-28 ${showTrialBanner ? "pt-10" : ""}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#3A3A3C]">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className={`text-sm font-bold bg-gradient-to-r ${greeting.gradient} bg-clip-text text-transparent`}>{greeting.text}</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">{userName}</h1>
          </div>
          
          {/* Streak Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#FF4500] to-[#FF6B00] px-4 py-2.5 rounded-full shadow-lg shadow-[#FF4500]/30"
          >
            <motion.div
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
            <span className="text-white font-black text-lg">{currentStreak}</span>
          </motion.div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6">
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

            {/* Mini Bar Chart */}
            <div className="flex items-end justify-between h-16 gap-2">
              {chartData.map((day, i) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: day.miles > 0 ? `${(day.miles / maxMiles) * 100}%` : '4px' }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                    className={`w-full rounded-full min-h-[4px] ${
                      day.date === todayStr 
                        ? "bg-gradient-to-t from-[#FF4500] to-[#FFD700] shadow-lg shadow-[#FF4500]/50" 
                        : day.miles > 0 
                          ? "bg-[#3A3A3C]" 
                          : "bg-[#2A2A2A]"
                    }`}
                  />
                  <span className={`text-xs font-bold ${day.date === todayStr ? "text-[#FF4500]" : "text-[#8E8E93]"}`}>
                    {day.day}
                  </span>
                </div>
              ))}
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
            onClick={() => !hasCheckedInToday && setShowCheckinModal(true)}
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
          className="relative overflow-hidden rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-5"
        >
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#00D4FF] rounded-full blur-[80px] opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0099CC] flex items-center justify-center shadow-lg shadow-[#00D4FF]/30">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AI Coach</h3>
                <p className="text-[#AEAEB2] text-sm font-medium">Your personal advisor</p>
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
