"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Skip transitions on coach pages and non-mobile
  if (pathname.startsWith("/coach") || pathname.startsWith("/join") || pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return <>{children}</>;
  }

  // Desktop: simple fade
  if (!isMobile) {
    return (
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  // Mobile: 3D book page flip
  return (
    <div 
      className="page-transition-wrapper"
      style={{ 
        perspective: "1500px",
        perspectiveOrigin: "center center",
        overflow: "hidden",
      }}
    >
      <motion.div
        key={pathname}
        initial={{ 
          rotateY: 90,
          opacity: 0,
          scale: 0.95,
        }}
        animate={{ 
          rotateY: 0,
          opacity: 1,
          scale: 1,
        }}
        exit={{ 
          rotateY: -90,
          opacity: 0,
          scale: 0.95,
        }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1], // Custom ease for smooth feel
        }}
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Page shadow during flip */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "linear-gradient(to left, rgba(0,0,0,0.3) 0%, transparent 30%)",
          }}
        />
        
        {/* Page content */}
        <div className="relative min-h-screen">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
