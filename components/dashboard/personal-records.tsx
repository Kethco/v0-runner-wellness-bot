"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Timer, Flame, Target, Zap, Star, X, Medal, Crown } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// PR distance definitions
const PR_DISTANCES = [
  { name: "1 Mile", shortName: "1MI", miles: 1, tolerance: 0.05, icon: Zap, motivationalText: "Speed demon starter", key: "1_mile", color: "#60A5FA" },
  { name: "5K", shortName: "5K", miles: 3.1, tolerance: 0.1, icon: Flame, motivationalText: "The classic distance", key: "5k", color: "#F97316" },
  { name: "10K", shortName: "10K", miles: 6.2, tolerance: 0.15, icon: Target, motivationalText: "Double the glory", key: "10k", color: "#A855F7" },
  { name: "Half Marathon", shortName: "HALF", miles: 13.1, tolerance: 0.2, icon: Star, motivationalText: "The big milestone", key: "half_marathon", color: "#10B981" },
  { name: "Marathon", shortName: "26.2", miles: 26.2, tolerance: 0.3, icon: Crown, motivationalText: "Ultimate achievement", key: "marathon", color: "#FFD700" },
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
  color: string;
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
        color: prDist.color,
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
      color: prDist.color,
    });
  }
  
  return prs;
}

