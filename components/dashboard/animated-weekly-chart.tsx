"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { LogRunModal } from "./log-run-modal";
import { mutate } from "swr";

interface Run {
  id: string;
  miles: number;
  date: string;
}

interface AnimatedWeeklyChartProps {
  runs: Run[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AnimatedWeeklyChart({ runs }: AnimatedWeeklyChartProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  // Get current week data
  const today = new Date();
  const currentDayIndex = today.getDay();
  
  // Calculate miles per day for current week
  const weekData = DAYS.map((day, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - currentDayIndex + index);
    const dateStr = date.toISOString().split("T")[0];
    
    const dayMiles = runs
      .filter(run => run.date === dateStr)
      .reduce((sum, run) => sum + run.miles, 0);
    
    return {
      day,
      miles: dayMiles,
      isToday: index === currentDayIndex,
      date: dateStr,
    };
  });

  const maxMiles = Math.max(...weekData.map(d => d.miles), 5);
  const totalMiles = weekData.reduce((sum, d) => sum + d.miles, 0);

  return (
    <div className="bg-[#141414] rounded-2xl p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">This Week</h3>
          <p className="text-2xl font-bold mt-1">{totalMiles.toFixed(1)} <span className="text-sm text-white/50">miles</span></p>
        </div>
        <LogRunModal onRunLogged={() => mutate("/api/runs?days=7")} />
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32">
        {weekData.map((data, index) => {
          const heightPercent = data.miles > 0 ? (data.miles / maxMiles) * 100 : 5;
          
          return (
            <div 
              key={data.day}
              className="flex-1 flex flex-col items-center gap-2"
              onMouseEnter={() => setHoveredDay(index)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Tooltip */}
              {hoveredDay === index && data.miles > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -mt-8 px-2 py-1 bg-white text-black text-xs font-bold rounded"
                >
                  {data.miles.toFixed(1)}mi
                </motion.div>
              )}
              
              {/* Bar */}
              <div className="w-full h-24 flex items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ 
                    delay: 0.1 * index, 
                    duration: 0.6, 
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  className={`w-full max-w-[32px] rounded-t-lg relative overflow-hidden ${
                    data.isToday 
                      ? 'bg-gradient-to-t from-[#FF2D55] to-[#FF6B00]' 
                      : data.miles > 0 
                        ? 'bg-gradient-to-t from-[#FF2D55]/60 to-[#FF6B00]/60'
                        : 'bg-white/10'
                  }`}
                  style={{
                    boxShadow: data.isToday ? '0 0 20px rgba(255,45,85,0.5)' : 'none',
                  }}
                >
                  {/* Shimmer effect for today */}
                  {data.isToday && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                      animate={{ y: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                  )}
                </motion.div>
              </div>
              
              {/* Day label */}
              <span className={`text-xs font-medium ${
                data.isToday ? 'text-[#FF2D55]' : 'text-white/40'
              }`}>
                {data.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Glowing line connecting bars */}
      <div className="relative h-0.5 mt-4 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF2D55] to-[#FF6B00] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentDayIndex + 1) / 7) * 100}%` }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          style={{
            boxShadow: '0 0 10px #FF2D55',
          }}
        />
      </div>
    </div>
  );
}
