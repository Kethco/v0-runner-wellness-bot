"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react";

interface VisualizationStep {
  text: string;
  duration: number;
  type: "intro" | "body" | "mind" | "action" | "close";
}

const VISUALIZATION_SCRIPTS: Record<string, VisualizationStep[]> = {
  race: [
    { text: "Close your eyes and take a deep breath...", duration: 5, type: "intro" },
    { text: "Picture yourself at the starting line...", duration: 6, type: "body" },
    { text: "Feel the energy of the crowd around you...", duration: 5, type: "body" },
    { text: "Your body is relaxed yet ready...", duration: 5, type: "body" },
    { text: "The starting signal sounds...", duration: 4, type: "action" },
    { text: "You begin with smooth, confident strides...", duration: 5, type: "action" },
    { text: "Your breathing is calm and rhythmic...", duration: 5, type: "body" },
    { text: "You feel strong, powerful, unstoppable...", duration: 5, type: "mind" },
    { text: "See yourself crossing the finish line...", duration: 6, type: "action" },
    { text: "Feel the pride and joy wash over you...", duration: 5, type: "mind" },
    { text: "You did it. You are ready.", duration: 5, type: "close" },
  ],
  training: [
    { text: "Take a moment to center yourself...", duration: 5, type: "intro" },
    { text: "Picture your favorite running route...", duration: 5, type: "body" },
    { text: "Feel your feet connecting with the ground...", duration: 5, type: "body" },
    { text: "Each step is light and effortless...", duration: 5, type: "action" },
    { text: "Your mind is clear, focused only on movement...", duration: 5, type: "mind" },
    { text: "You are in perfect harmony with your body...", duration: 5, type: "mind" },
    { text: "Challenges become opportunities to grow...", duration: 5, type: "mind" },
    { text: "You return feeling energized and grateful...", duration: 5, type: "close" },
  ],
  recovery: [
    { text: "Find a comfortable position...", duration: 5, type: "intro" },
    { text: "Imagine a warm, healing light...", duration: 5, type: "body" },
    { text: "It flows through your tired muscles...", duration: 6, type: "body" },
    { text: "Each breath releases tension...", duration: 5, type: "body" },
    { text: "Your body knows how to heal itself...", duration: 5, type: "mind" },
    { text: "Rest is part of getting stronger...", duration: 5, type: "mind" },
    { text: "You are patient and kind with yourself...", duration: 5, type: "mind" },
    { text: "You will return stronger than before...", duration: 5, type: "close" },
  ],
};

type ScriptType = "race" | "training" | "recovery";

