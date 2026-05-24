"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { hapticMedium, hapticLight } from "@/lib/haptics";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  const pullProgress = useTransform(pullDistance, [0, 80], [0, 1]);
  const spinnerRotation = useTransform(pullDistance, [0, 80], [0, 360]);
  const spinnerScale = useTransform(pullDistance, [0, 40, 80], [0.5, 0.8, 1]);
  const spinnerOpacity = useTransform(pullDistance, [0, 40], [0, 1]);

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) {
      setIsPulling(false);
      pullDistance.set(0);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const diff = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance as user pulls further
    const resistance = 0.5;
    const pull = Math.min(diff * resistance, MAX_PULL);
    
    pullDistance.set(pull);
    
    // Haptic feedback when crossing threshold
    if (pull >= THRESHOLD && pullDistance.get() < THRESHOLD) {
      hapticLight();
    }
  }, [isPulling, disabled, isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    const pull = pullDistance.get();
    
    if (pull >= THRESHOLD && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      hapticMedium();
      
      // Animate to refresh position
      animate(pullDistance, 60, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        // Animate back to zero
        await animate(pullDistance, 0, { duration: 0.3 });
        setIsRefreshing(false);
      }
    } else {
      // Snap back
      animate(pullDistance, 0, { duration: 0.3 });
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, onRefresh]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ 
          top: 0,
          height: pullDistance,
        }}
      >
        <motion.div
          className="relative"
          style={{ 
            scale: spinnerScale,
            opacity: spinnerOpacity,
          }}
        >
          {/* Custom runner spinner */}
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-[#FF4500]/30 border-t-[#FF4500] flex items-center justify-center"
            style={{ 
              rotate: isRefreshing ? undefined : spinnerRotation,
            }}
            animate={isRefreshing ? { rotate: 360 } : undefined}
            transition={isRefreshing ? { 
              duration: 0.8, 
              repeat: Infinity, 
              ease: "linear" 
            } : undefined}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-[#FF4500]"
              style={{
                scale: pullProgress,
              }}
            />
          </motion.div>
          
          {/* "Release to refresh" text */}
          <motion.p
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[#8E8E93] whitespace-nowrap"
            style={{ opacity: pullProgress }}
          >
            {isRefreshing ? "Refreshing..." : pullDistance.get() >= THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Content container */}
      <motion.div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-none"
        style={{ y: pullDistance }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
