"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const VERSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // Store the initial version when the component first mounts (when user loaded the page)
  const initialVersionRef = useRef<string | null>(null);
  const hasCheckedRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const response = await fetch(`/api/version?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      const serverVersion = data.version;
      
      if (!serverVersion) return;
      
      // First check - store the initial version the user loaded with
      if (!hasCheckedRef.current) {
        initialVersionRef.current = serverVersion;
        hasCheckedRef.current = true;
        return;
      }
      
      // Compare current server version with the version user originally loaded
      if (initialVersionRef.current && serverVersion !== initialVersionRef.current) {
        setUpdateAvailable(true);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const refreshApp = useCallback(() => {
    // Force a hard reload to get the new version
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    // Update the initial version to the current one so we don't show the banner again
    fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.version) {
          initialVersionRef.current = data.version;
        }
      });
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    // First check immediately to capture initial version
    checkForUpdate();

    // Then check periodically
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);

    // Check on tab focus (user coming back to the app)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkForUpdate]);

  return { updateAvailable, refreshApp, dismissUpdate };
}
