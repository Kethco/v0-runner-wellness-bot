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

// Simple wordmark logo component
function RunnerWellnessLogo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 280 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Runner Wellness"
    >
      <text
        x="140"
        y="28"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="26"
        letterSpacing="0.18em"
      >
        RUNNER
      </text>
      
      <text
        x="140"
        y="52"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="300"
        fontSize="18"
        letterSpacing="0.35em"
      >
        WELLNESS
      </text>
      
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
      initial={{ opacity: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        y: "-100%",
        transition: { 
          duration: 0.35, 
          ease: [0.4, 0, 0.2, 1] // Custom ease for native-like feel
        }
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "#FF4500" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ 
          opacity: 0, 
          y: -20,
          transition: { duration: 0.2, ease: "easeIn" }
        }}
        transition={{ duration: 0.5 }}
      >
        <RunnerWellnessLogo className="w-72 h-auto" />
      </motion.div>
    </motion.div>
  );
}

export function SplashProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const hideSplash = useCallback(() => {
    setIsLoading(false);
  }, []);

  const signalDataReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Simple timeout - hide splash after 1.8 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
      
    return () => {
      clearTimeout(timer);
    };
  }, []);

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
