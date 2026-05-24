"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from "swr";
import { 
  Users, UserPlus, Mail, Check, X, Flame, 
  TrendingUp, Calendar, Loader2, UserMinus, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { hapticSuccess, hapticLight } from "@/lib/haptics";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface BuddyStats {
  streak: number;
  activeToday: boolean;
  ranToday: boolean;
  weeklyMiles: number;
  lastCheckin: string | null;
  lastRun: { miles: number; date: string } | null;
}

interface BuddyData {
  connection: { id: string; connectedSince: string } | null;
  buddy: { id: string; name: string; firstName: string; avatarUrl: string | null } | null;
  buddyStats: BuddyStats | null;
  pendingInvite: { id: string; inviter: { first_name: string; last_name: string; email: string } } | null;
  sentInvite: { id: string; invited: { first_name: string; last_name: string; email: string } } | null;
}

export function RunningBuddy() {
  const { data, isLoading } = useSWR<BuddyData>("/api/accountability-buddy", fetcher);
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setIsInviting(true);
    try {
      const res = await fetch("/api/accountability-buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", email: email.trim() }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        hapticSuccess();
        toast({ title: "Invite sent!", description: "Waiting for them to accept." });
        setEmail("");
        setShowInviteForm(false);
        mutate("/api/accountability-buddy");
      }
    } catch {
      toast({ title: "Error", description: "Failed to send invite", variant: "destructive" });
    } finally {
      setIsInviting(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/accountability-buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", inviteId }),
      });
      
      if (res.ok) {
        hapticSuccess();
        toast({ title: "Buddy connected!", description: "You now have an accountability partner." });
        mutate("/api/accountability-buddy");
      }
    } catch {
      toast({ title: "Error", description: "Failed to accept invite", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setIsProcessing(true);
    try {
      await fetch("/api/accountability-buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", inviteId }),
      });
      mutate("/api/accountability-buddy");
    } catch {
      toast({ title: "Error", description: "Failed to decline invite", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBuddy = async () => {
    if (!confirm("Are you sure you want to remove your accountability buddy?")) return;
    
    setIsProcessing(true);
    try {
      await fetch("/api/accountability-buddy", { method: "DELETE" });
      toast({ title: "Buddy removed", description: "You can invite a new buddy anytime." });
      mutate("/api/accountability-buddy");
    } catch {
      toast({ title: "Error", description: "Failed to remove buddy", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 text-[#8E8E93] animate-spin" />
        </div>
      </div>
    );
  }

  // Has active buddy connection
  if (data?.connection && data?.buddy && data?.buddyStats) {
    const { buddy, buddyStats } = data;
    const daysSinceActive = buddyStats.lastCheckin 
      ? Math.floor((Date.now() - new Date(buddyStats.lastCheckin).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="icon-container p-2.5">
              <Users className="w-5 h-5 text-[#30D158]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Running Buddy</h3>
              <p className="text-xs text-[#8E8E93]">Accountability partner</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveBuddy}
            disabled={isProcessing}
            className="text-[#8E8E93] hover:text-red-400"
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        </div>

        <div className="premium-divider mb-4" />

        {/* Buddy Card */}
        <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[#2C2C2E]">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12 border-2 border-[#30D158]">
              <AvatarImage src={buddy.avatarUrl || undefined} />
              <AvatarFallback className="bg-[#30D158]/20 text-[#30D158] font-bold">
                {buddy.firstName?.charAt(0) || "B"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-white font-semibold">{buddy.name}</p>
              <p className="text-xs text-[#8E8E93]">
                {buddyStats.activeToday ? (
                  <span className="text-[#30D158]">Active today</span>
                ) : daysSinceActive !== null && daysSinceActive > 0 ? (
                  <span className="text-[#FF9500]">{daysSinceActive}d since last check-in</span>
                ) : (
                  "Connected"
                )}
              </p>
            </div>
            {buddyStats.activeToday && (
              <div className="w-3 h-3 rounded-full bg-[#30D158] animate-pulse" />
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className={`w-4 h-4 ${buddyStats.streak > 0 ? "text-[#FF6B00]" : "text-[#8E8E93]"}`} />
                <span className="text-lg font-bold text-white">{buddyStats.streak}</span>
              </div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider">Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-[#30D158]" />
                <span className="text-lg font-bold text-white">{buddyStats.weeklyMiles}</span>
              </div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider">Mi/Week</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className={`w-4 h-4 ${buddyStats.ranToday ? "text-[#30D158]" : "text-[#8E8E93]"}`} />
                <span className="text-lg font-bold text-white">
                  {buddyStats.ranToday ? "Yes" : "No"}
                </span>
              </div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider">Ran Today</p>
            </div>
          </div>

          {/* Nudge message */}
          {!buddyStats.activeToday && daysSinceActive !== null && daysSinceActive >= 2 && (
            <div className="mt-4 p-3 bg-[#FF9500]/10 rounded-lg border border-[#FF9500]/20">
              <p className="text-xs text-[#FF9500]">
                {buddy.firstName} hasn&apos;t checked in for {daysSinceActive} days. 
                Maybe send them an encouraging message?
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Has pending invite received
  if (data?.pendingInvite) {
    const inviter = data.pendingInvite.inviter;
    const inviterName = `${inviter.first_name || ""} ${inviter.last_name || ""}`.trim() || inviter.email;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-container p-2.5 bg-[#FF9500]/20">
            <UserPlus className="w-5 h-5 text-[#FF9500]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Buddy Invite</h3>
            <p className="text-xs text-[#8E8E93]">Someone wants to run with you</p>
          </div>
        </div>

        <div className="premium-divider mb-4" />

        <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[#FF9500]/30">
          <p className="text-white mb-1">
            <span className="font-semibold">{inviterName}</span> wants to be your accountability buddy
          </p>
          <p className="text-xs text-[#8E8E93] mb-4">
            You&apos;ll see each other&apos;s streaks and activity
          </p>

          <div className="flex gap-2">
            <Button
              onClick={() => handleDecline(data.pendingInvite!.id)}
              variant="outline"
              size="sm"
              className="flex-1 border-[#3A3A3C]"
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
            <Button
              onClick={() => handleAccept(data.pendingInvite!.id)}
              size="sm"
              className="flex-1 bg-[#30D158] hover:bg-[#30D158]/90 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Has sent invite pending
  if (data?.sentInvite) {
    const invited = data.sentInvite.invited;
    const invitedName = invited ? `${invited.first_name || ""} ${invited.last_name || ""}`.trim() || invited.email : "someone";

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-container p-2.5">
            <Users className="w-5 h-5 text-[#FF6B00]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Running Buddy</h3>
            <p className="text-xs text-[#8E8E93]">Invite pending</p>
          </div>
        </div>

        <div className="premium-divider mb-4" />

        <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[#3A3A3C]">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-[#FF9500] animate-spin" />
            <p className="text-sm text-white">
              Waiting for <span className="font-semibold">{invitedName}</span> to accept
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDecline(data.sentInvite!.id)}
            className="w-full border-[#3A3A3C] text-[#8E8E93]"
            disabled={isProcessing}
          >
            Cancel Invite
          </Button>
        </div>
      </motion.div>
    );
  }

  // No buddy - show invite form
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="icon-container p-2.5">
          <Users className="w-5 h-5 text-[#FF6B00]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Running Buddy</h3>
          <p className="text-xs text-[#8E8E93]">Find an accountability partner</p>
        </div>
      </div>

      <div className="premium-divider mb-4" />

      <AnimatePresence mode="wait">
        {showInviteForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-[#8E8E93]">
              Enter your friend&apos;s email (they must have an account)
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[#1C1C1E] border-[#3A3A3C]"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <Button
                onClick={handleInvite}
                disabled={isInviting || !email.trim()}
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              >
                {isInviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                hapticLight();
                setShowInviteForm(false);
              }}
              className="w-full text-[#8E8E93]"
            >
              Cancel
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[#2C2C2E] mb-4">
              <p className="text-sm text-[#8E8E93] mb-3">
                Pair with a friend to see each other&apos;s streaks and stay motivated together.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                <Check className="w-3 h-3 text-[#30D158]" />
                <span>See their streak and activity</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8E8E93] mt-1">
                <Check className="w-3 h-3 text-[#30D158]" />
                <span>Get notified if they go quiet</span>
              </div>
            </div>
            <Button
              onClick={() => {
                hapticLight();
                setShowInviteForm(true);
              }}
              className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            >
              <Mail className="w-4 h-4 mr-2" />
              Invite a Running Buddy
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
