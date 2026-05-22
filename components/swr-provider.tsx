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
        keepPreviousData: true,
        revalidateOnFocus: false,
        dedupingInterval: 10000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
