"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Play, Pause, ChevronRight, CheckCircle2, 
  Timer, Flame, Wind, Zap, RotateCcw, 
  AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";

interface Exercise {
  id: string;
  name: string;
  duration: number; // seconds
  description: string;
  targetArea: string;
  instructions: string[];
  image?: string;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  duration: number; // total minutes
  exercises: Exercise[];
  icon: "pre-run" | "post-run" | "strength" | "foam-roll";
  color: string;
}

const PRE_RUN_EXERCISES: Exercise[] = [
  {
    id: "leg-swings",
    name: "Leg Swings",
    duration: 30,
    description: "Dynamic hip opener",
    targetArea: "Hips & Hip Flexors",
    instructions: [
      "Stand on one leg, holding a wall for balance",
      "Swing opposite leg forward and back in a controlled motion",
      "Keep your core engaged and back straight",
      "15 swings each leg"
    ]
  },
  {
    id: "walking-lunges",
    name: "Walking Lunges",
    duration: 45,
    description: "Activate glutes & quads",
    targetArea: "Glutes, Quads & Hip Flexors",
    instructions: [
      "Step forward into a lunge position",
      "Lower your back knee toward the ground",
      "Push through your front heel to step forward",
      "Alternate legs for 10 steps each"
    ]
  },
  {
    id: "high-knees",
    name: "High Knees",
    duration: 30,
    description: "Warm up hip flexors",
    targetArea: "Hip Flexors & Core",
    instructions: [
      "Stand tall with feet hip-width apart",
      "Drive one knee up toward your chest",
      "Quickly alternate legs with a light bounce",
      "Keep your core tight and arms pumping"
    ]
  },
  {
    id: "butt-kicks",
    name: "Butt Kicks",
    duration: 30,
    description: "Activate hamstrings",
    targetArea: "Hamstrings & Quads",
    instructions: [
      "Stand tall and begin jogging in place",
      "Kick your heels up toward your glutes",
      "Keep your thighs relatively stationary",
      "Maintain a quick, light rhythm"
    ]
  },
  {
    id: "arm-circles",
    name: "Arm Circles",
    duration: 30,
    description: "Loosen shoulders",
    targetArea: "Shoulders & Upper Back",
    instructions: [
      "Extend arms out to the sides",
      "Make small circles, gradually increasing size",
      "15 seconds forward, 15 seconds backward",
      "Keep your core engaged"
    ]
  },
  {
    id: "ankle-circles",
    name: "Ankle Circles",
    duration: 30,
    description: "Mobilize ankles",
    targetArea: "Ankles & Calves",
    instructions: [
      "Lift one foot off the ground",
      "Rotate your ankle in circles",
      "10 circles each direction, each foot",
      "Keep movements controlled"
    ]
  }
];

const POST_RUN_EXERCISES: Exercise[] = [
  {
    id: "quad-stretch",
    name: "Standing Quad Stretch",
    duration: 60,
    description: "Release tight quads",
    targetArea: "Quadriceps",
    instructions: [
      "Stand on one leg, hold a wall if needed",
      "Grab your ankle and pull heel toward glutes",
      "Keep knees together and hips forward",
      "Hold 30 seconds each leg"
    ]
  },
  {
    id: "calf-stretch",
    name: "Wall Calf Stretch",
    duration: 60,
    description: "Lengthen calves",
    targetArea: "Calves & Achilles",
    instructions: [
      "Face a wall with hands at shoulder height",
      "Step one leg back, keeping heel on ground",
      "Lean into the wall until you feel the stretch",
      "Hold 30 seconds each leg"
    ]
  },
  {
    id: "hip-flexor-stretch",
    name: "Kneeling Hip Flexor",
    duration: 60,
    description: "Open tight hip flexors",
    targetArea: "Hip Flexors & Psoas",
    instructions: [
      "Kneel on one knee, other foot forward",
      "Tuck your pelvis slightly under",
      "Lean forward gently into the stretch",
      "Hold 30 seconds each side"
    ]
  },
  {
    id: "pigeon-stretch",
    name: "Pigeon Stretch",
    duration: 60,
    description: "Deep hip opener",
    targetArea: "Glutes & Hip Rotators",
    instructions: [
      "From all fours, bring one knee forward",
      "Extend the other leg straight back",
      "Lower your hips toward the ground",
      "Hold 30 seconds each side"
    ]
  },
  {
    id: "hamstring-stretch",
    name: "Standing Hamstring",
    duration: 60,
    description: "Release hamstrings",
    targetArea: "Hamstrings",
    instructions: [
      "Place one heel on a low surface",
      "Keep that leg straight, hinge at hips",
      "Reach toward your toes gently",
      "Hold 30 seconds each leg"
    ]
  },
  {
    id: "it-band-stretch",
    name: "IT Band Stretch",
    duration: 60,
    description: "Release outer thigh",
    targetArea: "IT Band & Outer Hip",
    instructions: [
      "Cross one leg behind the other",
      "Lean away from the back leg",
      "Reach arm overhead for deeper stretch",
      "Hold 30 seconds each side"
    ]
  }
];

