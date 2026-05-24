"use client";

import { useState } from "react";
import { Moon, Smile, Zap, Activity, Target, ChevronLeft, Check, Loader2, SkipForward, AlertTriangle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { celebrateCheckin } from "@/lib/celebrations";

interface TodayWorkout {
  id: string;
  title: string;
  workout_type: string;
  target_miles: number;
  description?: string;
}

interface AdjustmentSuggestion {
  originalWorkout: string;
  adjustedWorkout: string;
  adjustedMiles: number;
  reason: string;
  explanation: string;
}

interface CheckInModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  todayWorkout?: TodayWorkout | null;
}

const STEPS = [
  {
    id: "sleep",
    title: "How was your sleep last night?",
    icon: Moon,
    options: [
      { value: "Poor", label: "Poor", emoji: "😴" },
      { value: "OK", label: "OK", emoji: "😐" },
      { value: "Good", label: "Good", emoji: "😊" },
      { value: "Great", label: "Great", emoji: "🌟" },
    ],
  },
  {
    id: "feeling",
    title: "How are you feeling overall?",
    icon: Smile,
    options: [
      { value: "Low", label: "Low", emoji: "😔" },
      { value: "Fine", label: "Fine", emoji: "😐" },
      { value: "Good", label: "Good", emoji: "😊" },
      { value: "Great", label: "Great", emoji: "🔥" },
    ],
  },
  {
    id: "energy",
    title: "What's your energy level?",
    icon: Zap,
    options: [
      { value: "1", label: "1", emoji: "⚡" },
      { value: "2", label: "2", emoji: "⚡⚡" },
      { value: "3", label: "3", emoji: "⚡⚡⚡" },
      { value: "4", label: "4", emoji: "⚡⚡⚡⚡" },
      { value: "5", label: "5", emoji: "⚡⚡⚡⚡⚡" },
    ],
  },
  {
    id: "soreness",
    title: "Any muscle soreness?",
    icon: Activity,
    options: [
      { value: "None", label: "None", emoji: "✅" },
      { value: "Mild", label: "Mild", emoji: "🟡" },
      { value: "Moderate", label: "Moderate", emoji: "🟠" },
      { value: "High", label: "High", emoji: "🔴" },
    ],
  },
  {
    id: "readiness",
    title: "Ready to train today?",
    icon: Target,
    options: [
      { value: "Yes", label: "Yes", emoji: "💪" },
      { value: "Maybe", label: "Maybe", emoji: "🤔" },
      { value: "No", label: "No", emoji: "🛑" },
    ],
  },
];

