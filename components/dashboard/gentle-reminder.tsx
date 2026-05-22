"use client";

import { AlertTriangle, X, Heart, Zap, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

interface ReminderType {
  id: string;
  icon: React.ElementType;
  title: string;
  message: string;
  color: string;
  bgColor: string;
}

export function GentleReminder() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const { data: runsData } = useSWR("/api/runs?days=7", fetcher);
  const { data: insightsData } = useSWR("/api/wellness-insights", fetcher);
  
  // Check for patterns that warrant a reminder
  const runs = runsData?.runs || [];
  const readiness = insightsData?.readiness;
  
  // Count hard runs in last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const recentHardRuns = runs.filter((r: { date: string; run_type?: string; effort_level?: number }) => {
    const runDate = new Date(r.date);
    const isRecent = runDate >= threeDaysAgo;
    const isHard = r.run_type === "tempo" || r.run_type === "intervals" || r.run_type === "race" || (r.effort_level && r.effort_level >= 4);
    return isRecent && isHard;
  }).length;
  
  // Count consecutive running days
  const today = new Date();
  let consecutiveDays = 0;
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    const hasRun = runs.some((r: { date: string }) => r.date?.split("T")[0] === dateStr);
    if (hasRun) {
      consecutiveDays++;
    } else if (i > 0) {
      break;
    }
  }
  
  // Determine reminders to show
  const reminders: ReminderType[] = [];
  
  if (recentHardRuns >= 3 && !dismissed.includes("hard-runs")) {
    reminders.push({
      id: "hard-runs",
      icon: AlertTriangle,
      title: "Heavy training detected",
      message: `${recentHardRuns} hard sessions in 3 days. Consider an easy day to avoid overtraining.`,
      color: "#FF9500",
      bgColor: "#FF9500",
    });
  }
  
  if (consecutiveDays >= 6 && !dismissed.includes("consecutive")) {
    reminders.push({
      id: "consecutive",
      icon: Heart,
      title: "Rest is progress",
      message: `You've run ${consecutiveDays} days straight. Your body might appreciate a recovery day.`,
      color: "#AF52DE",
      bgColor: "#AF52DE",
    });
  }
  
  if (readiness && readiness.score < 50 && !dismissed.includes("low-readiness")) {
    reminders.push({
      id: "low-readiness",
      icon: Moon,
      title: "Listen to your body",
      message: "Your readiness is low today. An easy day or rest could help you bounce back stronger.",
      color: "#5E5CE6",
      bgColor: "#5E5CE6",
    });
  }
  
  // Only show the most important reminder
  const reminder = reminders[0];
  
  if (!reminder) {
    return <></>;
  }
  
  return (
    <div
      className="glass-subtle overflow-hidden"
      style={{ borderColor: `${reminder.color}20` }}
    >
      <div className="flex items-start gap-3 p-4">
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${reminder.color}15` }}
        >
          <reminder.icon className="w-4 h-4" style={{ color: reminder.color }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[13px] mb-0.5">{reminder.title}</p>
            <p className="text-white/50 text-[12px] leading-relaxed">{reminder.message}</p>
          </div>
          
          <button
            onClick={() => setDismissed(prev => [...prev, reminder.id])}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/30" />
          </button>
        </div>
      </div>
  );
}
