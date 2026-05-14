"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { useAppUpdate } from "@/hooks/use-app-update";

export function UpdateBanner() {
  const { updateAvailable, refreshApp, dismissUpdate } = useAppUpdate();

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#FF4500] to-[#FF6B00] px-4 py-2 pt-safe shadow-lg"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
            <p className="text-white text-sm font-medium">
              New update available!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshApp}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={dismissUpdate}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
