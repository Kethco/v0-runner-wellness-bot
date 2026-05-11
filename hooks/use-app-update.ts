"use client";

import { useState, useEffect, useCallback } from "react";

const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [initialBuildId, setInitialBuildId] = useState<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    try {
      // Fetch the current page to check for new build ID
      const response = await fetch(window.location.href, { 
        method: 'HEAD',
        cache: 'no-store'
      });
      
      // Check for Vercel's build ID or last-modified header
      const newBuildId = response.headers.get('x-vercel-deployment-url') || 
                         response.headers.get('x-vercel-id') ||
                         response.headers.get('etag');
      
      if (newBuildId && initialBuildId && newBuildId !== initialBuildId) {
        setUpdateAvailable(true);
      } else if (!initialBuildId && newBuildId) {
        setInitialBuildId(newBuildId);
      }
    } catch (error) {
      // Silently fail - network issues shouldn't break the app
    }
  }, [initialBuildId]);

  const refreshApp = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    // Initial check to set baseline
    checkForUpdate();

    // Set up periodic checking
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);

    // Also check when tab becomes visible
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

  return { updateAvailable, refreshApp };
}
