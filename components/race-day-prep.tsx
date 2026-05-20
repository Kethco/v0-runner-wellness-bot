"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flag, Heart, Wind, Sparkles, ChevronRight, ChevronLeft,
  Target, Flame, Mountain, Clock, Check, X
} from "lucide-react";
import { GuidedBreathing } from "./guided-breathing";

interface RaceDayPrepProps {
  onClose: () => void;
  raceName?: string;
}

const ANXIETY_LEVELS = [
  { level: 1, label: "Calm", color: "emerald", emoji: "😌" },
  { level: 2, label: "Slight nerves", color: "green", emoji: "🙂" },
  { level: 3, label: "Moderate", color: "yellow", emoji: "😐" },
  { level: 4, label: "Anxious", color: "orange", emoji: "😰" },
  { level: 5, label: "Very anxious", color: "red", emoji: "😣" },
];

const MANTRAS = [
  { text: "I've done the work. Trust the training.", category: "confidence" },
  { text: "One mile at a time. One step at a time.", category: "focus" },
  { text: "I am stronger than I think.", category: "strength" },
  { text: "This discomfort is temporary. Pride is forever.", category: "pushing" },
  { text: "I belong here. I earned this.", category: "confidence" },
  { text: "Relax. Breathe. Run.", category: "calm" },
  { text: "My body knows what to do.", category: "trust" },
  { text: "I run with gratitude.", category: "gratitude" },
  { text: "Strong legs. Strong heart. Strong mind.", category: "strength" },
  { text: "The finish line is waiting for me.", category: "motivation" },
];

const VISUALIZATION_PROMPTS = [
  "Picture yourself at the starting line. Feel the energy of the crowd.",
  "Imagine hitting your stride in mile 2. Your breathing is steady.",
  "See yourself pushing through the hardest mile. You're still moving.",
  "Visualize the final stretch. You hear cheers. You're almost there.",
  "Cross the finish line. Feel the accomplishment wash over you.",
];

