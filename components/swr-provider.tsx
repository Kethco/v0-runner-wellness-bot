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
        // Revalidate on mount, focus, and reconnect
        revalidateOnMount: true,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        // Dedupe requests within 5 seconds
        dedupingInterval: 5000,
        // Cache data for 10 minutes before considering it stale
        focusThrottleInterval: 60000,
        // Error retry configuration
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        // Show stale data while revalidating
        revalidateIfStale: true,
        // Suspense mode off to handle loading states manually
        suspense: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
