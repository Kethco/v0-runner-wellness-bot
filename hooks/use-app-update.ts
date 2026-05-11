"use client";

import { useState, useEffect, useCallback } from "react";

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const DISMISSED_KEY = "app-update-dismissed-version";

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    try {
      // Fetch version from a dedicated endpoint with cache busting
      const response = await fetch(`/api/version?t=${Date.now()}`, { 
        cache: 'no-store'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      const serverVersion = data.version;
      
      if (!serverVersion) return;
      
      // First load - store the version
      if (!currentVersion) {
        setCurrentVersion(serverVersion);
        // Clear any old dismissed version if we're on a new version
        const dismissedVersion = localStorage.getItem(DISMISSED_KEY);
        if (dismissedVersion && dismissedVersion !== serverVersion) {
          localStorage.removeItem(DISMISSED_KEY);
        }
        return;
      }
      
      // Check if version changed and wasn't dismissed
      const dismissedVersion = localStorage.getItem(DISMISSED_KEY);
      if (serverVersion !== currentVersion && serverVersion !== dismissedVersion) {
        setUpdateAvailable(true);
      }
    } catch {
      // Silently fail - network issues shouldn't break the app
    }
  }, [currentVersion]);

  const refreshApp = useCallback(() => {
    // Clear dismissed state and reload
    localStorage.removeItem(DISMISSED_KEY);
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    // Store the dismissed version so it doesn't show again until next update
    if (currentVersion) {
      // Get the new version that's available and dismiss it
      fetch(`/api/version?t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (data.version) {
            localStorage.setItem(DISMISSED_KEY, data.version);
          }
        });
    }
    setUpdateAvailable(false);
  }, [currentVersion]);

  useEffect(() => {
    // Initial check
    checkForUpdate();

    // Set up periodic checking
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);

    // Also check when tab becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  return { updateAvailable, refreshApp, dismissUpdate };
}
