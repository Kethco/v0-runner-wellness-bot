"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Star, TrendingUp, X, Share2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShareCard } from "@/hooks/use-share-card";
import confetti from "canvas-confetti";

interface PRCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  distanceLabel: string;
  newTime: string;
  previousTime?: string | null;
  improvementDisplay?: string | null;
}

export function PRCelebrationModal({
  isOpen,
  onClose,
  distanceLabel,
  newTime,
  previousTime,
  improvementDisplay,
}: PRCelebrationModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "shared">("idle");
  const cardRef = useRef<HTMLDivElement>(null);
  const { shareToSocial, downloadShareImage } = useShareCard();

  useEffect(() => {
    if (isOpen) {
      // Delay content for dramatic effect
      setTimeout(() => setShowContent(true), 300);
      
      // Epic confetti explosion
      const duration = 4000;
      const end = Date.now() + duration;
      
      const colors = ["#FFD700", "#FFA500", "#FF6B00", "#FF4500", "#FFFFFF"];
      
      // Initial big burst
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });
      
      // Continuous confetti
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        
        confetti({
          particleCount: 30,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 30,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 250);
      
      return () => clearInterval(interval);
    } else {
      setShowContent(false);
      setShareStatus("idle");
    }
  }, [isOpen]);

  const handleShare = async () => {
    setShareStatus("sharing");
    const success = await shareToSocial({
      type: "pr",
      title: distanceLabel,
      value: newTime,
      improvement: improvementDisplay || undefined,
    }, cardRef.current);
    
    if (success) {
      setShareStatus("shared");
      setTimeout(() => setShareStatus("idle"), 2000);
    } else {
      setShareStatus("idle");
    }
  };

  const handleDownload = async () => {
    if (cardRef.current) {
      await downloadShareImage(cardRef.current, `pr-${distanceLabel.toLowerCase().replace(/\s/g, "-")}.png`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="relative w-[90%] max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-red-500/30 rounded-3xl blur-xl" />
          
          {/* Main card */}
          <div ref={cardRef} className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border-2 border-amber-500/50 rounded-3xl p-6 overflow-hidden">
            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)",
                backgroundSize: "200% 100%",
              }}
              animate={{
                backgroundPosition: ["200% 0%", "-200% 0%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Content */}
            <AnimatePresence>
              {showContent && (
                <div className="relative z-10 text-center">
                  {/* Trophy icon with glow */}
                  <motion.div
                    initial={{ scale: 0, y: -50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 10, delay: 0.1 }}
                    className="relative w-24 h-24 mx-auto mb-4"
                  >
                    {/* Pulsing glow rings */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-amber-500/20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-amber-500/30"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    
                    {/* Trophy */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                        <Trophy className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    
                    {/* Floating stars */}
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.5, 1, 0.5],
                          x: [0, (i - 2) * 30],
                          y: [0, -20 - Math.random() * 30],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        style={{
                          left: "50%",
                          top: "50%",
                        }}
                      >
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  {/* NEW PR text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-400 font-bold text-sm uppercase tracking-widest">
                        New Personal Record
                      </span>
                      <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-1">
                      {distanceLabel}
                    </h2>
                  </motion.div>
                  
                  {/* Time display */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, delay: 0.5 }}
                    className="my-6"
                  >
                    <div className="inline-block bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl px-8 py-4">
                      <p className="text-5xl font-black text-white tracking-tight">
                        {newTime}
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Improvement (if beating previous PR) */}
                  {previousTime && improvementDisplay && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-center justify-center gap-3 mb-6"
                    >
                      <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-bold">
                          {improvementDisplay} faster!
                        </span>
                      </div>
                      <span className="text-white/50 text-sm">
                        Previous: {previousTime}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* First PR message */}
                  {!previousTime && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="text-white/70 text-sm mb-6"
                    >
                      Your first {distanceLabel} record is set!
                    </motion.p>
                  )}
                  
                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-3"
                  >
                    {/* Share row */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={handleShare}
                        variant="outline"
                        size="sm"
                        disabled={shareStatus === "sharing"}
                        className="border-amber-500/30 hover:bg-amber-500/10 text-amber-400"
                      >
                        {shareStatus === "shared" ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : shareStatus === "sharing" ? (
                          "Sharing..."
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        size="sm"
                        className="border-amber-500/30 hover:bg-amber-500/10 text-amber-400"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                    
                    {/* Main action */}
                    <Button
                      onClick={onClose}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-amber-500/30"
                    >
                      Keep Crushing It!
                    </Button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
