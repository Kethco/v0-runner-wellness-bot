"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Zap, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AfternoonUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENERGY_OPTIONS = [
  { value: 1, label: "Empty", emoji: "1" },
  { value: 2, label: "Low", emoji: "2" },
  { value: 3, label: "Moderate", emoji: "3" },
  { value: 4, label: "Good", emoji: "4" },
  { value: 5, label: "Fully Charged", emoji: "5" },
];

const SORENESS_OPTIONS = [
  { value: "None", color: "bg-emerald-500 hover:bg-emerald-600" },
  { value: "Mild", color: "bg-yellow-500 hover:bg-yellow-600" },
  { value: "Moderate", color: "bg-orange-500 hover:bg-orange-600" },
  { value: "High", color: "bg-red-500 hover:bg-red-600" },
];

type Step = "energy" | "soreness" | "notes" | "complete";

export function AfternoonUpdateModal({ open, onOpenChange }: AfternoonUpdateModalProps) {
  const [step, setStep] = useState<Step>("energy");
  const [energy, setEnergy] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleEnergySelect = (value: number) => {
    setEnergy(value);
    setStep("soreness");
  };

  const handleSorenessSelect = (value: string) => {
    setSoreness(value);
    setStep("notes");
  };

  const handleSubmit = () => {
    // In real app, this would save the update
    setStep("complete");
    setTimeout(() => {
      resetAndClose();
    }, 2000);
  };

  const handleSkipNotes = () => {
    handleSubmit();
  };

  const resetAndClose = () => {
    setStep("energy");
    setEnergy(null);
    setSoreness(null);
    setNotes("");
    onOpenChange(false);
  };

  const getProgress = () => {
    switch (step) {
      case "energy": return 33;
      case "soreness": return 66;
      case "notes": return 90;
      case "complete": return 100;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        {step !== "complete" && (
          <Progress value={getProgress()} className="h-1 mb-2" />
        )}
        
        {step === "energy" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <DialogTitle>Afternoon Update</DialogTitle>
                  <DialogDescription>
                    Quick check on how you are feeling now
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-4">
              <h3 className="text-lg font-medium text-foreground mb-4">
                How is your energy level right now?
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {ENERGY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleEnergySelect(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg transition-all",
                      "bg-secondary hover:bg-primary/20 hover:ring-2 hover:ring-primary",
                      energy === option.value && "bg-primary/20 ring-2 ring-primary"
                    )}
                  >
                    <span className="text-xl font-bold text-primary">{option.emoji}</span>
                    <span className="text-xs text-muted-foreground text-center">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "soreness" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Muscle Soreness</DialogTitle>
                  <DialogDescription>
                    Any aches after your session?
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-4">
              <h3 className="text-lg font-medium text-foreground mb-4">
                How is your muscle soreness?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {SORENESS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSorenessSelect(option.value)}
                    className={cn(
                      "py-4 px-6 rounded-lg font-medium text-white transition-all",
                      option.color,
                      soreness === option.value && "ring-2 ring-white ring-offset-2 ring-offset-background"
                    )}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "notes" && (
          <>
            <DialogHeader>
              <DialogTitle>Any notes?</DialogTitle>
              <DialogDescription>
                Optional - add details about your session or how you are feeling
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Textarea
                placeholder="e.g. Did 5K tempo run, legs felt heavy..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary border-border min-h-[100px]"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleSkipNotes}>
                Skip
              </Button>
              <Button onClick={handleSubmit}>
                Submit Update
              </Button>
            </div>
          </>
        )}

        {step === "complete" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Update Logged!
            </h3>
            <p className="text-muted-foreground">
              Energy: {energy}/5 | Soreness: {soreness}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
