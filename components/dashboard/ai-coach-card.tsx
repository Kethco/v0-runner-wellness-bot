"use client";

import { useMemo } from "react";
import { Sparkles, RefreshCw, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

interface AIAdviceResponse {
  advice: string | null;
  source: string | null;
  hasCheckedInToday: boolean;
  todayCheckin: {
    sleep_rating: number;
    energy: number;
    soreness: number;
    readiness: number;
  } | null;
}

// Coach personality
const COACH = {
  name: "Coach Alex",
};

interface CoachMessage {
  greeting: string;
  observation: string;
  suggestion: string;
  tone: "energetic" | "gentle" | "motivational" | "caring";
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function generateCoachMessage(
  checkin: AIAdviceResponse["todayCheckin"] | null,
  hasCheckedIn: boolean
): CoachMessage {
  const timeOfDay = getTimeOfDay();
  
  // Time-based greetings
  const greetings = {
    morning: ["Good morning!", "Rise and shine!", "Morning!"],
    afternoon: ["Hey there!", "Good afternoon!", "Hi!"],
    evening: ["Good evening!", "Hope you had a great day!"],
    night: ["Still up?", "Evening!"],
  };
  const greeting = greetings[timeOfDay][Math.floor(Math.random() * greetings[timeOfDay].length)];

  if (!hasCheckedIn || !checkin) {
    return {
      greeting,
      observation: timeOfDay === "morning" 
        ? "Haven't checked in yet today?" 
        : "How are you feeling today?",
      suggestion: "A quick wellness check-in helps me give you personalized advice!",
      tone: "gentle",
    };
  }

  const { sleep_rating, energy, soreness, readiness } = checkin;
  let observation = "";
  let suggestion = "";
  let tone: CoachMessage["tone"] = "motivational";

  // Low energy + poor sleep
  if (energy <= 2 && sleep_rating <= 2) {
    observation = "I notice you're feeling tired and didn't sleep well.";
    suggestion = timeOfDay === "morning" 
      ? "Consider a light 15-20 minute walk instead of a hard workout. Recovery is training too!"
      : "Get to bed early tonight - your body is asking for rest.";
    tone = "caring";
  }
  // High soreness
  else if (soreness >= 4) {
    observation = "Your muscles are quite sore today.";
    suggestion = "Focus on foam rolling and gentle stretching. Maybe a yoga session would help with recovery.";
    tone = "gentle";
  }
  // Great readiness
  else if (readiness >= 4 && energy >= 4) {
    observation = "You're feeling strong and ready today!";
    suggestion = "This is a great day to push a bit harder. Your body is primed for performance!";
    tone = "energetic";
  }
  // Good sleep but moderate energy
  else if (sleep_rating >= 4 && energy >= 3) {
    observation = "Good rest last night!";
    suggestion = "You've got a solid foundation today. Trust your training and enjoy the run!";
    tone = "motivational";
  }
  // Moderate energy
  else if (energy >= 3) {
    observation = "You're in a good spot today.";
    suggestion = "Listen to your body and enjoy whatever movement feels right.";
    tone = "motivational";
  }
  // Low readiness
  else if (readiness <= 2) {
    observation = "Your body needs some extra care today.";
    suggestion = "Light movement, hydration, and good nutrition will help you bounce back.";
    tone = "caring";
  }
  // Default
  else {
    observation = "Every day is different, and that's okay.";
    suggestion = "Do what feels right - even a short walk counts as progress.";
    tone = "caring";
  }

  return { greeting, observation, suggestion, tone };
}

const TONE_STYLES = {
  energetic: {
    gradient: "from-[#FF4500] to-[#FFD700]",
    iconBg: "bg-gradient-to-br from-[#FF4500] to-[#FF6B00]",
    iconShadow: "shadow-[#FF4500]/30",
    accentLine: "from-[#FF4500] via-[#FFD700] to-[#FF4500]",
    glowColor: "from-[#FF4500]/15 to-[#FFD700]/10",
  },
  gentle: {
    gradient: "from-[#AF52DE] to-[#00D4FF]",
    iconBg: "bg-gradient-to-br from-[#AF52DE] to-[#00D4FF]",
    iconShadow: "shadow-[#AF52DE]/30",
    accentLine: "from-[#AF52DE] via-[#00D4FF] to-[#AF52DE]",
    glowColor: "from-[#AF52DE]/15 to-[#00D4FF]/10",
  },
  motivational: {
    gradient: "from-[#00D4FF] to-[#30D158]",
    iconBg: "bg-gradient-to-br from-[#00D4FF] to-[#30D158]",
    iconShadow: "shadow-[#00D4FF]/30",
    accentLine: "from-[#00D4FF] via-[#30D158] to-[#00D4FF]",
    glowColor: "from-[#00D4FF]/15 to-[#30D158]/10",
  },
  caring: {
    gradient: "from-[#FF6B6B] to-[#AF52DE]",
    iconBg: "bg-gradient-to-br from-[#FF6B6B] to-[#AF52DE]",
    iconShadow: "shadow-[#FF6B6B]/30",
    accentLine: "from-[#FF6B6B] via-[#AF52DE] to-[#FF6B6B]",
    glowColor: "from-[#FF6B6B]/15 to-[#AF52DE]/10",
  },
};

export function AICoachCard() {
  const { data, isLoading, mutate } = useSWR<AIAdviceResponse>(
    "/api/ai-advice",
    fetcher,
    { 
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnMount: true,
    }
  );

  const hasCheckedIn = data?.hasCheckedInToday ?? false;
  const checkin = data?.todayCheckin ?? null;
  const apiAdvice = data?.advice;

  const coachMessage = useMemo(
    () => generateCoachMessage(checkin, hasCheckedIn),
    [checkin, hasCheckedIn]
  );

  const style = TONE_STYLES[coachMessage.tone];

  return (
    <div className="glass-card-premium relative overflow-hidden min-h-[180px]">
      {/* Gradient accent line at top */}
      <div className={`h-[2px] bg-gradient-to-r ${style.accentLine}`} />
      
      {/* Ambient glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${style.glowColor} rounded-full blur-3xl`} />
      
      <div className="relative z-10 p-5">
        <div className="flex items-start gap-4">
          {/* Coach Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${style.gradient} opacity-30`} />
            <div className={`relative w-12 h-12 rounded-xl ${style.iconBg} shadow-lg ${style.iconShadow} flex items-center justify-center`}>
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{COACH.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI Coach
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-white/30 hover:text-white hover:bg-white/5"
                onClick={() => mutate()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            
            {isLoading && !apiAdvice && !checkin ? (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing your wellness data...</span>
              </div>
            ) : apiAdvice ? (
              // Show API-generated advice if available
              <div className="space-y-2">
                <p className={`text-base font-semibold bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`}>
                  {coachMessage.greeting}
                </p>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                  {apiAdvice}
                </p>
              </div>
            ) : (
              // Show generated contextual message
              <div className="space-y-2">
                <p className={`text-base font-semibold bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`}>
                  {coachMessage.greeting}
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  {coachMessage.observation}
                </p>
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  {coachMessage.suggestion}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Wellness Check-in Prompt (if not checked in) */}
        {!hasCheckedIn && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-xs text-white/50 text-center">
              Complete your daily check-in for personalized advice
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
