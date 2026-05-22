"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashContextType {
  isLoading: boolean;
  hideSplash: () => void;
}

const SplashContext = createContext<SplashContextType>({
  isLoading: true,
  hideSplash: () => {},
});

export const useSplash = () => useContext(SplashContext);

// Premium wordmark logo component
function RunnerWellnessLogo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 280 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Runner Wellness"
    >
      {/* RUNNER - Premium refined typography */}
      <text
        x="140"
        y="28"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="600"
        fontSize="26"
        letterSpacing="0.18em"
      >
        RUNNER
      </text>
      
      {/* WELLNESS - Slightly lighter weight for elegant hierarchy */}
      <text
        x="140"
        y="52"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="300"
        fontSize="18"
        letterSpacing="0.35em"
      >
        WELLNESS
      </text>
      
      {/* Subtle accent line between words */}
      <rect
        x="95"
        y="33"
        width="90"
        height="1"
        fill="white"
        opacity="0.4"
      />
    </svg>
  );
}

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#FF4500] flex items-center justify-center"
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10" />
      
      {/* Logo container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <RunnerWellnessLogo className="w-72 h-auto" />
      </motion.div>
      
      {/* Subtle loading indicator at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex gap-1.5"
        >
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function SplashProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Minimum splash duration for branding + time for initial data load
    const minDuration = 1500; // 1.5 seconds minimum
    const startTime = Date.now();

    const hideSplash = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    };

    // Hide splash when the window fully loads or after timeout
    if (document.readyState === "complete") {
      hideSplash();
    } else {
      window.addEventListener("load", hideSplash);
      // Fallback timeout in case load event doesn't fire
      const timeout = setTimeout(hideSplash, 3000);
      
      return () => {
        window.removeEventListener("load", hideSplash);
        clearTimeout(timeout);
      };
    }
  }, []);

  const hideSplash = () => setIsLoading(false);

  // Don't render splash on server
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SplashContext.Provider value={{ isLoading, hideSplash }}>
      <AnimatePresence mode="wait">
        {isLoading && <SplashScreen key="splash" />}
      </AnimatePresence>
      {children}
    </SplashContext.Provider>
  );
}
