"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Play, Square, RotateCcw } from "lucide-react";

type BreathingPattern = "relaxing" | "energizing" | "focus" | "sleep";

interface Pattern {
  name: string;
  description: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  color: string;
}

const PATTERNS: Record<BreathingPattern, Pattern> = {
  relaxing: {
    name: "4-7-8 Relaxing",
    description: "Calms the nervous system",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
    color: "#AF52DE",
  },
  energizing: {
    name: "Power Breath",
    description: "Boosts energy before a run",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
    color: "#FF9500",
  },
  focus: {
    name: "Box Breathing",
    description: "Improves concentration",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
    color: "#00D4FF",
  },
  sleep: {
    name: "Deep Rest",
    description: "Prepares for sleep",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 2,
    cycles: 3,
    color: "#5E5CE6",
  },
};

type Phase = "idle" | "inhale" | "hold1" | "exhale" | "hold2" | "complete";

export function GuidedBreathing() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>("relaxing");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const pattern = PATTERNS[selectedPattern];

  const resetExercise = useCallback(() => {
    setPhase("idle");
    setCurrentCycle(0);
    setCountdown(0);
  }, []);

  const startExercise = () => {
    setPhase("inhale");
    setCurrentCycle(1);
    setCountdown(pattern.inhale);
  };

  // Main breathing cycle logic
  useEffect(() => {
    if (phase === "idle" || phase === "complete") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Move to next phase
        if (phase === "inhale") {
          if (pattern.hold1 > 0) {
            setPhase("hold1");
            return pattern.hold1;
          } else {
            setPhase("exhale");
            return pattern.exhale;
          }
        } else if (phase === "hold1") {
          setPhase("exhale");
          return pattern.exhale;
        } else if (phase === "exhale") {
          if (pattern.hold2 > 0) {
            setPhase("hold2");
            return pattern.hold2;
          } else {
            // End of cycle
            if (currentCycle >= pattern.cycles) {
              setPhase("complete");
              return 0;
            }
            setCurrentCycle((c) => c + 1);
            setPhase("inhale");
            return pattern.inhale;
          }
        } else if (phase === "hold2") {
          // End of cycle
          if (currentCycle >= pattern.cycles) {
            setPhase("complete");
            return 0;
          }
          setCurrentCycle((c) => c + 1);
          setPhase("inhale");
          return pattern.inhale;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, pattern, currentCycle]);

  // Reset when pattern changes
  useEffect(() => {
    resetExercise();
  }, [selectedPattern, resetExercise]);

  const getPhaseText = () => {
    switch (phase) {
      case "inhale": return "Breathe In";
      case "hold1": return "Hold";
      case "exhale": return "Breathe Out";
      case "hold2": return "Hold";
      case "complete": return "Complete";
      default: return "Ready";
    }
  };

  const getCircleScale = () => {
    if (phase === "inhale") return 1.4;
    if (phase === "hold1") return 1.4;
    if (phase === "exhale") return 1;
    if (phase === "hold2") return 1;
    return 1.2;
  };

  const isActive = phase !== "idle" && phase !== "complete";

  return (
    <div className="space-y-4">
      {/* Pattern Selector */}
      {!isActive && phase !== "complete" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 gap-2"
        >
          {(Object.keys(PATTERNS) as BreathingPattern[]).map((key) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPattern(key)}
              className={`p-3 rounded-xl text-left transition-all border ${
                selectedPattern === key
                  ? "border-opacity-100"
                  : "border-[#3A3A3C] bg-[#1C1C1E]"
              }`}
              style={{
                borderColor: selectedPattern === key ? PATTERNS[key].color : undefined,
                backgroundColor: selectedPattern === key ? `${PATTERNS[key].color}20` : undefined,
              }}
            >
              <p className="text-white font-semibold text-sm">{PATTERNS[key].name}</p>
              <p className="text-[#8E8E93] text-xs">{PATTERNS[key].description}</p>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Breathing Circle */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          {/* Outer glow ring */}
          <motion.div
            animate={{
              scale: isActive ? [1, 1.1, 1] : 1,
              opacity: isActive ? [0.3, 0.5, 0.3] : 0.2,
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: pattern.color,
              filter: "blur(20px)",
            }}
          />
          
          {/* Main circle */}
          <motion.div
            animate={{ scale: getCircleScale() }}
            transition={{ duration: phase === "inhale" ? pattern.inhale : phase === "exhale" ? pattern.exhale : 0.5, ease: "easeInOut" }}
            className="relative w-32 h-32 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${pattern.color}40, ${pattern.color}20)`,
              border: `2px solid ${pattern.color}60`,
            }}
          >
            <motion.div
              animate={{ scale: getCircleScale() * 0.8 }}
              transition={{ duration: phase === "inhale" ? pattern.inhale : phase === "exhale" ? pattern.exhale : 0.5, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${pattern.color}, ${pattern.color}80)`,
              }}
            >
              {isActive ? (
                <span className="text-white font-bold text-2xl">{countdown}</span>
              ) : (
                <Wind className="w-8 h-8 text-white" />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Phase Text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-white font-semibold text-xl mt-6"
          >
            {getPhaseText()}
          </motion.p>
        </AnimatePresence>

        {/* Cycle Progress */}
        {isActive && (
          <div className="flex gap-2 mt-4">
            {Array.from({ length: pattern.cycles }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < currentCycle ? "opacity-100" : "opacity-30"
                }`}
                style={{ backgroundColor: pattern.color }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          {phase === "idle" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startExercise}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
              style={{ backgroundColor: pattern.color }}
            >
              <Play className="w-5 h-5" />
              Start
            </motion.button>
          )}

          {isActive && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetExercise}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#2C2C2E] text-white"
            >
              <Square className="w-5 h-5" />
              Stop
            </motion.button>
          )}

          {phase === "complete" && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startExercise}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
                style={{ backgroundColor: pattern.color }}
              >
                <RotateCcw className="w-5 h-5" />
                Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetExercise}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#2C2C2E] text-white"
              >
                Done
              </motion.button>
            </>
          )}
        </div>

        {/* Completion Message */}
        {phase === "complete" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#30D158] text-sm mt-4"
          >
            Great job! You completed {pattern.cycles} cycles.
          </motion.p>
        )}
      </div>
    </div>
  );
}
