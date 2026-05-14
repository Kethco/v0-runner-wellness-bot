"use client";

import { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/page-transition";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={pathname}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
}
