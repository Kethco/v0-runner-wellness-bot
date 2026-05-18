"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ChevronRight } from "lucide-react";
import { CheckInModal } from "./checkin-modal";

interface TodayWorkout {
  id: string;
  title: string;
  workout_type: string;
  target_miles: number;
  description?: string;
}

interface CheckInCardProps {
  streak?: number;
  hasCheckedInToday?: boolean;
  todayWorkout?: TodayWorkout | null;
}

export function CheckInCard({ streak = 0, hasCheckedInToday = false, todayWorkout }: CheckInCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (hasCheckedInToday) return null;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className="relative rounded-2xl overflow-hidden cursor-pointer"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF2D55] via-[#FF6B00] to-[#FF8A9B]" />
        
        {/* Animated shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        
        {/* Content */}
        <div className="relative p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Daily Check-in</h3>
            <p className="text-white/80 text-sm">Log how you feel today</p>
          </div>
          
          <motion.div 
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </motion.div>
        </div>
      </motion.div>

      <CheckInModal open={isModalOpen} onOpenChange={setIsModalOpen} todayWorkout={todayWorkout} />
    </>
  );
}
