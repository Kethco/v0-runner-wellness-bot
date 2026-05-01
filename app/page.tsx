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
import { useAuth } from "@/contexts/auth-context";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Hello");
  
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);
  
  const userName = user?.user_metadata?.first_name || "Runner";
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {greeting}, {userName}
            </p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
              27.3
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-1">
              Miles this week
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Week 17 · May 2026
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
            {/* Check-in Card & Streak */}
            <CheckInCard streak={12} hasCheckedInToday={false} />

            {/* Wellness Metrics */}
            <WellnessMetrics />

            {/* Goal Card */}
            <GoalCard
              race="Half Marathon"
              date="May 15, 2026"
              daysUntil={14}
              targetTime="1:45:00"
            />
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
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/help" className="hover:text-foreground transition-colors">Help</a>
          </div>
          <p className="text-xs text-muted-foreground">
            AI assistant — NOT a doctor. Consult your coach for health decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
