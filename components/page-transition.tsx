"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

// Full-width slide animation like native mobile apps
// Current page slides out to the left, new page slides in from the right
export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        x: "100%", // Start fully off-screen to the right
      }}
      animate={{ 
        opacity: 1, 
        x: 0, // Slide to center
        transition: {
          duration: 0.35,
          ease: [0.32, 0.72, 0, 1], // iOS-like spring curve
        }
      }}
      exit={{
        opacity: 0.5,
        x: "-100%", // Exit fully to the left
        transition: {
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1],
        }
      }}
      className={`${className} overflow-x-hidden`}
      style={{ 
        willChange: "transform, opacity",
      }}
    >
      {children}
    </motion.div>
  );
}
