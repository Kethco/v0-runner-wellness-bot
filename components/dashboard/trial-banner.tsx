"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, X, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "framer-motion";

export function TrialBanner() {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if dismissed recently (within this session)
    const dismissedKey = `trial-banner-dismissed-${new Date().toDateString()}`;
    if (sessionStorage.getItem(dismissedKey)) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!user || !mounted) return;

    // Check if user is on any free trial (athlete or coach)
    const plan = user.user_metadata?.plan;
    if (plan !== "free_trial" && plan !== "coach_trial") return;

    // Calculate days left from account creation
    const createdAt = new Date(user.created_at);
    const trialEndDate = new Date(createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDaysLeft(Math.max(0, diffDays));
  }, [user, mounted]);

  const handleDismiss = () => {
    setDismissed(true);
    const dismissedKey = `trial-banner-dismissed-${new Date().toDateString()}`;
    sessionStorage.setItem(dismissedKey, "true");
  };

  // Don't show if not on trial, dismissed, or not mounted
  if (!mounted || daysLeft === null || dismissed) return null;

  const isCoachTrial = user?.user_metadata?.plan === "coach_trial";
  const planName = isCoachTrial ? "Coach" : "Pro";

  // Trial expired
  if (daysLeft === 0) {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg pt-safe"
      >
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Trial Ended</p>
                <p className="text-xs opacity-90">Upgrade to keep your data</p>
              </div>
            </div>
            <Link href="/pricing">
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs h-8 bg-white text-red-600 hover:bg-white/90">
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // Urgency levels based on days left
  const urgency = daysLeft <= 1 ? "critical" : daysLeft <= 2 ? "high" : daysLeft <= 4 ? "medium" : "low";
  
  // Only show banner for urgent cases (4 days or less)
  if (urgency === "low") return null;

  const gradients = {
    critical: "from-red-600 to-orange-500",
    high: "from-orange-500 to-yellow-500",
    medium: "from-yellow-500 to-amber-400",
    low: "from-primary to-orange-500"
  };

  const messages = {
    critical: "Last day! Upgrade now to keep your data",
    high: `${daysLeft} days left - Don't lose your progress!`,
    medium: `${daysLeft} days left in your ${planName} trial`,
    low: `${daysLeft} days left in your free trial`
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r ${gradients[urgency]} text-white shadow-lg pt-safe`}
      >
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="font-semibold text-sm truncate">{messages[urgency]}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Link href="/pricing">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="gap-1 text-xs h-7 px-2.5 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Sparkles className="w-3 h-3" />
                  Upgrade
                </Button>
              </Link>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
