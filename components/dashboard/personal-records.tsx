"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Timer, Flame, Target, Zap, ChevronRight, Star, TrendingUp, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// PR distance definitions (in miles) with tolerance for matching
const PR_DISTANCES = [
  { name: "1 Mile", shortName: "1MI", miles: 1, tolerance: 0.05, icon: Zap, motivationalText: "Speed demon starter", key: "1_mile" },
  { name: "5K", shortName: "5K", miles: 3.1, tolerance: 0.1, icon: Flame, motivationalText: "The classic distance", key: "5k" },
  { name: "10K", shortName: "10K", miles: 6.2, tolerance: 0.15, icon: Target, motivationalText: "Double the glory", key: "10k" },
  { name: "Half Marathon", shortName: "HALF", miles: 13.1, tolerance: 0.2, icon: Star, motivationalText: "The big milestone", key: "half_marathon" },
  { name: "Marathon", shortName: "26.2", miles: 26.2, tolerance: 0.3, icon: Trophy, motivationalText: "Ultimate achievement", key: "marathon" },
];

interface PersonalRecord {
  distance: string;
  shortName: string;
  time: string;
  timeSeconds: number;
  date: string;
  miles: number;
  icon: typeof Trophy;
  motivationalText: string;
}

// Convert pace string to seconds
function paceToSeconds(pace: string): number | null {
  const parts = pace.split(":");
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0]);
  const secs = parseInt(parts[1]);
  if (isNaN(mins) || isNaN(secs)) return null;
  return mins * 60 + secs;
}