export function RaceDayPrep({ onClose, raceName }: RaceDayPrepProps) {
  const [step, setStep] = useState(0);
  const [anxietyLevel, setAnxietyLevel] = useState(3);
  const [selectedMantras, setSelectedMantras] = useState<string[]>([]);
  const [visualizationIndex, setVisualizationIndex] = useState(0);
  const [showBreathing, setShowBreathing] = useState(false);

  const steps = ["Check-in", "Breathe", "Visualize", "Mantras", "Ready"];

  const toggleMantra = (mantra: string) => {
    setSelectedMantras(prev => 
      prev.includes(mantra) 
        ? prev.filter(m => m !== mantra)
        : prev.length < 3 ? [...prev, mantra] : prev
    );
  };

  const getAnxietyResponse = () => {
    if (anxietyLevel <= 2) {
      return "You're in a great headspace. Let's channel that calm energy.";
    } else if (anxietyLevel === 3) {
      return "Some nerves are normal and can help performance. Let's get focused.";
    } else {
      return "Those nerves mean you care. Let's transform that energy into fuel.";
    }
  };

  if (showBreathing) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <GuidedBreathing />
        <button
          onClick={() => {
            setShowBreathing(false);
            setStep(2);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-[#0A0A0F] via-[#0F0A1A] to-[#0A0A0F] overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-white/60 text-sm">Race Day Prep</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mt-4">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors ${
                i <= step ? "bg-[#FF6B00]" : "bg-white/20"
              }`} />
              <span className={`text-[10px] ${i <= step ? "text-[#FF6B00]" : "text-white/40"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-48">
        <AnimatePresence mode="wait">
          {/* Step 0: Anxiety Check-in */}
          {step === 0 && (
            <motion.div
              key="checkin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {raceName ? `Ready for ${raceName}?` : "How are you feeling?"}
                </h2>
                <p className="text-white/60">Let's check in before your race</p>
              </div>

              <div className="space-y-4">
                <p className="text-white/80 text-center">Rate your current nerves:</p>
                <div className="flex justify-center gap-2">
                  {ANXIETY_LEVELS.map((a) => (
                    <button
                      key={a.level}
                      onClick={() => setAnxietyLevel(a.level)}
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${
                        anxietyLevel === a.level 
                          ? "bg-[#FF6B00] scale-110" 
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <span className="text-xl">{a.emoji}</span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-white/60 text-sm">
                  {ANXIETY_LEVELS[anxietyLevel - 1].label}
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#FF6B00]/20 to-[#FF6B00]/5 border border-[#FF6B00]/30"
              >
                <p className="text-white text-center">{getAnxietyResponse()}</p>
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Breathing */}
          {step === 1 && (
            <motion.div
              key="breathe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Calm Your Body</h2>
                <p className="text-white/60">
                  {anxietyLevel >= 4 
                    ? "Let's slow down those racing thoughts" 
                    : "A few deep breaths to center yourself"}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-40 h-40 rounded-full bg-gradient-to-br from-[#64D2FF]/30 to-[#5E5CE6]/30 flex items-center justify-center"
                >
                  <Wind className="w-16 h-16 text-[#64D2FF]" />
                </motion.div>

                <p className="text-white/60 text-center">
                  Breathe in... hold... breathe out...
                </p>

                <button
                  onClick={() => setShowBreathing(true)}
                  className="px-6 py-3 rounded-full bg-[#64D2FF] text-black font-semibold"
                >
                  Start Guided Breathing
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="text-white/40 text-sm hover:text-white/60"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Visualization */}
          {step === 2 && (
            <motion.div
              key="visualize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">See Your Success</h2>
                <p className="text-white/60">Close your eyes between each prompt</p>
              </div>

              <div className="relative min-h-[200px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={visualizationIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-6 rounded-3xl bg-gradient-to-br from-[#5E5CE6]/20 to-[#AF52DE]/10 border border-[#5E5CE6]/30"
                  >
                    <Mountain className="w-8 h-8 text-[#AF52DE] mx-auto mb-4" />
                    <p className="text-white text-lg text-center leading-relaxed">
                      {VISUALIZATION_PROMPTS[visualizationIndex]}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-center gap-2">
                {VISUALIZATION_PROMPTS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setVisualizationIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === visualizationIndex ? "bg-[#AF52DE]" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setVisualizationIndex(i => Math.max(0, i - 1))}
                  disabled={visualizationIndex === 0}
                  className="p-3 rounded-full bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => {
                    if (visualizationIndex < VISUALIZATION_PROMPTS.length - 1) {
                      setVisualizationIndex(i => i + 1);
                    } else {
                      setStep(3);
                    }
                  }}
                  className="p-3 rounded-full bg-white/10"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Mantras */}
          {step === 3 && (
            <motion.div
              key="mantras"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Mantras</h2>
                <p className="text-white/60">Select up to 3 to carry with you</p>
              </div>

              <div className="space-y-2">
                {MANTRAS.map((mantra) => (
                  <motion.button
                    key={mantra.text}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleMantra(mantra.text)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                      selectedMantras.includes(mantra.text)
                        ? "bg-[#FF6B00]/20 border border-[#FF6B00]/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedMantras.includes(mantra.text) 
                        ? "bg-[#FF6B00]" 
                        : "bg-white/10"
                    }`}>
                      {selectedMantras.includes(mantra.text) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-white">{mantra.text}</span>
                  </motion.button>
                ))}
              </div>

              {selectedMantras.length > 0 && (
                <p className="text-center text-[#FF6B00] text-sm">
                  {selectedMantras.length}/3 selected
                </p>
              )}
            </motion.div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] flex items-center justify-center"
              >
                <Flame className="w-16 h-16 text-white" />
              </motion.div>

              <div>
                <h2 className="text-3xl font-black text-white mb-2">You're Ready</h2>
                <p className="text-white/60">Go show them what you've got</p>
              </div>

              {selectedMantras.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#FF6B00] text-xs font-semibold uppercase tracking-wider mb-3">
                    Your Mantras
                  </p>
                  <div className="space-y-2">
                    {selectedMantras.map((mantra, i) => (
                      <p key={i} className="text-white italic">"{mantra}"</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
                <p className="text-emerald-400 text-lg font-semibold">
                  Trust your training. You've earned this moment.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pt-6 bg-gradient-to-t from-black via-black to-transparent" style={{ paddingBottom: '100px' }}>
        <div className="flex gap-3 max-w-lg mx-auto">
          {step > 0 && step < 4 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-semibold"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-4 rounded-2xl bg-[#FF6B00] text-white font-semibold flex items-center justify-center gap-2"
            >
              {step === 3 ? "I'm Ready" : "Continue"}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-[#FF6B00] text-white font-semibold"
            >
              Go Crush It
            </button>
          )}
        </div>
        
        <p className="text-center text-white/30 text-[10px] mt-3">
          For wellness purposes only. Not professional advice.
        </p>
      </div>
    </motion.div>
  );
}
