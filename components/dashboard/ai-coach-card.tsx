"use client";

import { Bot, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
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

export function AICoachCard() {
  // Fetch latest AI advice with auto-refresh every 30 seconds
  const { data, error, isLoading, mutate } = useSWR<AIAdviceResponse>(
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
    <Card className="bg-card border-border p-5 relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5">
              AI Training Advice
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {hasCheckedIn === false ? "Check in for personalized advice" : "Personalized for you"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
          onClick={() => mutate()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading && !advice ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Analyzing your wellness data...</span>
        </div>
      ) : advice ? (
        <div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {advice}
          </p>
          {data?.source === "sms" && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Generated from your SMS check-in
            </p>
          )}
        </div>
      ) : hasCheckedIn ? (
        <p className="text-sm text-muted-foreground">
          Generating your personalized advice...
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Complete your daily check-in to get personalized AI coaching advice based on your wellness data.
        </p>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Text <span className="font-mono text-primary">ai</span> to +1 844 503 0386 anytime
        </p>
      </div>
    </Card>
  );
}
