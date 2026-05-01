"use client";

import { Bot, Sparkles, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const tips = [
  "Based on your high energy and low soreness, today is a great day for a tempo run! Consider 4-5 miles at marathon pace.",
  "Your sleep quality has improved this week. Keep up the consistency - aim for 7-8 hours to optimize recovery.",
  "You've been pushing hard this week. Consider an easy recovery run or rest day to prevent overtraining.",
  "Your readiness scores have been excellent. This is a good week to increase your weekly mileage by 10%.",
];

export function AICoachCard() {
  const [tipIndex, setTipIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
      setIsRefreshing(false);
    }, 500);
  };

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
              Personalized for you
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed">
        {tips[tipIndex]}
      </p>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Type <span className="font-mono text-primary">/ai</span> anytime for a fresh recommendation
        </p>
      </div>
    </Card>
  );
}
