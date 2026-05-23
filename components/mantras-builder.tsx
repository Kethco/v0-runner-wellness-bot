"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Plus, Trash2, Sparkles, ChevronRight, Check, 
  Mountain, Zap, Heart, Flame, Target, Shield, Star
} from "lucide-react";

interface MantrasBuilderProps {
  onClose: () => void;
}

// Pre-built mantra suggestions by category
const MANTRA_CATEGORIES = [
  {
    id: "tough-moments",
    name: "Tough Moments",
    icon: Mountain,
    color: "#FF6B00",
    description: "When the going gets hard",
    suggestions: [
      "I am stronger than this moment",
      "Pain is temporary, pride is forever",
      "My body can do hard things",
      "This is where champions are made",
      "I didn't come this far to only come this far",
      "Embrace the suck",
      "One more step, then another"
    ]
  },
  {
    id: "race-day",
    name: "Race Day",
    icon: Flame,
    color: "#FF3B30",
    description: "When it matters most",
    suggestions: [
      "I trained for this moment",
      "Trust your training",
      "Today I run my race",
      "I am ready",
      "This is my time to shine",
      "Run the mile you're in",
      "Relax, focus, execute"
    ]
  },
  {
    id: "energy",
    name: "Energy Boost",
    icon: Zap,
    color: "#FFD60A",
    description: "When you need a lift",
    suggestions: [
      "Light and fast",
      "I am energy",
      "Power through every stride",
      "Strong legs, strong mind",
      "I am unstoppable",
      "Float like a feather",
      "Smooth is fast, fast is smooth"
    ]
  },
  {
    id: "self-love",
    name: "Self-Compassion",
    icon: Heart,
    color: "#AF52DE",
    description: "Be kind to yourself",
    suggestions: [
      "I am enough, exactly as I am",
      "Progress, not perfection",
      "Every run is a gift",
      "I'm proud of showing up",
      "My worth is not my pace",
      "I honor my body's journey",
      "Rest is part of training"
    ]
  },
  {
    id: "focus",
    name: "Focus & Form",
    icon: Target,
    color: "#64D2FF",
    description: "Stay present and sharp",
    suggestions: [
      "Tall spine, soft shoulders",
      "Eyes up, head high",
      "Quick feet, light landing",
      "Breathe in strength, exhale doubt",
      "Stay in the moment",
      "One stride at a time",
      "Relax and flow"
    ]
  },
  {
    id: "faith",
    name: "Faith & Strength",
    icon: Shield,
    color: "#32D74B",
    description: "Spiritual power",
    suggestions: [
      "I can do all things through Christ who strengthens me",
      "The Lord is my strength",
      "I run and do not grow weary",
      "God's grace carries me",
      "My strength comes from above",
      "I am fearfully and wonderfully made",
      "With God, all things are possible"
    ]
  }
];

// Storage key for mantras
const MANTRAS_STORAGE_KEY = "runner-mantras";

interface SavedMantra {
  id: string;
  text: string;
  categoryId: string;
  createdAt: string;
  isFavorite: boolean;
}

