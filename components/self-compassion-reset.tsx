"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, RefreshCw, Sparkles, 
  ChevronRight, Check, X, ArrowRight, 
  Coffee, Moon, Music, Bath, BookOpen, Flower2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SelfCompassionResetProps {
  triggerType?: "bad_run" | "low_energy" | "high_soreness" | "manual";
  onComplete?: () => void;
  onDismiss?: () => void;
}

// Cognitive reframing suggestions based on common running negative thoughts
const reframeSuggestions = [
  {
    negative: "I'm so slow, I'll never get faster",
    reframe: "Every run builds endurance. Speed comes with consistency, not perfection.",
  },
  {
    negative: "I had to walk, I failed",
    reframe: "Walking is part of running. Even elites take walk breaks. You showed up.",
  },
  {
    negative: "Everyone else is better than me",
    reframe: "Comparison steals joy. Your only competition is who you were yesterday.",
  },
  {
    negative: "I should have pushed harder",
    reframe: "Listening to your body is wisdom, not weakness. Rest builds strength.",
  },
  {
    negative: "I'm not a real runner",
    reframe: "If you run, you're a runner. There's no speed requirement, no distance minimum.",
  },
  {
    negative: "This was a waste of time",
    reframe: "No run is wasted. Even a hard day trains your mind and moves your body.",
  },
];

// Self-kindness micro-actions
const kindnessActions = [
  { id: "tea", icon: Coffee, label: "Make yourself a warm drink", time: "5 min" },
  { id: "rest", icon: Moon, label: "Take a 10-minute rest", time: "10 min" },
  { id: "music", icon: Music, label: "Listen to a favorite song", time: "3 min" },
  { id: "stretch", icon: Bath, label: "Take a warm shower or bath", time: "15 min" },
  { id: "read", icon: BookOpen, label: "Read something uplifting", time: "10 min" },
  { id: "nature", icon: Flower2, label: "Step outside for fresh air", time: "5 min" },
];

