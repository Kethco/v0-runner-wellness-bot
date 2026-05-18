"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Heart, Target, ChevronRight, Check, Sparkles, 
  Zap, Brain, TrendingUp, Star, Award, Moon, Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";

interface OnboardingProps {
  userName: string;
  onComplete: () => void;
}

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Runner Wellness",
    subtitle: "Your intelligent running companion",
    color: "#FF4500",
    gradient: "from-[#FF4500] via-[#FF6B35] to-[#FF8C00]",
  },
  {
    id: "benefits",
    title: "Train Smarter, Not Harder",
    subtitle: "Here's what makes us different",
    color: "#30D158",
    gradient: "from-[#30D158] via-[#34C759] to-[#32D74B]",
  },
  {
    id: "personalize",
    title: "Let's Personalize",
    subtitle: "Tell us about your running",
    color: "#00D4FF",
    gradient: "from-[#00D4FF] via-[#00C7FF] to-[#5AC8FA]",
  },
  {
    id: "goal",
    title: "What's Your Goal?",
    subtitle: "We'll create a plan just for you",
    color: "#AF52DE",
    gradient: "from-[#AF52DE] via-[#BF5AF2] to-[#DA70D6]",
  },
  {
    id: "ready",
    title: "You're All Set!",
    subtitle: "Your journey starts now",
    color: "#FFD700",
    gradient: "from-[#FFD700] via-[#FFC000] to-[#FFB800]",
  },
];

const GOAL_OPTIONS = [
  { label: "Stay Healthy", value: "health", desc: "Run for wellness", icon: Heart, color: "#30D158" },
  { label: "5K Race", value: "5k", desc: "3.1 miles", icon: Zap, color: "#00D4FF" },
  { label: "10K Race", value: "10k", desc: "6.2 miles", icon: TrendingUp, color: "#FF9500" },
  { label: "Half Marathon", value: "half", desc: "13.1 miles", icon: Award, color: "#AF52DE" },
  { label: "Marathon", value: "marathon", desc: "26.2 miles", icon: Star, color: "#FF4500" },
  { label: "Just Explore", value: "explore", desc: "Check it out", icon: Sparkles, color: "#FFD700" },
];