export function MantrasBuilder({ onClose }: MantrasBuilderProps) {
  const [savedMantras, setSavedMantras] = useState<SavedMantra[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customMantra, setCustomMantra] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Load saved mantras from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MANTRAS_STORAGE_KEY);
      if (stored) {
        setSavedMantras(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load mantras:", e);
    }
  }, []);

  // Save mantras to localStorage
  const saveMantras = (mantras: SavedMantra[]) => {
    try {
      localStorage.setItem(MANTRAS_STORAGE_KEY, JSON.stringify(mantras));
      setSavedMantras(mantras);
    } catch (e) {
      console.error("Failed to save mantras:", e);
    }
  };

  const addMantra = (text: string, categoryId: string) => {
    const newMantra: SavedMantra = {
      id: Date.now().toString(),
      text,
      categoryId,
      createdAt: new Date().toISOString(),
      isFavorite: false
    };
    
    const updated = [newMantra, ...savedMantras];
    saveMantras(updated);
    setJustAdded(newMantra.id);
    setTimeout(() => setJustAdded(null), 2000);
  };

  const removeMantra = (id: string) => {
    const updated = savedMantras.filter(m => m.id !== id);
    saveMantras(updated);
  };

  const toggleFavorite = (id: string) => {
    const updated = savedMantras.map(m => 
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    saveMantras(updated);
  };

  const handleAddCustom = () => {
    if (customMantra.trim()) {
      addMantra(customMantra.trim(), "custom");
      setCustomMantra("");
      setShowAddCustom(false);
    }
  };

  const category = MANTRA_CATEGORIES.find(c => c.id === selectedCategory);

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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD60A] to-[#FF9500] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Running Mantras</h1>
                <p className="text-sm text-[#8E8E93]">
                  {savedMantras.length} mantra{savedMantras.length !== 1 ? 's' : ''} saved
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
          {!selectedCategory ? (
            // Main View
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5 space-y-6"
            >
              {/* Saved Mantras Section */}
              {savedMantras.length > 0 && (
                <div>
                  <h2 className="text-[#AEAEB2] text-xs font-bold uppercase tracking-wider mb-3">
                    Your Mantras
                  </h2>
                  <div className="space-y-2">
                    {savedMantras.slice(0, 5).map((mantra) => {
                      const cat = MANTRA_CATEGORIES.find(c => c.id === mantra.categoryId);
                      return (
                        <motion.div
                          key={mantra.id}
                          initial={justAdded === mantra.id ? { scale: 0.8, opacity: 0 } : {}}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-3 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]"
                        >
                          <button
                            onClick={() => toggleFavorite(mantra.id)}
                            className="shrink-0"
                          >
                            <Star 
                              className={`w-5 h-5 ${mantra.isFavorite ? 'text-[#FFD60A] fill-[#FFD60A]' : 'text-[#6E6E73]'}`}
                            />
                          </button>
                          <p className="flex-1 text-white text-sm">
                            "{mantra.text}"
                          </p>
                          <button
                            onClick={() => removeMantra(mantra.id)}
                            className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </motion.div>
                      );
                    })}
                    {savedMantras.length > 5 && (
                      <p className="text-center text-[#8E8E93] text-xs py-2">
                        +{savedMantras.length - 5} more mantras saved
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Add Custom Mantra */}
              <div>
                <h2 className="text-[#AEAEB2] text-xs font-bold uppercase tracking-wider mb-3">
                  Create Your Own
                </h2>
                {showAddCustom ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3"
                  >
                    <textarea
                      value={customMantra}
                      onChange={(e) => setCustomMantra(e.target.value)}
                      placeholder="Write your personal mantra..."
                      className="w-full p-4 rounded-xl bg-[#1C1C1E] border border-[#3A3A3C] text-white placeholder:text-[#6E6E73] resize-none focus:outline-none focus:border-[#FFD60A]"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddCustom(false)}
                        className="flex-1 py-3 rounded-xl bg-[#2C2C2E] text-white font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCustom}
                        disabled={!customMantra.trim()}
                        className="flex-1 py-3 rounded-xl bg-[#FFD60A] text-black font-bold disabled:opacity-50"
                      >
                        Save Mantra
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddCustom(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#3A3A3C] text-[#8E8E93] hover:border-[#FFD60A] hover:text-[#FFD60A] transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Write Your Own Mantra</span>
                  </motion.button>
                )}
              </div>

              {/* Browse Categories */}
              <div>
                <h2 className="text-[#AEAEB2] text-xs font-bold uppercase tracking-wider mb-3">
                  Browse by Situation
                </h2>
                <div className="space-y-3">
                  {MANTRA_CATEGORIES.map((cat, index) => {
                    const Icon = cat.icon;
                    const count = savedMantras.filter(m => m.categoryId === cat.id).length;
                    
                    return (
                      <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all"
                        style={{
                          background: `linear-gradient(to right, ${cat.color}15, ${cat.color}05)`,
                          borderColor: `${cat.color}30`
                        }}
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-bold">{cat.name}</p>
                          <p className="text-[#8E8E93] text-sm">{cat.description}</p>
                        </div>
                        {count > 0 && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: `${cat.color}30`, color: cat.color }}
                          >
                            {count}
                          </span>
                        )}
                        <ChevronRight className="w-5 h-5 text-[#6E6E73]" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : category && (
            // Category View
            <motion.div
              key="category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5"
            >
              {/* Back button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-[#8E8E93] mb-6"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to categories</span>
              </button>

              {/* Category Header */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <category.icon className="w-8 h-8" style={{ color: category.color }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{category.name}</h2>
                  <p className="text-[#8E8E93]">{category.description}</p>
                </div>
              </div>

              {/* Mantra Suggestions */}
              <div className="space-y-3">
                {category.suggestions.map((mantra, index) => {
                  const isSaved = savedMantras.some(m => m.text === mantra);
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]"
                    >
                      <p className="flex-1 text-white">"{mantra}"</p>
                      <button
                        onClick={() => !isSaved && addMantra(mantra, category.id)}
                        disabled={isSaved}
                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isSaved 
                            ? "bg-[#32D74B]/20" 
                            : "bg-[#2C2C2E] hover:bg-[#3A3A3C]"
                        }`}
                        style={!isSaved ? { backgroundColor: `${category.color}20` } : {}}
                      >
                        {isSaved ? (
                          <Check className="w-5 h-5 text-[#32D74B]" />
                        ) : (
                          <Plus className="w-5 h-5" style={{ color: category.color }} />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
