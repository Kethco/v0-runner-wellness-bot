"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, ClipboardCheck, Bell, ChevronRight, Check, Sparkles, 
  BarChart3, Shield, UserPlus, Send, Trophy, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";

interface CoachOnboardingProps {
  userName: string;
  teamName?: string;
  onComplete: () => void;
}

const STEPS = [
  {
    id: "welcome",
    title: "Welcome, Coach",
    subtitle: "Your athletes' wellness hub",
    color: "#5856D6",
    gradient: "from-[#5856D6] via-[#6366F1] to-[#818CF8]",
  },
  {
    id: "how-it-works",
    title: "How It Works",
    subtitle: "A smarter way to coach",
    color: "#00D4FF",
    gradient: "from-[#00D4FF] via-[#00C7FF] to-[#5AC8FA]",
  },
  {
    id: "setup",
    title: "Set Up Your Program",
    subtitle: "Give your team an identity",
    color: "#30D158",
    gradient: "from-[#30D158] via-[#34C759] to-[#32D74B]",
  },
  {
    id: "invite",
    title: "Invite Athletes",
    subtitle: "Get your team on board",
    color: "#FF9500",
    gradient: "from-[#FF9500] via-[#FFAA33] to-[#FFB84D]",
  },
  {
    id: "ready",
    title: "You're All Set!",
    subtitle: "Your coaching hub awaits",
    color: "#FFD700",
    gradient: "from-[#FFD700] via-[#FFC000] to-[#FFB800]",
  },
];

const SPORT_OPTIONS = [
  { label: "Cross Country", value: "cross_country" },
  { label: "Track & Field", value: "track" },
  { label: "Road Running", value: "road" },
  { label: "Trail Running", value: "trail" },
  { label: "General Fitness", value: "general" },
];

// Floating particles component
function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-30"
          style={{ backgroundColor: color }}
          initial={{
            x: Math.random() * 400 - 200,
            y: Math.random() * 800,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, -100],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: Math.random() * 4 + 4,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}
    </div>
  );
}

