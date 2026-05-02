"use client";

import { Bot, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

interface AICoachResponse {
  advice: string;
  todayCheckin: {
    sleep: number;
    energy: number;
    soreness: number;
    readiness: number;
  } | null;
  weeklyStats: {
    avgSleep: string;
    avgEnergy: string;
    avgSoreness: string;
    avgReadiness: string;
    weeklyMiles: number;
  };
}

export function AICoachCard() {
  const { user } = useAuth();
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean | null>(null);

  const fetchAdvice = async () => {
    if (!user) {
      console.log("[v0] AI Coach - no user, skipping fetch");
      return;
    }
    
    console.log("[v0] AI Coach - fetching advice for user:", user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      console.log("[v0] AI Coach - response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log("[v0] AI Coach - error response:", errorData);
        throw new Error(errorData.error || "Failed to get advice");
      }
      
      const data: AICoachResponse = await response.json();
      console.log("[v0] AI Coach - received data:", { hasAdvice: !!data.advice, adviceLength: data.advice?.length });
      setAdvice(data.advice);
      setHasCheckedIn(data.todayCheckin !== null);
    } catch (err) {
      setError("Unable to load coaching advice");
      console.error("[v0] AI Coach error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAdvice();
    }
  }, [user]);

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
          onClick={fetchAdvice}
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
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : advice ? (
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
          {advice}
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
