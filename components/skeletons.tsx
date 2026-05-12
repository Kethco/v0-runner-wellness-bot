"use client";

import { motion } from "framer-motion";

// Base shimmer animation
const shimmer = {
  initial: { x: "-100%" },
  animate: { x: "100%" },
  transition: {
    repeat: Infinity,
    duration: 1.5,
    ease: "linear",
  },
};

function SkeletonBase({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#2C2C2E] rounded-xl ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3A3A3C]/50 to-transparent"
        initial={shimmer.initial}
        animate={shimmer.animate}
        transition={shimmer.transition}
      />
    </div>
  );
}

// Hero stats card skeleton
export function HeroCardSkeleton() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#1C1C1E] to-[#0D0D0D] p-6 border border-[#3A3A3C]">
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-8 w-32" />
        </div>
        <SkeletonBase className="h-10 w-20 rounded-full" />
      </div>
      
      <div className="flex items-center gap-8">
        {/* Progress ring skeleton */}
        <SkeletonBase className="w-32 h-32 rounded-full" />
        
        {/* Stats skeleton */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <SkeletonBase className="h-3 w-16" />
            <SkeletonBase className="h-6 w-24" />
          </div>
          <div className="space-y-1">
            <SkeletonBase className="h-3 w-20" />
            <SkeletonBase className="h-6 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Action buttons skeleton
export function ActionButtonsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SkeletonBase className="h-20 rounded-2xl" />
      <SkeletonBase className="h-20 rounded-2xl" />
    </div>
  );
}

// Wellness metrics skeleton
export function WellnessMetricsSkeleton() {
  return (
    <div className="rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-5">
      <SkeletonBase className="h-5 w-32 mb-4" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <SkeletonBase className="h-12 w-12 rounded-xl mx-auto" />
            <SkeletonBase className="h-3 w-10 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Coach card skeleton
export function AICoachSkeleton() {
  return (
    <div className="rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-5">
      <div className="flex items-center gap-3 mb-3">
        <SkeletonBase className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <SkeletonBase className="h-4 w-20" />
          <SkeletonBase className="h-3 w-32" />
        </div>
      </div>
      <SkeletonBase className="h-16 w-full rounded-xl" />
    </div>
  );
}

// Recent runs skeleton
export function RecentRunsSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBase className="h-5 w-28" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBase className="h-10 w-10 rounded-xl" />
              <div className="space-y-1">
                <SkeletonBase className="h-4 w-20" />
                <SkeletonBase className="h-3 w-24" />
              </div>
            </div>
            <SkeletonBase className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-7 w-32" />
        </div>
        <SkeletonBase className="h-10 w-10 rounded-full" />
      </div>
      
      <HeroCardSkeleton />
      <ActionButtonsSkeleton />
      <WellnessMetricsSkeleton />
      <AICoachSkeleton />
      <RecentRunsSkeleton />
    </div>
  );
}
