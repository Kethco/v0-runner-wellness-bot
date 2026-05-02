"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function TrialBanner() {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !mounted) return;

    // Check if user is on free trial
    const plan = user.user_metadata?.plan;
    if (plan !== "free_trial") return;

    // Calculate days left from account creation
    const createdAt = new Date(user.created_at);
    const trialEndDate = new Date(createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDaysLeft(Math.max(0, diffDays));
  }, [user, mounted]);

  // Don't show if not on trial, dismissed, or not mounted
  if (!mounted || daysLeft === null || dismissed) return null;

  // Trial expired
  if (daysLeft === 0) {
    return (
      <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-bold text-foreground">Your free trial has ended</p>
              <p className="text-sm text-muted-foreground">Upgrade now to continue tracking your wellness</p>
            </div>
          </div>
          <Link href="/pricing">
            <Button size="sm" className="gap-2 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Trial active - show countdown
  const urgency = daysLeft <= 2 ? "high" : daysLeft <= 4 ? "medium" : "low";
  
  return (
    <div className={`rounded-lg p-4 mb-6 ${
      urgency === "high" 
        ? "bg-orange-500/20 border border-orange-500/30" 
        : urgency === "medium"
        ? "bg-yellow-500/20 border border-yellow-500/30"
        : "bg-primary/10 border border-primary/20"
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            urgency === "high" 
              ? "bg-orange-500/20" 
              : urgency === "medium"
              ? "bg-yellow-500/20"
              : "bg-primary/20"
          }`}>
            <Clock className={`w-5 h-5 ${
              urgency === "high" 
                ? "text-orange-500" 
                : urgency === "medium"
                ? "text-yellow-500"
                : "text-primary"
            }`} />
          </div>
          <div>
            <p className="font-bold text-foreground">
              {daysLeft === 1 ? "1 day left" : `${daysLeft} days left`} in your free trial
            </p>
            <p className="text-sm text-muted-foreground">
              {urgency === "high" 
                ? "Upgrade now to keep your data and streaks!" 
                : "Upgrade anytime to unlock all Pro features"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button size="sm" variant={urgency === "high" ? "default" : "outline"} className="gap-2 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              Upgrade
            </Button>
          </Link>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
