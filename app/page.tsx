"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Activity } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import useSWR from "swr";
import Link from "next/link";

// Import dashboard components
import { PremiumProgressRing } from "@/components/dashboard/premium-progress-ring";
import { AnimatedWeeklyChart } from "@/components/dashboard/animated-weekly-chart";
import { AITrainingCard } from "@/components/dashboard/ai-training-card";
import { WellnessOrbs } from "@/components/dashboard/wellness-orbs";
import { RecentRunsCarousel } from "@/components/dashboard/recent-runs-carousel";
import { CheckInCard } from "@/components/dashboard/checkin-card";
import { CheckInModal } from "@/components/dashboard/checkin-modal";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Hello");
  
  // Fetch data
  const { data: checkinsData } = useSWR("/api/checkins?limit=7", fetcher);
  const { data: runsData } = useSWR("/api/runs?days=7", fetcher);
  const { data: goalsData } = useSWR("/api/goals", fetcher);
  
  const todayStr = new Date().toISOString().split("T")[0];
  const hasCheckedInToday = checkinsData?.checkins?.some((c: { date: string }) => c.date === todayStr) ?? false;
  const todayCheckin = checkinsData?.checkins?.find((c: { date: string }) => c.date === todayStr);
  
  // Calculate streak
  const calculateStreak = () => {
    if (!checkinsData?.checkins?.length) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < checkinsData.checkins.length; i++) {
      const checkinDate = new Date(checkinsData.checkins[i].date);
      checkinDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (checkinDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  
  const currentStreak = calculateStreak();
  
  // Calculate weekly miles
  const weeklyMiles = runsData?.runs?.reduce((sum: number, run: { miles: number }) => sum + run.miles, 0) || 0;
  const goalMiles = goalsData?.goals?.[0]?.weekly_miles_target || 30;
  const progressPercent = Math.min((weeklyMiles / goalMiles) * 100, 100);
  
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);
  
  const userName = user?.user_metadata?.first_name || "Runner";
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF2D55]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#FF6B00]/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0A0A]/80 border-b border-white/5"
      >
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#FF6B00] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Runner Wellness</span>
          </Link>
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center relative"
            >
              <Bell className="w-4 h-4 text-white/70" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF2D55] rounded-full" />
            </motion.button>
            <Link href="/profile">
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#FF6B00] flex items-center justify-center text-xs font-bold"
              >
                {userInitials}
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-lg mx-auto px-4 py-6 space-y-6 relative z-10"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-white/50 text-sm uppercase tracking-widest mb-1">{greeting}</p>
          <h1 className="text-2xl font-bold">{userName}</h1>
        </motion.div>

        {/* Hero Progress Ring */}
        <motion.div variants={itemVariants}>
          <PremiumProgressRing 
            currentMiles={weeklyMiles}
            goalMiles={goalMiles}
            progressPercent={progressPercent}
            streak={currentStreak}
          />
        </motion.div>

        {/* Weekly Chart */}
        <motion.div variants={itemVariants}>
          <AnimatedWeeklyChart runs={runsData?.runs || []} />
        </motion.div>

        {/* AI Training Advice */}
        <motion.div variants={itemVariants}>
          <AITrainingCard />
        </motion.div>

        {/* Wellness Metrics Orbs */}
        <motion.div variants={itemVariants}>
          <WellnessOrbs checkin={todayCheckin} hasCheckedIn={hasCheckedInToday} />
        </motion.div>

        {/* Check-in Card (if not checked in) */}
        {!hasCheckedInToday && (
          <motion.div variants={itemVariants}>
            <CheckInCard streak={currentStreak} hasCheckedInToday={hasCheckedInToday} />
          </motion.div>
        )}

        {/* Recent Runs Carousel */}
        <motion.div variants={itemVariants}>
          <RecentRunsCarousel runs={runsData?.runs || []} />
        </motion.div>

        {/* Bottom spacing for mobile nav */}
        <div className="h-20" />
      </motion.main>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5"
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-around">
          <NavItem href="/" icon="home" label="Home" active />
          <NavItem href="/runs" icon="runs" label="Runs" />
          <NavItem href="/goals" icon="target" label="Goals" />
          <NavItem href="/profile" icon="profile" label="Profile" />
        </div>
      </motion.nav>

      {/* Check-in Modal */}
      <CheckInModal />
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    runs: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    target: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    profile: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return (
    <Link href={href}>
      <motion.div 
        whileTap={{ scale: 0.9 }}
        className={`flex flex-col items-center gap-1 px-4 py-1 ${active ? 'text-[#FF2D55]' : 'text-white/40'}`}
      >
        {icons[icon]}
        <span className="text-[10px] font-medium">{label}</span>
        {active && (
          <motion.div 
            layoutId="nav-indicator"
            className="absolute -bottom-1 w-1 h-1 bg-[#FF2D55] rounded-full"
          />
        )}
      </motion.div>
    </Link>
  );
}
