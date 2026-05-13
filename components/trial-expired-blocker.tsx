"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Sparkles, Clock, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

// Routes that should never show the trial blocker
const EXCLUDED_ROUTES = ["/pricing", "/login", "/signup", "/auth", "/join", "/terms", "/privacy", "/help", "/account/cancel"];

export function TrialExpiredBlocker() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [trialExpired, setTrialExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || isLoading || !mounted) return;
    
    // Don't show blocker on excluded routes (pricing, login, etc.)
    if (EXCLUDED_ROUTES.some(route => pathname?.startsWith(route))) return;

    // Check if user is on a free trial plan
    const plan = user.user_metadata?.plan;
    
    // Athletes invited by coaches don't have trial expiration - coach pays
    if (plan === "coach_athlete") return;
    
    // Paid plans don't expire
    if (plan === "pro" || plan === "coach_pro") return;
    
    // Only check trial expiration for free trial plans
    if (plan !== "free_trial" && plan !== "coach_trial") return;

    // Calculate if trial has expired
    const createdAt = new Date(user.created_at);
    const trialEndDate = new Date(createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    const now = new Date();
    if (now > trialEndDate) {
      setTrialExpired(true);
    }
  }, [user, isLoading, mounted, pathname]);

  // Don't show on excluded routes
  if (EXCLUDED_ROUTES.some(route => pathname?.startsWith(route))) return null;
  
  if (!mounted || isLoading || !trialExpired) return null;

  const isCoachTrial = user?.user_metadata?.plan === "coach_trial";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="max-w-md w-full bg-[#1C1C1E] rounded-3xl p-8 text-center border border-[#3A3A3C]"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF4500]/20 to-[#FF6B00]/20 flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#FF4500]" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          Your Free Trial Has Ended
        </h1>
        <p className="text-[#AEAEB2] mb-8">
          Upgrade to {isCoachTrial ? "Coach Pro" : "Pro"} to continue tracking your running journey and keep all your data.
        </p>

        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center gap-3 text-white">
            <CheckCircle className="w-5 h-5 text-[#30D158]" />
            <span>Unlimited run logging</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <CheckCircle className="w-5 h-5 text-[#30D158]" />
            <span>Daily wellness check-ins</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <CheckCircle className="w-5 h-5 text-[#30D158]" />
            <span>AI-powered coaching advice</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <CheckCircle className="w-5 h-5 text-[#30D158]" />
            <span>Keep all your existing data</span>
          </div>
        </div>

        <Link href="/pricing" className="block">
          <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#FF4500] to-[#FF6B00] hover:from-[#FF5500] hover:to-[#FF7B00] text-white rounded-xl shadow-lg shadow-[#FF4500]/30">
            <Sparkles className="w-5 h-5 mr-2" />
            Upgrade Now
          </Button>
        </Link>
        
        <p className="text-[#8E8E93] text-sm mt-4">
          Starting at $9.99/month
        </p>

        <Link href="/account/cancel" className="block mt-6">
          <button className="text-[#8E8E93] text-sm hover:text-[#FF3B30] transition-colors">
            Cancel account and delete my data
          </button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// Countdown component to show remaining trial time
export function TrialCountdown() {
  const { user, isLoading } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || isLoading || !mounted) return;

    // Check if user is on a free trial plan
    const plan = user.user_metadata?.plan;
    
    // Athletes invited by coaches don't see countdown - coach pays
    if (plan === "coach_athlete") return;
    
    // Paid plans don't show countdown
    if (plan === "pro" || plan === "coach_pro") return;
    
    // Only show countdown for free trial plans
    if (plan !== "free_trial" && plan !== "coach_trial") return;

    const calculateTimeLeft = () => {
      const createdAt = new Date(user.created_at);
      const trialEndDate = new Date(createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      const now = new Date();
      const diffMs = trialEndDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user, isLoading, mounted]);

  if (!mounted || !timeLeft) return null;

  return (
    <Link href="/pricing">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF4500]/10 to-[#FF6B00]/10 border border-[#FF4500]/30"
      >
        <Clock className="w-4 h-4 text-[#FF4500]" />
        <div className="text-xs">
          <span className="text-[#FF4500] font-bold">
            {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
            {timeLeft.hours}h {timeLeft.minutes}m
          </span>
          <span className="text-[#AEAEB2] ml-1">left</span>
        </div>
      </motion.div>
    </Link>
  );
}
