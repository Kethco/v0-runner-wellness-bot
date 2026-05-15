"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/dashboard/navbar";
import { LogRunModal } from "@/components/dashboard/log-run-modal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Flame, TrendingUp, ChevronLeft, ChevronRight, Activity, Zap, Route } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

interface Run {
  id: string;
  miles: number;
  pace: string | null;
  duration_minutes: number | null;
  run_type: string;
  feeling: string | null;
  notes: string | null;
  date: string;
  created_at: string;
}

const runTypeConfig: Record<string, { gradient: string; label: string; icon: string }> = {
  easy: { gradient: "from-emerald-500 to-emerald-400", label: "Easy", icon: "E" },
  tempo: { gradient: "from-orange-500 to-amber-400", label: "Tempo", icon: "T" },
  interval: { gradient: "from-red-500 to-rose-400", label: "Interval", icon: "I" },
  long: { gradient: "from-purple-500 to-violet-400", label: "Long", icon: "L" },
  recovery: { gradient: "from-cyan-500 to-sky-400", label: "Recovery", icon: "R" },
  race: { gradient: "from-yellow-500 to-amber-300", label: "Race", icon: "!" },
};

type ViewMode = "recent" | "calendar";

export default function RunsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("recent");
  const { data, mutate } = useSWR<{ runs: Run[]; weeklyTotal: number }>("/api/runs?days=90", fetcher);
  
  const runs = data?.runs || [];
  
  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const weeklyRuns = runs.filter(run => {
      const runDate = new Date(run.date);
      return runDate >= weekStart && runDate <= today;
    });
    
    const monthlyRuns = runs.filter(run => {
      const runDate = new Date(run.date);
      return runDate >= monthStart && runDate <= monthEnd;
    });
    
    const totalMiles = runs.reduce((sum, run) => sum + run.miles, 0);
    const weeklyMiles = weeklyRuns.reduce((sum, run) => sum + run.miles, 0);
    const monthlyMiles = monthlyRuns.reduce((sum, run) => sum + run.miles, 0);
    
    // Calculate average pace from runs with pace data
    const runsWithPace = runs.filter(r => r.pace);
    let avgPace = "--:--";
    if (runsWithPace.length > 0) {
      const totalSeconds = runsWithPace.reduce((sum, r) => {
        const [min, sec] = (r.pace || "0:00").split(":").map(Number);
        return sum + min * 60 + sec;
      }, 0);
      const avgSeconds = totalSeconds / runsWithPace.length;
      const mins = Math.floor(avgSeconds / 60);
      const secs = Math.floor(avgSeconds % 60);
      avgPace = `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    
    return {
      totalRuns: runs.length,
      totalMiles,
      weeklyMiles,
      weeklyRuns: weeklyRuns.length,
      monthlyMiles,
      monthlyRuns: monthlyRuns.length,
      avgPace,
    };
  }, [runs, currentMonth]);

  // Group runs by date for timeline
  const groupedRuns = useMemo(() => {
    const groups: { date: string; runs: Run[]; totalMiles: number }[] = [];
    const sorted = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sorted.forEach(run => {
      const existing = groups.find(g => g.date === run.date);
      if (existing) {
        existing.runs.push(run);
        existing.totalMiles += run.miles;
      } else {
        groups.push({ date: run.date, runs: [run], totalMiles: run.miles });
      }
    });
    
    return groups;
  }, [runs]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split("T")[0]) return "Today";
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
    
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      <Navbar />
      
      <main className="container max-w-lg mx-auto px-4 pt-4 mt-[80px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <h1 className="text-2xl font-bold">Runs</h1>
          <LogRunModal onRunLogged={() => mutate()} />
        </motion.div>

        {/* Summary Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex-shrink-0 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <Route className="w-3.5 h-3.5 text-[#FF4500]" />
                <span className="text-[10px] text-[#6E6E73] uppercase tracking-wider">This Week</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.weeklyMiles.toFixed(1)}<span className="text-sm font-normal text-[#6E6E73] ml-1">mi</span></p>
            </div>
            
            <div className="flex-shrink-0 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-[#6E6E73] uppercase tracking-wider">Total Runs</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalRuns}</p>
            </div>
            
            <div className="flex-shrink-0 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-[#6E6E73] uppercase tracking-wider">Avg Pace</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.avgPace}<span className="text-sm font-normal text-[#6E6E73] ml-1">/mi</span></p>
            </div>
            
            <div className="flex-shrink-0 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] text-[#6E6E73] uppercase tracking-wider">All Time</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalMiles.toFixed(0)}<span className="text-sm font-normal text-[#6E6E73] ml-1">mi</span></p>
            </div>
          </div>
        </motion.div>

        {/* View Toggle & Month Navigator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex bg-[#1A1A1A] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("recent")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "recent" ? "bg-[#FF4500] text-white" : "text-[#6E6E73]"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "calendar" ? "bg-[#FF4500] text-white" : "text-[#6E6E73]"
              }`}
            >
              Monthly
            </button>
          </div>
          
          {viewMode === "calendar" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-[#6E6E73] hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-[#6E6E73] hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Monthly Stats (Calendar View) */}
        <AnimatePresence mode="wait">
          {viewMode === "calendar" && (
            <motion.div
              key="calendar-stats"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Card className="bg-[#141414] border-[#2A2A2A] p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#FF4500]">{stats.monthlyMiles.toFixed(1)}</p>
                    <p className="text-xs text-[#6E6E73] uppercase tracking-wider">Miles</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{stats.monthlyRuns}</p>
                    <p className="text-xs text-[#6E6E73] uppercase tracking-wider">Runs</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline View */}
        <div className="space-y-3">
          {groupedRuns.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <Calendar className="w-8 h-8 text-[#3A3A3A]" />
              </div>
              <p className="text-[#6E6E73] font-medium">No runs logged yet</p>
              <p className="text-sm text-[#3A3A3A] mt-1">Tap the + button to log your first run</p>
            </motion.div>
          ) : (
            groupedRuns.map((group, groupIndex) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * Math.min(groupIndex, 10) }}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isToday(group.date) && (
                      <div className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
                    )}
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                      isToday(group.date) ? "text-[#FF4500]" : "text-[#6E6E73]"
                    }`}>
                      {formatDate(group.date)}
                    </span>
                  </div>
                  <span className="text-xs text-[#3A3A3A]">
                    {group.totalMiles.toFixed(1)} mi total
                  </span>
                </div>
                
                {/* Run Cards */}
                {group.runs.map((run) => {
                  const config = runTypeConfig[run.run_type] || runTypeConfig.easy;
                  
                  return (
                    <Card
                      key={run.id}
                      className="bg-[#141414] border-[#2A2A2A] p-4 mb-2 hover:border-[#3A3A3A] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Run Type Badge */}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-sm">{config.icon}</span>
                        </div>
                        
                        {/* Run Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <p className="text-lg font-bold text-white">
                              {run.miles.toFixed(2)} <span className="text-sm font-normal text-[#6E6E73]">miles</span>
                            </p>
                            {run.pace && (
                              <span className="text-sm text-[#8E8E93]">{run.pace}/mi</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[#6E6E73]">{config.label}</span>
                            {run.duration_minutes && (
                              <span className="text-xs text-[#6E6E73] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {run.duration_minutes}min
                              </span>
                            )}
                            {run.feeling && (
                              <span className="text-xs text-[#6E6E73]">
                                Felt {run.feeling}
                              </span>
                            )}
                          </div>
                          
                          {run.notes && (
                            <p className="text-xs text-[#4A4A4A] mt-2 line-clamp-2">{run.notes}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </motion.div>
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
