"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LEDTickerProps {
  streak?: number;
  weeklyMiles?: number;
  userName?: string;
}

// Get time-based greeting
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "night owl";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

// Context-aware message generator
function generateMessages(streak: number, weeklyMiles: number, userName: string): string[] {
  const messages: string[] = [];
  const timeOfDay = getTimeGreeting();
  const firstName = userName.split(" ")[0] || "Runner";
  
  // Streak-based messages
  if (streak >= 30) {
    messages.push(`${streak}-day streak. Legendary commitment.`);
  } else if (streak >= 14) {
    messages.push(`${streak} days strong. You're unstoppable.`);
  } else if (streak >= 7) {
    messages.push(`${streak}-day streak! Keep the momentum.`);
  } else if (streak >= 3) {
    messages.push(`${streak} days in a row. Building habits.`);
  } else if (streak === 1) {
    messages.push("Day 1. Every journey starts here.");
  }
  
  // Weekly miles messages
  if (weeklyMiles >= 30) {
    messages.push(`${weeklyMiles.toFixed(0)} miles this week. Elite volume.`);
  } else if (weeklyMiles >= 20) {
    messages.push(`${weeklyMiles.toFixed(0)} weekly miles. Strong progress.`);
  } else if (weeklyMiles >= 10) {
    messages.push(`${weeklyMiles.toFixed(0)} miles logged this week.`);
  } else if (weeklyMiles > 0) {
    messages.push(`${weeklyMiles.toFixed(1)} miles and counting.`);
  }
  
  // Time-based contextual messages
  if (timeOfDay === "morning") {
    messages.push("Perfect time for a morning run.");
    messages.push("Fresh legs, clear mind. Let's go.");
  } else if (timeOfDay === "afternoon") {
    messages.push("Afternoon miles hit different.");
  } else if (timeOfDay === "evening") {
    messages.push("End the day strong.");
  }
  
  // Motivational messages (always include a few)
  const motivational = [
    "Trust the process.",
    "Consistency beats intensity.",
    "One mile at a time.",
    "Recovery is training too.",
    "Run your own race.",
    "Progress, not perfection.",
    "The body achieves what the mind believes.",
    "Small steps, big results.",
  ];
  
  // Shuffle and pick 2-3 motivational messages
  const shuffled = motivational.sort(() => Math.random() - 0.5);
  messages.push(...shuffled.slice(0, 3));
  
  // Return unique messages
  return [...new Set(messages)];
}

export function LEDTicker({ streak = 0, weeklyMiles = 0, userName = "" }: LEDTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const newMessages = generateMessages(streak, weeklyMiles, userName);
    setMessages(newMessages);
  }, [streak, weeklyMiles, userName]);

  useEffect(() => {
    if (messages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000); // 4 seconds per message
    
    return () => clearInterval(interval);
  }, [messages.length]);

  if (messages.length === 0) return null;

  const currentMessage = messages[currentIndex] || "";

  return (
    <div className="relative w-full h-6 overflow-hidden bg-[#0a0a0a] border-t border-[#1a1a1a]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF4500]/5 to-transparent" />
      
      {/* Text content with fade transition */}
      <div className="relative h-full flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut"
            }}
            className="text-[11px] font-medium tracking-wide text-center text-[#8E8E93]"
          >
            {currentMessage}
          </motion.p>
        </AnimatePresence>
      </div>
      
      {/* Progress indicator dots */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
        {messages.slice(0, Math.min(5, messages.length)).map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-colors duration-300 ${
              i === currentIndex % Math.min(5, messages.length)
                ? "bg-[#FF4500]"
                : "bg-[#2A2A2A]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
