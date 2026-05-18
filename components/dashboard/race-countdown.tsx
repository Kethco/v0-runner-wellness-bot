"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Flag, Flame, Trophy, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Goal {
  id: string;
  distance: string;
  race_name?: string;
  target_date: string;
}

export function RaceCountdown() {
  const { data: goalsData } = useSWR<{ goals: Goal[] }>("/api/goals", fetcher);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Find the active goal with nearest upcoming race
  const activeGoal = goalsData?.goals
    ?.filter(g => g.target_date && new Date(g.target_date) > new Date())
    ?.sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())[0];

  // Store target date string to avoid creating new Date objects on each render
  const targetDateStr = activeGoal?.target_date || null;
  const targetDate = targetDateStr ? new Date(targetDateStr) : null;
  const daysUntilRace = targetDate 
    ? Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Only show when race is <= 30 days away
  const shouldShow = daysUntilRace !== null && daysUntilRace <= 30 && daysUntilRace > 0;

  // Update countdown every second
  useEffect(() => {
    if (!targetDateStr) return;

    const target = new Date(targetDateStr);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (!shouldShow || !activeGoal) return null;

  // Urgency levels for visual intensity
  const isUrgent = daysUntilRace !== null && daysUntilRace <= 7;
  const isFinalWeek = daysUntilRace !== null && daysUntilRace <= 3;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className={`relative overflow-hidden border-2 ${
          isFinalWeek 
            ? "border-red-500/60 bg-gradient-to-br from-red-500/10 via-[#1A1A1A] to-[#1A1A1A]" 
            : isUrgent 
              ? "border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-[#1A1A1A] to-[#1A1A1A]"
              : "border-[#FF4500]/40 bg-gradient-to-br from-[#FF4500]/10 via-[#1A1A1A] to-[#1A1A1A]"
        }`}>
          {/* Animated pulse background for urgency */}
          {isUrgent && (
            <motion.div
              className={`absolute inset-0 ${isFinalWeek ? "bg-red-500/5" : "bg-amber-500/5"}`}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />

          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={isUrgent ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {isFinalWeek ? (
                    <Flame className="w-5 h-5 text-red-500" />
                  ) : isUrgent ? (
                    <Clock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Flag className="w-5 h-5 text-[#FF4500]" />
                  )}
                </motion.div>
                <div>
                  <p className="text-xs text-[#8E8E93] uppercase tracking-wider">Race Day</p>
                  <p className="text-sm font-bold text-white truncate max-w-[180px]">
                    {activeGoal.race_name || activeGoal.distance}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#6E6E73]">
                  {targetDate?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Mins", value: timeLeft.minutes },
                { label: "Secs", value: timeLeft.seconds },
              ].map((unit, i) => (
                <motion.div
                  key={unit.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-lg p-2 text-center ${
                    isFinalWeek 
                      ? "bg-red-500/20 border border-red-500/30" 
                      : isUrgent 
                        ? "bg-amber-500/20 border border-amber-500/30"
                        : "bg-[#2A2A2A] border border-[#3A3A3A]"
                  }`}
                >
                  <motion.p
                    key={unit.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-2xl font-black ${
                      isFinalWeek ? "text-red-400" : isUrgent ? "text-amber-400" : "text-white"
                    }`}
                  >
                    {String(unit.value).padStart(2, "0")}
                  </motion.p>
                  <p className="text-[9px] text-[#6E6E73] uppercase tracking-wider">{unit.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Motivational message based on urgency */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-center text-xs mt-3 font-medium ${
                isFinalWeek ? "text-red-400" : isUrgent ? "text-amber-400" : "text-[#8E8E93]"
              }`}
            >
              {isFinalWeek 
                ? "Final countdown! Trust your training." 
                : isUrgent 
                  ? "Race week approaching. Stay focused!"
                  : "Every run brings you closer."}
            </motion.p>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
