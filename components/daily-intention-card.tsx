"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Brain, Heart, TreePine, Zap, 
  Sun, Target, Wind, Check, X
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const VALUES = [
  { id: "mental_clarity", label: "Mental Clarity", icon: Brain, color: "#60A5FA", description: "Stay focused and present" },
  { id: "resilience", label: "Resilience", icon: Zap, color: "#F59E0B", description: "Embrace challenges" },
  { id: "joy", label: "Joy", icon: Sun, color: "#FBBF24", description: "Find moments of happiness" },
  { id: "nature_connection", label: "Nature", icon: TreePine, color: "#34D399", description: "Connect with the outdoors" },
  { id: "self_compassion", label: "Self-Compassion", icon: Heart, color: "#F472B6", description: "Be kind to yourself" },
  { id: "mindfulness", label: "Mindfulness", icon: Wind, color: "#A78BFA", description: "Stay in the moment" },
];

export function DailyIntentionCard() {
  const { data, mutate, isLoading } = useSWR("/api/daily-intention", fetcher);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Set initial value if already set today
  useEffect(() => {
    if (data?.todayIntention) {
      setSelectedValue(data.todayIntention.value);
      setCustomNote(data.todayIntention.custom_note || "");
    }
  }, [data]);

  const handleSave = async () => {
    if (!selectedValue) return;
    
    setIsSaving(true);
    try {
      await fetch("/api/daily-intention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: selectedValue, customNote }),
      });
      await mutate();
      setJustSaved(true);
      setTimeout(() => {
        setJustSaved(false);
        setIsExpanded(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to save intention:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const todayIntention = data?.todayIntention;
  const selectedValueData = VALUES.find(v => v.id === (selectedValue || todayIntention?.value));

  if (isLoading) {
    return (
      <div className="premium-card p-4 animate-pulse">
        <div className="h-16 bg-white/5 rounded-xl" />
      </div>
    );
  }

  // Collapsed state - show set intention or current intention
  if (!isExpanded) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsExpanded(true)}
        className="w-full premium-card overflow-hidden"
      >
        {todayIntention ? (
          // Has intention set
          <div className="p-4 flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${selectedValueData?.color}20` }}
            >
              {selectedValueData && <selectedValueData.icon className="w-6 h-6" style={{ color: selectedValueData.color }} />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Today&apos;s Intention</p>
              <p className="text-white font-semibold">{selectedValueData?.label}</p>
              {todayIntention.custom_note && (
                <p className="text-white/50 text-sm truncate mt-0.5">{todayIntention.custom_note}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <Check className="w-4 h-4" />
              <span className="text-xs font-medium">Set</span>
            </div>
          </div>
        ) : (
          // No intention yet
          <div className="p-4 flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-blue-500/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">Set Your Daily Intention</p>
              <p className="text-white/50 text-sm">What value guides your run today?</p>
            </div>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
        )}
      </motion.button>
    );
  }

  // Expanded state - value selection
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="premium-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">Daily Intention</h3>
          <p className="text-white/50 text-sm">Choose what guides you today</p>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Value Chips */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {VALUES.map((value) => {
            const isSelected = selectedValue === value.id;
            return (
              <motion.button
                key={value.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedValue(value.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
                  isSelected
                    ? "border-transparent"
                    : "border-white/10 hover:border-white/20 bg-white/[0.03]"
                }`}
                style={isSelected ? {
                  backgroundColor: `${value.color}20`,
                  borderColor: `${value.color}50`,
                } : {}}
              >
                <value.icon 
                  className="w-4 h-4" 
                  style={{ color: isSelected ? value.color : "rgba(255,255,255,0.5)" }}
                />
                <span 
                  className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/70"}`}
                >
                  {value.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Selected value description */}
        <AnimatePresence mode="wait">
          {selectedValue && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <p className="text-white/60 text-sm mb-3">
                {VALUES.find(v => v.id === selectedValue)?.description}
              </p>
              
              {/* Optional note */}
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Add a personal note (optional)..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSave}
          disabled={!selectedValue || isSaving}
          className={`w-full mt-4 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            selectedValue
              ? justSaved
                ? "bg-emerald-500 text-white"
                : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          {justSaved ? (
            <>
              <Check className="w-4 h-4" />
              Intention Set
            </>
          ) : isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Set Today&apos;s Intention
            </>
          )}
        </motion.button>

        {/* Streak indicator */}
        {data?.streak > 1 && (
          <p className="text-center text-white/40 text-xs mt-3">
            {data.streak} day streak setting intentions
          </p>
        )}
      </div>
    </motion.div>
  );
}
