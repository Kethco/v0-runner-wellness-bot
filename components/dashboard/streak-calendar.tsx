"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import useSWR from "swr";

interface Run {
  id: string;
  date: string;
  miles: number;
}

interface StreakCalendarProps {
  currentStreak?: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function StreakCalendar({ currentStreak = 0 }: StreakCalendarProps) {
  const [yearOffset, setYearOffset] = useState(0);
  
  // Calculate date range for the displayed year
  const { startDate, endDate, year } = useMemo(() => {
    const now = new Date();
    const targetYear = now.getFullYear() + yearOffset;
    const start = new Date(targetYear, 0, 1);
    const end = yearOffset === 0 ? now : new Date(targetYear, 11, 31);
    return { 
      startDate: start, 
      endDate: end, 
      year: targetYear 
    };
  }, [yearOffset]);

  // Fetch runs for the year
  const daysToFetch = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const { data: runsData } = useSWR(`/api/runs?days=${daysToFetch}`, fetcher);

  // Build calendar data
  const calendarData = useMemo(() => {
    const runs = runsData?.runs || [];
    const runsByDate: Record<string, number> = {};
    
    runs.forEach((run: Run) => {
      const date = run.date.split('T')[0];
      runsByDate[date] = (runsByDate[date] || 0) + run.miles;
    });

    // Generate all weeks of the year
    const weeks: { date: Date; miles: number; isCurrentMonth: boolean }[][] = [];
    const current = new Date(startDate);
    
    // Start from the first Sunday before or on Jan 1
    current.setDate(current.getDate() - current.getDay());
    
    // Continue until we pass the end date AND have complete weeks
    while (current <= endDate || current.getDay() !== 0) {
      const week: { date: Date; miles: number; isCurrentMonth: boolean }[] = [];
      
      for (let i = 0; i < 7; i++) {
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const isInRange = current >= startDate && current <= endDate;
        
        week.push({
          date: new Date(current),
          miles: isInRange ? (runsByDate[dateStr] || 0) : -1,
          isCurrentMonth: current.getFullYear() === year,
        });
        current.setDate(current.getDate() + 1);
      }
      
      weeks.push(week);
      
      // Safety limit to prevent infinite loop
      if (weeks.length >= 54) break;
    }
    
    return weeks;
  }, [runsData, startDate, endDate, year]);

  // Calculate stats
  const stats = useMemo(() => {
    const runs = runsData?.runs || [];
    const totalMiles = runs.reduce((sum: number, r: Run) => sum + r.miles, 0);
    const totalRuns = runs.length;
    const runDates = new Set(runs.map((r: Run) => r.date.split('T')[0]));
    const activeDays = runDates.size;
    
    return { totalMiles, totalRuns, activeDays };
  }, [runsData]);

  // Get intensity level for color (0-4)
  const getIntensity = (miles: number): number => {
    if (miles < 0) return -1; // Out of range
    if (miles === 0) return 0;
    if (miles < 3) return 1;
    if (miles < 5) return 2;
    if (miles < 8) return 3;
    return 4;
  };

  const intensityColors = [
    "bg-white/5", // 0 - no run
    "bg-[#FF4500]/30", // 1 - light
    "bg-[#FF4500]/50", // 2 - medium
    "bg-[#FF4500]/70", // 3 - good
    "bg-[#FF4500]", // 4 - great
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-glow card-lift p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#FF6B00] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Run Streak Calendar</h3>
            <p className="text-xs text-[#8E8E93]">{stats.activeDays} active days this year</p>
          </div>
        </div>
        
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF4500]/20 to-[#FF6B00]/20 border border-[#FF4500]/30">
            <Flame className="w-4 h-4 text-[#FF4500] flame-animated" />
            <span className="text-sm font-bold text-[#FF4500]">{currentStreak}</span>
          </div>
        )}
      </div>

      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setYearOffset(prev => prev - 1)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#8E8E93]" />
        </button>
        <span className="text-sm font-semibold text-white">{year}</span>
        <button
          onClick={() => setYearOffset(prev => Math.min(prev + 1, 0))}
          disabled={yearOffset >= 0}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
        </button>
      </div>

      {/* Month Labels - positioned based on actual week positions */}
      <div className="flex mb-1 pl-6">
        {calendarData.map((week, weekIndex) => {
          // Show month label on the first week that starts in that month
          const firstDayOfWeek = week[0]?.date;
          const showLabel = firstDayOfWeek && firstDayOfWeek.getDate() <= 7 && firstDayOfWeek.getFullYear() === year;
          return (
            <div key={weekIndex} className="w-[11px] mr-0.5 text-[10px] text-[#8E8E93] text-center flex-shrink-0">
              {showLabel ? months[firstDayOfWeek.getMonth()].slice(0, 1) : ""}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="flex gap-0.5">
        {/* Day Labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {days.map((day, i) => (
            <div key={i} className="w-4 h-[11px] text-[8px] text-[#8E8E93] flex items-center justify-center">
              {i % 2 === 1 ? day : ""}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => {
                const intensity = getIntensity(day.miles);
                const isToday = day.date.toDateString() === new Date().toDateString();
                
                return (
                  <motion.div
                    key={dayIndex}
                    whileHover={{ scale: 1.3 }}
                    className={`
                      w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-colors
                      ${intensity === -1 ? "bg-transparent" : intensityColors[intensity]}
                      ${isToday ? "ring-1 ring-white/50" : ""}
                    `}
                    title={`${day.date.toLocaleDateString()}: ${day.miles > 0 ? `${day.miles.toFixed(1)} mi` : "No run"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1 text-[10px] text-[#8E8E93]">
          <span>Less</span>
          {intensityColors.map((color, i) => (
            <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${color}`} />
          ))}
          <span>More</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="text-[#8E8E93]">
            <span className="text-white font-semibold">{stats.totalRuns}</span> runs
          </div>
          <div className="text-[#8E8E93]">
            <span className="text-white font-semibold">{stats.totalMiles.toFixed(0)}</span> mi
          </div>
        </div>
      </div>
    </motion.div>
  );
}
