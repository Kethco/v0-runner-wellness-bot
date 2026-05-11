"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function AITrainingCard() {
  const { data: adviceData } = useSWR("/api/ai-advice", fetcher);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const advice = adviceData?.advice;
  const hasAdvice = !!advice;

  // Truncate advice for preview
  const previewLength = 120;
  const needsTruncation = advice && advice.length > previewLength;
  const displayAdvice = isExpanded ? advice : (advice?.substring(0, previewLength) + (needsTruncation ? "..." : ""));

  return (
    <motion.div 
      className="relative rounded-2xl overflow-hidden"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Animated gradient border */}
      <motion.div 
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(90deg, #FF2D55, #FF6B00, #FF8A9B, #FF6B00, #FF2D55)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "200% 0%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Card content */}
      <div className="relative m-[2px] bg-[#141414] rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF2D55]/20 to-[#FF6B00]/20 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(255,45,85,0)",
                "0 0 20px 5px rgba(255,45,85,0.3)",
                "0 0 0 0 rgba(255,45,85,0)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="w-5 h-5 text-[#FF2D55]" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              AI Training Advice
              <Sparkles className="w-3 h-3 text-[#FF6B00]" />
            </h3>
            <p className="text-xs text-white/40">Personalized for you</p>
          </div>
        </div>

        {/* Advice content */}
        {hasAdvice ? (
          <div>
            <p className="text-sm text-white/80 leading-relaxed">
              {displayAdvice}
            </p>
            {needsTruncation && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-[#FF2D55] mt-2 hover:underline"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-white/50">
            Complete your daily check-in to receive personalized AI coaching advice.
          </div>
        )}

        {/* CTA Button */}
        {hasAdvice && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2D55] to-[#FF6B00] text-sm font-bold flex items-center justify-center gap-2"
            style={{
              boxShadow: "0 0 20px rgba(255,45,85,0.3)",
            }}
          >
            Apply to Today&apos;s Run
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
