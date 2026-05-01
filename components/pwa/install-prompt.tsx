"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus, MoreVertical, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DeviceType = "ios" | "android" | "desktop" | "unknown";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Ensure component only runs on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Check if already dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Don't show if installed or dismissed within last 7 days
    if (isStandalone || (dismissed && daysSinceDismissed < 7)) {
      setShowPrompt(false);
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType("ios");
      // Show prompt for iOS after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    } else if (/android/.test(userAgent)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }

    // Listen for beforeinstallprompt event (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem("pwa-installed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Check display mode changes (user installed the app)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setShowPrompt(false);
        localStorage.setItem("pwa-installed", "true");
      }
    };
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [mounted]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        localStorage.setItem("pwa-installed", "true");
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <Card className="bg-card border-border p-4 shadow-lg max-w-md mx-auto">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Install Runner Wellness</h3>
              <p className="text-sm text-muted-foreground">Add to your home screen for quick access</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {deviceType === "ios" && (
          <div className="bg-secondary rounded-lg p-3 space-y-3">
            <p className="text-sm font-medium text-foreground">To install:</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center shrink-0">
                <Share className="w-4 h-4 text-primary" />
              </div>
              <span>1. Tap the <strong className="text-foreground">Share</strong> button in Safari</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span>2. Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></span>
            </div>
          </div>
        )}

        {deviceType === "android" && deferredPrompt && (
          <div className="space-y-3">
            <Button className="w-full gap-2" onClick={handleInstallClick}>
              <Download className="w-4 h-4" />
              Install App
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or tap <MoreVertical className="w-3 h-3 inline" /> in Chrome and select &quot;Add to Home screen&quot;
            </p>
          </div>
        )}

        {deviceType === "android" && !deferredPrompt && (
          <div className="bg-secondary rounded-lg p-3 space-y-3">
            <p className="text-sm font-medium text-foreground">To install:</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center shrink-0">
                <MoreVertical className="w-4 h-4 text-primary" />
              </div>
              <span>1. Tap the <strong className="text-foreground">menu</strong> button in Chrome</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span>2. Tap <strong className="text-foreground">Add to Home screen</strong></span>
            </div>
          </div>
        )}

        {deviceType === "desktop" && deferredPrompt && (
          <Button className="w-full gap-2" onClick={handleInstallClick}>
            <Download className="w-4 h-4" />
            Install App
          </Button>
        )}

        {deviceType === "desktop" && !deferredPrompt && (
          <p className="text-sm text-muted-foreground text-center">
            Click the install icon in your browser&apos;s address bar to add this app
          </p>
        )}
      </Card>
    </div>
  );
}
