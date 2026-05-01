"use client";

import { useState } from "react";
import { Moon, Smile, Zap, Activity, Target, ChevronLeft, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CheckInModal({ open, onOpenChange }: CheckInModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleComplete = () => {
    setIsSubmitting(true);
    // For now, just show completion without API call
    // API integration will be added back once auth is working
    console.log("[v0] Check-in submitted:", { ...answers, notes });
    setIsComplete(true);
    
    setTimeout(() => {
      onOpenChange(false);
      setCurrentStep(0);
      setAnswers({});
      setNotes("");
      setIsComplete(false);
      setIsSubmitting(false);
    }, 2000);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
    setAnswers({});
    setNotes("");
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Check-in Complete!</h3>
            <p className="text-muted-foreground text-sm text-center">
              Great job staying consistent. Keep it up!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              >
                Skip
              </Button>
              <Button className="flex-1" onClick={handleComplete}>
                Complete
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
