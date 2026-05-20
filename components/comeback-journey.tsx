"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Sparkles, ChevronRight, ChevronLeft,
  Sunrise, RefreshCw, Target, Shield, Clock, X, Check
} from "lucide-react";

interface ComebackJourneyProps {
  onClose: () => void;
}

const FEELINGS = [
  { id: "frustrated", label: "Frustrated", emoji: "😤" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "lost", label: "Lost", emoji: "😶" },
  { id: "hopeful", label: "Hopeful", emoji: "🙂" },
  { id: "accepting", label: "Accepting", emoji: "😌" },
];

const AFFIRMATIONS = [
  "Taking time off doesn't change who I am. I am still a runner.",
  "Rest is part of training. This is training too.",
  "My body knows how to heal. I will trust the process.",
  "This pause is temporary. My running journey is not over.",
  "I've overcome challenges before. I will overcome this too.",
  "Every day of rest brings me closer to running again.",
];

const IDENTITY_PROMPTS = [
  "Running is part of who I am, but it's not all of who I am.",
  "I am still the same person who trained for those runs.",
  "My running achievements don't disappear because I'm pausing.",
  "I can support other runners even when I'm not running.",
  "This experience will make me a more resilient runner.",
];

const MICRO_ACTIONS = [
  { id: "stretch", label: "Do a gentle stretch", icon: "🧘" },
  { id: "walk", label: "Take a short walk", icon: "🚶" },
  { id: "hydrate", label: "Drink a full glass of water", icon: "💧" },
  { id: "journal", label: "Write 3 things I'm grateful for", icon: "📝" },
  { id: "breathe", label: "Take 5 deep breaths", icon: "🌬️" },
  { id: "connect", label: "Message a running friend", icon: "💬" },
];

const RETURN_FEARS = [
  { fear: "I've lost all my fitness", reframe: "Fitness returns faster than you built it. Your body remembers." },
  { fear: "I'll get hurt again", reframe: "You're wiser now. You'll listen to your body better." },
  { fear: "I'll never be as fast", reframe: "Speed is one part of running. Joy is another. Both matter." },
  { fear: "Others have passed me", reframe: "Your journey is yours alone. Comparison steals joy." },
  { fear: "Starting over feels hard", reframe: "You're not starting over. You're starting from experience." },
];

