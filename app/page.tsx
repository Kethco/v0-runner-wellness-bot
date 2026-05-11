"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Flame, Play, Target, Brain, User, TrendingUp, Moon, Battery, Heart, Gauge, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import useSWR from "swr";
import Link from "next/link";
import { CheckInModal } from "@/components/dashboard/checkin-modal";
import { LogRunModal } from "@/components/dashboard/log-run-modal";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export default function Dashboard() {
  const { user } = useAuth();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  
  const { data: checkinsData, mutate: mutateCheckins } = useSWR("/api/checkins?limit=7", fetcher);
  const { data: runsData, mutate: mutateRuns } = useSWR("/api/runs?days=7", fetcher);
  const { data: profileData } = useSWR("/api/profile", fetcher);
  const { data: aiAdvice } = useSWR("/api/ai-advice", fetcher);
  
  const todayStr = new Date().toISOString().split("T")[0];
  const runs = runsData?.runs || [];
  const checkins = checkinsData?.checkins || [];
  const hasCheckedInToday = checkins.some((c: { date: string }) => c.date === todayStr);
  const todayCheckin = checkins.find((c: { date: string }) => c.date === todayStr);
  const profile = profileData?.profile;
  
  const weeklyMiles = runs.reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);
  const weeklyGoal = profile?.weekly_goal || 25;
  const progressPercent = Math.min((weeklyMiles / weeklyGoal) * 100, 100);
  const currentStreak = profile?.current_streak || checkins.length;

  const userName = profile?.first_name || user?.user_metadata?.first_name || "Runner";
  const greeting = getGreeting();

  // Chart data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const chartData = last7Days.map(date => {
    const dayRuns = runs.filter((r: { date: string }) => r.date === date);
    const miles = dayRuns.reduce((sum: number, r: { miles: number }) => sum + (r.miles || 0), 0);
    return { date, miles, day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0) };
  });

  const maxMiles = Math.max(...chartData.map(d => d.miles), 1);

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#2A2A2A]">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#8E8E93] text-sm font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">{userName}</h1>
          </div>
          
          {/* Streak Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#FF4500] to-[#FF6B00] px-4 py-2.5 rounded-full shadow-lg shadow-[#FF4500]/30"
          >
            <Flame className="w-5 h-5 text-white" />
            <span className="text-white font-black text-lg">{currentStreak}</span>
          </motion.div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6">
        {/* Hero Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1C1E] to-[#0D0D0D] p-6 border border-[#2A2A2A]"
        >
          {/* Glow effect */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FF4500] rounded-full blur-[100px] opacity-40" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[#8E8E93] text-sm font-semibold uppercase tracking-wider">This Week</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-6xl font-black text-white"
                  >
                    {weeklyMiles.toFixed(1)}
                  </motion.span>
                  <span className="text-[#8E8E93] text-xl font-semibold">/ {weeklyGoal} mi</span>
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
                  <span className="text-2xl font-black text-white">{Math.round(progressPercent)}%</span>
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
                  <span className={`text-xs font-bold ${day.date === todayStr ? "text-[#FF4500]" : "text-[#636366]"}`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <LogRunModal onRunLogged={() => mutateRuns()}>
            <motion.button
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
              <p className={`text-sm font-medium ${hasCheckedInToday ? "text-[#8E8E93]" : "text-white/80"}`}>
                {hasCheckedInToday ? "All set today" : "Daily wellness"}
              </p>
            </div>
          </motion.button>
        </div>

        {/* Wellness Metrics */}
        {todayCheckin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#1C1C1E] border border-[#2A2A2A] p-5"
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
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-[#1C1C1E] border border-[#2A2A2A] p-5"
        >
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#00D4FF] rounded-full blur-[80px] opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0099CC] flex items-center justify-center shadow-lg shadow-[#00D4FF]/30">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AI Coach</h3>
                <p className="text-[#8E8E93] text-sm font-medium">Your personal advisor</p>
              </div>
            </div>
            
            <p className="text-[#E5E5EA] text-base leading-relaxed line-clamp-2">
              {aiAdvice?.advice || "Complete your daily check-in to receive personalized training insights."}
            </p>
            
            <Link href="/coach">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-2 text-[#00D4FF] font-semibold text-sm mt-4"
              >
                Get full advice
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Runs */}
        {runs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                  className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2A2A2A] hover:border-[#3A3A3C] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRunStyles(run.run_type).bg}`}>
                      <Zap className={`w-6 h-6 ${getRunStyles(run.run_type).text}`} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{run.miles} mi</p>
                      <p className="text-[#8E8E93] text-sm font-medium capitalize">{run.run_type || "Run"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{run.pace || "--"}</p>
                    <p className="text-[#636366] text-sm">
                      {new Date(run.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation - High Visibility */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D] border-t-2 border-[#2A2A2A]">
        <div className="flex items-center justify-around py-4 px-6 max-w-lg mx-auto">
          <NavButton icon={Activity} label="Home" href="/" active />
          <NavButton icon={TrendingUp} label="Runs" href="/runs" />
          <NavButton icon={Target} label="Goals" href="/goals" />
          <NavButton icon={User} label="Profile" href="/profile" />
        </div>
        {/* Safe area for notched phones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

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
    </div>
  );
}

function MetricOrb({ icon: Icon, label, value, color }: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center gap-2"
    >
      <div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 20px ${color}30` }}
        />
      </div>
      <p className="text-white font-bold text-xl">{value}</p>
      <p className="text-[#8E8E93] text-xs font-semibold uppercase">{label}</p>
    </motion.div>
  );
}

function NavButton({ icon: Icon, label, href, active }: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div 
        whileTap={{ scale: 0.9 }}
        className={`flex flex-col items-center gap-1.5 px-5 py-2 rounded-2xl transition-all ${
          active ? "bg-[#FF4500]/20" : ""
        }`}
      >
        <Icon className={`w-7 h-7 ${active ? "text-[#FF4500]" : "text-[#636366]"}`} />
        <span className={`text-xs font-bold ${active ? "text-[#FF4500]" : "text-[#636366]"}`}>
          {label}
        </span>
      </motion.div>
    </Link>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
