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

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#FF4500] flex items-center justify-center"
    >
      {/* Logo container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        {/* App Logo/Name */}
        <h1 className="text-white font-black text-4xl tracking-tight uppercase">
          Runner
        </h1>
        <h2 className="text-white font-black text-4xl tracking-tight uppercase -mt-1">
          Wellness
        </h2>
      </motion.div>
      
      {/* Subtle pulse animation at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2"
      >
        <div className="w-10 h-1 bg-white/40 rounded-full" />
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
