"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/dashboard/navbar";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { WellnessMetrics } from "@/components/dashboard/wellness-metrics";
import { CheckInCard } from "@/components/dashboard/checkin-card";
import { RecentRuns } from "@/components/dashboard/recent-runs";
import { AICoachCard } from "@/components/dashboard/ai-coach-card";
import { CheckInHistory } from "@/components/dashboard/checkin-history";
import { GoalCard } from "@/components/dashboard/goal-card";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { SMSGuideCard } from "@/components/dashboard/sms-guide-card";
import { useAuth } from "@/contexts/auth-context";
import useSWR from "swr";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    console.log("[v0] Fetch error:", url, res.status);
    return null;
  }
  return res.json();
};

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Hello");
  const [weekLabel, setWeekLabel] = useState("");
  
  // Fetch streak and check-in status
  const { data: checkinsData } = useSWR("/api/checkins?limit=7", fetcher);
  
  const todayStr = new Date().toISOString().split("T")[0];
  const hasCheckedInToday = checkinsData?.checkins?.some((c: { date: string }) => c.date === todayStr) ?? false;
  
  // Debug: log check-in status
  if (checkinsData) {
    console.log("[v0] Today:", todayStr);
    console.log("[v0] Checkins data:", checkinsData);
    console.log("[v0] Has checked in today:", hasCheckedInToday);
  }
  
  // Calculate streak from check-ins
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
  
  useEffect(() => {
    setGreeting(getGreeting());
    
    // Calculate week number on client to avoid hydration mismatch
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
    const monthName = now.toLocaleString("default", { month: "short" });
    const year = now.getFullYear();
    setWeekLabel(`Week ${weekNum} · ${monthName} ${year}`);
  }, []);
  
  const userName = user?.user_metadata?.first_name || "Runner";
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Trial Banner */}
        <TrialBanner />

        {/* Hero Section - Greeting + Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {greeting}, {userName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {weekLabel || "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Streak Counter */}
            {currentStreak > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-bold text-primary">{currentStreak} day streak</span>
              </div>
            )}
            {/* Check-in Status */}
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${hasCheckedInToday ? 'bg-green-500/10 border border-green-500/20' : 'bg-card border border-border'}`}>
              <div className={`w-2 h-2 rounded-full ${hasCheckedInToday ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span className={`text-sm font-medium ${hasCheckedInToday ? 'text-green-500' : 'text-muted-foreground'}`}>
                {hasCheckedInToday ? 'Checked in today' : 'Not checked in yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Weekly Chart */}
            <WeeklyChart />

            {/* AI Coach */}
            <AICoachCard />

            {/* Wellness Trends Chart */}
            <TrendsChart />

            {/* Recent Runs */}
            <RecentRuns />

            {/* Check-in History */}
            <CheckInHistory />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* SMS Guide */}
            <SMSGuideCard />

            {/* Check-in Card & Streak */}
            <CheckInCard streak={currentStreak} hasCheckedInToday={hasCheckedInToday} />

            {/* Wellness Metrics */}
            <WellnessMetrics />

            {/* Goal Card - empty state for new users */}
            <GoalCard />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight">RUNNER</span>
            <span className="text-sm font-bold tracking-tight text-primary">WELLNESS</span>
          </div>
          <div className="flex items-center gap-6 text-sm md:text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/help" className="hover:text-foreground transition-colors">Help</a>
          </div>
          <p className="text-sm md:text-xs text-muted-foreground">
            AI assistant — NOT a doctor. Consult your coach for health decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
