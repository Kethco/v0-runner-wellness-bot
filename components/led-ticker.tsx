"use client";

import { useState, useEffect } from "react";
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

interface LEDTickerProps {
  streak?: number;
  weeklyMiles?: number;
  userName?: string;
}

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

  useEffect(() => {
    if (messages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="relative w-full h-7 overflow-hidden bg-gradient-to-r from-[#1a0a00] via-[#2a0f00] to-[#1a0a00] border-y border-[#FF4500]/30">
      {/* LED glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF4500]/10 to-transparent" />
      
      {/* Scanline effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[2px]"
        animate={{ y: [0, 28, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      {/* LED dots pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, #FF4500 1px, transparent 1px)`,
          backgroundSize: '4px 4px',
        }}
      />
      
      {/* Text content */}
      <div className="relative h-full flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-bold text-[#FF6B00] tracking-wide text-center truncate"
            style={{
              textShadow: '0 0 10px rgba(255, 107, 0, 0.8), 0 0 20px rgba(255, 69, 0, 0.5)',
            }}
          >
            {messages[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      
      {/* Edge glow */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#1a0a00] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#1a0a00] to-transparent" />
    </div>
  );
}
