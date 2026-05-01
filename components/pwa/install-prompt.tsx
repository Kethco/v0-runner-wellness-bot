"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeviceType = "ios" | "android" | "desktop" | "unknown";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("unknown");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Don't show in v0 preview or if already installed
    if (typeof window === "undefined") return;
    if (window.location.hostname.includes("v0.dev")) return;
    if (window.location.hostname.includes("vusercontent")) return;
    
    // Check for secure context (required for localStorage on some mobile browsers)
    if (!window.isSecureContext) return;
    
    // Check if already running as installed PWA
    // iOS Safari uses navigator.standalone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isIOSStandalone = (navigator as any).standalone === true;
    
    // Other browsers use display-mode: standalone
    let isStandalone = false;
    try {
      isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    } catch {
      // matchMedia may fail in some contexts
    }
    
    // If running as installed app, don't show prompt
    if (isIOSStandalone || isStandalone) return;
    
    // Check if dismissed recently (with try-catch for localStorage)
    try {
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) return;
      }
    } catch {
      // localStorage may not be available
      return;
    }

    // Detect device
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType("ios");
      setShowPrompt(true);
    } else if (/android/i.test(ua)) {
      setDeviceType("android");
      setShowPrompt(true);
    } else {
      setDeviceType("desktop");
      setShowPrompt(true);
    }
  }, [mounted]);

  const handleDismiss = () => {
    try {
      localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    } catch {
      // localStorage may not be available
    }
    setShowPrompt(false);
  };

  if (!mounted || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom duration-300">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="max-w-md mx-auto">
        <h3 className="font-semibold text-foreground mb-2">Install Runner Wellness</h3>
        
        {deviceType === "ios" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Add this app to your home screen for quick access:
            </p>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4">
              <li className="flex items-center gap-2">
                1. Tap <Share className="w-4 h-4 inline text-primary" /> Share
              </li>
              <li className="flex items-center gap-2">
                2. Scroll and tap <Plus className="w-4 h-4 inline text-primary" /> Add to Home Screen
              </li>
            </ol>
          </div>
        )}
        
        {deviceType === "android" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Install this app for quick access and offline use.
            </p>
            <Button onClick={handleDismiss} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Add to Home Screen
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or tap the browser menu and select &quot;Add to Home Screen&quot;
            </p>
          </div>
        )}
        
        {deviceType === "desktop" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Install this app for quick access. Look for the install icon in your browser&apos;s address bar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
