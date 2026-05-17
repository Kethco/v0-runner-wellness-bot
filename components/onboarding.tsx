"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Heart, Target, ChevronRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OnboardingProps {
  userName: string;
  onComplete: () => void;
}

const STEPS = [
  {
    id: "welcome",
    icon: Activity,
    title: "Welcome to Runner Wellness",
    subtitle: "Your journey to better running starts here",
    color: "#FF4500",
  },
  {
    id: "profile",
    icon: Heart,
    title: "Tell Us About You",
    subtitle: "So we can personalize your experience",
    color: "#30D158",
  },
  {
    id: "goals",
    icon: Target,
    title: "Set Your First Goal",
    subtitle: "What are you training for?",
    color: "#00D4FF",
  },
  {
    id: "ready",
    icon: Sparkles,
    title: "You're All Set!",
    subtitle: "Start your wellness journey today",
    color: "#FFD700",
  },
];

const GOAL_OPTIONS = [
  { label: "Stay healthy", value: "health", desc: "Run for wellness and injury prevention" },
  { label: "Run a 5K", value: "5k", desc: "Build up to 3.1 miles" },
  { label: "Run a 10K", value: "10k", desc: "Train for 6.2 miles" },
  { label: "Half Marathon", value: "half", desc: "Conquer 13.1 miles" },
  { label: "Full Marathon", value: "marathon", desc: "The ultimate 26.2 miles" },
  { label: "Just explore", value: "explore", desc: "Check out the app first" },
];

export function Onboarding({ userName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");

  const currentStep = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Save onboarding state and goal
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true, weekly_goal: weeklyGoal ? Number(weeklyGoal) : undefined }),
      });
      onComplete();
    }
  };

  const canAdvance = () => {
    if (step === 1) return true; // profile step is optional
    if (step === 2) return selectedGoal !== ""; // must pick a goal
    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] opacity-30"
          animate={{ backgroundColor: currentStep.color }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Progress dots */}
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-2 z-10">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full"
            animate={{
              width: i === step ? 24 : 8,
              backgroundColor: i <= step ? currentStep.color : "#3A3A3C",
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full pt-24 pb-12 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Icon */}
            <motion.div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
              style={{ backgroundColor: `${currentStep.color}20` }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <currentStep.icon className="w-10 h-10" style={{ color: currentStep.color }} />
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white text-center mb-2 text-balance">
              {step === 0 ? `Hey ${userName || "Runner"}!` : currentStep.title}
            </h1>
            <p className="text-[#8E8E93] text-center text-lg mb-8">
              {currentStep.subtitle}
            </p>

            {/* Step-specific content */}
            <div className="flex-1">
              {step === 0 && (
                <div className="space-y-4 max-w-sm mx-auto">
                  {[
                    { icon: Heart, text: "Track sleep, energy, and soreness daily", color: "#30D158" },
                    { icon: Activity, text: "Log runs and see your progress", color: "#FF4500" },
                    { icon: Sparkles, text: "Get personalized AI coaching", color: "#00D4FF" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-[#1C1C1E] border border-[#2A2A2A]"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <p className="text-white text-sm font-medium">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div className="space-y-2">
                    <label className="text-sm text-[#8E8E93] font-medium">Weekly mileage goal (optional)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 15 miles per week"
                      value={weeklyGoal}
                      onChange={(e) => setWeeklyGoal(e.target.value)}
                      className="bg-[#1C1C1E] border-[#2A2A2A] text-white text-lg h-14"
                    />
                    <p className="text-xs text-[#6E6E73]">You can always change this later</p>
                  </div>

                  <div className="pt-4 space-y-3">
                    <p className="text-sm text-[#8E8E93] font-medium">Quick start tips:</p>
                    {[
                      "Do your first check-in after this setup",
                      "Log your next run to start tracking",
                      "Check the Mind page for breathing exercises",
                    ].map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#30D158]/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-[#30D158]" />
                        </div>
                        <p className="text-sm text-[#C7C7CC]">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {GOAL_OPTIONS.map((goal, i) => (
                    <motion.button
                      key={goal.value}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      onClick={() => setSelectedGoal(goal.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedGoal === goal.value
                          ? "border-[#00D4FF] bg-[#00D4FF]/10"
                          : "border-[#2A2A2A] bg-[#1C1C1E]"
                      }`}
                    >
                      <p className={`font-bold text-sm ${selectedGoal === goal.value ? "text-[#00D4FF]" : "text-white"}`}>
                        {goal.label}
                      </p>
                      <p className="text-xs text-[#6E6E73] mt-1">{goal.desc}</p>
                    </motion.button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF6B00] flex items-center justify-center"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>

                  <div className="space-y-3 w-full">
                    {[
                      { text: "Daily check-in", desc: "Log how you feel each day" },
                      { text: "Log your runs", desc: "Track miles, pace, and effort" },
                      { text: "AI Coach", desc: "Get personalized daily advice" },
                      { text: "Mind & Soul", desc: "Breathing and visualization tools" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1E] border border-[#2A2A2A]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-[#FFD700]" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{item.text}</p>
                          <p className="text-xs text-[#6E6E73]">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="w-full h-14 text-lg font-bold rounded-xl gap-2"
            style={{ backgroundColor: canAdvance() ? currentStep.color : "#3A3A3C", color: "#fff" }}
          >
            {step === STEPS.length - 1 ? "Let's Go!" : "Continue"}
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          {step > 0 && step < STEPS.length - 1 && (
            <button
              onClick={handleNext}
              className="w-full mt-3 text-center text-[#6E6E73] text-sm hover:text-white transition-colors"
            >
              Skip for now
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
