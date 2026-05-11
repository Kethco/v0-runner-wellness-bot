"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ 
          opacity: 0, 
          x: 60,
        }}
        animate={{ 
          opacity: 1, 
          x: 0,
        }}
        exit={{
          opacity: 0,
          x: -60,
        }}
        transition={{
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1], // iOS-like easing
        }}
        className="min-h-screen"
        style={{ 
          willChange: "transform, opacity",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
