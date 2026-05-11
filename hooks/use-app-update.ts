"use client";

import { useState, useEffect, useCallback } from "react";

const VERSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const CLIENT_VERSION_KEY = "app-client-version";
const DISMISSED_KEY = "app-update-dismissed";

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const response = await fetch(`/api/version?t=${Date.now()}`, { 
        cache: 'no-store'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      const serverVersion = data.version;
      
      if (!serverVersion) return;
      
      // Get stored client version
      const clientVersion = localStorage.getItem(CLIENT_VERSION_KEY);
      const dismissed = sessionStorage.getItem(DISMISSED_KEY);
      
      // First visit ever - store the version
      if (!clientVersion) {
        localStorage.setItem(CLIENT_VERSION_KEY, serverVersion);
        return;
      }
      
      // Version changed and not dismissed this session
      if (serverVersion !== clientVersion && dismissed !== serverVersion) {
        console.log("[v0] Update available:", clientVersion, "->", serverVersion);
        setUpdateAvailable(true);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const refreshApp = useCallback(() => {
    // Store the new version before refreshing
    fetch(`/api/version?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.version) {
          localStorage.setItem(CLIENT_VERSION_KEY, data.version);
        }
        window.location.reload();
      })
      .catch(() => window.location.reload());
  }, []);

  const dismissUpdate = useCallback(() => {
    fetch(`/api/version?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.version) {
          sessionStorage.setItem(DISMISSED_KEY, data.version);
        }
      });
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    // Check after a short delay to let the app load
    const initialCheck = setTimeout(checkForUpdate, 2000);

    // Periodic checking
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);

    // Check on tab focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkForUpdate]);

  return { updateAvailable, refreshApp, dismissUpdate };
}
