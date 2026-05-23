"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Sun, Moon as MoonIcon, Heart, Wind, 
  ArrowLeft, Check, ChevronRight, Flame, 
  CloudRain, Smile, Frown, Meh, Zap, Coffee, Flag, Sunrise,
  Mountain, Shield, Dumbbell
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { DailyTips } from "@/components/daily-tips";
import { GuidedBreathing } from "@/components/guided-breathing";
import { RunVisualization } from "@/components/run-visualization";
import { SelfCompassionReset } from "@/components/self-compassion-reset";
import { DailyIntentionCard } from "@/components/daily-intention-card";
import { ProgressEcho } from "@/components/progress-echo";
import { EmotionalPatterns } from "@/components/emotional-patterns";
import { RaceDayPrep } from "@/components/race-day-prep";
import { ComebackJourney } from "@/components/comeback-journey";
import { MentalToughness } from "@/components/mental-toughness";
import { SleepStories } from "@/components/sleep-stories";
import { MantrasBuilder } from "@/components/mantras-builder";
import { MobilityHub } from "@/components/mobility-hub";
import useSWR from "swr";
import { MeshBackground } from "@/components/mesh-background";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

type MindMode = "home" | "pre-run" | "post-run" | "burnout" | "breathe" | "visualize" | "compassion";

