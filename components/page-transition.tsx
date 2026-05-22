"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionContextType {
  isTransitioning: boolean;
  startTransition: () => void;
  endTransition: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isTransitioning: false,
  startTransition: () => {},
  endTransition: () => {},
});

export const usePageTransition = () => useContext(PageTransitionContext);

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();
  
  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);
  
  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);
  
  // Reset transition state when pathname changes (navigation complete)
  useEffect(() => {
    // Small delay to ensure the new page content is ready
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);
  
  return (
    <PageTransitionContext.Provider value={{ isTransitioning, startTransition, endTransition }}>
      <div 
        className="page-transition-container"
        style={{
          opacity: isTransitioning ? 0.97 : 1,
          transition: "opacity 100ms ease-out",
        }}
      >
        {children}
      </div>
    </PageTransitionContext.Provider>
  );
}
