"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Run {
  id: string;
  miles: number;
  date: string;
  run_type?: string;
  feeling?: string;
  pace?: string;
}

interface RecentRunsCarouselProps {
  runs: Run[];
}

const RUN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: "#34C759", text: "#FFFFFF" },
  tempo: { bg: "#FF6B00", text: "#FFFFFF" },
  intervals: { bg: "#FF2D55", text: "#FFFFFF" },
  long: { bg: "#AF52DE", text: "#FFFFFF" },
  recovery: { bg: "#00D4FF", text: "#000000" },
  race: { bg: "#FFD60A", text: "#000000" },
};

const FEELING_LABELS: Record<string, string> = {
  "1": "Hard",
  "2": "Tough",
  "3": "OK",
  "4": "Good",
  "5": "Great",
};

export function RecentRunsCarousel({ runs }: RecentRunsCarouselProps) {
  if (runs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Recent Runs</h3>
        </div>
        <div className="bg-[#141414] rounded-2xl p-8 border border-white/5 text-center">
          <p className="text-white/40 text-sm">No runs logged yet</p>
          <p className="text-white/20 text-xs mt-1">Log your first run to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Recent Runs</h3>
        <Link href="/runs" className="text-xs text-[#FF2D55] flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Horizontal scroll carousel */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3" style={{ width: "max-content" }}>
          {runs.slice(0, 10).map((run, index) => {
            const runType = run.run_type || "easy";
            const colors = RUN_TYPE_COLORS[runType] || RUN_TYPE_COLORS.easy;
            const feeling = run.feeling ? FEELING_LABELS[run.feeling] : null;
            const date = new Date(run.date);
            const formattedDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            
            return (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-36 bg-[#141414] rounded-xl p-4 border border-white/5 flex-shrink-0 cursor-pointer"
              >
                {/* Run type badge */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05, type: "spring" }}
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ 
                    backgroundColor: colors.bg + "20",
                    color: colors.bg,
                  }}
                >
                  {runType}
                </motion.div>

                {/* Miles */}
                <div className="text-2xl font-black mb-1">{run.miles.toFixed(1)}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">miles</div>

                {/* Feeling badge */}
                {feeling && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium mb-2"
                    style={{ 
                      backgroundColor: colors.bg + "15",
                      color: colors.bg,
                    }}
                  >
                    {feeling}
                  </motion.div>
                )}

                {/* Date */}
                <div className="text-[10px] text-white/30 mt-1">{formattedDate}</div>

                {/* Pace if available */}
                {run.pace && (
                  <div className="text-[10px] text-white/40 mt-1">{run.pace} /mi</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
