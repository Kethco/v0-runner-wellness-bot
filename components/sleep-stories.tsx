"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Play, Pause, Moon, Cloud, Wind, 
  Mountain, Waves, ChevronRight, Volume2, VolumeX
} from "lucide-react";

interface SleepStoriesProps {
  onClose: () => void;
}

// Sleep stories designed for runners
const SLEEP_STORIES = [
  {
    id: "forest-recovery",
    title: "Forest Recovery Run",
    description: "A gentle journey through a peaceful forest as your body heals",
    icon: Mountain,
    color: "#32D74B",
    duration: "10 min",
    ambiance: "forest",
    paragraphs: [
      "Close your eyes and take a slow, deep breath. Feel your body sink into the mattress, heavy and relaxed. Your running is done for today. Your only job now is to rest.",
      "Imagine yourself standing at the edge of a quiet forest. The air is cool and fresh, carrying the scent of pine needles and earth. A soft trail winds ahead, dappled with golden light filtering through the canopy.",
      "You begin to walk slowly, not run. This is a recovery journey. Each step is gentle on the soft forest floor. Your feet press into a carpet of fallen leaves, making a soft, satisfying crunch.",
      "As you walk deeper into the forest, feel the tension leaving your legs. The muscles that worked so hard today are now releasing, softening. The forest is absorbing your fatigue.",
      "A gentle stream appears beside the trail. Listen to the water flowing over smooth stones. This stream carries away any remaining stress, any worries about tomorrow's run or yesterday's pace.",
      "Birds sing softly in the distance. They're not urgent songs, just quiet melodies celebrating the end of day. Your breathing matches their rhythm - slow, peaceful, natural.",
      "The trail curves around an ancient oak tree. You pause here, placing your hand on its rough bark. Feel the tree's steady strength. It has stood here for centuries, patient and rooted. You too are strong. You too can rest.",
      "The light is fading now, turning golden, then soft purple. The forest is preparing for sleep, and so are you. Find a soft clearing and lie down on the moss.",
      "The ground supports you completely. Every muscle releases. Your eyes grow heavy. The forest wraps around you like a blanket, protective and warm.",
      "As you drift toward sleep, know that your body is healing. Every cell is repairing, growing stronger. Tomorrow you'll wake refreshed. But that's tomorrow. Now, there is only rest. Only peace. Only sleep."
    ]
  },
  {
    id: "ocean-rhythm",
    title: "The Runner's Ocean",
    description: "Find your rhythm in the gentle pulse of the waves",
    icon: Waves,
    color: "#64D2FF",
    duration: "12 min",
    ambiance: "ocean",
    paragraphs: [
      "Take a deep breath and release it slowly. Let your body settle. The day's miles are behind you. Now is the time for deep, restorative rest.",
      "Picture yourself on a quiet beach at dusk. The sand beneath you is still warm from the day's sun. Above, the sky is painted in soft oranges and purples.",
      "The ocean stretches endlessly before you. Watch the waves roll in, gentle and rhythmic. In... and out. In... and out. Like your breath. Like your heartbeat. Like your footsteps on a long, easy run.",
      "There's something magical about running by the ocean. The way the salt air fills your lungs. The way the horizon reminds you how vast the world is, how small your worries are.",
      "But tonight, you're not running. You're floating. Imagine yourself drifting on calm, warm water. The ocean supports you completely. You don't need to do anything. Just float.",
      "Each wave that passes lifts you gently, then sets you down. Up and down, like a lullaby. Your arms drift at your sides. Your legs are weightless, free from gravity, free from effort.",
      "The water knows all about your runs - the hard ones where you pushed through pain, the easy ones where you found flow. It washes over you now, honoring that effort, soothing those muscles.",
      "Stars begin to appear above. One by one, they blink into existence like small promises. Each star represents a run you've completed, a mile you've conquered, a moment you kept going when you wanted to stop.",
      "The rhythm of the waves matches your slowing heartbeat. In... and out. Slower now. Deeper. The boundary between you and the ocean begins to blur. You are the wave. You are the rhythm.",
      "Let the ocean carry you toward sleep. There's nowhere to go, nothing to do. Just this gentle rocking, this infinite peace. Tomorrow the beach will be there for another run. But tonight, you drift into deep, healing sleep."
    ]
  },
  {
    id: "mountain-rest",
    title: "Summit Rest",
    description: "Rest at the peak after conquering your mountain",
    icon: Mountain,
    color: "#AF52DE",
    duration: "8 min",
    ambiance: "mountain",
    paragraphs: [
      "Breathe in deeply. Hold it for a moment. Now release, letting go of everything you carried today. Your climb is complete. You've reached the summit.",
      "Imagine yourself at the top of a mountain. Not gasping, not struggling - you arrived here with strength to spare. The view stretches for miles in every direction.",
      "The air is thin and clear, cool against your skin. Below, valleys unfold like a patchwork quilt - forests, meadows, tiny villages with lights just beginning to flicker on.",
      "You ran hard to get here. You climbed when your legs burned. You pushed when your mind said stop. And now, you've earned this moment of pure rest.",
      "Find a flat rock, smoothed by centuries of wind. Lie back on it. The stone is warm, heated by the day's sun. It holds you, solid and eternal.",
      "Watch the clouds drift below you. Yes, below you. You're above the clouds tonight. Their soft edges catch the last light, glowing pink and gold.",
      "Your body melts into the rock. Feel your calves release, your quads soften, your hip flexors let go. Every muscle that carried you up this mountain now surrenders to gravity.",
      "The summit is silent except for the whisper of wind. It's not a cold wind - it's gentle, like a hand brushing hair from your forehead. The mountain is thanking you for visiting.",
      "As darkness falls, the stars emerge - more stars than you've ever seen. They're brighter here, closer. Each one a tiny sun, burning for billions of years, and tonight, shining just for you.",
      "Let the mountain guard your sleep. You're safe here, high above the world. Tomorrow you'll descend, refreshed and renewed. But now, surrounded by stars, you drift into peaceful sleep."
    ]
  },
  {
    id: "rain-recovery",
    title: "Gentle Rain",
    description: "Let the rain wash away fatigue and carry you to sleep",
    icon: Cloud,
    color: "#8E8E93",
    duration: "9 min",
    ambiance: "rain",
    paragraphs: [
      "Close your eyes. Take a breath that fills your whole body. Release it slowly, like air leaving a balloon. The rain has begun to fall.",
      "You're inside a cozy cabin, wrapped in soft blankets. Outside the window, rain taps gently on the glass. Not a storm - just a soft, steady rain. The kind that makes everything grow.",
      "Listen to the rhythm. Tap, tap, tap. It's like hundreds of tiny fingers massaging the roof, playing a lullaby just for you. Each drop carries away a little bit of tension.",
      "Remember your runs in the rain? How the world felt quieter, softer? How the rain cooled your skin and washed the effort from your face? Tonight, the rain runs for you.",
      "Inside your blanket cocoon, you're perfectly warm and dry. But you can smell the rain through the cracked window - that fresh, earthy scent that makes everything feel new.",
      "Your body is tired in the best way. The kind of tired that comes from moving, from living, from being strong. Now it's time to let that tiredness transform into deep rest.",
      "The rain intensifies slightly, then softens. Like waves on a shore, it has its own rhythm. Your breath naturally syncs with it. Inhale as it swells, exhale as it fades.",
      "Imagine the rain falling on all the trails you love. It's watering the paths, preparing them for your return. But that's for another day. Tonight, the trails rest too.",
      "The cabin grows dimmer as the evening deepens. Just the sound of rain remains - steady, peaceful, eternal. It has fallen for millions of years. It will fall for millions more.",
      "Let the rain carry your thoughts away. Each drop that falls is a worry dissolving, a doubt disappearing. There's only the rain, only the warmth, only sleep coming gently to claim you."
    ]
  },
  {
    id: "sunset-trail",
    title: "The Golden Hour Trail",
    description: "One last peaceful journey as the sun sets on your day",
    icon: Wind,
    color: "#FFD60A",
    duration: "11 min",
    ambiance: "nature",
    paragraphs: [
      "Let your eyes close softly. Take one more breath of the day. Hold the light inside you for a moment, then release it. The sun is setting, and so are you.",
      "Picture your favorite trail at golden hour. The one where the light turns everything magical. The path glows amber, and long shadows stretch across the ground.",
      "You're jogging slowly, barely more than a walk. This isn't training - this is saying goodnight. Each footfall is gentle, quiet, like you're trying not to wake the earth.",
      "The sky above is a masterpiece. Golds melting into pinks, purples bleeding into deep blue. No artist could capture this. But your eyes drink it in, storing it for dreams.",
      "Wildflowers line the trail, their petals closed for the night. They ran their race today too - reaching for the sun, growing a little taller. Now they rest. Soon, you will too.",
      "Your pace slows even more. You're not tired - you're content. There's a difference. Tired is empty. Content is full. Full of miles, full of effort, full of gratitude.",
      "A deer appears at the trail's edge, watching you without fear. You slow to a walk, then stop. For a moment, you and the deer share the sunset, two creatures at peace.",
      "The deer turns and walks quietly into the trees. You continue your journey home. The trail is taking you back, back to rest, back to healing, back to sleep.",
      "The last rays of sun warm your back as you round the final bend. Tomorrow this trail will be here, waiting for your morning run. But that's tomorrow.",
      "Now, let the last light fade. Feel your footsteps growing lighter, quieter, until they're just a whisper. The trail dissolves into dreams. Your breath deepens. You are home. You are safe. You are asleep."
    ]
  }
];

