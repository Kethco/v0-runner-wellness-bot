"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOTIVATIONAL_QUOTES = [
  "The miracle isn't that I finished. It's that I had the courage to start.",
  "Run when you can, walk if you have to, crawl if you must; just never give up.",
  "Every mile is a gift. Embrace it.",
  "Your legs are not giving out. Your head is giving up.",
  "Pain is temporary. Pride is forever.",
  "The body achieves what the mind believes.",
  "One run can change your day. Many runs can change your life.",
  "You're stronger than your excuses.",
  "Champions train, losers complain.",
  "Run the mile you're in.",
  "Trust your training.",
  "Rest days build champions.",
  "Sweat is just fat crying.",
  "The only bad run is the one you didn't do.",
  "Believe in the run.",
];

// Cool, calm color palette for LED effect
const LED_COLORS = [
  { color: "#00d4ff", glow: "rgba(0, 212, 255, 0.6)" },    // Cyan
  { color: "#00E5A0", glow: "rgba(0, 229, 160, 0.6)" },    // Mint
  { color: "#A78BFA", glow: "rgba(167, 139, 250, 0.6)" },  // Purple
  { color: "#F472B6", glow: "rgba(244, 114, 182, 0.6)" },  // Pink
  { color: "#38BDF8", glow: "rgba(56, 189, 248, 0.6)" },   // Sky blue
  { color: "#2DD4BF", glow: "rgba(45, 212, 191, 0.6)" },   // Teal
];

interface LEDTickerProps {
  streak?: number;
  weeklyMiles?: number;
  userName?: string;
}

// Threshold for when to scroll (approx characters that fit in container)
const SCROLL_THRESHOLD = 45;

export function LEDTicker({ streak = 0, weeklyMiles = 0, userName = "" }: LEDTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Build personalized messages
    const personalizedMessages: string[] = [];
    
    // Add streak-based messages
    if (streak >= 7) {
      personalizedMessages.push(`🔥 ${streak} day streak! You're on fire!`);
    } else if (streak >= 3) {
      personalizedMessages.push(`💪 ${streak} days strong! Keep it going!`);
    }
    
    // Add weekly progress
    if (weeklyMiles > 0) {
      personalizedMessages.push(`📊 ${weeklyMiles.toFixed(1)} miles this week!`);
    }
    
    // Add greeting
    if (userName) {
      personalizedMessages.push(`⭐ Let's crush it today, ${userName}!`);
    }
    
    // Mix in motivational quotes
    const shuffledQuotes = [...MOTIVATIONAL_QUOTES].sort(() => Math.random() - 0.5).slice(0, 5);
    
    // Combine and shuffle
    const allMessages = [...personalizedMessages, ...shuffledQuotes];
    setMessages(allMessages);
  }, [streak, weeklyMiles, userName]);

  // Check if current message needs scrolling based on length
  const currentMessage = messages[currentIndex] || "";
  const needsScroll = currentMessage.length > SCROLL_THRESHOLD;

  useEffect(() => {
    if (messages.length === 0) return;
    
    // Longer display time for scrolling messages
    const displayTime = needsScroll ? 10000 : 4000;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, displayTime);
    
    return () => clearInterval(interval);
  }, [messages.length, needsScroll, currentIndex]);

  if (messages.length === 0) return null;

  // Get current color based on message index
  const currentColor = LED_COLORS[currentIndex % LED_COLORS.length];

  return (
    <div className="relative w-full h-7 overflow-hidden bg-gradient-to-r from-[#0a1520] via-[#0d1a28] to-[#0a1520] border-y border-white/10">
      {/* LED glow effect - changes with color */}
      <motion.div 
        className="absolute inset-0"
        animate={{ 
          background: `linear-gradient(to right, transparent, ${currentColor.color}10, transparent)` 
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Scanline effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[2px]"
        animate={{ y: [0, 28, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      {/* LED dots pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '4px 4px',
        }}
      />
      
      {/* Text content */}
      <div className="relative h-full flex items-center overflow-hidden px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full ${needsScroll ? "" : "flex justify-center"}`}
          >
            <motion.p
              initial={needsScroll ? { x: "100%" } : { x: 0 }}
              animate={needsScroll ? { x: "-100%" } : { x: 0 }}
              transition={needsScroll ? { 
                duration: 8, 
                ease: "linear",
                delay: 0.3 
              } : {}}
              className="text-xs font-bold tracking-wide whitespace-nowrap"
              style={{
                color: currentColor.color,
                textShadow: `0 0 10px ${currentColor.glow}, 0 0 20px ${currentColor.glow}`,
              }}
            >
              {currentMessage}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Edge glow */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a1520] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a1520] to-transparent" />
    </div>
  );
}