const EXPERIENCE_OPTIONS = [
  { label: "New Runner", value: "beginner", desc: "Just getting started", miles: "0-10 miles/week" },
  { label: "Regular Runner", value: "intermediate", desc: "Running consistently", miles: "10-30 miles/week" },
  { label: "Experienced", value: "advanced", desc: "Training seriously", miles: "30+ miles/week" },
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

export function Onboarding({ userName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [weeklyMiles, setWeeklyMiles] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const currentStep = STEPS[step];

  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#FFD700", "#FF4500", "#30D158", "#00D4FF", "#AF52DE"];

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

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarded: true,
          weekly_goal: weeklyMiles ? Number(weeklyMiles) : undefined,
          experience_level: experience || undefined,
          initial_goal: selectedGoal || undefined,
        }),
      });
      onComplete();
    }
  };

  const canAdvance = () => {
    if (step === 2) return experience !== ""; // must pick experience
    if (step === 3) return selectedGoal !== ""; // must pick a goal
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
            <span className="text-xs text-[#8E8E93] font-medium">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs text-[#8E8E93]">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
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
                  <Activity className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Hey {userName || "Runner"}!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-[#8E8E93] mb-8"
                >
                  {currentStep.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1C1E] border border-[#2A2A2A]"
                >
                  <div className="flex -space-x-2">
                    {["#FF4500", "#30D158", "#00D4FF"].map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-black"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-[#8E8E93]">Join 10,000+ runners</span>
                </motion.div>
              </div>
            )}

            {/* Step 1: Benefits */}
            {step === 1 && (
              <div className="flex-1 flex flex-col">
                <h1 className="text-2xl font-bold text-white text-center mb-2">{currentStep.title}</h1>
                <p className="text-[#8E8E93] text-center mb-8">{currentStep.subtitle}</p>
                
                <div className="space-y-4">
                  {[
                    { icon: Brain, title: "Adaptive Training Plans", desc: "Plans that adjust to how you feel, not rigid schedules", color: "#AF52DE" },
                    { icon: Heart, title: "Wellness-First Approach", desc: "Track sleep, energy & soreness to prevent injury", color: "#FF4500" },
                    { icon: Sparkles, title: "AI-Powered Coaching", desc: "Personalized advice based on your unique data", color: "#00D4FF" },
                    { icon: Moon, title: "Life-Aware Scheduling", desc: "Training adapts to travel, illness, and busy times", color: "#FFD700" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-[#1C1C1E]/80 border border-[#2A2A2A] backdrop-blur-sm"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <item.icon className="w-6 h-6" style={{ color: item.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-[#8E8E93] mt-0.5">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Personalize */}
            {step === 2 && (
              <div className="flex-1 flex flex-col">
                <h1 className="text-2xl font-bold text-white text-center mb-2">{currentStep.title}</h1>
                <p className="text-[#8E8E93] text-center mb-8">{currentStep.subtitle}</p>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-[#8E8E93] font-medium mb-3 block">Your running experience</label>
                    <div className="space-y-3">
                      {EXPERIENCE_OPTIONS.map((opt, i) => (
                        <motion.button
                          key={opt.value}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.1 }}
                          onClick={() => setExperience(opt.value)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all ${
                            experience === opt.value
                              ? "border-[#00D4FF] bg-[#00D4FF]/10 shadow-lg shadow-[#00D4FF]/10"
                              : "border-[#2A2A2A] bg-[#1C1C1E] hover:border-[#3A3A3A]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${experience === opt.value ? "text-[#00D4FF]" : "text-white"}`}>
                                {opt.label}
                              </p>
                              <p className="text-sm text-[#6E6E73] mt-0.5">{opt.desc}</p>
                            </div>
                            <span className="text-xs text-[#6E6E73] bg-[#2A2A2A] px-2 py-1 rounded-full">
                              {opt.miles}
                            </span>
                          </div>
                          {experience === opt.value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#00D4FF] flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="text-sm text-[#8E8E93] font-medium mb-2 block">
                      Current weekly miles <span className="text-[#6E6E73]">(optional)</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      value={weeklyMiles}
                      onChange={(e) => setWeeklyMiles(e.target.value)}
                      className="bg-[#1C1C1E] border-[#2A2A2A] text-white h-12"
                    />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Step 3: Goal */}
            {step === 3 && (
              <div className="flex-1 flex flex-col">
                <h1 className="text-2xl font-bold text-white text-center mb-2">{currentStep.title}</h1>
                <p className="text-[#8E8E93] text-center mb-6">{currentStep.subtitle}</p>

                <div className="grid grid-cols-2 gap-3">
                  {GOAL_OPTIONS.map((goal, i) => (
                    <motion.button
                      key={goal.value}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.05, type: "spring" }}
                      onClick={() => setSelectedGoal(goal.value)}
                      className={`relative p-4 rounded-2xl border text-center transition-all ${
                        selectedGoal === goal.value
                          ? "border-transparent bg-gradient-to-br shadow-lg"
                          : "border-[#2A2A2A] bg-[#1C1C1E] hover:border-[#3A3A3A]"
                      }`}
                      style={selectedGoal === goal.value ? {
                        background: `linear-gradient(135deg, ${goal.color}20, ${goal.color}05)`,
                        borderColor: goal.color,
                        boxShadow: `0 8px 24px ${goal.color}20`,
                      } : {}}
                    >
                      <div 
                        className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 transition-all"
                        style={{ 
                          backgroundColor: selectedGoal === goal.value ? `${goal.color}30` : "#2A2A2A",
                        }}
                      >
                        <goal.icon 
                          className="w-6 h-6 transition-colors" 
                          style={{ color: selectedGoal === goal.value ? goal.color : "#6E6E73" }}
                        />
                      </div>
                      <p className={`font-semibold text-sm ${selectedGoal === goal.value ? "text-white" : "text-[#C7C7CC]"}`}>
                        {goal.label}
                      </p>
                      <p className="text-xs text-[#6E6E73] mt-1">{goal.desc}</p>
                      
                      {selectedGoal === goal.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: goal.color }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Ready */}
            {step === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="relative mb-8"
                >
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${currentStep.gradient} flex items-center justify-center shadow-2xl`}
                    style={{ boxShadow: `0 20px 60px ${currentStep.color}50` }}
                  >
                    <Check className="w-14 h-14 text-white" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4"
                    style={{ borderColor: currentStep.color }}
                    animate={{ scale: [1, 1.3, 1.3], opacity: [0.5, 0, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {currentStep.title}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-[#8E8E93] mb-8"
                >
                  {currentStep.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 gap-3 w-full max-w-xs"
                >
                  {[
                    { icon: Sun, label: "Daily Check-in", color: "#FFD700" },
                    { icon: Activity, label: "Log Runs", color: "#FF4500" },
                    { icon: Brain, label: "AI Coach", color: "#00D4FF" },
                    { icon: Heart, label: "Mind & Soul", color: "#AF52DE" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2A2A2A] flex items-center gap-2"
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      <span className="text-sm text-white font-medium">{item.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="mt-auto pt-4"
        >
          <Button
            onClick={handleNext}
            disabled={!canAdvance()}
            className={`w-full h-14 text-lg font-bold rounded-2xl gap-2 transition-all ${
              canAdvance() 
                ? `bg-gradient-to-r ${currentStep.gradient} hover:opacity-90 shadow-lg` 
                : "bg-[#3A3A3C]"
            }`}
            style={canAdvance() ? { boxShadow: `0 8px 24px ${currentStep.color}40` } : {}}
          >
            {step === STEPS.length - 1 ? "Start Your Journey" : "Continue"}
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          {step > 0 && step < STEPS.length - 1 && (
            <button
              onClick={handleNext}
              className="w-full mt-4 text-center text-[#6E6E73] text-sm hover:text-white transition-colors"
            >
              Skip for now
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