export function CheckInModal({ isOpen, onClose, open, onOpenChange, todayWorkout }: CheckInModalProps) {
  const isModalOpen = isOpen ?? open ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) onClose?.();
    onOpenChange?.(newOpen);
  };
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [showWorkoutActions, setShowWorkoutActions] = useState(false);
  const [skippingWorkout, setSkippingWorkout] = useState(false);
  const [adjustingWorkout, setAdjustingWorkout] = useState(false);
  const [adjustmentSuggestion, setAdjustmentSuggestion] = useState<AdjustmentSuggestion | null>(null);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isNotesStep = currentStep === STEPS.length;

  const handleSelect = (value: string) => {
    if (!step) return;
    setAnswers((prev) => ({ ...prev, [step.id]: value }));

    setTimeout(() => {
      if (isLastStep) {
        setCurrentStep(STEPS.length); // Go to notes
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }, 300);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Map answers to API format
      const sleepMap: Record<string, number> = { "Poor": 1, "OK": 2, "Good": 3, "Great": 4 };
      const readinessMap: Record<string, number> = { "No": 1, "Maybe": 3, "Yes": 5 };
      const sorenessMap: Record<string, number> = { "None": 1, "Mild": 2, "Moderate": 3, "High": 4 };
      
      const checkinData = {
        sleepRating: sleepMap[answers.sleep] || 3,
        feeling: answers.feeling?.toLowerCase(),
        energy: parseInt(answers.energy) || 3,
        soreness: sorenessMap[answers.soreness] || 1,
        readiness: readinessMap[answers.readiness] || 3,
        notes: notes || null,
      };

      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkinData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Check-in failed: ${data.error || "Unknown error"}`);
        setIsSubmitting(false);
        return;
      }
      
      const receivedAdvice = data.aiAdvice || null;
      setAiAdvice(receivedAdvice);
      setIsComplete(true);
      
      // Celebrate the check-in
      celebrateCheckin();
      setIsComplete(true);
      setAiAdvice(receivedAdvice);
      
      // Determine if we should show workout actions based on wellness
      // Show if: energy is low (1-2), soreness is high (3-4), readiness is low (No/Maybe), or sleep is poor
      const sleepPoor = ["Poor"].includes(answers.sleep);
      const energyLow = Number(answers.energy) <= 2;
      const sorenessHigh = ["Moderate", "High"].includes(answers.soreness);
      const readinessLow = ["No", "Maybe"].includes(answers.readiness);
      const wellnessIsPoor = (sleepPoor || energyLow || sorenessHigh || readinessLow) && todayWorkout && todayWorkout.workout_type !== "rest";
      
      // Generate adjustment suggestion with explanation
      if (wellnessIsPoor && todayWorkout) {
        const reasons: string[] = [];
        if (sleepPoor) reasons.push("poor sleep");
        if (energyLow) reasons.push("low energy");
        if (sorenessHigh) reasons.push("muscle soreness");
        if (readinessLow) reasons.push("not feeling ready");
        
        // Calculate readiness score (1-5)
        const sleepScore = { "Poor": 1, "OK": 2, "Good": 4, "Great": 5 }[answers.sleep] || 3;
        const energyScore = Number(answers.energy) || 3;
        const sorenessScore = { "None": 5, "Mild": 4, "Moderate": 2, "High": 1 }[answers.soreness] || 3;
        const readinessScore = { "No": 1, "Maybe": 3, "Yes": 5 }[answers.readiness] || 3;
        const avgReadiness = Math.round((sleepScore + energyScore + sorenessScore + readinessScore) / 4);
        
        // Generate specific adjustment based on workout type
        let adjustedType = "easy";
        let adjustedMiles = Math.min(todayWorkout.target_miles || 4, 3);
        let explanation = "";
        
        if (todayWorkout.workout_type === "intervals" || todayWorkout.workout_type === "tempo") {
          adjustedMiles = Math.min(todayWorkout.target_miles || 4, 4);
          explanation = `High-intensity workouts stress your body. With ${reasons.join(" and ")}, pushing hard today could lead to overtraining or injury. An easy run keeps you moving without the added stress.`;
        } else if (todayWorkout.workout_type === "long") {
          adjustedMiles = Math.round((todayWorkout.target_miles || 10) * 0.6);
          explanation = `Long runs are demanding. Your ${reasons.join(" and ")} today means your body needs more recovery. A shorter run maintains your routine while respecting your body's signals.`;
        } else {
          adjustedMiles = Math.min(todayWorkout.target_miles || 4, 3);
          explanation = `Even easy runs can feel hard when you're experiencing ${reasons.join(" and ")}. Taking it extra light today helps you recover faster for stronger runs ahead.`;
        }
        
        setAdjustmentSuggestion({
          originalWorkout: `${todayWorkout.title} (${todayWorkout.target_miles} mi)`,
          adjustedWorkout: `Easy Run (${adjustedMiles} mi)`,
          adjustedMiles,
          reason: reasons.join(", "),
          explanation,
        });
      }
      
      setShowWorkoutActions(!!wellnessIsPoor);
      
      setTimeout(() => {
        if (!showWorkoutActions) {
          handleOpenChange(false);
          setCurrentStep(0);
          setAnswers({});
          setNotes("");
          setIsComplete(false);
          setIsSubmitting(false);
          setAiAdvice(null);
          setShowWorkoutActions(false);
          window.location.reload();
        }
      }, receivedAdvice ? 8000 : 3000); // Show longer if AI advice or workout actions present
    } catch (error) {
      console.error("[v0] Check-in error:", error);
      alert("Failed to submit check-in. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

const handleClose = () => {
  handleOpenChange(false);
  onClose?.();
    setCurrentStep(0);
    setAnswers({});
    setNotes("");
    setIsComplete(false);
    setShowWorkoutActions(false);
    setAdjustmentSuggestion(null);
  };

  const handleAdjustWorkout = async () => {
    if (!todayWorkout || !adjustmentSuggestion) return;
    setAdjustingWorkout(true);
    try {
      const response = await fetch(`/api/training-plan/week`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          workoutId: todayWorkout.id,
          adjustedWorkout: {
            workoutType: "easy",
            title: "Adjusted: Easy Run",
            description: adjustmentSuggestion.explanation,
            targetMiles: adjustmentSuggestion.adjustedMiles,
            targetPaceZone: "easy",
          },
          reason: `Wellness adjustment - ${adjustmentSuggestion.reason}`,
        }),
      });
      if (response.ok) {
        handleOpenChange(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to adjust workout:", error);
    } finally {
      setAdjustingWorkout(false);
    }
  };

  const handleSkipWorkout = async () => {
    if (!todayWorkout) return;
    setSkippingWorkout(true);
    try {
      const response = await fetch(`/api/training-plan/week`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "skip",
          workoutId: todayWorkout.id,
          reason: "Low wellness - " + [
            answers.sleep === "Poor" ? "poor sleep" : null,
            Number(answers.energy) <= 2 ? "low energy" : null,
            ["Moderate", "High"].includes(answers.soreness) ? "high soreness" : null,
            ["No", "Maybe"].includes(answers.readiness) ? "not ready" : null,
          ].filter(Boolean).join(", "),
        }),
      });
      if (response.ok) {
        handleOpenChange(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to skip workout:", error);
    } finally {
      setSkippingWorkout(false);
    }
  };

  if (isComplete) {
    return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Check-in Complete!</h3>
            <p className="text-muted-foreground text-sm text-center mb-4">
              Great job staying consistent. Keep it up!
            </p>
            
            {aiAdvice && (
              <div className="w-full bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">AI Coach Says</p>
                <p className="text-sm text-foreground">{aiAdvice}</p>
              </div>
            )}
            
            {showWorkoutActions && todayWorkout && adjustmentSuggestion && (
              <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-500">Workout Adjustment Suggested</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {adjustmentSuggestion.originalWorkout} → {adjustmentSuggestion.adjustedWorkout}
                    </p>
                  </div>
                </div>
                
                {/* Explanation Card */}
                <div className="bg-background/50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-foreground mb-1">Why this change?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {adjustmentSuggestion.explanation}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-muted-foreground/30"
                    onClick={handleSkipWorkout}
                    disabled={skippingWorkout || adjustingWorkout}
                  >
                    {skippingWorkout ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <SkipForward className="w-4 h-4 mr-1" />
                    )}
                    Rest Instead
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleAdjustWorkout}
                    disabled={skippingWorkout || adjustingWorkout}
                  >
                    {adjustingWorkout ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Adjust Workout
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs text-muted-foreground"
                  onClick={() => {
                    handleClose();
                    window.location.reload();
                  }}
                >
                  Keep Original Workout
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1 flex justify-center">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i < currentStep
                        ? "bg-primary"
                        : i === currentStep
                        ? "bg-primary/50"
                        : "bg-secondary"
                    )}
                  />
                ))}
              </div>
            </div>
            {currentStep > 0 && <div className="w-8" />}
          </div>
          <DialogTitle className="text-center pt-2">
            {isNotesStep ? "Any notes to add?" : step?.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-center">
            {isNotesStep
              ? "Optional - share how you feel or any details"
              : `Question ${currentStep + 1} of ${STEPS.length}`}
          </p>
        </DialogHeader>

        {isNotesStep ? (
          <div className="py-4 space-y-4">
            <Textarea
              placeholder="Type your notes here or skip..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] bg-secondary border-border resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Skip"}
              </Button>
              <Button className="flex-1" onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 py-4">
            {step?.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  answers[step.id] === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary hover:border-primary/50 hover:bg-secondary/80"
                )}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
