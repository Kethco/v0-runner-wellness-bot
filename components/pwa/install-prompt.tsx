"use client";

import { useState, useEffect } from "react";
import { X, Share, Download } from "lucide-react";

type DeviceType = "ios" | "android" | "other";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("other");

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;
    
    // Skip in v0 preview
    if (window.location.hostname.includes("v0.dev")) return;
    if (window.location.hostname.includes("vusercontent")) return;
    
    // Check if already running as installed PWA (iOS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isIOSStandalone = (navigator as any).standalone === true;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    
    // Hide if running as installed PWA
    if (isIOSStandalone || isStandalone) return;
    
    // Detect device type
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType("ios");
      setShowPrompt(true);
    } else if (/android/i.test(ua)) {
      setDeviceType("android");
      setShowPrompt(true);
    }
    // Don't show on desktop
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          {deviceType === "ios" ? (
            <>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Share className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm">
                Tap <Share className="w-4 h-4 inline mx-1 text-primary" /> then <span className="font-medium">&quot;Add to Home Screen&quot;</span>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm">
                <span className="font-medium">Install App</span> from browser menu
              </p>
            </>
          )}
        </div>
        <button 
          onClick={() => setShowPrompt(false)}
          className="p-2 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