export default function MindPage() {
  const [mode, setMode] = useState<MindMode>("home");
  const [showCompassionReset, setShowCompassionReset] = useState(false);
  const [showRaceDayPrep, setShowRaceDayPrep] = useState(false);
  const [showComebackJourney, setShowComebackJourney] = useState(false);
  const [showMentalToughness, setShowMentalToughness] = useState(false);
  const [showSleepStories, setShowSleepStories] = useState(false);
  const [showMantrasBuilder, setShowMantrasBuilder] = useState(false);
  const [showMobilityHub, setShowMobilityHub] = useState(false);
  const [compassionTrigger, setCompassionTrigger] = useState<"bad_run" | "low_energy" | "high_soreness" | "manual">("manual");
  const { data: reflectionsData, mutate } = useSWR("/api/reflections", fetcher);
  const { data: insightsData } = useSWR("/api/wellness-insights", fetcher);
  const { data: journalData } = useSWR("/api/resilience-journal?limit=5", fetcher);

  // Auto-trigger compassion reset when wellness is low
  useEffect(() => {
    if (insightsData?.todayCheckin) {
      const { energy, soreness } = insightsData.todayCheckin;
      // Auto-show prompt (but not the full modal) if struggling
      if (energy && energy <= 2) {
        setCompassionTrigger("low_energy");
      } else if (soreness && soreness >= 4) {
        setCompassionTrigger("high_soreness");
      }
    }
  }, [insightsData]);
  
return (
  <div className="min-h-screen mesh-gradient-bg noise-texture text-foreground pb-28">
      {/* Animated mesh background */}
      <MeshBackground />
      
      {/* Header - Fixed with solid background */}
      <header className="fixed-header-safe glass-header z-50">
        <div className="px-5 py-4 flex items-center gap-4">
          {mode !== "home" ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMode("home")}
              className="w-10 h-10 rounded-xl bg-[#1C1C1E] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5E5CE6] to-[#7B6CF6] flex items-center justify-center shadow-lg shadow-[#5E5CE6]/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">
              {mode === "home" ? "Mind & Soul" : 
               mode === "pre-run" ? "Pre-Run Mindset" :
               mode === "post-run" ? "Post-Run Reflection" : 
               mode === "breathe" ? "Guided Breathing" :
               mode === "visualize" ? "Run Visualization" : "Motivation Support"}
            </h1>
            <p className="text-[#AEAEB2] text-sm">
              {mode === "home" ? "Your mental wellness toolkit" :
               mode === "pre-run" ? "Set your intention" :
               mode === "post-run" ? "Celebrate the moment" :
               mode === "breathe" ? "Find your calm" :
               mode === "visualize" ? "See your success" : "You're not alone"}
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 py-4 mt-[115px]">
        <AnimatePresence mode="wait">
          {mode === "home" && (
            <HomeView 
              onSelectMode={setMode} 
              setShowCompassionReset={setShowCompassionReset}
              setShowRaceDayPrep={setShowRaceDayPrep}
              setShowComebackJourney={setShowComebackJourney}
              setShowMentalToughness={setShowMentalToughness}
              setShowSleepStories={setShowSleepStories}
              setShowMantrasBuilder={setShowMantrasBuilder}
              setShowMobilityHub={setShowMobilityHub}
              compassionTrigger={compassionTrigger}
              journalData={journalData}
            />
          )}
          {mode === "pre-run" && <PreRunView onComplete={() => setMode("home")} />}
          {mode === "post-run" && <PostRunView onComplete={() => { setMode("home"); mutate(); }} />}
{mode === "burnout" && <BurnoutView />}
{mode === "breathe" && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <GuidedBreathing />
  </motion.div>
)}
{mode === "visualize" && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <RunVisualization onComplete={() => setMode("home")} />
  </motion.div>
)}
</AnimatePresence>
      </main>

      {/* Self-Compassion Reset Modal */}
      <AnimatePresence>
        {showCompassionReset && (
          <SelfCompassionReset
            triggerType={compassionTrigger}
            onComplete={() => {
              setShowCompassionReset(false);
              setCompassionTrigger("manual");
            }}
            onDismiss={() => setShowCompassionReset(false)}
          />
        )}
      </AnimatePresence>

      {/* Race Day Prep Modal */}
      <AnimatePresence>
        {showRaceDayPrep && (
          <RaceDayPrep onClose={() => setShowRaceDayPrep(false)} />
        )}
      </AnimatePresence>

      {/* Comeback Journey Modal */}
      <AnimatePresence>
        {showComebackJourney && (
          <ComebackJourney onClose={() => setShowComebackJourney(false)} />
        )}
      </AnimatePresence>

      {/* Mental Toughness Modal */}
      <AnimatePresence>
        {showMentalToughness && (
          <MentalToughness onClose={() => setShowMentalToughness(false)} />
        )}
      </AnimatePresence>

      {/* Sleep Stories Modal */}
      <AnimatePresence>
        {showSleepStories && (
          <SleepStories onClose={() => setShowSleepStories(false)} />
        )}
      </AnimatePresence>

      {/* Mantras Builder Modal */}
      <AnimatePresence>
        {showMantrasBuilder && (
          <MantrasBuilder onClose={() => setShowMantrasBuilder(false)} />
        )}
      </AnimatePresence>

      {/* Mobility Hub Modal */}
      <AnimatePresence>
        {showMobilityHub && (
          <MobilityHub onClose={() => setShowMobilityHub(false)} />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Christian-inspired daily wisdom - rotates based on day of year
const CHRISTIAN_WISDOM = [
  { quote: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
  { quote: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary.", reference: "Isaiah 40:31" },
  { quote: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.", reference: "Psalm 28:7" },
  { quote: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { quote: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
  { quote: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.", reference: "2 Timothy 1:7" },
  { quote: "The joy of the Lord is your strength.", reference: "Nehemiah 8:10" },
  { quote: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
  { quote: "Be strong and take heart, all you who hope in the Lord.", reference: "Psalm 31:24" },
  { quote: "He gives strength to the weary and increases the power of the weak.", reference: "Isaiah 40:29" },
  { quote: "The Lord will fight for you; you need only to be still.", reference: "Exodus 14:14" },
  { quote: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6" },
  { quote: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
  { quote: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" },
  { quote: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
  { quote: "And let us run with perseverance the race marked out for us, fixing our eyes on Jesus.", reference: "Hebrews 12:1-2" },
  { quote: "My grace is sufficient for you, for my power is made perfect in weakness.", reference: "2 Corinthians 12:9" },
  { quote: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18" },
  { quote: "Wait for the Lord; be strong and take heart and wait for the Lord.", reference: "Psalm 27:14" },
  { quote: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", reference: "Matthew 6:33" },
  { quote: "I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.", reference: "John 16:33" },
  { quote: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  { quote: "The name of the Lord is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10" },
  { quote: "He who began a good work in you will carry it on to completion.", reference: "Philippians 1:6" },
  { quote: "Do not fear, for I am with you; do not be dismayed, for I am your God.", reference: "Isaiah 41:10" },
  { quote: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", reference: "Psalm 51:10" },
  { quote: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", reference: "Galatians 6:9" },
  { quote: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.", reference: "Lamentations 3:22-23" },
  { quote: "Commit your way to the Lord; trust in him and he will act.", reference: "Psalm 37:5" },
  { quote: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1" },
  { quote: "In all your ways acknowledge him, and he will make straight your paths.", reference: "Proverbs 3:6" },
];

function HomeView({ 
  onSelectMode, 
  setShowCompassionReset,
  setShowRaceDayPrep,
  setShowComebackJourney,
  setShowMentalToughness,
  setShowSleepStories,
  setShowMantrasBuilder,
  setShowMobilityHub,
  compassionTrigger,
  journalData 
}: { 
  onSelectMode: (mode: MindMode) => void;
  setShowCompassionReset: (show: boolean) => void;
  setShowRaceDayPrep: (show: boolean) => void;
  setShowComebackJourney: (show: boolean) => void;
  setShowMentalToughness: (show: boolean) => void;
  setShowSleepStories: (show: boolean) => void;
  setShowMantrasBuilder: (show: boolean) => void;
  setShowMobilityHub: (show: boolean) => void;
  compassionTrigger: "bad_run" | "low_energy" | "high_soreness" | "manual";
  journalData: { total: number; avgMoodImprovement: number } | null;
}) {
  // Fetch today's wellness data
  const { data: checkinData } = useSWR<{ checkins: Array<{
    sleep_rating: number;
    energy: number;
    soreness: number;
    readiness: number;
    feeling: string;
  }> }>("/api/checkins?limit=1", fetcher);
  
  const todayCheckin = checkinData?.checkins?.[0];
  
  // Calculate wellness state
  const getWellnessState = () => {
    if (!todayCheckin) return null;
    
    const avgScore = (
      (todayCheckin.sleep_rating || 3) +
      (todayCheckin.energy || 3) +
      (todayCheckin.readiness || 3) +
      (6 - (todayCheckin.soreness || 3)) // Invert soreness
    ) / 4;
    
    if (avgScore <= 2) return "low";
    if (avgScore >= 4) return "high";
    return "moderate";
  };
  
  const wellnessState = getWellnessState();
  
  // Personalized greeting based on wellness
  const getWellnessGreeting = () => {
    if (!todayCheckin) {
      return { 
        message: "Welcome to your mental wellness toolkit", 
        suggestion: "breathe",
        suggestionText: "Start with calming breathwork"
      };
    }
    
    if (wellnessState === "low") {
      return {
        message: "I sense today might be tough. Be gentle with yourself.",
        suggestion: "breathe",
        suggestionText: "Try some calming breathwork",
      };
    }
    
    if (todayCheckin.energy <= 2) {
      return {
        message: "Your energy seems low today. Rest is productive too.",
        suggestion: "breathe",
        suggestionText: "Energizing breathwork can help",
      };
    }
    
    if (todayCheckin.soreness >= 4) {
      return {
        message: "Your body is speaking. Listen to it with kindness.",
        suggestion: "breathe",
        suggestionText: "Recovery breathing recommended",
      };
    }
    
    if (wellnessState === "high") {
      return {
        message: "You're feeling great! Channel that energy.",
        suggestion: "visualize",
        suggestionText: "Perfect day to visualize success",
      };
    }
    
    return {
      message: "Your mental wellness toolkit awaits",
      suggestion: "breathe",
      suggestionText: "A few deep breaths can center you",
    };
  };
  
  const greeting = getWellnessGreeting();
  
  // Get daily wisdom based on day of year for consistency throughout the day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todaysWisdom = CHRISTIAN_WISDOM[dayOfYear % CHRISTIAN_WISDOM.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Wellness-Aware Greeting */}
      {greeting.suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border ${
            wellnessState === "low" 
              ? "bg-gradient-to-r from-[#64D2FF]/10 to-[#5E5CE6]/5 border-[#64D2FF]/20"
              : wellnessState === "high"
              ? "bg-gradient-to-r from-[#32D74B]/10 to-[#FFD60A]/5 border-[#32D74B]/20"
              : "bg-gradient-to-r from-[#AF52DE]/10 to-[#5E5CE6]/5 border-[#AF52DE]/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              wellnessState === "low" 
                ? "bg-[#64D2FF]/20"
                : wellnessState === "high"
                ? "bg-[#32D74B]/20"
                : "bg-[#AF52DE]/20"
            }`}>
              {wellnessState === "low" ? (
                <Heart className="w-5 h-5 text-[#64D2FF]" />
              ) : wellnessState === "high" ? (
                <Zap className="w-5 h-5 text-[#32D74B]" />
              ) : (
                <Sparkles className="w-5 h-5 text-[#AF52DE]" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{greeting.message}</p>
              {greeting.suggestionText && (
                <button
                  onClick={() => onSelectMode(greeting.suggestion as MindMode)}
                  className="text-xs text-[#64D2FF] mt-1 hover:underline"
                >
                  {greeting.suggestionText} &rarr;
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily Wisdom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: greeting.suggestion ? 0.1 : 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A] p-6 border border-[#2A2A40]"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#5E5CE6] rounded-full blur-[80px] opacity-30" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#64D2FF] rounded-full blur-[60px] opacity-20" />
        <div className="relative z-10">
          <p className="text-[#64D2FF] text-xs font-bold uppercase tracking-wider mb-3">Daily Wisdom</p>
          <p className="text-white text-xl font-medium leading-relaxed italic">
            "{todaysWisdom.quote}"
          </p>
          <p className="text-[#AEAEB2] text-sm mt-3">— {todaysWisdom.reference}</p>
        </div>
      </motion.div>

      {/* Daily Intention Card */}
      <DailyIntentionCard />

      {/* Weekly Progress Echo */}
      <ProgressEcho />

      {/* Emotional Patterns & Insights */}
      <EmotionalPatterns />

      {/* Daily Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-[#1A1A2E]/80 border border-[#2A2A40] p-5"
      >
        <h3 className="text-white font-bold mb-4">Daily Tips</h3>
        <DailyTips />
      </motion.div>

      {/* Quick Tools Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Guided Breathing Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode("breathe")}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#64D2FF]/20 to-[#5E5CE6]/10 border border-[#64D2FF]/30 p-4"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#64D2FF] to-[#5E5CE6] flex items-center justify-center shadow-lg shadow-[#64D2FF]/20">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Breathing</p>
              <p className="text-[#8E8E93] text-xs">Calm your mind</p>
            </div>
          </div>
        </motion.button>

        {/* Run Visualization Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode("visualize")}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#AF52DE]/20 to-[#7B6CF6]/10 border border-[#AF52DE]/30 p-4"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#AF52DE] to-[#7B6CF6] flex items-center justify-center shadow-lg shadow-[#AF52DE]/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Visualize</p>
              <p className="text-[#8E8E93] text-xs">See your success</p>
            </div>
          </div>
        </motion.button>
      </div>

  {/* Main Actions */}
  <div className="space-y-4">
  <h2 className="text-[#AEAEB2] text-xs font-bold uppercase tracking-wider px-1">Mindset Tools</h2>
  
  {/* Pre-Run Mindset */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectMode("pre-run")}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#FFD60A]/15 to-[#FFD60A]/5 border border-[#FFD60A]/25 hover:border-[#FFD60A]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFD60A]/15 flex items-center justify-center">
            <Sun className="w-7 h-7 text-[#FFD60A]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Pre-Run Mindset</p>
            <p className="text-[#8E8E93] text-sm">Set your intention before you head out</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Post-Run Reflection */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectMode("post-run")}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#32D74B]/15 to-[#32D74B]/5 border border-[#32D74B]/25 hover:border-[#32D74B]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#32D74B]/15 flex items-center justify-center">
            <Heart className="w-7 h-7 text-[#32D74B]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Post-Run Reflection</p>
            <p className="text-[#8E8E93] text-sm">Capture the joy, not just the stats</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Motivation Support */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectMode("burnout")}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#5E5CE6]/15 to-[#5E5CE6]/5 border border-[#5E5CE6]/25 hover:border-[#5E5CE6]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#5E5CE6]/15 flex items-center justify-center">
            <Heart className="w-7 h-7 text-[#5E5CE6]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Feeling Low?</p>
            <p className="text-[#8E8E93] text-sm">Support for motivation dips & burnout</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Self-Compassion Reset */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowCompassionReset(true)}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-colors ${
            compassionTrigger !== "manual" 
              ? "bg-gradient-to-r from-rose-500/20 to-purple-500/10 border-rose-500/40 animate-pulse"
              : "bg-gradient-to-r from-rose-500/15 to-rose-500/5 border-rose-500/25 hover:border-rose-500/40"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center">
            <Heart className="w-7 h-7 text-rose-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">
              {compassionTrigger !== "manual" ? "Time for Self-Care" : "Bad Run Reset"}
            </p>
            <p className="text-[#8E8E93] text-sm">
              {compassionTrigger === "low_energy" 
                ? "Your energy is low - be kind to yourself"
                : compassionTrigger === "high_soreness"
                ? "Your body needs compassion today"
                : "Turn setbacks into self-compassion"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Race Day Prep */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowRaceDayPrep(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#FF6B00]/15 to-[#FF6B00]/5 border border-[#FF6B00]/25 hover:border-[#FF6B00]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center">
            <Flag className="w-7 h-7 text-[#FF6B00]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Race Day Prep</p>
            <p className="text-[#8E8E93] text-sm">Get your mind ready for race day</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Comeback Journey */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowComebackJourney(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#64D2FF]/15 to-[#64D2FF]/5 border border-[#64D2FF]/25 hover:border-[#64D2FF]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#64D2FF]/15 flex items-center justify-center">
            <Sunrise className="w-7 h-7 text-[#64D2FF]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Comeback Journey</p>
            <p className="text-[#8E8E93] text-sm">Support when taking time off</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Mental Toughness Training */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowMentalToughness(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#FF9500]/15 to-[#FF9500]/5 border border-[#FF9500]/25 hover:border-[#FF9500]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FF9500]/15 flex items-center justify-center">
            <Mountain className="w-7 h-7 text-[#FF9500]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Mental Toughness</p>
            <p className="text-[#8E8E93] text-sm">Build resilience for hard runs</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Sleep Stories */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowSleepStories(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#AF52DE]/15 to-[#AF52DE]/5 border border-[#AF52DE]/25 hover:border-[#AF52DE]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#AF52DE]/15 flex items-center justify-center">
            <MoonIcon className="w-7 h-7 text-[#AF52DE]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Sleep Stories</p>
            <p className="text-[#8E8E93] text-sm">Drift off to peaceful sleep</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Running Mantras */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowMantrasBuilder(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#FFD60A]/15 to-[#FFD60A]/5 border border-[#FFD60A]/25 hover:border-[#FFD60A]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFD60A]/15 flex items-center justify-center">
            <Shield className="w-7 h-7 text-[#FFD60A]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Running Mantras</p>
            <p className="text-[#8E8E93] text-sm">Build your power phrases</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Mobility Hub */}
        <motion.button
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowMobilityHub(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#30D158]/15 to-[#30D158]/5 border border-[#30D158]/25 hover:border-[#30D158]/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#30D158]/15 flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-[#30D158]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg">Mobility Hub</p>
            <p className="text-[#8E8E93] text-sm">Stretches, strength & recovery</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
        </motion.button>

        {/* Resilience Journal Stats */}
        {journalData && journalData.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Resilience Journal</p>
                <p className="text-white text-sm mt-1">
                  {journalData.total} {journalData.total === 1 ? "entry" : "entries"} 
                  {journalData.avgMoodImprovement > 0 && (
                    <span className="text-emerald-400"> • Avg +{journalData.avgMoodImprovement} mood boost</span>
                  )}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </motion.div>
        )}
      </div>

      </motion.div>
  );
}

function PreRunView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [intention, setIntention] = useState("");
  const [energy, setEnergy] = useState<string | null>(null);

  const energyLevels = [
    { id: "low", icon: Coffee, label: "Need a boost", color: "#FF9500" },
    { id: "medium", icon: Meh, label: "Steady", color: "#30D158" },
    { id: "high", icon: Zap, label: "Ready to go!", color: "#00D4FF" },
  ];

  const intentions = [
    "I run for the joy of movement",
    "Today I listen to my body",
    "Every step is progress",
    "I am stronger than I think",
    "This run is a gift to myself",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {step === 0 && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto rounded-full bg-[#FF9500]/20 flex items-center justify-center mb-6"
            >
              <Sun className="w-10 h-10 text-[#FF9500]" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">How are you feeling?</h2>
            <p className="text-[#AEAEB2]">Check in with yourself before you run</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {energyLevels.map((level) => (
              <motion.button
                key={level.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setEnergy(level.id); setStep(1); }}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  energy === level.id 
                    ? `border-[${level.color}] bg-[${level.color}]/20` 
                    : "border-[#3A3A3C] bg-[#1C1C1E]"
                }`}
              >
                <level.icon className="w-8 h-8 mx-auto mb-2" style={{ color: level.color }} />
                <p className="text-white text-sm font-medium">{level.label}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-white mb-2">Set Your Intention</h2>
            <p className="text-[#AEAEB2]">Choose or create your own</p>
          </div>

          <div className="space-y-3">
            {intentions.map((text, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIntention(text)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  intention === text 
                    ? "bg-[#FF9500]/20 border-2 border-[#FF9500]" 
                    : "bg-[#1C1C1E] border-2 border-[#3A3A3C]"
                }`}
              >
                <p className="text-white font-medium">{text}</p>
              </motion.button>
            ))}
          </div>

          <div className="relative">
            <textarea
              placeholder="Or write your own..."
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#1C1C1E] border-2 border-[#3A3A3C] text-white placeholder-[#8E8E93] resize-none h-24 focus:border-[#FF9500] focus:outline-none transition-colors"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep(2)}
            disabled={!intention}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF9500] to-[#FF6B00] text-white font-bold text-lg shadow-lg shadow-[#FF9500]/30 disabled:opacity-50"
          >
            Continue
          </motion.button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-24 h-24 mx-auto rounded-full bg-[#30D158]/20 flex items-center justify-center mb-6"
            >
              <Check className="w-12 h-12 text-[#30D158]" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">You're Ready</h2>
            <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-[#3A3A3C]">
              <p className="text-[#AEAEB2] text-sm mb-2">Your intention:</p>
              <p className="text-white text-xl font-medium italic">"{intention}"</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#30D158] to-[#34C759] text-white font-bold text-lg shadow-lg shadow-[#30D158]/30"
          >
            Go Run!
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function PostRunView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [enjoyment, setEnjoyment] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enjoymentLevels = [
    { value: 1, icon: Frown, label: "Tough", color: "#FF453A" },
    { value: 2, icon: CloudRain, label: "Meh", color: "#FF9500" },
    { value: 3, icon: Meh, label: "Okay", color: "#FFD60A" },
    { value: 4, icon: Smile, label: "Good", color: "#30D158" },
    { value: 5, icon: Heart, label: "Loved it!", color: "#FF2D55" },
  ];

  const gratitudePrompts = [
    "I'm grateful my body let me run today",
    "I enjoyed the fresh air and freedom",
    "I feel proud I showed up for myself",
    "The scenery made me smile",
    "I had a moment of peace out there",
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "post_run",
          enjoyment,
          gratitude,
          date: new Date().toISOString().split("T")[0],
        }),
      });
      setStep(2);
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {step === 0 && (
        <div className="space-y-6">
          <div className="text-center py-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto rounded-full bg-[#30D158]/20 flex items-center justify-center mb-6"
            >
              <Heart className="w-10 h-10 text-[#30D158]" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">How was your run?</h2>
            <p className="text-[#AEAEB2]">Not the pace - the experience</p>
          </div>

          <div className="flex justify-between gap-2">
            {enjoymentLevels.map((level) => (
              <motion.button
                key={level.value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setEnjoyment(level.value); setStep(1); }}
                className={`flex-1 p-3 rounded-xl transition-all ${
                  enjoyment === level.value 
                    ? "bg-white/10 border-2" 
                    : "bg-[#1C1C1E] border-2 border-transparent"
                }`}
                style={{ borderColor: enjoyment === level.value ? level.color : undefined }}
              >
                <level.icon 
                  className="w-8 h-8 mx-auto mb-1" 
                  style={{ color: level.color }} 
                />
                <p className="text-[#AEAEB2] text-xs">{level.label}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-white mb-2">Capture a moment</h2>
            <p className="text-[#AEAEB2]">What made this run worth it?</p>
          </div>

          <div className="space-y-3">
            {gratitudePrompts.map((text, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setGratitude(text)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  gratitude === text 
                    ? "bg-[#30D158]/20 border-2 border-[#30D158]" 
                    : "bg-[#1C1C1E] border-2 border-[#3A3A3C]"
                }`}
              >
                <p className="text-white font-medium">{text}</p>
              </motion.button>
            ))}
          </div>

          <textarea
            placeholder="Or write your own reflection..."
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#1C1C1E] border-2 border-[#3A3A3C] text-white placeholder-[#8E8E93] resize-none h-24 focus:border-[#30D158] focus:outline-none transition-colors"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!gratitude || isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#30D158] to-[#34C759] text-white font-bold text-lg shadow-lg shadow-[#30D158]/30 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Reflection"}
          </motion.button>
        </div>
      )}

      {step === 2 && (
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 mx-auto rounded-full bg-[#30D158]/20 flex items-center justify-center mb-6"
          >
            <Sparkles className="w-12 h-12 text-[#30D158]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Beautiful</h2>
          <p className="text-[#AEAEB2] mb-8">Your reflection has been saved</p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            className="px-8 py-4 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] text-white font-bold"
          >
            Done
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function BurnoutView() {
  const supportMessages = [
    {
      title: "It's okay to take a break",
      body: "Rest is part of training. Your body and mind need recovery to come back stronger. Taking time off doesn't erase your progress.",
      color: "#00D4FF"
    },
    {
      title: "You don't have to feel motivated",
      body: "Motivation comes and goes. What matters is showing up when you can - even if it's just a short walk. That still counts.",
      color: "#30D158"
    },
    {
      title: "Running should feel good",
      body: "If every run feels like a chore, something needs to change. Try a new route, run slower, or skip the watch. Rediscover why you started.",
      color: "#FF9500"
    },
    {
      title: "You're not falling behind",
      body: "There is no timeline. There is no race you have to run. You're exactly where you need to be right now.",
      color: "#AF52DE"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="text-center py-6">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-20 mx-auto rounded-full bg-[#00D4FF]/20 flex items-center justify-center mb-6"
        >
          <Wind className="w-10 h-10 text-[#00D4FF]" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">You're not alone</h2>
        <p className="text-[#AEAEB2]">Every runner goes through this</p>
      </div>

      <div className="space-y-4">
        {supportMessages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="p-5 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: msg.color }}
              />
              <div>
                <h3 className="text-white font-bold mb-2">{msg.title}</h3>
                <p className="text-[#AEAEB2] leading-relaxed">{msg.body}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Breathing Exercise */}
      <div className="rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-5 mt-8">
        <h3 className="text-white font-bold mb-4">Take a breath</h3>
        <GuidedBreathing />
      </div>
    </motion.div>
  );
}
