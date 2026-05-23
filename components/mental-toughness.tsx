"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronRight, Check, Trophy, Mountain, Flame, 
  Target, Shield, Zap, Brain, Lock, Unlock
} from "lucide-react";

interface MentalToughnessProps {
  onClose: () => void;
}

// Progressive mental toughness exercises for runners
const TOUGHNESS_MODULES = [
  {
    id: "discomfort",
    title: "Embrace Discomfort",
    description: "Learn to stay calm when running gets hard",
    icon: Flame,
    color: "#FF6B00",
    duration: "5 min",
    exercises: [
      {
        title: "The 10-Second Rule",
        instruction: "When you feel like stopping, commit to just 10 more seconds. After those 10 seconds, decide again. You'll often find you can keep going.",
        action: "Practice this on your next hard interval or hill.",
        affirmation: "I am stronger than this moment of discomfort."
      },
      {
        title: "Reframe the Burn",
        instruction: "Instead of thinking 'this hurts,' tell yourself 'this is my body getting stronger.' Pain during effort is growth happening in real time.",
        action: "Notice where you feel the burn. Welcome it as progress.",
        affirmation: "Every moment of struggle is building my resilience."
      },
      {
        title: "Controlled Breathing Under Stress",
        instruction: "When effort peaks, focus on a 3-count exhale. This activates your parasympathetic nervous system and reduces perceived effort.",
        action: "Practice: Inhale naturally, exhale slowly for 3 counts.",
        affirmation: "My breath is my anchor. I am in control."
      }
    ]
  },
  {
    id: "mental-blocks",
    title: "Break Mental Blocks",
    description: "Overcome the voice that says you can't",
    icon: Brain,
    color: "#AF52DE",
    duration: "6 min",
    exercises: [
      {
        title: "Name Your Inner Critic",
        instruction: "Give your negative self-talk a silly name. When it speaks up ('You can't do this'), respond: 'Thanks for sharing, [Name], but I've got this.'",
        action: "What will you call your inner critic?",
        affirmation: "My negative thoughts are not facts. They are just thoughts."
      },
      {
        title: "The 'So What' Technique",
        instruction: "When fear of failure creeps in, ask 'So what if I fail?' Keep asking until the fear loses its power. Usually, the worst outcome isn't that bad.",
        action: "What's your biggest running fear? Apply 'so what' to it.",
        affirmation: "Failure is feedback. I learn and grow either way."
      },
      {
        title: "Previous Victory Recall",
        instruction: "Remember a time you pushed through when you wanted to quit. How did it feel after? You've done hard things before. You can do them again.",
        action: "Close your eyes. Recall that moment of triumph.",
        affirmation: "I have overcome before. I will overcome again."
      }
    ]
  },
  {
    id: "race-pressure",
    title: "Handle Race Pressure",
    description: "Stay composed when it matters most",
    icon: Trophy,
    color: "#FFD60A",
    duration: "7 min",
    exercises: [
      {
        title: "Pre-Race Centering",
        instruction: "Before a race, find your 'anchor word' - one word that captures how you want to feel. Examples: Strong. Smooth. Unstoppable. Repeat it when nerves hit.",
        action: "Choose your anchor word now. Practice saying it.",
        affirmation: "I am prepared. I am ready. This is my moment."
      },
      {
        title: "The Mile-by-Mile Focus",
        instruction: "Don't think about the full distance. Break it down: 'I just need to run THIS mile well.' When that mile is done, focus on the next one.",
        action: "Practice compartmentalizing on your next long run.",
        affirmation: "I only have to handle right now. And I can handle right now."
      },
      {
        title: "Competitor as Pacer",
        instruction: "Instead of seeing others as threats, view them as pacers helping you achieve your best. Their presence is a gift pushing you forward.",
        action: "Mentally thank the runners around you.",
        affirmation: "Everyone here is helping me become my best self."
      }
    ]
  },
  {
    id: "deep-fatigue",
    title: "Push Through Fatigue",
    description: "Find reserves you didn't know you had",
    icon: Mountain,
    color: "#32D74B",
    duration: "5 min",
    exercises: [
      {
        title: "The 40% Rule",
        instruction: "When your mind says you're done, you're actually only at 40% of your capacity. Your brain protects you by lying. You have 60% left in the tank.",
        action: "Remember this on your next hard effort.",
        affirmation: "My mind quits before my body. I have more to give."
      },
      {
        title: "Body Part Check",
        instruction: "When exhausted, scan your body: Are your shoulders relaxed? Hands unclenched? Face soft? Often we waste energy on tension. Release it.",
        action: "Do a quick scan now. Drop your shoulders. Unclench your jaw.",
        affirmation: "I release what doesn't serve me. I run light and free."
      },
      {
        title: "Counting Meditation",
        instruction: "When everything hurts, count your steps to 100, then start over. This gives your mind something to focus on besides the fatigue.",
        action: "Try it now: count 10 breaths slowly.",
        affirmation: "One step at a time. That's all I need to do."
      }
    ]
  },
  {
    id: "consistency",
    title: "Build Consistency",
    description: "Show up even when you don't feel like it",
    icon: Shield,
    color: "#64D2FF",
    duration: "5 min",
    exercises: [
      {
        title: "The 5-Minute Commitment",
        instruction: "On days you don't want to run, commit to just 5 minutes. Put on your shoes, step outside, move for 5 minutes. You can stop after. You rarely will.",
        action: "Make this your rule for low-motivation days.",
        affirmation: "I don't have to want to run. I just have to start."
      },
      {
        title: "Identity Over Motivation",
        instruction: "Don't rely on motivation - it comes and goes. Instead, build identity: 'I am a runner. Runners run.' You do it because it's who you are.",
        action: "Say to yourself: 'I am a runner.'",
        affirmation: "Running is part of who I am. I show up for myself."
      },
      {
        title: "Streak Mindset",
        instruction: "Don't break the chain. Every run, no matter how short, adds to your streak of consistency. Protecting that streak becomes its own motivation.",
        action: "What's your current running streak?",
        affirmation: "Every single run counts. I'm building something great."
      }
    ]
  }
];