export function ComebackJourney({ onClose }: ComebackJourneyProps) {
  const [step, setStep] = useState(0);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [selectedAffirmation, setSelectedAffirmation] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [fearIndex, setFearIndex] = useState(0);

  const steps = ["Acknowledge", "Identity", "Fears", "Action", "Forward"];

  const toggleFeeling = (id: string) => {
    setSelectedFeelings(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleAction = (id: string) => {
    setCompletedActions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-[#0A0A0F] via-[#0A0F1A] to-[#0A0A0F] overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Sunrise className="w-4 h-4 text-[#64D2FF]" />
            <span className="text-white/60 text-sm">Comeback Journey</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mt-4">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors ${
                i <= step ? "bg-[#64D2FF]" : "bg-white/20"
              }`} />
              <span className={`text-[10px] ${i <= step ? "text-[#64D2FF]" : "text-white/40"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-48">
        <AnimatePresence mode="wait">
          {/* Step 0: Acknowledge Feelings */}
          {step === 0 && (
            <motion.div
              key="acknowledge"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">It's Okay to Feel This</h2>
                <p className="text-white/60">Taking time away from running is hard. What are you feeling?</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {FEELINGS.map((feeling) => (
                  <button
                    key={feeling.id}
                    onClick={() => toggleFeeling(feeling.id)}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                      selectedFeelings.includes(feeling.id)
                        ? "bg-[#64D2FF]/20 border-2 border-[#64D2FF]/50"
                        : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                    }`}
                  >
                    <span className="text-2xl">{feeling.emoji}</span>
                    <span className="text-white text-xs">{feeling.label}</span>
                  </button>
                ))}
              </div>

              {selectedFeelings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-[#64D2FF]/20 to-[#5E5CE6]/10 border border-[#64D2FF]/30"
                >
                  <p className="text-white text-center">
                    {selectedFeelings.includes("hopeful") || selectedFeelings.includes("accepting")
                      ? "Those feelings show strength. You're already on the path forward."
                      : "Those feelings are valid. Being sidelined is genuinely hard. Let's work through this together."}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 1: Identity Affirmations */}
          {step === 1 && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">You Are Still a Runner</h2>
                <p className="text-white/60">Choose an affirmation that resonates with you</p>
              </div>

              <div className="space-y-3">
                {AFFIRMATIONS.map((affirmation) => (
                  <motion.button
                    key={affirmation}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAffirmation(affirmation)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedAffirmation === affirmation
                        ? "bg-[#AF52DE]/20 border border-[#AF52DE]/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-white italic">"{affirmation}"</p>
                  </motion.button>
                ))}
              </div>

              {selectedAffirmation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-[#AF52DE]/10 border border-[#AF52DE]/30 text-center"
                >
                  <p className="text-[#AF52DE] text-sm">
                    Say this out loud or write it down. Repeat it when doubt creeps in.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Fear Reframing */}
          {step === 2 && (
            <motion.div
              key="fears"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Reframe Your Fears</h2>
                <p className="text-white/60">Common worries and new perspectives</p>
              </div>

              <div className="relative min-h-[250px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={fearIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                      <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">The Fear</p>
                      <p className="text-white text-lg">"{RETURN_FEARS[fearIndex].fear}"</p>
                    </div>

                    <div className="flex justify-center">
                      <RefreshCw className="w-6 h-6 text-white/40" />
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">The Reframe</p>
                      <p className="text-white text-lg">{RETURN_FEARS[fearIndex].reframe}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-center gap-2">
                {RETURN_FEARS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFearIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === fearIndex ? "bg-emerald-500" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setFearIndex(i => Math.max(0, i - 1))}
                  disabled={fearIndex === 0}
                  className="p-3 rounded-full bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setFearIndex(i => Math.min(RETURN_FEARS.length - 1, i + 1))}
                  disabled={fearIndex === RETURN_FEARS.length - 1}
                  className="p-3 rounded-full bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Micro Actions */}
          {step === 3 && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">One Small Step</h2>
                <p className="text-white/60">You don't need to run. Just do one kind thing for yourself.</p>
              </div>

              <div className="space-y-3">
                {MICRO_ACTIONS.map((action) => (
                  <motion.button
                    key={action.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAction(action.id)}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                      completedActions.has(action.id)
                        ? "bg-emerald-500/20 border border-emerald-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="flex-1 text-left text-white">{action.label}</span>
                    {completedActions.has(action.id) && (
                      <Check className="w-5 h-5 text-emerald-500" />
                    )}
                  </motion.button>
                ))}
              </div>

              {completedActions.size > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-emerald-400 text-sm"
                >
                  {completedActions.size === 1 
                    ? "One step taken. That's all it takes."
                    : `${completedActions.size} steps taken. You're doing great.`}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Step 4: Looking Forward */}
          {step === 4 && (
            <motion.div
              key="forward"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#64D2FF] to-[#5E5CE6] flex items-center justify-center"
              >
                <Sunrise className="w-16 h-16 text-white" />
              </motion.div>

              <div>
                <h2 className="text-3xl font-black text-white mb-2">You Will Run Again</h2>
                <p className="text-white/60">This is a chapter, not the whole story</p>
              </div>

              {selectedAffirmation && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#AF52DE] text-xs font-semibold uppercase tracking-wider mb-2">
                    Your Affirmation
                  </p>
                  <p className="text-white italic">"{selectedAffirmation}"</p>
                </div>
              )}

              <div className="space-y-3">
                {IDENTITY_PROMPTS.slice(0, 2).map((prompt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="p-3 rounded-xl bg-gradient-to-r from-[#64D2FF]/10 to-transparent border border-[#64D2FF]/20"
                  >
                    <p className="text-white/80 text-sm">{prompt}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[env(safe-area-inset-bottom,24px)] bg-gradient-to-t from-black via-black to-transparent" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 32px)' }}>
        <div className="flex gap-3 max-w-lg mx-auto mb-6">
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
              className="flex-1 py-4 rounded-2xl bg-[#64D2FF] text-black font-semibold flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-[#64D2FF] text-black font-semibold"
            >
              Close
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