const STRENGTH_EXERCISES: Exercise[] = [
  {
    id: "single-leg-deadlift",
    name: "Single Leg Deadlift",
    duration: 60,
    description: "Build balance & hamstring strength",
    targetArea: "Hamstrings, Glutes & Core",
    instructions: [
      "Stand on one leg, slight knee bend",
      "Hinge at hips, extending other leg back",
      "Lower until torso is parallel to ground",
      "10 reps each leg"
    ]
  },
  {
    id: "clamshells",
    name: "Clamshells",
    duration: 60,
    description: "Activate glute medius",
    targetArea: "Glute Medius & Hip Stabilizers",
    instructions: [
      "Lie on your side, knees bent 90 degrees",
      "Keep feet together, lift top knee",
      "Don't let hips rotate backward",
      "15 reps each side"
    ]
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    duration: 45,
    description: "Strengthen glutes",
    targetArea: "Glutes & Core",
    instructions: [
      "Lie on back, knees bent, feet flat",
      "Press through heels to lift hips",
      "Squeeze glutes at the top",
      "15 reps, hold last rep 10 seconds"
    ]
  },
  {
    id: "calf-raises",
    name: "Single Leg Calf Raises",
    duration: 60,
    description: "Build calf strength",
    targetArea: "Calves & Achilles",
    instructions: [
      "Stand on one leg on a step edge",
      "Lower heel below step level",
      "Rise up onto toes",
      "15 reps each leg"
    ]
  },
  {
    id: "plank",
    name: "Plank Hold",
    duration: 45,
    description: "Core stability",
    targetArea: "Core & Shoulders",
    instructions: [
      "Forearms on ground, body in straight line",
      "Engage core, don't let hips sag",
      "Keep breathing steadily",
      "Hold 30-45 seconds"
    ]
  },
  {
    id: "side-plank",
    name: "Side Plank",
    duration: 60,
    description: "Lateral core strength",
    targetArea: "Obliques & Hip Stabilizers",
    instructions: [
      "Lie on side, forearm on ground",
      "Lift hips to form straight line",
      "Keep core tight, hips stacked",
      "Hold 20-30 seconds each side"
    ]
  }
];

const FOAM_ROLL_EXERCISES: Exercise[] = [
  {
    id: "foam-quads",
    name: "Quad Roll",
    duration: 60,
    description: "Release quad tension",
    targetArea: "Quadriceps",
    instructions: [
      "Lie face down with roller under thighs",
      "Roll from hip to just above knee",
      "Pause on tender spots for 20-30 seconds",
      "30 seconds each leg"
    ]
  },
  {
    id: "foam-it-band",
    name: "IT Band Roll",
    duration: 60,
    description: "Release outer thigh",
    targetArea: "IT Band",
    instructions: [
      "Lie on your side with roller under outer thigh",
      "Roll from hip to just above knee",
      "This may be intense - breathe through it",
      "30 seconds each side"
    ]
  },
  {
    id: "foam-calves",
    name: "Calf Roll",
    duration: 60,
    description: "Release calf tightness",
    targetArea: "Calves",
    instructions: [
      "Sit with roller under calves",
      "Cross one leg over the other for pressure",
      "Roll from ankle to below knee",
      "30 seconds each leg"
    ]
  },
  {
    id: "foam-glutes",
    name: "Glute Roll",
    duration: 60,
    description: "Release glute tension",
    targetArea: "Glutes & Piriformis",
    instructions: [
      "Sit on roller, cross one ankle over knee",
      "Lean toward the crossed side",
      "Roll in small circles on glute",
      "30 seconds each side"
    ]
  },
  {
    id: "foam-hamstrings",
    name: "Hamstring Roll",
    duration: 60,
    description: "Release hamstring tension",
    targetArea: "Hamstrings",
    instructions: [
      "Sit with roller under thighs",
      "Roll from glutes to just above knee",
      "Rotate leg in/out to hit different areas",
      "30 seconds each leg"
    ]
  },
  {
    id: "foam-upper-back",
    name: "Upper Back Roll",
    duration: 45,
    description: "Release upper back tension",
    targetArea: "Upper Back & Thoracic Spine",
    instructions: [
      "Lie with roller under upper back",
      "Support head with hands",
      "Roll from mid-back to shoulders",
      "45 seconds total"
    ]
  }
];