export function SleepStories({ onClose }: SleepStoriesProps) {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const story = SLEEP_STORIES.find(s => s.id === selectedStory);

  // Auto-advance paragraphs when playing
  useEffect(() => {
    if (isPlaying && story) {
      timerRef.current = setInterval(() => {
        setCurrentParagraph(prev => {
          if (prev < story.paragraphs.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 15000); // 15 seconds per paragraph
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, story]);

  const handleStartStory = (storyId: string) => {
    setSelectedStory(storyId);
    setCurrentParagraph(0);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0A0A1A]"
    >
      <div className="h-full overflow-y-auto pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0A0A1A] via-[#0A0A1A]/95 to-transparent px-5 pt-14 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5E5CE6] to-[#AF52DE] flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Sleep Stories</h1>
                <p className="text-sm text-[#8E8E93]">Drift off to peaceful sleep</p>
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
          {!selectedStory ? (
            // Story Selection View
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5 space-y-4"
            >
              <p className="text-[#AEAEB2] text-sm mb-6">
                Calming narratives designed for runners. Let your body recover while 
                your mind drifts to peaceful places.
              </p>

              {SLEEP_STORIES.map((story, index) => {
                const Icon = story.icon;

                return (
                  <motion.button
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStartStory(story.id)}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border transition-all"
                    style={{
                      background: `linear-gradient(to right, ${story.color}15, ${story.color}05)`,
                      borderColor: `${story.color}30`
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${story.color}20` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: story.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-bold text-lg">{story.title}</p>
                      <p className="text-[#8E8E93] text-sm">{story.description}</p>
                      <p className="text-xs mt-1" style={{ color: story.color }}>
                        {story.duration}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
                  </motion.button>
                );
              })}
            </motion.div>
          ) : story && (
            // Story Playing View
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 h-full flex flex-col"
            >
              {/* Progress bar */}
              <div className="flex items-center gap-1 mb-8">
                {story.paragraphs.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i < currentParagraph 
                        ? "bg-white/60" 
                        : i === currentParagraph 
                        ? "bg-white" 
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              {/* Story content */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentParagraph}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1 }}
                    className="text-center px-4"
                  >
                    <p className="text-white text-xl leading-relaxed font-light">
                      {story.paragraphs[currentParagraph]}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="pb-10">
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: story.color }}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedStory(null);
                      setCurrentParagraph(0);
                      setIsPlaying(false);
                    }}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <p className="text-center text-[#8E8E93] text-sm mt-4">
                  {currentParagraph + 1} of {story.paragraphs.length}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
