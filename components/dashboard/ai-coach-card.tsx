"use client";

import { Sparkles, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { motion } from "framer-motion";

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

// Animated Brain SVG with neural pulse effect
function PulsingBrain() {
  return (
    <div className="relative w-10 h-10">
      {/* Pulsing glow rings */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#00D4FF] opacity-20"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.1, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#00D4FF] opacity-10"
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.05, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      
      {/* Main brain container */}
      <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-[#FF4500] to-[#00D4FF] flex items-center justify-center overflow-hidden">
        {/* Neural connection dots */}
        <motion.div
          className="absolute w-1 h-1 bg-white/60 rounded-full"
          style={{ top: '20%', left: '25%' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="absolute w-1 h-1 bg-white/60 rounded-full"
          style={{ top: '35%', right: '20%' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute w-1 h-1 bg-white/60 rounded-full"
          style={{ bottom: '30%', left: '30%' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <motion.div
          className="absolute w-1 h-1 bg-white/60 rounded-full"
          style={{ bottom: '25%', right: '25%' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
        />
        
        {/* Brain icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-5 h-5 text-white drop-shadow-lg"
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
          <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
          <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
          <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
          <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
          <path d="M6 18a4 4 0 0 1-1.967-.516" />
          <path d="M19.967 17.484A4 4 0 0 1 18 18" />
        </svg>
      </div>
    </div>
  );
}

export function AICoachCard() {
  // Fetch latest AI advice with auto-refresh every 30 seconds
  const { data, isLoading, mutate } = useSWR<AIAdviceResponse>(
    "/api/ai-advice",
    fetcher,
    { 
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const advice = data?.advice;
  const hasCheckedIn = data?.hasCheckedInToday;

  return (
    <Card className="bg-[#141414] border-[#2A2A2A] p-5 relative overflow-hidden">
      {/* Subtle gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF4500] via-[#00D4FF] to-[#AF52DE]" />
      
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#FF4500]/10 to-[#00D4FF]/5 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <PulsingBrain />
            <div>
              <p className="text-base font-bold text-white flex items-center gap-2">
                AI Coach
                <Sparkles className="w-4 h-4 text-[#00D4FF]" />
              </p>
              <p className="text-xs text-[#6E6E73]">
                Your personalized guidance companion
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-[#6E6E73] hover:text-white hover:bg-[#2A2A2A]"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isLoading && !advice ? (
          <div className="flex items-center gap-2 text-sm text-[#6E6E73]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Analyzing your wellness data...</span>
          </div>
        ) : advice ? (
          <div>
            <p className="text-sm text-[#E5E5EA] leading-relaxed whitespace-pre-line">
              {advice}
            </p>
            {data?.source === "sms" && (
              <p className="text-[10px] text-[#6E6E73] mt-2">
                Generated from your SMS check-in
              </p>
            )}
          </div>
        ) : hasCheckedIn ? (
          <p className="text-sm text-[#6E6E73]">
            Generating your personalized advice...
          </p>
        ) : (
          <p className="text-sm text-[#6E6E73]">
            Complete your daily check-in to get personalized AI coaching advice based on your wellness data.
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
          <p className="text-[10px] text-[#6E6E73]">
            Text <span className="font-mono text-[#FF4500]">ai</span> to +1 844 503 0386 anytime
          </p>
        </div>
      </div>
    </Card>
  );
}
