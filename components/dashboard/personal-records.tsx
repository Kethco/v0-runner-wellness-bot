"use client";

import { Trophy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// PR distance definitions (in miles) with tolerance for matching
const PR_DISTANCES = [
  { name: "1 Mile", miles: 1, tolerance: 0.05 },
  { name: "5K", miles: 3.1, tolerance: 0.1 },
  { name: "10K", miles: 6.2, tolerance: 0.15 },
  { name: "Half", miles: 13.1, tolerance: 0.2 },
  { name: "Marathon", miles: 26.2, tolerance: 0.3 },
];

interface PersonalRecord {
  distance: string;
  time: string;
  timeSeconds: number;
  date: string;
  miles: number;
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
      prs.push({ distance: prDist.name, time: "--:--", timeSeconds: Infinity, date: "", miles: prDist.miles });
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
      time: bestRun?.time || "--:--",
      timeSeconds: bestRun?.timeSeconds || Infinity,
      date: bestRun?.date || "",
      miles: prDist.miles,
    });
  }
  
  return prs;
}

export function PersonalRecordsCard() {
  const { data: runsData } = useSWR<{ runs: { miles: number; pace?: string; duration_minutes?: number; date: string }[] }>(
    "/api/runs?days=365",
    fetcher
  );

  const runs = runsData?.runs || [];
  const personalRecords = calculatePRs(runs);
  const earnedCount = personalRecords.filter(pr => pr.time !== "--:--").length;

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-base">Personal Records</CardTitle>
            <CardDescription>
              {earnedCount} of {personalRecords.length} earned
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-5 gap-2">
          {personalRecords.map((pr) => {
            const hasPR = pr.time !== "--:--";
            
            return (
              <div 
                key={pr.distance}
                className={`relative rounded-xl p-2.5 text-center transition-all ${
                  hasPR 
                    ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30" 
                    : "bg-secondary/50 border border-border"
                }`}
              >
                {/* Trophy Icon */}
                <div className={`w-8 h-8 mx-auto mb-1.5 rounded-full flex items-center justify-center ${
                  hasPR 
                    ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/30" 
                    : "bg-muted"
                }`}>
                  <Trophy className={`w-4 h-4 ${hasPR ? "text-white" : "text-muted-foreground/50"}`} />
                </div>
                
                {/* Distance Label */}
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-0.5 ${
                  hasPR ? "text-amber-500/80" : "text-muted-foreground"
                }`}>
                  {pr.distance}
                </p>
                
                {/* Time */}
                <p className={`text-sm font-bold ${
                  hasPR ? "text-foreground" : "text-muted-foreground/40"
                }`}>
                  {hasPR ? pr.time : "---"}
                </p>
                
                {/* Earned Badge */}
                {hasPR && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