export function PersonalRecordsCard() {
  const [selectedPR, setSelectedPR] = useState<PersonalRecord | null>(null);
  
  const { data: prData } = useSWR<{ prs: { distance: string; label: string; shortName: string; hasPR: boolean; time: string | null; timeSeconds: number | null; pace: string | null; achievedAt: string | null }[] }>(
    "/api/personal-records",
    fetcher
  );
  
  const { data: runsData } = useSWR<{ runs: { miles: number; pace?: string; duration_minutes?: number; date: string }[] }>(
    !prData?.prs ? "/api/runs?days=365" : null,
    fetcher
  );

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
          color: distConfig?.color || "#FFD700",
        };
      })
    : calculatePRs(runsData?.runs || []);
    
  const earnedRecords = personalRecords.filter(pr => pr.time !== "--:--");
  const earnedCount = earnedRecords.length;

  // Get top 3 PRs for podium (by most recent or most impressive)
  const topPRs = earnedRecords.slice(0, 3);

  return (
    <>
      <div className="glass-card-premium overflow-hidden">
        {/* Header with gold accent */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        
        <div className="p-5">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.15) 100%)',
                  boxShadow: '0 0 20px rgba(251,191,36,0.2)'
                }}
              >
                <Trophy className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Hall of Fame</h3>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">
                  {earnedCount > 0 ? `${earnedCount} Record${earnedCount > 1 ? 's' : ''} Set` : 'Your Legacy Awaits'}
                </p>
              </div>
            </div>
            {earnedCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Medal className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">{earnedCount}/{personalRecords.length}</span>
              </div>
            )}
          </div>

          {/* Podium Display - Show top 3 earned PRs */}
          {topPRs.length > 0 && (
            <div className="mb-5">
              <div className="flex items-end justify-center gap-2 h-32">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  {topPRs[1] && (
                    <button
                      onClick={() => setSelectedPR(topPRs[1])}
                      className="flex flex-col items-center group"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                        style={{ 
                          background: `linear-gradient(135deg, ${topPRs[1].color}30 0%, ${topPRs[1].color}10 100%)`,
                          border: `1px solid ${topPRs[1].color}40`
                        }}
                      >
                        <topPRs[1].icon className="w-5 h-5" style={{ color: topPRs[1].color }} />
                      </div>
                      <span className="text-[10px] text-white/60 font-medium">{topPRs[1].shortName}</span>
                    </button>
                  )}
                  <div className="w-16 h-16 bg-gradient-to-t from-[#C0C0C0]/20 to-[#C0C0C0]/5 rounded-t-lg flex items-end justify-center pb-1 border-t border-x border-[#C0C0C0]/30">
                    <span className="text-lg font-black text-[#C0C0C0]">2</span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  {topPRs[0] && (
                    <button
                      onClick={() => setSelectedPR(topPRs[0])}
                      className="flex flex-col items-center group"
                    >
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                        style={{ 
                          background: `linear-gradient(135deg, #FFD70040 0%, #FFD70015 100%)`,
                          border: `1px solid #FFD70060`,
                          boxShadow: '0 0 20px rgba(255,215,0,0.3)'
                        }}
                      >
                        <topPRs[0].icon className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="text-xs text-amber-400 font-bold">{topPRs[0].shortName}</span>
                    </button>
                  )}
                  <div className="w-20 h-24 bg-gradient-to-t from-amber-500/20 to-amber-500/5 rounded-t-lg flex items-end justify-center pb-1 border-t border-x border-amber-500/40">
                    <Crown className="w-6 h-6 text-amber-400 mb-1" />
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  {topPRs[2] && (
                    <button
                      onClick={() => setSelectedPR(topPRs[2])}
                      className="flex flex-col items-center group"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                        style={{ 
                          background: `linear-gradient(135deg, ${topPRs[2].color}30 0%, ${topPRs[2].color}10 100%)`,
                          border: `1px solid ${topPRs[2].color}40`
                        }}
                      >
                        <topPRs[2].icon className="w-5 h-5" style={{ color: topPRs[2].color }} />
                      </div>
                      <span className="text-[10px] text-white/60 font-medium">{topPRs[2].shortName}</span>
                    </button>
                  )}
                  <div className="w-16 h-12 bg-gradient-to-t from-[#CD7F32]/20 to-[#CD7F32]/5 rounded-t-lg flex items-end justify-center pb-1 border-t border-x border-[#CD7F32]/30">
                    <span className="text-lg font-black text-[#CD7F32]">3</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Medal Ribbon - All distances */}
          <div className="relative">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3 font-semibold">All Distances</p>
            
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {personalRecords.map((pr) => {
                const hasPR = pr.time !== "--:--";
                const Icon = pr.icon;
                
                return (
                  <button
                    key={pr.shortName}
                    onClick={() => setSelectedPR(pr)}
                    className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl transition-all ${
                      hasPR 
                        ? 'bg-[#1C1C1E] border border-white/10 hover:border-white/20' 
                        : 'bg-white/[0.02] border border-dashed border-white/10 hover:border-white/20'
                    }`}
                    style={{ minWidth: '72px' }}
                  >
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                        hasPR ? '' : 'opacity-40'
                      }`}
                      style={{ 
                        background: hasPR 
                          ? `linear-gradient(135deg, ${pr.color}25 0%, ${pr.color}10 100%)`
                          : 'rgba(255,255,255,0.05)',
                        border: hasPR ? `1px solid ${pr.color}40` : '1px dashed rgba(255,255,255,0.1)'
                      }}
                    >
                      <Icon 
                        className="w-5 h-5" 
                        style={{ color: hasPR ? pr.color : 'rgba(255,255,255,0.3)' }} 
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${hasPR ? 'text-white' : 'text-white/40'}`}>
                      {pr.shortName}
                    </span>
                    <span 
                      className="text-[11px] font-mono font-bold mt-0.5"
                      style={{ color: hasPR ? pr.color : 'rgba(255,255,255,0.25)' }}
                    >
                      {hasPR ? pr.time : '—:——'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            onClick={() => setSelectedPR(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xs overflow-hidden rounded-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #1A1A1C 0%, #0D0D0F 100%)',
                border: `2px solid ${selectedPR.color}40`
              }}
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedPR(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Top glow */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30"
                style={{ background: selectedPR.color }}
              />

              <div className="relative p-6 pt-8 text-center">
                {/* Medal icon */}
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{ 
                    background: selectedPR.time !== "--:--"
                      ? `linear-gradient(135deg, ${selectedPR.color} 0%, ${selectedPR.color}80 100%)`
                      : 'rgba(255,255,255,0.05)',
                    boxShadow: selectedPR.time !== "--:--" ? `0 8px 32px ${selectedPR.color}50` : 'none',
                    border: selectedPR.time === "--:--" ? '2px dashed rgba(255,255,255,0.2)' : 'none'
                  }}
                >
                  <selectedPR.icon 
                    className="w-10 h-10" 
                    style={{ color: selectedPR.time !== "--:--" ? '#fff' : 'rgba(255,255,255,0.3)' }} 
                  />
                </div>

                {/* Distance name */}
                <h3 className="text-2xl font-black text-white mb-1">{selectedPR.distance}</h3>
                <p className="text-sm text-white/50 mb-5">{selectedPR.motivationalText}</p>

                {selectedPR.time !== "--:--" ? (
                  <>
                    {/* Time display - Racing bib style */}
                    <div 
                      className="inline-block px-6 py-4 rounded-xl mb-4"
                      style={{ 
                        background: 'linear-gradient(180deg, #0A0A0A 0%, #151515 100%)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Timer className="w-4 h-4 text-white/40 mr-2" />
                        <span 
                          className="text-4xl font-mono font-black tracking-tight"
                          style={{ color: selectedPR.color }}
                        >
                          {selectedPR.time}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-white/40">
                      Achieved on{' '}
                      <span className="text-white/70 font-medium">
                        {new Date(selectedPR.date).toLocaleDateString("en-US", { 
                          month: "long", 
                          day: "numeric", 
                          year: "numeric" 
                        })}
                      </span>
                    </p>
                  </>
                ) : (
                  <div className="py-4">
                    <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
                      <span className="text-3xl text-white/30">?</span>
                    </div>
                    <p className="text-white/50 mb-2">No record yet</p>
                    <p className="text-sm text-white/30">
                      Run {selectedPR.miles} miles to claim this record
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
