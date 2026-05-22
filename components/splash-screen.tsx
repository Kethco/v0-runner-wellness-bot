"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashContextType {
  isLoading: boolean;
  hideSplash: () => void;
  signalDataReady: () => void;
}

const SplashContext = createContext<SplashContextType>({
  isLoading: true,
  hideSplash: () => {},
  signalDataReady: () => {},
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] bg-[#FF4500] flex items-center justify-center"
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10" />
      
      {/* Logo container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <RunnerWellnessLogo className="w-72 h-auto" />
      </motion.div>
      
      {/* Subtle loading indicator at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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

// Session key to track if we've shown splash this session
const SPLASH_SESSION_KEY = "runner_wellness_splash_shown";

export function SplashProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const hideSplash = useCallback(() => {
    setIsLoading(false);
    // Mark that we've shown splash this session
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    }
  }, []);

  const signalDataReady = useCallback(() => {
    setDataReady(true);
  }, []);

  // Hide splash when BOTH min time elapsed AND data is ready
  useEffect(() => {
    if (minTimeElapsed && dataReady) {
      hideSplash();
    }
  }, [minTimeElapsed, dataReady, hideSplash]);

  useEffect(() => {
    setMounted(true);
    
    // Check if splash was already shown this session (browser tab)
    const alreadyShownThisSession = sessionStorage.getItem(SPLASH_SESSION_KEY) === "true";
    
    if (alreadyShownThisSession) {
      // Skip splash if already shown this session
      setIsLoading(false);
      setMinTimeElapsed(true);
      setDataReady(true);
      return;
    }

    // Minimum splash duration for branding
    const minDuration = 1800;
    
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDuration);

    // Fallback timeout - if data never signals ready, hide after max time
    const maxTimeout = setTimeout(() => {
      setDataReady(true);
    }, 5000);
      
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimeout);
    };
  }, []);

  // Show splash when returning to the app after being in background
  useEffect(() => {
    if (!mounted) return;

    let wasHidden = false;
    let hiddenTime = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden = true;
        hiddenTime = Date.now();
      } else if (wasHidden) {
        // User returned to the app
        const timeAway = Date.now() - hiddenTime;
        
        // Show splash if away for more than 5 seconds
        if (timeAway > 5000) {
          setIsLoading(true);
          // Auto-hide after brief display
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
        wasHidden = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mounted]);

  // Don't render splash on server
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SplashContext.Provider value={{ isLoading, hideSplash, signalDataReady }}>
      <AnimatePresence mode="wait">
        {isLoading && <SplashScreen key="splash" />}
      </AnimatePresence>
      {children}
    </SplashContext.Provider>
  );
}