export function MentalToughness({ onClose }: MentalToughnessProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [showAffirmation, setShowAffirmation] = useState(false);

  const module = TOUGHNESS_MODULES.find(m => m.id === selectedModule);
  const exercise = module?.exercises[currentExercise];

  const handleNextExercise = () => {
    if (!module) return;
    
    if (currentExercise < module.exercises.length - 1) {
      setShowAffirmation(true);
      setTimeout(() => {
        setShowAffirmation(false);
        setCurrentExercise(prev => prev + 1);
      }, 2500);
    } else {
      // Module complete
      setCompletedModules(prev => [...prev, module.id]);
      setShowAffirmation(true);
      setTimeout(() => {
        setShowAffirmation(false);
        setSelectedModule(null);
        setCurrentExercise(0);
      }, 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl"
    >
      <div className="h-full overflow-y-auto pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-black via-black/95 to-transparent px-5 pt-14 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Mental Toughness</h1>
                <p className="text-sm text-[#8E8E93]">
                  {completedModules.length}/{TOUGHNESS_MODULES.length} modules completed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedModule ? (
            // Module Selection View
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5 space-y-4"
            >
              <p className="text-[#AEAEB2] text-sm mb-6">
                Progressive exercises to build mental resilience for hard runs and races. 
                Complete each module to unlock your full potential.
              </p>

              {TOUGHNESS_MODULES.map((mod, index) => {
                const Icon = mod.icon;
                const isCompleted = completedModules.includes(mod.id);
                const isLocked = index > 0 && !completedModules.includes(TOUGHNESS_MODULES[index - 1].id) && !isCompleted;

                return (
                  <motion.button
                    key={mod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={!isLocked ? { scale: 1.02 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                    onClick={() => !isLocked && setSelectedModule(mod.id)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                      isLocked 
                        ? "bg-[#1C1C1E]/50 border-[#2C2C2E] opacity-50"
                        : isCompleted
                        ? "bg-gradient-to-r from-[#32D74B]/15 to-[#32D74B]/5 border-[#32D74B]/30"
                        : `bg-gradient-to-r from-[${mod.color}]/15 to-[${mod.color}]/5 border-[${mod.color}]/25 hover:border-[${mod.color}]/40`
                    }`}
                    style={!isLocked && !isCompleted ? {
                      background: `linear-gradient(to right, ${mod.color}15, ${mod.color}05)`,
                      borderColor: `${mod.color}40`
                    } : {}}
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: isLocked ? '#2C2C2E' : `${mod.color}20` }}
                    >
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-[#6E6E73]" />
                      ) : isCompleted ? (
                        <Check className="w-7 h-7 text-[#32D74B]" />
                      ) : (
                        <Icon className="w-7 h-7" style={{ color: mod.color }} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-bold text-lg ${isLocked ? "text-[#6E6E73]" : "text-white"}`}>
                        {mod.title}
                      </p>
                      <p className="text-[#8E8E93] text-sm">{mod.description}</p>
                      <p className="text-xs mt-1" style={{ color: isLocked ? '#6E6E73' : mod.color }}>
                        {mod.duration} • {mod.exercises.length} exercises
                      </p>
                    </div>
                    {!isLocked && !isCompleted && (
                      <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            // Exercise View
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5"
            >
              {module && exercise && (
                <>
                  {/* Progress */}
                  <div className="flex items-center gap-2 mb-6">
                    {module.exercises.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < currentExercise 
                            ? "bg-[#32D74B]" 
                            : i === currentExercise 
                            ? "bg-white" 
                            : "bg-[#3A3A3C]"
                        }`}
                      />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {showAffirmation ? (
                      // Affirmation Display
                      <motion.div
                        key="affirmation"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.2 }}
                          className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
                          style={{ backgroundColor: `${module.color}30` }}
                        >
                          <Check className="w-10 h-10" style={{ color: module.color }} />
                        </motion.div>
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-2xl font-bold text-white leading-relaxed"
                        >
                          "{exercise.affirmation}"
                        </motion.p>
                      </motion.div>
                    ) : (
                      // Exercise Content
                      <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: module.color }}>
                            Exercise {currentExercise + 1} of {module.exercises.length}
                          </p>
                          <h2 className="text-2xl font-bold text-white">
                            {exercise.title}
                          </h2>
                        </div>

                        <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-[#2C2C2E]">
                          <p className="text-white text-lg leading-relaxed">
                            {exercise.instruction}
                          </p>
                        </div>

                        <div 
                          className="rounded-2xl p-5 border"
                          style={{ 
                            backgroundColor: `${module.color}10`,
                            borderColor: `${module.color}30`
                          }}
                        >
                          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: module.color }}>
                            Your Action
                          </p>
                          <p className="text-white">
                            {exercise.action}
                          </p>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleNextExercise}
                          className="w-full py-4 rounded-2xl font-bold text-white text-lg"
                          style={{ backgroundColor: module.color }}
                        >
                          {currentExercise < module.exercises.length - 1 
                            ? "Next Exercise" 
                            : "Complete Module"}
                        </motion.button>

                        <button
                          onClick={() => {
                            setSelectedModule(null);
                            setCurrentExercise(0);
                          }}
                          className="w-full py-3 text-[#8E8E93] text-sm"
                        >
                          Back to Modules
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
