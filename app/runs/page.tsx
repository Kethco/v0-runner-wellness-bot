"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Navbar } from "@/components/dashboard/navbar";
import { LogRunModal } from "@/components/dashboard/log-run-modal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Flame, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
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

const runTypeColors: Record<string, string> = {
  easy: "from-[#34C759] to-[#30D158]",
  tempo: "from-[#FF9500] to-[#FF6B00]",
  interval: "from-[#FF2D55] to-[#FF375F]",
  long: "from-[#AF52DE] to-[#BF5AF2]",
  recovery: "from-[#00D4FF] to-[#5AC8FA]",
  race: "from-[#FFD60A] to-[#FF9F0A]",
};

export default function RunsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data, mutate } = useSWR<{ runs: Run[]; weeklyTotal: number }>("/api/runs?days=90", fetcher);
  
  const runs = data?.runs || [];
  
  // Group runs by date
  const runsByDate = runs.reduce((acc, run) => {
    const date = run.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(run);
    return acc;
  }, {} as Record<string, Run[]>);

  // Calculate monthly stats
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const monthlyRuns = runs.filter(run => {
    const runDate = new Date(run.date);
    return runDate >= monthStart && runDate <= monthEnd;
  });
  
  const monthlyMiles = monthlyRuns.reduce((sum, run) => sum + run.miles, 0);
  const monthlyCount = monthlyRuns.length;

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

return (
  <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
  <Navbar />
      
      <main className="container max-w-lg mx-auto px-4 pt-4 mt-[56px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl font-bold">Run History</h1>
          <LogRunModal onRunLogged={() => mutate()} />
        </motion.div>

        {/* Month Navigator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#141414] border-[#2A2A2A] p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="text-white/60 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-lg font-semibold">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="text-white/60 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#1A1A1A] rounded-xl">
                <p className="text-2xl font-bold text-[#FF2D55]">{monthlyMiles.toFixed(1)}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider">Miles</p>
              </div>
              <div className="text-center p-3 bg-[#1A1A1A] rounded-xl">
                <p className="text-2xl font-bold text-[#34C759]">{monthlyCount}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider">Runs</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Run List */}
        <div className="space-y-3">
          {Object.entries(runsByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateRuns], index) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 px-1">
                  {formatDate(date)}
                </p>
                {dateRuns.map((run) => (
                  <Card
                    key={run.id}
                    className="bg-[#141414] border-[#2A2A2A] p-4 mb-2 hover:border-[#3A3A3A] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${runTypeColors[run.run_type] || runTypeColors.easy} flex items-center justify-center`}>
                          <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{run.miles.toFixed(2)} miles</p>
                          <p className="text-xs text-white/50 capitalize">{run.run_type} run</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {run.pace && (
                          <div className="flex items-center gap-1 text-sm text-white/70">
                            <TrendingUp className="w-3 h-3" />
                            <span>{run.pace}/mi</span>
                          </div>
                        )}
                        {run.duration_minutes && (
                          <div className="flex items-center gap-1 text-xs text-white/50">
                            <Clock className="w-3 h-3" />
                            <span>{run.duration_minutes} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {run.feeling && (
                      <div className="mt-2 pt-2 border-t border-[#2A2A2A]">
                        <p className="text-xs text-white/50">Feeling: <span className="text-white/70">{run.feeling}</span></p>
                      </div>
                    )}
                    {run.notes && (
                      <p className="text-xs text-white/40 mt-1">{run.notes}</p>
                    )}
                  </Card>
                ))}
              </motion.div>
            ))}
          
          {runs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/50">No runs logged yet</p>
              <p className="text-sm text-white/30 mt-1">Tap the button above to log your first run</p>
            </motion.div>
          )}
        </div>
</main>
      <BottomNav />
  </div>
  );
}
