"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Zap, Heart, Apple, ChevronLeft, ChevronRight,
  Target, Flame, Moon, Droplets
} from "lucide-react";

type Category = "motivation" | "training" | "recovery" | "nutrition";

const TIPS: Record<Category, { title: string; tip: string; icon: React.ReactNode }[]> = {
  motivation: [
    { title: "Start Small", tip: "The hardest part is starting. Just put on your shoes and step outside.", icon: <Sparkles className="w-5 h-5" /> },
    { title: "Embrace the Process", tip: "Progress isn't always linear. Trust your training and be patient.", icon: <Target className="w-5 h-5" /> },
    { title: "Run for Joy", tip: "Remember why you started. Running is a gift, not a chore.", icon: <Heart className="w-5 h-5" /> },
    { title: "Celebrate Every Mile", tip: "Every run counts, no matter the pace or distance.", icon: <Flame className="w-5 h-5" /> },
    { title: "You're Stronger", tip: "Your body can do more than your mind thinks. Push through doubt.", icon: <Zap className="w-5 h-5" /> },
    { title: "Find Your Why", tip: "Connect your runs to a deeper purpose. That's where motivation lives.", icon: <Sparkles className="w-5 h-5" /> },
    { title: "Bad Runs Matter", tip: "The runs you don't feel like doing often matter the most.", icon: <Target className="w-5 h-5" /> },
  ],
  training: [
    { title: "Easy Days Easy", tip: "80% of your runs should be at a conversational pace. Save intensity for key workouts.", icon: <Zap className="w-5 h-5" /> },
    { title: "Warm Up Right", tip: "Start with 5-10 minutes of easy jogging before picking up the pace.", icon: <Flame className="w-5 h-5" /> },
    { title: "Mix It Up", tip: "Include variety: easy runs, tempo, intervals, and long runs build complete fitness.", icon: <Target className="w-5 h-5" /> },
    { title: "Listen to Your Body", tip: "Fatigue is information. Rest when you need it, push when you can.", icon: <Heart className="w-5 h-5" /> },
    { title: "Run Hills", tip: "Hills build strength and improve running economy. Embrace the climb.", icon: <Zap className="w-5 h-5" /> },
    { title: "Cadence Matters", tip: "Aim for 170-180 steps per minute. Quicker turnover reduces injury risk.", icon: <Flame className="w-5 h-5" /> },
    { title: "Cool Down", tip: "End with 5-10 minutes of easy jogging. It aids recovery and flexibility.", icon: <Target className="w-5 h-5" /> },
  ],
  recovery: [
    { title: "Sleep is Training", tip: "Aim for 7-9 hours. Your body rebuilds and adapts while you sleep.", icon: <Moon className="w-5 h-5" /> },
    { title: "Active Recovery", tip: "Light movement on rest days promotes blood flow and healing.", icon: <Heart className="w-5 h-5" /> },
    { title: "Foam Rolling", tip: "Spend 10 minutes on tight spots. It's uncomfortable but effective.", icon: <Zap className="w-5 h-5" /> },
    { title: "Ice & Heat", tip: "Ice for acute pain, heat for muscle stiffness. Both have their place.", icon: <Droplets className="w-5 h-5" /> },
    { title: "Rest Days Matter", tip: "Recovery isn't weakness. It's when adaptation happens.", icon: <Moon className="w-5 h-5" /> },
    { title: "Stretch Daily", tip: "Focus on hips, hamstrings, and calves. Flexibility prevents injury.", icon: <Heart className="w-5 h-5" /> },
    { title: "Mental Recovery", tip: "Take breaks from thinking about running. Your mind needs rest too.", icon: <Sparkles className="w-5 h-5" /> },
  ],
  nutrition: [
    { title: "Hydrate Early", tip: "Start drinking water when you wake up. Don't wait until you're thirsty.", icon: <Droplets className="w-5 h-5" /> },
    { title: "Fuel Your Runs", tip: "Eat 2-3 hours before long runs. Carbs are your friend.", icon: <Apple className="w-5 h-5" /> },
    { title: "Post-Run Window", tip: "Eat protein and carbs within 30-60 minutes after running.", icon: <Flame className="w-5 h-5" /> },
    { title: "Don't Skip Meals", tip: "Consistent eating supports consistent training. Fuel the work.", icon: <Apple className="w-5 h-5" /> },
    { title: "Electrolytes", tip: "Replace sodium, potassium, and magnesium after sweaty runs.", icon: <Droplets className="w-5 h-5" /> },
    { title: "Real Food First", tip: "Whole foods beat supplements. Eat a variety of colors.", icon: <Apple className="w-5 h-5" /> },
    { title: "Listen to Cravings", tip: "Sometimes your body knows what it needs. Trust it.", icon: <Heart className="w-5 h-5" /> },
  ],
};

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bgColor: string }> = {
  motivation: { label: "Motivation", color: "#AF52DE", bgColor: "from-[#AF52DE]/20 to-[#AF52DE]/5" },
  training: { label: "Training", color: "#FF9500", bgColor: "from-[#FF9500]/20 to-[#FF9500]/5" },
  recovery: { label: "Recovery", color: "#30D158", bgColor: "from-[#30D158]/20 to-[#30D158]/5" },
  nutrition: { label: "Nutrition", color: "#00D4FF", bgColor: "from-[#00D4FF]/20 to-[#00D4FF]/5" },
};

export function DailyTips() {
  const [category, setCategory] = useState<Category>("motivation");
  const [tipIndex, setTipIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const categories: Category[] = ["motivation", "training", "recovery", "nutrition"];
  const tips = TIPS[category];
  const currentTip = tips[tipIndex];
  const config = CATEGORY_CONFIG[category];

  // Auto-rotate tips
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlay, tips.length]);

  // Reset tip index when category changes
  useEffect(() => {
    setTipIndex(0);
  }, [category]);

  const nextTip = () => {
    setIsAutoPlay(false);
    setTipIndex((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setIsAutoPlay(false);
    setTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              category === cat
                ? "text-white"
                : "text-[#8E8E93] bg-[#1C1C1E]"
            }`}
            style={{
              backgroundColor: category === cat ? CATEGORY_CONFIG[cat].color : undefined,
            }}
          >
            {CATEGORY_CONFIG[cat].label}
          </motion.button>
        ))}
      </div>

      {/* Tip Card */}
      <motion.div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.bgColor} border p-6`}
        style={{ borderColor: `${config.color}30` }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${category}-${tipIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${config.color}30`, color: config.color }}
              >
                {currentTip.icon}
              </div>
              <h3 className="text-white font-bold text-lg">{currentTip.title}</h3>
            </div>
            <p className="text-[#AEAEB2] leading-relaxed">{currentTip.tip}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex gap-1">
            {tips.map((_, i) => (
              <button
                key={i}
                onClick={() => { setTipIndex(i); setIsAutoPlay(false); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === tipIndex ? "w-6" : ""
                }`}
                style={{
                  backgroundColor: i === tipIndex ? config.color : "#3A3A3C",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={prevTip}
              className="w-8 h-8 rounded-lg bg-[#2C2C2E] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={nextTip}
              className="w-8 h-8 rounded-lg bg-[#2C2C2E] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