// Calculate PRs from run history
function calculatePRs(runs: { miles: number; pace?: string; duration_minutes?: number; date: string }[]): PersonalRecord[] {
  const prs: PersonalRecord[] = [];
  
  for (const prDist of PR_DISTANCES) {
    const matchingRuns = runs.filter(r => 
      Math.abs(r.miles - prDist.miles) <= prDist.tolerance
    );
    
    if (matchingRuns.length === 0) {
      prs.push({ 
        distance: prDist.name, 
        shortName: prDist.shortName,
        time: "--:--", 
        timeSeconds: Infinity, 
        date: "", 
        miles: prDist.miles,
        icon: prDist.icon,
        motivationalText: prDist.motivationalText,
      });
      continue;
    }
    
    let bestRun: { time: string; timeSeconds: number; date: string } | null = null;
    
    for (const run of matchingRuns) {
      let timeSeconds: number | null = null;
      
      if (run.duration_minutes) {
        timeSeconds = run.duration_minutes * 60;
      } else if (run.pace) {
        const paceSeconds = paceToSeconds(run.pace);
        if (paceSeconds) {
          timeSeconds = paceSeconds * run.miles;
        }
      }
      
      if (timeSeconds && (!bestRun || timeSeconds < bestRun.timeSeconds)) {
        const hours = Math.floor(timeSeconds / 3600);
        const mins = Math.floor((timeSeconds % 3600) / 60);
        const secs = Math.floor(timeSeconds % 60);
        const timeStr = hours > 0 
          ? `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          : `${mins}:${secs.toString().padStart(2, "0")}`;
        
        bestRun = { time: timeStr, timeSeconds, date: run.date };
      }
    }
    
    prs.push({
      distance: prDist.name,
      shortName: prDist.shortName,
      time: bestRun?.time || "--:--",
      timeSeconds: bestRun?.timeSeconds || Infinity,
      date: bestRun?.date || "",
      miles: prDist.miles,
      icon: prDist.icon,
      motivationalText: prDist.motivationalText,
    });
  }
  
  return prs;
}

export function PersonalRecordsCard() {
  const [selectedPR, setSelectedPR] = useState<PersonalRecord | null>(null);
  
  // Try to fetch from the new PR API first
  const { data: prData } = useSWR<{ prs: { distance: string; label: string; shortName: string; hasPR: boolean; time: string | null; timeSeconds: number | null; pace: string | null; achievedAt: string | null }[] }>(
    "/api/personal-records",
    fetcher
  );
  
  // Fallback to runs data if PR API doesn't return data
  const { data: runsData } = useSWR<{ runs: { miles: number; pace?: string; duration_minutes?: number; date: string }[] }>(
    !prData?.prs ? "/api/runs?days=365" : null,
    fetcher
  );

  // Use PR API data if available, otherwise calculate from runs
  const personalRecords: PersonalRecord[] = prData?.prs 
    ? prData.prs.map(pr => {
        const distConfig = PR_DISTANCES.find(d => d.key === pr.distance);
        return {
          distance: pr.label,
          shortName: pr.shortName,
          time: pr.time || "--:--",
          timeSeconds: pr.timeSeconds || Infinity,
          date: pr.achievedAt || "",
          miles: distConfig?.miles || 0,
          icon: distConfig?.icon || Trophy,
          motivationalText: distConfig?.motivationalText || "",
        };
      })
    : calculatePRs(runsData?.runs || []);
    
  const earnedCount = personalRecords.filter(pr => pr.time !== "--:--").length;
  const hasAnyPR = earnedCount > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#1A1A1A]">
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent)",
              }}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Glowing corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-amber-500/20 via-transparent to-transparent blur-2xl" />
          
          {/* Header */}
          <div className="relative p-4 border-b border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated Trophy */}
                <motion.div
                  className="relative"
                  animate={hasAnyPR ? { 
                    rotate: [0, -5, 5, -5, 0],
                  } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  {/* Sparkle effect */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                  </motion.div>
                </motion.div>
                
                <div>
                  <h3 className="text-lg font-bold text-white">Personal Records</h3>
                  <p className="text-sm text-amber-500/80">
                    {hasAnyPR 
                      ? `${earnedCount} of ${personalRecords.length} conquered`
                      : "Your glory awaits"
                    }
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                {personalRecords.map((pr, i) => (
                  <motion.div
                    key={pr.shortName}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`w-2 h-2 rounded-full ${
                      pr.time !== "--:--" 
                        ? "bg-amber-500 shadow-sm shadow-amber-500/50" 
                        : "bg-[#3A3A3A]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Motivational tagline */}
            {!hasAnyPR && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-3 flex items-center gap-2 text-sm text-[#8E8E93]"
              >
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Every record starts with a single run. Make yours count.</span>
              </motion.div>
            )}
          </div>

          {/* PR Grid */}
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {personalRecords.map((pr, index) => {
                const hasPR = pr.time !== "--:--";
                const Icon = pr.icon;
                
                return (
                  <motion.button
                    key={pr.shortName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPR(pr)}
                    className={`relative rounded-xl p-3 text-center transition-all cursor-pointer group ${
                      hasPR 
                        ? "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-400/60" 
                        : "bg-[#1A1A1A] border-2 border-dashed border-[#5A5A5A] hover:border-amber-500/50"
                    }`}
                  >
                    {/* Glow effect for earned PRs */}
                    {hasPR && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-amber-500/10 blur-md"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Icon */}
                    <div className={`relative w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      hasPR 
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/40" 
                        : "bg-[#2A2A2A] border border-[#4A4A4A] group-hover:bg-[#3A3A3A]"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        hasPR ? "text-white" : "text-white/60 group-hover:text-amber-400"
                      }`} />
                      
                      {/* Pulse ring for unearned */}
                      {!hasPR && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-amber-500/30"
                          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>

                    {/* Distance Label */}
                    <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      hasPR ? "text-amber-300" : "text-white/70 group-hover:text-white"
                    }`}>
                      {pr.shortName}
                    </p>

                    {/* Time or Call to Action */}
                    {hasPR ? (
                      <motion.p 
                        className="text-sm font-bold text-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {pr.time}
                      </motion.p>
                    ) : (
                      <p className="text-[10px] text-white/50 group-hover:text-amber-400 transition-colors">
                        Set it!
                      </p>
                    )}

                    {/* Earned checkmark */}
                    {hasPR && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, delay: index * 0.1 + 0.3 }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50"
                      >
                        <Star className="w-3 h-3 text-white fill-white" />
                      </motion.div>
                    )}

                    {/* Hover arrow */}
                    <motion.div
                      className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ChevronRight className="w-3 h-3 text-amber-500/50" />
                    </motion.div>
                  </motion.button>
                );
              })}
            </div>

            {/* Inspirational footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-center gap-2"
            >
              <Timer className="w-4 h-4 text-amber-500/60" />
              <p className="text-xs text-[#6E6E73]">
                {hasAnyPR 
                  ? "Tap a distance to see details or challenge yourself" 
                  : "Complete a timed run to unlock your first PR"
                }
              </p>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* PR Detail Modal */}
      <AnimatePresence>
        {selectedPR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPR(null)}
          >
            <motion.div
              initial={{ scale: 0.8, rotateX: -15 }}
              animate={{ scale: 1, rotateX: 0 }}
              exit={{ scale: 0.8, rotateX: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] rounded-2xl border-2 border-amber-500/40 overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent" />
              
              {/* Content */}
              <div className="relative p-6 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative mx-auto mb-4"
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                    selectedPR.time !== "--:--"
                      ? "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-xl shadow-amber-500/50"
                      : "bg-[#2A2A2A] border-2 border-dashed border-amber-500/30"
                  }`}>
                    <selectedPR.icon className={`w-10 h-10 ${
                      selectedPR.time !== "--:--" ? "text-white" : "text-amber-500/50"
                    }`} />
                  </div>
                  
                  {/* Confetti for earned */}
                  {selectedPR.time !== "--:--" && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            background: ["#FFD700", "#FF6B00", "#FFFFFF", "#FFA500"][i % 4],
                            top: "50%",
                            left: "50%",
                          }}
                          initial={{ x: 0, y: 0, opacity: 1 }}
                          animate={{
                            x: Math.cos((i * Math.PI * 2) / 8) * 60,
                            y: Math.sin((i * Math.PI * 2) / 8) * 60,
                            opacity: 0,
                            scale: [1, 1.5, 0],
                          }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>

                {/* Distance name */}
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-white mb-1"
                >
                  {selectedPR.distance}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-amber-500/80 mb-4"
                >
                  {selectedPR.motivationalText}
                </motion.p>

                {/* Time or motivation */}
                {selectedPR.time !== "--:--" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full border border-amber-500/30 mb-3">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-400 uppercase">Personal Best</span>
                    </div>
                    <p className="text-4xl font-black text-white mb-2">{selectedPR.time}</p>
                    <p className="text-sm text-[#6E6E73]">
                      Set on {new Date(selectedPR.date).toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric", 
                        year: "numeric" 
                      })}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full border-4 border-dashed border-amber-500/30 flex items-center justify-center">
                      <span className="text-2xl font-bold text-amber-500/50">?</span>
                    </div>
                    <p className="text-lg text-[#8E8E93]">No record yet</p>
                    <p className="text-sm text-[#6E6E73] max-w-xs mx-auto">
                      Run {selectedPR.miles} miles with a timer to set your first {selectedPR.distance} PR!
                    </p>
                    <motion.div
                      className="flex items-center justify-center gap-2 text-amber-500"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Flame className="w-4 h-4" />
                      <span className="text-sm font-medium">Your record awaits</span>
                    </motion.div>
                  </motion.div>
                )}

                {/* Close hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-xs text-[#4A4A4A]"
                >
                  Tap outside to close
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
