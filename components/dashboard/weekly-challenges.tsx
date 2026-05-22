"use client";

import { useState, useMemo, useEffect } from "react";
import { Target, Trophy, Flame, Clock, Footprints, CheckCircle2, Sparkles } from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/contexts/auth-context";
import { celebrateChallengeComplete } from "@/lib/celebrations";
import { hapticLight } from "@/lib/haptics";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: "target" | "flame" | "clock" | "footprints" | "trophy";
  type: "runs" | "miles" | "streak" | "checkins" | "custom";
  target: number;
  current: number;
  unit: string;
  difficulty: "easy" | "medium" | "hard";
  xp: number;
  completed: boolean;
}

const ICON_MAP = {
  target: Target,
  flame: Flame,
  clock: Clock,
  footprints: Footprints,
  trophy: Trophy,
};

const DIFFICULTY_COLORS = {
  easy: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  medium: { bg: "bg-[#FF6B00]/10", border: "border-[#FF6B00]/30", text: "text-[#FF6B00]" },
  hard: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
};

function generateWeeklyChallenges(
  runs: Array<{ miles: number; date: string }>,
  checkins: Array<{ date: string }>,
  streak: number,
  weeklyGoal: number
): Challenge[] {
  // Get current week's data
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

  const weekRuns = runs.filter(r => r.date >= startOfWeekStr);
  const weekCheckins = checkins.filter(c => c.date >= startOfWeekStr);
  const weekMiles = weekRuns.reduce((sum, r) => sum + (r.miles || 0), 0);
  const runCount = weekRuns.length;
  const checkinCount = weekCheckins.length;

  // Dynamic challenges based on user's activity level
  const challenges: Challenge[] = [
    {
      id: "weekly-runs",
      name: "Consistent Runner",
      description: "Complete 3 runs this week",
      icon: "footprints",
      type: "runs",
      target: 3,
      current: runCount,
      unit: "runs",
      difficulty: "easy",
      xp: 50,
      completed: runCount >= 3,
    },
    {
      id: "weekly-miles",
      name: "Mile Crusher",
      description: `Run ${weeklyGoal} miles this week`,
      icon: "target",
      type: "miles",
      target: weeklyGoal,
      current: Math.round(weekMiles * 10) / 10,
      unit: "miles",
      difficulty: "medium",
      xp: 100,
      completed: weekMiles >= weeklyGoal,
    },
    {
      id: "daily-checkins",
      name: "Self-Aware",
      description: "Complete 5 wellness check-ins",
      icon: "clock",
      type: "checkins",
      target: 5,
      current: checkinCount,
      unit: "check-ins",
      difficulty: "easy",
      xp: 40,
      completed: checkinCount >= 5,
    },
    {
      id: "streak-builder",
      name: "Streak Builder",
      description: "Maintain a 7-day streak",
      icon: "flame",
      type: "streak",
      target: 7,
      current: streak,
      unit: "days",
      difficulty: "medium",
      xp: 75,
      completed: streak >= 7,
    },
    {
      id: "bonus-miles",
      name: "Overachiever",
      description: `Exceed your goal by 20%`,
      icon: "trophy",
      type: "miles",
      target: Math.round(weeklyGoal * 1.2),
      current: Math.round(weekMiles * 10) / 10,
      unit: "miles",
      difficulty: "hard",
      xp: 150,
      completed: weekMiles >= weeklyGoal * 1.2,
    },
  ];

  return challenges;
}

export function WeeklyChallenges() {
  const { user } = useAuth();
  const [celebratedIds, setCelebratedIds] = useState<Set<string>>(new Set());
  
  const { data: runsData } = useSWR(user ? "/api/runs?days=7" : null);
  const { data: checkinsData } = useSWR(user ? "/api/checkins?limit=7" : null);
  const { data: streakData } = useSWR(user ? "/api/streak" : null);
  const { data: profileData } = useSWR(user ? "/api/profile" : null);

  const runs = runsData?.runs || [];
  const checkins = checkinsData?.checkins || [];
  const streak = streakData?.streak?.current || 0;
  const weeklyGoal = profileData?.profile?.weekly_goal || 20;

  const challenges = useMemo(
    () => generateWeeklyChallenges(runs, checkins, streak, weeklyGoal),
    [runs, checkins, streak, weeklyGoal]
  );

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xp, 0);

  // Celebrate newly completed challenges
  challenges.forEach(challenge => {
    if (challenge.completed && !celebratedIds.has(challenge.id)) {
      // Only celebrate if this is a new completion (not on initial load)
      if (celebratedIds.size > 0 || runs.length > 0) {
        celebrateChallengeComplete(challenge.name);
      }
      setCelebratedIds(prev => new Set([...prev, challenge.id]));
    }
  });

  return (
    <div className="glass-card-premium overflow-hidden min-h-[280px]">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#FF6B00] flex items-center justify-center shadow-lg shadow-[#FF4500]/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Weekly Challenges</h3>
              <p className="text-xs text-white/50">{completedCount}/{challenges.length} completed</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="text-xs font-semibold text-[#FFD700]">{totalXP} XP</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            style={{ width: `${(completedCount / challenges.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-[#FF4500] to-[#30D158] rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* Challenges list */}
      <div className="p-3 space-y-2">
        {challenges.map((challenge) => {
          const IconComponent = ICON_MAP[challenge.icon];
          const difficultyStyle = DIFFICULTY_COLORS[challenge.difficulty];
          const progress = Math.min((challenge.current / challenge.target) * 100, 100);

          return (
            <div
              key={challenge.id}
              onClick={() => hapticLight()}
              className={`relative p-3 rounded-xl border transition-all ${
                challenge.completed
                  ? "bg-[#30D158]/5 border-[#30D158]/20"
                  : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
              }`}
            >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    challenge.completed 
                      ? "bg-[#30D158]/20" 
                      : difficultyStyle.bg
                  }`}>
                    {challenge.completed ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#30D158]" />
                    ) : (
                      <IconComponent className={`w-4.5 h-4.5 ${difficultyStyle.text}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${
                        challenge.completed ? "text-[#30D158]" : "text-white"
                      }`}>
                        {challenge.name}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${difficultyStyle.bg} ${difficultyStyle.text} font-medium uppercase`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{challenge.description}</p>
                    
                    {/* Progress */}
                    {!challenge.completed && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${progress}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              progress >= 100 
                                ? "bg-[#30D158]" 
                                : "bg-gradient-to-r from-[#FF4500] to-[#FF6B00]"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-white/40 font-medium">
                          {challenge.current}/{challenge.target} {challenge.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* XP reward */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                    challenge.completed 
                      ? "bg-[#FFD700]/10" 
                      : "bg-white/[0.03]"
                  }`}>
                    <Sparkles className={`w-3 h-3 ${
                      challenge.completed ? "text-[#FFD700]" : "text-white/30"
                    }`} />
                    <span className={`text-xs font-semibold ${
                      challenge.completed ? "text-[#FFD700]" : "text-white/30"
                    }`}>
                      {challenge.xp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
