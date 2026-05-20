"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Moon, Heart, Smile, Sunrise, Sunset, 
  Battery, AlertTriangle, ChevronDown, Brain
} from "lucide-react";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const iconMap: Record<string, React.ReactNode> = {
  battery: <Battery className="w-5 h-5" />,
  smile: <Smile className="w-5 h-5" />,
  sunrise: <Sunrise className="w-5 h-5" />,
  sunset: <Sunset className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  alert: <AlertTriangle className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  moon: <Moon className="w-5 h-5" />,
};

export function EmotionalPatterns() {
  const { data, isLoading } = useSWR("/api/emotional-patterns", fetcher);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5E5CE6]/20 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.patterns?.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] border border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5E5CE6]/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#5E5CE6]" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Your Patterns</p>
            <p className="text-[#8E8E93] text-xs mt-0.5">
              {data?.dataPoints < 3 
                ? `${3 - (data?.dataPoints || 0)} more check-ins to unlock insights`
                : "Patterns will emerge as you track more"}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const patterns = data.patterns || [];
  const visiblePatterns = expanded ? patterns : patterns.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5E5CE6]/30 to-[#AF52DE]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#AF52DE]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Your Wellness Patterns</p>
              <p className="text-[#6E6E73] text-xs">
                Based on {data.dataPoints} check-ins & {data.runsAnalyzed} runs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patterns List */}
      <div className="p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {visiblePatterns.map((pattern: {
            type: string;
            insight: string;
            strength: string;
            icon: string;
            color: string;
          }, index: number) => (
            <motion.div
              key={pattern.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${pattern.color}20` }}
                >
                  <span style={{ color: pattern.color }}>
                    {iconMap[pattern.icon] || <Sparkles className="w-5 h-5" />}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ 
                        backgroundColor: `${pattern.color}20`,
                        color: pattern.color
                      }}
                    >
                      {pattern.strength}
                    </span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {pattern.insight}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Expand/Collapse */}
        {patterns.length > 2 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 flex items-center justify-center gap-1 text-[#8E8E93] text-xs hover:text-white transition-colors"
          >
            {expanded ? "Show less" : `Show ${patterns.length - 2} more`}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