export function SelfCompassionReset({ 
  triggerType = "manual", 
  onComplete, 
  onDismiss 
}: SelfCompassionResetProps) {
  const [step, setStep] = useState(0);
  const [moodBefore, setMoodBefore] = useState<number>(2);
  const [situation, setSituation] = useState("");
  const [initialFeelings, setInitialFeelings] = useState("");
  const [friendAdvice, setFriendAdvice] = useState("");
  const [selectedReframe, setSelectedReframe] = useState<typeof reframeSuggestions[0] | null>(null);
  const [customReframe, setCustomReframe] = useState("");
  const [selectedKindness, setSelectedKindness] = useState<string | null>(null);
  const [moodAfter, setMoodAfter] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    { title: "Acknowledge", subtitle: "What happened?" },
    { title: "Friend Test", subtitle: "Show yourself compassion" },
    { title: "Reframe", subtitle: "Find a new perspective" },
    { title: "Self-Kindness", subtitle: "One small act of care" },
    { title: "Reflect", subtitle: "How do you feel now?" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/resilience-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_type: triggerType,
          situation,
          initial_feelings: initialFeelings,
          friend_advice: friendAdvice,
          reframe: customReframe || selectedReframe?.reframe,
          kindness_action: selectedKindness,
          kindness_completed: true,
          mood_before: moodBefore,
          mood_after: moodAfter,
        }),
      });
      onComplete?.();
    } catch (error) {
      console.error("Error saving resilience entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const moodLabels = ["Rough", "Low", "Okay", "Good", "Great"];
  const moodColors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#10B981"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-gradient-to-b from-[#1A1A1C] to-[#0D0D0F] rounded-3xl overflow-hidden border border-white/10"
      >
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Self-Compassion Reset</h2>
              <p className="text-xs text-white/50">Be kind to yourself</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-rose-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {/* Step 0: Acknowledge */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-white font-semibold mb-1">{steps[0].title}</h3>
                  <p className="text-white/50 text-sm">{steps[0].subtitle}</p>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                    How are you feeling right now?
                  </label>
                  <div className="flex justify-between gap-2">
                    {moodLabels.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setMoodBefore(i + 1)}
                        className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                          moodBefore === i + 1
                            ? "bg-white/10 text-white border border-white/20"
                            : "text-white/40 hover:text-white/60"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                    What happened? (optional)
                  </label>
                  <textarea
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="A tough run, missed goal, feeling discouraged..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                    What are you telling yourself?
                  </label>
                  <textarea
                    value={initialFeelings}
                    onChange={(e) => setInitialFeelings(e.target.value)}
                    placeholder="I'm not good enough, I should have..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 resize-none"
                    rows={2}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 1: Friend Test */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-white font-semibold mb-1">{steps[1].title}</h3>
                  <p className="text-white/50 text-sm">{steps[1].subtitle}</p>
                </div>

                <div className="bg-gradient-to-br from-rose-500/10 to-purple-500/10 rounded-xl p-4 border border-rose-500/20">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-rose-400 mt-0.5" />
                    <div>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Imagine a close friend came to you feeling exactly the way you do now. 
                        What would you say to comfort them?
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                    What would you tell your friend?
                  </label>
                  <textarea
                    value={friendAdvice}
                    onChange={(e) => setFriendAdvice(e.target.value)}
                    placeholder="You'd probably say something kind and understanding..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 resize-none"
                    rows={4}
                  />
                </div>

                <p className="text-white/40 text-xs italic text-center">
                  Now offer those same words to yourself.
                </p>
              </motion.div>
            )}

            {/* Step 2: Reframe */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-white font-semibold mb-1">{steps[2].title}</h3>
                  <p className="text-white/50 text-sm">{steps[2].subtitle}</p>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {reframeSuggestions.slice(0, 4).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedReframe(suggestion)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedReframe === suggestion
                          ? "bg-rose-500/20 border border-rose-500/40"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <p className="text-white/40 text-xs line-through mb-1">
                        {suggestion.negative}
                      </p>
                      <p className="text-white text-sm">{suggestion.reframe}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                    Or write your own reframe
                  </label>
                  <textarea
                    value={customReframe}
                    onChange={(e) => {
                      setCustomReframe(e.target.value);
                      setSelectedReframe(null);
                    }}
                    placeholder="A kinder way to see this situation..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 resize-none"
                    rows={2}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Self-Kindness Action */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-white font-semibold mb-1">{steps[3].title}</h3>
                  <p className="text-white/50 text-sm">{steps[3].subtitle}</p>
                </div>

                <p className="text-white/60 text-sm">
                  Choose one small act of self-care to do right now:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {kindnessActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => setSelectedKindness(action.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedKindness === action.id
                          ? "bg-rose-500/20 border border-rose-500/40"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <action.icon className={`w-5 h-5 mb-2 ${
                        selectedKindness === action.id ? "text-rose-400" : "text-white/40"
                      }`} />
                      <p className="text-white text-xs font-medium">{action.label}</p>
                      <p className="text-white/40 text-[10px]">{action.time}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Reflect */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-white font-semibold mb-1">{steps[4].title}</h3>
                  <p className="text-white/50 text-sm">{steps[4].subtitle}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <p className="text-white/80 text-sm">
                      You showed up for yourself today. That takes courage.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                    How are you feeling now?
                  </label>
                  <div className="flex justify-between gap-2">
                    {moodLabels.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setMoodAfter(i + 1)}
                        className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                          moodAfter === i + 1
                            ? "text-white border border-white/20"
                            : "text-white/40 hover:text-white/60"
                        }`}
                        style={{
                          backgroundColor: moodAfter === i + 1 ? `${moodColors[i]}20` : "transparent",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {moodAfter > moodBefore && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-2"
                  >
                    <p className="text-emerald-400 text-sm font-medium">
                      Your mood improved by {moodAfter - moodBefore} {moodAfter - moodBefore === 1 ? "level" : "levels"}
                    </p>
                  </motion.div>
                )}

                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs">
                    <span className="text-rose-400">Remember:</span> This entry is saved to your Resilience Journal. 
                    You can revisit your reframes and growth anytime.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Back
            </Button>
          )}
          
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white border-0"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {isSaving ? "Saving..." : "Complete"}
              <Check className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