export function RunVisualization({ onComplete }: { onComplete?: () => void }) {
  const [selectedScript, setSelectedScript] = useState<ScriptType>("training");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenStep = useRef<number>(-1);

  const script = VISUALIZATION_SCRIPTS[selectedScript];
  const step = script[currentStep];
  const totalDuration = script.reduce((sum, s) => sum + s.duration, 0);

  // Voice guidance - soothing, human-like voice
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    
    window.speechSynthesis?.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Slower rate for a calm, soothing delivery
    utterance.rate = 0.75;
    // Slightly lower pitch for warmth
    utterance.pitch = 0.85;
    // Softer volume for gentleness
    utterance.volume = 0.75;
    
    // Get available voices and prioritize natural-sounding ones
    const voices = window.speechSynthesis?.getVoices() || [];
    
    // Priority order for most human-like voices
    const preferredVoiceNames = [
      "Samantha", // macOS - very natural
      "Karen", // macOS Australian - warm
      "Moira", // macOS Irish - soothing
      "Fiona", // macOS Scottish
      "Google UK English Female", // Chrome - natural
      "Google US English Female",
      "Microsoft Zira", // Windows - clear
      "Microsoft Aria", // Windows 11 - natural
    ];
    
    let selectedVoice = null;
    for (const name of preferredVoiceNames) {
      selectedVoice = voices.find(v => v.name.includes(name));
      if (selectedVoice) break;
    }
    
    // Fallback to any English female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang.startsWith("en") && 
        (v.name.toLowerCase().includes("female") || 
         v.name.includes("Zira") || 
         v.name.includes("Samantha"))
      );
    }
    
    // Final fallback to any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith("en"));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    window.speechSynthesis?.speak(utterance);
  }, [voiceEnabled]);

  // Speak when step changes
  useEffect(() => {
    if (isPlaying && currentStep !== lastSpokenStep.current && step) {
      lastSpokenStep.current = currentStep;
      speak(step.text);
    }
  }, [currentStep, isPlaying, step, speak]);

  // Progress timer
  useEffect(() => {
    if (!isPlaying || isComplete) return;

    let elapsed = 0;
    const stepDuration = step.duration * 1000;

    timerRef.current = setInterval(() => {
      elapsed += 100;
      setProgress((elapsed / stepDuration) * 100);

      if (elapsed >= stepDuration) {
        if (currentStep < script.length - 1) {
          setCurrentStep(prev => prev + 1);
          elapsed = 0;
          setProgress(0);
        } else {
          setIsPlaying(false);
          setIsComplete(true);
          onComplete?.();
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStep, step, script.length, isComplete, onComplete]);

  const handleStart = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setProgress(0);
    setIsComplete(false);
    lastSpokenStep.current = -1;
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
    setIsComplete(false);
    lastSpokenStep.current = -1;
    window.speechSynthesis?.cancel();
  };

  const getTypeColor = (type: VisualizationStep["type"]) => {
    switch (type) {
      case "intro": return "#64D2FF";
      case "body": return "#30D158";
      case "mind": return "#AF52DE";
      case "action": return "#FF9500";
      case "close": return "#FFD60A";
      default: return "#FFFFFF";
    }
  };

  return (
    <div className="space-y-6">
      {/* Script Selector */}
      {!isPlaying && !isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <p className="text-[#8E8E93] text-sm">Choose your visualization:</p>
          <div className="grid grid-cols-3 gap-2">
            {(["race", "training", "recovery"] as ScriptType[]).map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedScript(type)}
                className={`p-3 rounded-xl text-center transition-all border capitalize ${
                  selectedScript === type
                    ? "border-[#AF52DE] bg-[#AF52DE]/20 text-white"
                    : "border-[#3A3A3C] bg-[#1C1C1E] text-[#AEAEB2]"
                }`}
              >
                {type}
              </motion.button>
            ))}
          </div>
          <p className="text-[#6E6E73] text-xs text-center">
            ~{Math.ceil(totalDuration / 60)} min guided visualization
          </p>
        </motion.div>
      )}

      {/* Visualization Display */}
      <div className="relative">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-30"
          style={{
            background: `radial-gradient(circle at center, ${getTypeColor(step?.type || "intro")}40, transparent)`,
          }}
          animate={{
            scale: isPlaying ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative bg-[#1A1A1A]/80 backdrop-blur-xl rounded-3xl p-8 border border-[#2A2A2A]">
          {/* Icon */}
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${getTypeColor(step?.type || "intro")}30` }}
            animate={{
              scale: isPlaying ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8" style={{ color: getTypeColor(step?.type || "intro") }} />
          </motion.div>

          {/* Text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white text-xl font-medium text-center leading-relaxed min-h-[60px]"
            >
              {isComplete ? "You are mentally ready." : (step?.text || "Press play to begin...")}
            </motion.p>
          </AnimatePresence>

          {/* Progress */}
          {isPlaying && (
            <div className="mt-6">
              <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: getTypeColor(step?.type || "intro"),
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[#6E6E73]">
                <span>Step {currentStep + 1} of {script.length}</span>
                <span>{step?.duration}s</span>
              </div>
            </div>
          )}

          {/* Step indicators */}
          {isPlaying && (
            <div className="flex justify-center gap-1.5 mt-4">
              {script.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < currentStep ? "bg-[#30D158]" : i === currentStep ? "bg-white" : "bg-[#3A3A3C]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isPlaying && !isComplete && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#AF52DE] text-white"
            >
              <Play className="w-5 h-5" />
              Begin Visualization
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors ${
                voiceEnabled ? "bg-[#30D158]/20 text-[#30D158]" : "bg-[#2C2C2E] text-[#8E8E93]"
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
          </>
        )}

        {isPlaying && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPlaying(false)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#2C2C2E] text-white"
            >
              <Pause className="w-5 h-5" />
              Pause
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold bg-[#FF453A]/20 text-[#FF453A]"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          </>
        )}

        {isComplete && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#AF52DE] text-white"
            >
              <RotateCcw className="w-5 h-5" />
              Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#30D158] text-white"
            >
              Done
            </motion.button>
          </>
        )}
      </div>

      {isComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[#30D158] text-sm"
        >
          Visualization complete. Go run with confidence!
        </motion.p>
      )}
    </div>
  );
}