const ROUTINES: Routine[] = [
  {
    id: "pre-run",
    name: "Pre-Run Warm Up",
    description: "Dynamic stretches to prepare your body",
    duration: 5,
    exercises: PRE_RUN_EXERCISES,
    icon: "pre-run",
    color: "#FF9500"
  },
  {
    id: "post-run",
    name: "Post-Run Cool Down",
    description: "Static stretches for recovery",
    duration: 6,
    exercises: POST_RUN_EXERCISES,
    icon: "post-run",
    color: "#30D158"
  },
  {
    id: "strength",
    name: "Runner Strength",
    description: "Build strength in key running muscles",
    duration: 7,
    exercises: STRENGTH_EXERCISES,
    icon: "strength",
    color: "#FF4500"
  },
  {
    id: "foam-roll",
    name: "Foam Rolling",
    description: "Release tight muscles & fascia",
    duration: 6,
    exercises: FOAM_ROLL_EXERCISES,
    icon: "foam-roll",
    color: "#AF52DE"
  }
];

const BODY_AREAS = [
  { id: "calves", name: "Calves", color: "#30D158" },
  { id: "quads", name: "Quads", color: "#00D4FF" },
  { id: "hamstrings", name: "Hamstrings", color: "#FF9500" },
  { id: "hips", name: "Hips", color: "#FF4500" },
  { id: "glutes", name: "Glutes", color: "#AF52DE" },
  { id: "it-band", name: "IT Band", color: "#FFD60A" },
  { id: "lower-back", name: "Lower Back", color: "#5E5CE6" },
  { id: "ankles", name: "Ankles", color: "#FF375F" }
];

interface MobilityHubProps {
  onClose: () => void;
}

