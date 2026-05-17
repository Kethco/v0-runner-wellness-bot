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
  const { data } = useSWR("/api/wellness-insights", fetcher);

  if (!data?.insights) return null;

  const { weeklyStats, previousWeekStats, patterns, bestDay } = data.insights;

  // Only show on Sundays or Mondays, or if there's enough data
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isRecapDay = dayOfWeek === 0 || dayOfWeek === 1; // Sun or Mon
  
  if (!isRecapDay && !weeklyStats) return null;
  if (!weeklyStats) return null;

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-[#FF4500]/20 via-[#FFD700]/10 to-[#30D158]/20 p-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Weekly Recap</p>
            <p className="text-white font-bold text-lg">Your Week in Review</p>
          </div>
          <Link href="/trends" className="text-[#6E6E73] hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="bg-[#141414] border border-[#2A2A2A] border-t-0 rounded-b-2xl p-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#6E6E73]">{stat.label}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-bold text-lg">{stat.value}</p>
                  <TrendArrow current={stat.current} previous={stat.prev} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Best day callout */}
        {bestDay && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-[#30D158]/10 to-transparent border border-[#30D158]/20">
            <p className="text-xs text-[#30D158] font-semibold">Best Day: {bestDay.day}</p>
            <p className="text-sm text-[#C7C7CC]">{bestDay.reason}</p>
          </div>
        )}

        {/* Patterns */}
        {patterns && patterns.length > 0 && (
          <div className="mt-3 space-y-2">
            {patterns.slice(0, 2).map((pattern: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2">
                <Flame className="w-3.5 h-3.5 text-[#FF6B00] mt-0.5 shrink-0" />
                <p className="text-xs text-[#8E8E93] leading-relaxed">{pattern}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
