"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Moon, Zap, Activity, Flame, Calendar, ChevronRight, Minus } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="w-3.5 h-3.5 text-[#6E6E73]" />;
  const diff = current - previous;
  if (diff > 0) return <TrendingUp className="w-3.5 h-3.5 text-[#30D158]" />;
  if (diff < 0) return <TrendingDown className="w-3.5 h-3.5 text-[#FF453A]" />;
  return <Minus className="w-3.5 h-3.5 text-[#6E6E73]" />;
}

export function WeeklySummary() {
  const { data } = useSWR("/api/wellness-insights");

  // Return empty fragment to prevent layout shifts
  if (!data?.insights) return <></>;

  const { weeklyStats, previousWeekStats, patterns, bestDay } = data.insights;

  // Only show on Sundays or Mondays, or if there's enough data
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isRecapDay = dayOfWeek === 0 || dayOfWeek === 1; // Sun or Mon
  
  if (!isRecapDay && !weeklyStats) return <></>;
  if (!weeklyStats) return <></>;

  const stats = [
    {
      label: "Miles Run",
      value: weeklyStats.totalMiles?.toFixed(1) || "0",
      prev: previousWeekStats?.totalMiles || 0,
      current: weeklyStats.totalMiles || 0,
      icon: Activity,
      color: "#FF4500",
    },
    {
      label: "Avg Sleep",
      value: weeklyStats.avgSleep?.toFixed(1) || "--",
      prev: previousWeekStats?.avgSleep || 0,
      current: weeklyStats.avgSleep || 0,
      icon: Moon,
      color: "#5E5CE6",
    },
    {
      label: "Avg Energy",
      value: weeklyStats.avgEnergy?.toFixed(1) || "--",
      prev: previousWeekStats?.avgEnergy || 0,
      current: weeklyStats.avgEnergy || 0,
      icon: Zap,
      color: "#FFD700",
    },
    {
      label: "Check-ins",
      value: String(weeklyStats.checkinCount || 0),
      prev: previousWeekStats?.checkinCount || 0,
      current: weeklyStats.checkinCount || 0,
      icon: Calendar,
      color: "#30D158",
    },
  ];

  return (
    <div className="glass-card-premium overflow-hidden">
      {/* Top accent */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
      
      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Weekly Recap</p>
            <p className="text-white font-bold text-lg mt-1">Your Week in Review</p>
          </div>
          <Link 
            href="/trends" 
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#161618] border border-white/15 hover:border-white/25 transition-all shadow-lg shadow-black/20"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center" 
                style={{ 
                  backgroundColor: `${stat.color}20`,
                  boxShadow: `0 0 16px ${stat.color}30`
                }}
              >
                <stat.icon 
                  className="w-5 h-5" 
                  style={{ 
                    color: stat.color,
                    filter: `drop-shadow(0 0 4px ${stat.color})`
                  }} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 font-semibold">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-lg">{stat.value}</p>
                  <TrendArrow current={stat.current} previous={stat.prev} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Best day callout */}
        {bestDay && (
          <div className="mt-4 p-4 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20">
            <p className="text-xs text-[#30D158] font-bold uppercase tracking-wider">Best Day · {bestDay.day}</p>
            <p className="text-sm text-white/70 mt-1">{bestDay.reason}</p>
          </div>
        )}

        {/* Patterns */}
        {patterns && patterns.length > 0 && (
          <div className="mt-4 space-y-2">
            {patterns.slice(0, 2).map((pattern: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                <Flame className="w-4 h-4 text-[#FF6B00] mt-0.5 shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(255,107,0,0.5))' }} />
                <p className="text-sm text-white/60 leading-relaxed">{pattern}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