export function MobilityHub({ onClose }: MobilityHubProps) {
  const [view, setView] = useState<"home" | "routine" | "body-check">("home");
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Timer for exercises
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isPlaying && timeRemaining === 0 && selectedRoutine) {
      // Exercise complete
      hapticMedium();
      const currentExercise = selectedRoutine.exercises[currentExerciseIndex];
      if (!completedExercises.includes(currentExercise.id)) {
        setCompletedExercises(prev => [...prev, currentExercise.id]);
      }
      
      // Move to next exercise
      if (currentExerciseIndex < selectedRoutine.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setTimeRemaining(selectedRoutine.exercises[currentExerciseIndex + 1].duration);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining, currentExerciseIndex, selectedRoutine, completedExercises]);

  const startRoutine = (routine: Routine) => {
    hapticLight();
    setSelectedRoutine(routine);
    setCurrentExerciseIndex(0);
    setTimeRemaining(routine.exercises[0].duration);
    setCompletedExercises([]);
    setView("routine");
  };

  const togglePlayPause = () => {
    hapticLight();
    setIsPlaying(!isPlaying);
  };

  const skipExercise = () => {
    hapticLight();
    if (selectedRoutine && currentExerciseIndex < selectedRoutine.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setTimeRemaining(selectedRoutine.exercises[currentExerciseIndex + 1].duration);
      setIsPlaying(false);
    }
  };

  const restartRoutine = () => {
    hapticLight();
    if (selectedRoutine) {
      setCurrentExerciseIndex(0);
      setTimeRemaining(selectedRoutine.exercises[0].duration);
      setCompletedExercises([]);
      setIsPlaying(false);
    }
  };

  const toggleBodyArea = (areaId: string) => {
    hapticLight();
    setSelectedBodyAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const getRecommendedExercises = () => {
    const exercises: Exercise[] = [];
    const areaMapping: Record<string, Exercise[]> = {
      "calves": [POST_RUN_EXERCISES.find(e => e.id === "calf-stretch")!, FOAM_ROLL_EXERCISES.find(e => e.id === "foam-calves")!],
      "quads": [POST_RUN_EXERCISES.find(e => e.id === "quad-stretch")!, FOAM_ROLL_EXERCISES.find(e => e.id === "foam-quads")!],
      "hamstrings": [POST_RUN_EXERCISES.find(e => e.id === "hamstring-stretch")!, FOAM_ROLL_EXERCISES.find(e => e.id === "foam-hamstrings")!],
      "hips": [POST_RUN_EXERCISES.find(e => e.id === "hip-flexor-stretch")!, POST_RUN_EXERCISES.find(e => e.id === "pigeon-stretch")!],
      "glutes": [POST_RUN_EXERCISES.find(e => e.id === "pigeon-stretch")!, FOAM_ROLL_EXERCISES.find(e => e.id === "foam-glutes")!],
      "it-band": [POST_RUN_EXERCISES.find(e => e.id === "it-band-stretch")!, FOAM_ROLL_EXERCISES.find(e => e.id === "foam-it-band")!],
      "lower-back": [FOAM_ROLL_EXERCISES.find(e => e.id === "foam-upper-back")!],
      "ankles": [PRE_RUN_EXERCISES.find(e => e.id === "ankle-circles")!, STRENGTH_EXERCISES.find(e => e.id === "calf-raises")!]
    };
    
    selectedBodyAreas.forEach(area => {
      const areaExercises = areaMapping[area];
      if (areaExercises) {
        areaExercises.forEach(ex => {
          if (ex && !exercises.find(e => e.id === ex.id)) {
            exercises.push(ex);
          }
        });
      }
    });
    
    return exercises;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIconForRoutine = (icon: string) => {
    switch (icon) {
      case "pre-run": return <Flame className="w-6 h-6" />;
      case "post-run": return <Wind className="w-6 h-6" />;
      case "strength": return <Zap className="w-6 h-6" />;
      case "foam-roll": return <RotateCcw className="w-6 h-6" />;
      default: return <Flame className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0A0A0C]"
    >
      {/* Header */}
      <div className="fixed-header-safe glass-header z-50">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== "home" && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setView("home");
                  setSelectedRoutine(null);
                  setIsPlaying(false);
                }}
                className="w-10 h-10 rounded-xl bg-[#1C1C1E] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {view === "home" ? "Mobility Hub" : 
                 view === "body-check" ? "Body Check-In" :
                 selectedRoutine?.name}
              </h1>
              <p className="text-[#8E8E93] text-sm">
                {view === "home" ? "Keep your body running strong" :
                 view === "body-check" ? "Where do you feel tight?" :
                 `${selectedRoutine?.duration} min routine`}
              </p>
            </div>
          </div>
          {view === "home" && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#1C1C1E] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="pt-28 pb-8 px-5 overflow-y-auto h-full">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Body Check-In Card */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setView("body-check")}
                className="w-full p-5 rounded-2xl bg-gradient-to-r from-[#FF375F]/20 to-[#FF375F]/5 border border-[#FF375F]/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF375F]/20 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-[#FF375F]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-lg">Body Check-In</p>
                    <p className="text-[#8E8E93] text-sm">Get personalized recommendations</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
                </div>
              </motion.button>

              {/* Routines Grid */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Quick Routines</h2>
                <div className="grid grid-cols-2 gap-3">
                  {ROUTINES.map((routine) => (
                    <motion.button
                      key={routine.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startRoutine(routine)}
                      className="p-4 rounded-2xl border text-left"
                      style={{ 
                        backgroundColor: `${routine.color}15`,
                        borderColor: `${routine.color}30`
                      }}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${routine.color}25` }}
                      >
                        <div style={{ color: routine.color }}>
                          {getIconForRoutine(routine.icon)}
                        </div>
                      </div>
                      <p className="text-white font-semibold">{routine.name}</p>
                      <p className="text-[#8E8E93] text-xs mt-1">{routine.duration} min</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Tips Section */}
              <div className="p-4 rounded-2xl bg-[#1C1C1E]/80 border border-[#2C2C2E]">
                <h3 className="text-white font-semibold mb-2">Pro Tips</h3>
                <ul className="space-y-2 text-sm text-[#8E8E93]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#30D158]">•</span>
                    Dynamic stretches before runs, static stretches after
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00D4FF]">•</span>
                    Foam roll 2-3x per week for best results
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF9500]">•</span>
                    Strength train on easy run days, not before hard workouts
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

          {view === "body-check" && (
            <motion.div
              key="body-check"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <p className="text-[#AEAEB2]">
                Tap the areas that feel tight or sore. We&apos;ll recommend targeted exercises.
              </p>

              {/* Body Area Grid */}
              <div className="grid grid-cols-2 gap-3">
                {BODY_AREAS.map((area) => (
                  <motion.button
                    key={area.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleBodyArea(area.id)}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedBodyAreas.includes(area.id)
                        ? "border-2"
                        : "border-[#2C2C2E] bg-[#1C1C1E]/50"
                    }`}
                    style={{
                      borderColor: selectedBodyAreas.includes(area.id) ? area.color : undefined,
                      backgroundColor: selectedBodyAreas.includes(area.id) ? `${area.color}15` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{area.name}</span>
                      {selectedBodyAreas.includes(area.id) && (
                        <CheckCircle2 className="w-5 h-5" style={{ color: area.color }} />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Recommendations */}
              {selectedBodyAreas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-bold text-white">Recommended Exercises</h3>
                  {getRecommendedExercises().map((exercise) => (
                    <div
                      key={exercise.id}
                      className="p-4 rounded-xl bg-[#1C1C1E]/80 border border-[#2C2C2E]"
                    >
                      <button
                        onClick={() => setExpandedExercise(
                          expandedExercise === exercise.id ? null : exercise.id
                        )}
                        className="w-full flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-semibold text-left">{exercise.name}</p>
                          <p className="text-[#8E8E93] text-sm">{exercise.targetArea}</p>
                        </div>
                        {expandedExercise === exercise.id ? (
                          <ChevronUp className="w-5 h-5 text-[#6E6E73]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#6E6E73]" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedExercise === exercise.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <ul className="mt-3 pt-3 border-t border-[#2C2C2E] space-y-2">
                              {exercise.instructions.map((instruction, i) => (
                                <li key={i} className="text-[#AEAEB2] text-sm flex gap-2">
                                  <span className="text-[#FF4500]">{i + 1}.</span>
                                  {instruction}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {view === "routine" && selectedRoutine && (
            <motion.div
              key="routine"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Current Exercise */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1C1C1E] to-[#0A0A0C] border border-[#2C2C2E]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#8E8E93] text-sm">
                    Exercise {currentExerciseIndex + 1} of {selectedRoutine.exercises.length}
                  </span>
                  {completedExercises.includes(selectedRoutine.exercises[currentExerciseIndex].id) && (
                    <span className="flex items-center gap-1 text-[#30D158] text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedRoutine.exercises[currentExerciseIndex].name}
                </h2>
                <p className="text-[#AEAEB2] mb-6">
                  {selectedRoutine.exercises[currentExerciseIndex].description}
                </p>

                {/* Timer Circle */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#2C2C2E"
                        strokeWidth="8"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={selectedRoutine.color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * (1 - timeRemaining / selectedRoutine.exercises[currentExerciseIndex].duration))}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={restartRoutine}
                    className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlayPause}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedRoutine.color }}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={skipExercise}
                    className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center"
                    disabled={currentExerciseIndex >= selectedRoutine.exercises.length - 1}
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-[#1C1C1E]/80 border border-[#2C2C2E]">
                <h3 className="text-white font-semibold mb-3">Instructions</h3>
                <ul className="space-y-2">
                  {selectedRoutine.exercises[currentExerciseIndex].instructions.map((instruction, i) => (
                    <li key={i} className="text-[#AEAEB2] text-sm flex gap-2">
                      <span className="text-[#FF4500] font-semibold">{i + 1}.</span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exercise List */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">All Exercises</h3>
                <div className="space-y-2">
                  {selectedRoutine.exercises.map((exercise, index) => (
                    <motion.button
                      key={exercise.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setCurrentExerciseIndex(index);
                        setTimeRemaining(exercise.duration);
                        setIsPlaying(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        index === currentExerciseIndex
                          ? "bg-[#2C2C2E] border border-[#3C3C3E]"
                          : "bg-[#1C1C1E]/50"
                      }`}
                    >
                      <div 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                          completedExercises.includes(exercise.id)
                            ? "bg-[#30D158]/20 text-[#30D158]"
                            : index === currentExerciseIndex
                            ? "text-white"
                            : "bg-[#2C2C2E] text-[#8E8E93]"
                        }`}
                        style={index === currentExerciseIndex ? { backgroundColor: `${selectedRoutine.color}30`, color: selectedRoutine.color } : undefined}
                      >
                        {completedExercises.includes(exercise.id) ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${index === currentExerciseIndex ? "text-white" : "text-[#AEAEB2]"}`}>
                          {exercise.name}
                        </p>
                      </div>
                      <span className="text-[#6E6E73] text-sm">
                        {formatTime(exercise.duration)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Completion Message */}
              {completedExercises.length === selectedRoutine.exercises.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-[#30D158]/20 to-[#30D158]/5 border border-[#30D158]/30 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-[#30D158] mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Routine Complete!</h3>
                  <p className="text-[#AEAEB2]">Great work taking care of your body.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