export function CoachOnboarding({ userName, teamName: initialTeamName, onComplete }: CoachOnboardingProps) {
  const [step, setStep] = useState(0);
  const [programName, setProgramName] = useState(initialTeamName || "");
  const [sportType, setSportType] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedAthletes, setInvitedAthletes] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentStep = STEPS[step];

  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#5856D6", "#00D4FF", "#30D158", "#FF9500", "#FFD700"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  useEffect(() => {
    if (step === STEPS.length - 1) {
      setShowCelebration(true);
      fireConfetti();
    }
  }, [step, fireConfetti]);

  const handleAddAthlete = () => {
    if (inviteEmail && !invitedAthletes.includes(inviteEmail)) {
      setInvitedAthletes([...invitedAthletes, inviteEmail]);
      setInviteEmail("");
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Save onboarding data
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarded: true,
          program_name: programName || undefined,
          sport_type: sportType || undefined,
        }),
      });
      
      // Send invites if any
      if (invitedAthletes.length > 0) {
        await fetch("/api/coach/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: invitedAthletes }),
        });
      }
      
      onComplete();
    }
  };

  const canAdvance = () => {
    if (step === 2) return programName.trim() !== ""; // must have program name
    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(circle at 30% 20%, ${currentStep.color}15 0%, transparent 50%)`,
            `radial-gradient(circle at 70% 80%, ${currentStep.color}15 0%, transparent 50%)`,
            `radial-gradient(circle at 30% 20%, ${currentStep.color}15 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      {/* Floating particles */}
      <FloatingParticles color={currentStep.color} />

      {/* Animated orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-[100px] opacity-20"
        animate={{
          backgroundColor: currentStep.color,
          x: ["-20%", "120%", "-20%"],
          y: ["10%", "60%", "10%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Progress bar with step count */}
      <div className="absolute top-8 left-0 right-0 px-6 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/50 font-medium">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs text-white/50">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: currentStep.color }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full pt-20 pb-8 px-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex-1 flex flex-col overflow-y-auto py-4"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentStep.gradient} flex items-center justify-center mb-8 shadow-lg`}
                  style={{ boxShadow: `0 20px 40px ${currentStep.color}40` }}
                >
                  <Users className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Hey Coach {userName || ""}!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-white/60 mb-8"
                >
                  {currentStep.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1C1E] border border-white/10"
                >
                  <Shield className="w-4 h-4 text-[#5856D6]" />
                  <span className="text-sm text-white/60">Trusted by 500+ coaches</span>
                </motion.div>
              </div>
            )}

            {/* Step 1: How It Works */}
            {step === 1 && (
              <div className="flex-1 flex flex-col">
                <h1 className="text-2xl font-bold text-white text-center mb-2">{currentStep.title}</h1>
                <p className="text-white/60 text-center mb-8">{currentStep.subtitle}</p>
                
                <div className="space-y-4">
                  {[
                    { icon: UserPlus, title: "Invite Your Athletes", desc: "Send invite links via email or text - they sign up in seconds", color: "#5856D6" },
                    { icon: ClipboardCheck, title: "Daily Wellness Check-ins", desc: "Athletes report sleep, energy, and soreness each morning", color: "#00D4FF" },
                    { icon: BarChart3, title: "Real-Time Dashboard", desc: "See your entire team's wellness status at a glance", color: "#30D158" },
                    { icon: Bell, title: "Smart Alerts", desc: "Get notified when an athlete might be at risk for injury", color: "#FF9500" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-[#1C1C1E]/80 border border-white/[0.06] backdrop-blur-sm"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <item.icon className="w-6 h-6" style={{ color: item.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-white/50 mt-0.5">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Setup Program */}
            {step === 2 && (
              <div className="flex-1 flex flex-col">
                <h1 className="text-2xl font-bold text-white text-center mb-2">{currentStep.title}</h1>
                <p className="text-white/60 text-center mb-8">{currentStep.subtitle}</p>

                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="text-sm text-white/60 font-medium mb-2 block">
                      Program / Team Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Lincoln High XC"
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      className="bg-[#1C1C1E] border-white/10 text-white h-12 focus:border-[#30D158]"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="text-sm text-white/60 font-medium mb-3 block">Sport Type</label>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_OPTIONS.map((opt, i) => (
                        <motion.button
                          key={opt.value}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          onClick={() => setSportType(opt.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            sportType === opt.value
                              ? "bg-[#30D158] text-white"
                              : "bg-[#1C1C1E] text-white/60 border border-white/10 hover:border-white/20"
                          }`}
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Step 3: Invite Athletes */}
            {step === 3 && (
              <div className="flex-1 flex flex-col">
                <h1 className="text-2xl font-bold text-white text-center mb-2">{currentStep.title}</h1>
                <p className="text-white/60 text-center mb-6">{currentStep.subtitle}</p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="athlete@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddAthlete()}
                      className="bg-[#1C1C1E] border-white/10 text-white h-12 flex-1"
                    />
                    <Button 
                      onClick={handleAddAthlete}
                      disabled={!inviteEmail}
                      className="h-12 px-4 bg-[#FF9500] hover:bg-[#FF9500]/90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {invitedAthletes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <p className="text-xs text-white/40 uppercase tracking-wider">Pending Invites</p>
                      {invitedAthletes.map((email, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1E] border border-white/[0.06]">
                          <span className="text-sm text-white">{email}</span>
                          <Check className="w-4 h-4 text-[#30D158]" />
                        </div>
                      ))}
                    </motion.div>
                  )}

                  <p className="text-center text-white/40 text-sm mt-4">
                    You can always invite more athletes later from your dashboard
                  </p>
                </motion.div>
              </div>
            )}

            {/* Step 4: Ready */}
            {step === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${currentStep.gradient} flex items-center justify-center mb-8 shadow-lg`}
                  style={{ boxShadow: `0 20px 40px ${currentStep.color}40` }}
                >
                  <Trophy className="w-14 h-14 text-white" />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {currentStep.title}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-white/60 mb-8"
                >
                  {currentStep.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-3 gap-4 w-full max-w-xs"
                >
                  {[
                    { label: "Athletes", value: invitedAthletes.length || "0", icon: Users },
                    { label: "Alerts", value: "On", icon: Bell },
                    { label: "Ready", value: "Yes", icon: Heart },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#1C1C1E] border border-white/[0.06]">
                      <stat.icon className="w-5 h-5 text-[#FFD700] mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                      <p className="text-[10px] text-white/40 uppercase">{stat.label}</p>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom navigation */}
        <div className="mt-auto pt-4">
          {step > 0 && step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-white/50 text-sm mb-4 hover:text-white transition-colors"
            >
              Back
            </button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={!canAdvance()}
            className={`w-full h-14 rounded-2xl text-lg font-semibold transition-all ${
              canAdvance()
                ? `bg-gradient-to-r ${currentStep.gradient} hover:opacity-90 text-white shadow-lg`
                : "bg-[#2A2A2A] text-white/40 cursor-not-allowed"
            }`}
            style={canAdvance() ? { boxShadow: `0 8px 24px ${currentStep.color}30` } : {}}
          >
            {step === STEPS.length - 1 ? (
              <>Go to Dashboard</>
            ) : step === 3 ? (
              invitedAthletes.length > 0 ? (
                <>Send Invites & Continue <ChevronRight className="w-5 h-5 ml-1" /></>
              ) : (
                <>Skip for Now <ChevronRight className="w-5 h-5 ml-1" /></>
              )
            ) : (
              <>Continue <ChevronRight className="w-5 h-5 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
