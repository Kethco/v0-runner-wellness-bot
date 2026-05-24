"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronRight, ChevronLeft, Activity, Brain, 
  Calendar, TrendingUp, Sparkles, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Runner Wellness",
    description: "Your personal running companion that helps you train smarter, recover better, and stay mentally strong.",
    icon: Sparkles,
    color: "#FF6B00",
    tips: [
      "Track your wellness with daily check-ins",
      "Get personalized AI coaching",
      "Build mental toughness for race day",
    ],
  },
  {
    id: "checkin",
    title: "Daily Check-Ins",
    description: "Start each day with a quick wellness check. We'll track your sleep, energy, soreness, and readiness to help optimize your training.",
    icon: Activity,
    color: "#30D158",
    tips: [
      "Takes only 30 seconds",
      "Builds your streak for consistency",
      "Triggers smart workout adjustments",
    ],
  },
  {
    id: "training",
    title: "Smart Training Plans",
    description: "Get personalized training plans that adapt to your wellness. If you're tired, we'll suggest an easier workout.",
    icon: Calendar,
    color: "#007AFF",
    tips: [
      "Plans adjust based on how you feel",
      "Track your runs and progress",
      "Build toward your race goals",
    ],
  },
  {
    id: "mind",
    title: "Mental Wellness",
    description: "Running is as much mental as physical. Access breathing exercises, sleep stories, and mental toughness training.",
    icon: Brain,
    color: "#AF52DE",
    tips: [
      "Pre-run and post-run breathing",
      "Sleep stories for recovery",
      "Race day mental prep",
    ],
  },
  {
    id: "progress",
    title: "Track Your Progress",
    description: "Watch your consistency grow with streaks, see your PRs, earn badges, and track your training load.",
    icon: TrendingUp,
    color: "#FF9500",
    tips: [
      "Streak calendar shows your dedication",
      "PR wall celebrates your records",
      "Training load prevents overtraining",
    ],
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const StepIcon = step.icon;

  const handleNext = () => {
    hapticLight();
    if (isLastStep) {
      hapticSuccess();
      setIsVisible(false);
      setTimeout(() => {
        localStorage.setItem("onboarding_completed", "true");
        onComplete();
      }, 300);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    hapticLight();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    hapticLight();
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem("onboarding_completed", "true");
      onComplete();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#1C1C1E] rounded-3xl overflow-hidden border border-[#3A3A3C]"
          >
            {/* Header */}
            <div className="relative p-6 pb-0">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-[#8E8E93]" />
              </button>
              
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                {ONBOARDING_STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep 
                        ? "w-6 bg-[#FF6B00]" 
                        : i < currentStep 
                          ? "w-1.5 bg-[#FF6B00]/50" 
                          : "w-1.5 bg-[#3A3A3C]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 pt-2"
              >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <StepIcon className="w-10 h-10" style={{ color: step.color }} />
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-3">
                  {step.title}
                </h2>

                {/* Description */}
                <p className="text-[#8E8E93] text-center text-sm leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Tips */}
                <div className="space-y-3 mb-6">
                  {step.tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${step.color}20` }}
                      >
                        <Check className="w-3 h-3" style={{ color: step.color }} />
                      </div>
                      <p className="text-sm text-white/80">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1 border-[#3A3A3C] text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1 text-[#8E8E93]"
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="flex-1 text-white"
                style={{ backgroundColor: step.color }}
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed");
    if (!completed) {
      setShowOnboarding(true);
    }
    setIsChecked(true);
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("onboarding_completed");
    setShowOnboarding(true);
  };

  return { showOnboarding, isChecked, completeOnboarding, resetOnboarding };
}
