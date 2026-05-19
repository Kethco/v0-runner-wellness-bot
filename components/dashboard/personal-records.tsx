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
        transition={{ duration: 0.4 }}
      >
        <Card className="premium-card overflow-hidden border-0">
          {/* Header */}
          <div className="relative p-4 border-b border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                
                <div>
                  <h3 className="text-base font-bold text-white">Personal Records</h3>
                  <p className="text-[11px] text-white/40">
                    {hasAnyPR 
                      ? `${earnedCount} of ${personalRecords.length} conquered`
                      : "Your glory awaits"
                    }
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-1.5">
                {personalRecords.map((pr, i) => (
                  <motion.div
                    key={pr.shortName}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className={`w-1.5 h-1.5 rounded-full ${
                      pr.time !== "--:--" 
                        ? "bg-amber-400" 
                        : "bg-white/15"
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
                transition={{ delay: 0.4 }}
                className="mt-3 flex items-center gap-2 text-[12px] text-white/40"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-500/70" />
                <span>Every record starts with a single run</span>
              </motion.div>
            )}
          </div>

          {/* PR Grid */}
          <div className="p-4 pt-0">
            <div className="grid grid-cols-5 gap-1.5">
              {personalRecords.map((pr, index) => {
                const hasPR = pr.time !== "--:--";
                const Icon = pr.icon;
                
                return (
                  <motion.button
                    key={pr.shortName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPR(pr)}
                    className={`relative rounded-xl p-2.5 text-center transition-all cursor-pointer ${
                      hasPR 
                        ? "bg-amber-500/10 border border-amber-500/25" 
                        : "bg-white/[0.02] border border-white/[0.06] border-dashed hover:border-amber-500/30"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`relative w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center ${
                      hasPR 
                        ? "bg-gradient-to-br from-amber-400/20 to-amber-600/10" 
                        : "bg-white/[0.04]"
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        hasPR ? "text-amber-400" : "text-white/30"
                      }`} />
                    </div>

                    {/* Distance Label */}
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                      hasPR ? "text-amber-400/80" : "text-white/40"
                    }`}>
                      {pr.shortName}
                    </p>

                    {/* Time */}
                    {hasPR ? (
                      <p className="text-[11px] font-bold text-white">{pr.time}</p>
                    ) : (
                      <p className="text-[10px] text-white/25">—</p>
                    )}
                  </motion.button>
                );
              })}
            </div>
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
