"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Zap, Heart, Target, Shield, 
  Smile, Brain, Sun, Check, ChevronDown, ChevronUp, Trophy
} from "lucide-react";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const iconMap: Record<string, React.ElementType> = {
  zap: Zap,
  heart: Heart,
  target: Target,
  shield: Shield,
  smile: Smile,
  brain: Brain,
  sun: Sun,
  check: Check,
  sparkles: Sparkles,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  energy: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  consistency: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  intention: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  gratitude: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
  joy: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  resilience: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  kindness: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30" },
  mindful: { bg: "bg-teal-500/15", text: "text-teal-400", border: "border-teal-500/30" },
  feeling: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
};

export function ProgressEcho() {
  const { data, isLoading } = useSWR("/api/progress-echo", fetcher);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-4 bg-white/5 rounded w-3/4" />
      </div>
    );
  }

  if (!data?.wins || data.wins.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-5 border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Your Growth Story</h3>
            <p className="text-white/50 text-sm">Keep checking in to see your weekly wins</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const displayWins = expanded ? data.wins : data.wins.slice(0, 2);
  const hasMore = data.wins.length > 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center relative">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-emerald-400/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h3 className="text-white font-bold">This Week&apos;s Growth</h3>
              <p className="text-white/50 text-xs">Beyond the miles</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/15 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold">{data.totalWins} wins</span>
          </div>
        </div>
      </div>

      {/* Wins List */}
      <div className="px-5 pb-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {displayWins.map((win: { type: string; text: string; icon: string }, index: number) => {
            const Icon = iconMap[win.icon] || Sparkles;
            const colors = colorMap[win.type] || colorMap.energy;
            
            return (
              <motion.div
                key={win.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${colors.bg} border ${colors.border}`}
              >
                <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${colors.text}`} />
                </div>
                <p className="text-white/90 text-sm flex-1">{win.text}</p>
                <Check className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Expand/Collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 border-t border-white/5 flex items-center justify-center gap-2 text-white/50 hover:text-white/70 transition-colors"
        >
          <span className="text-xs font-medium">
            {expanded ? "Show less" : `Show ${data.wins.length - 2} more`}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Encouragement Footer */}
      <div className="px-5 py-3 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-t border-white/5">
        <p className="text-white/40 text-xs text-center italic">
          {data.wins.length >= 4 
            ? "You're building something beautiful beyond the numbers"
            : data.wins.length >= 2
            ? "Every small win is part of your bigger story"
            : "Keep showing up - your wins are adding up"}
        </p>
      </div>
    </motion.div>
  );
}
