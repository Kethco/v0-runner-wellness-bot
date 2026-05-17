"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  color?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  actionHref, 
  color = "#FF4500" 
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Animated icon container */}
      <motion.div
        className="relative w-24 h-24 mb-6"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl" style={{ backgroundColor: color }} />
        <div className="relative w-full h-full rounded-2xl flex items-center justify-center border border-dashed" style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}>
          <Icon className="w-10 h-10" style={{ color }} />
        </div>
      </motion.div>

      <h3 className="text-xl font-bold text-white mb-2 text-balance">{title}</h3>
      <p className="text-[#8E8E93] text-sm max-w-xs leading-relaxed mb-6">{description}</p>

      {actionLabel && (onAction || actionHref) && (
        actionHref ? (
          <a href={actionHref}>
            <Button className="gap-2 rounded-xl px-6" style={{ backgroundColor: color, color: "#fff" }}>
              {actionLabel}
            </Button>
          </a>
        ) : (
          <Button onClick={onAction} className="gap-2 rounded-xl px-6" style={{ backgroundColor: color, color: "#fff" }}>
            {actionLabel}
          </Button>
        )
      )}
    </motion.div>
  );
}
