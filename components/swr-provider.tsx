"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // Keep previous data while revalidating - prevents blank flashes
        keepPreviousData: true,
        // Only revalidate on mount, not on focus (this causes jank)
        revalidateOnMount: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        // Dedupe requests within 30 seconds - longer to prevent frequent refetches
        dedupingInterval: 30000,
        // Don't automatically revalidate stale data
        revalidateIfStale: false,
        // Error retry configuration
        errorRetryCount: 2,
        errorRetryInterval: 3000,
        // Suspense mode off to handle loading states manually
        suspense: false,
        // Don't poll for updates
        refreshInterval: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}
