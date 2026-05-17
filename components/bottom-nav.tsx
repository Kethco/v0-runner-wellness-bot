"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Sparkles, Target, User } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

const navItems = [
  { icon: Activity, label: "Home", href: "/", color: "#FF4500", bgColor: "rgba(255, 69, 0, 0.15)" },
  { icon: TrendingUp, label: "Runs", href: "/runs", color: "#00D4FF", bgColor: "rgba(0, 212, 255, 0.15)" },
  { icon: Sparkles, label: "Mind", href: "/mind", color: "#A78BFA", bgColor: "rgba(167, 139, 250, 0.15)" },
  { icon: Target, label: "Goals", href: "/goals", color: "#22C55E", bgColor: "rgba(34, 197, 94, 0.15)" },
  { icon: User, label: "Profile", href: "/profile", color: "#2DD4BF", bgColor: "rgba(45, 212, 191, 0.15)" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Don't show bottom nav on coach pages
  if (pathname.startsWith("/coach")) {
    return null;
  }
  
  // Find active index for pill animation
  const activeIndex = navItems.findIndex(item => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });

  const handleNavClick = (href: string, isActive: boolean) => {
    hapticLight();
    
    if (isActive) {
      // Scroll to top if already on this page
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push(href);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="relative flex items-center justify-around py-1.5 px-2 max-w-lg mx-auto">
        {/* Animated pill indicator */}
        <motion.div
          className="absolute top-1 h-[42px] rounded-xl"
          initial={false}
          animate={{
            x: `calc(${activeIndex * 100}% + ${activeIndex * 4}px)`,
            width: `calc(${100 / navItems.length}% - 8px)`,
            backgroundColor: activeIndex >= 0 ? navItems[activeIndex].bgColor : "transparent",
          }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
          style={{
            left: 4,
          }}
        />
        
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;
          
          return (
            <button 
              key={item.href} 
              onClick={() => handleNavClick(item.href, isActive)}
              className="flex-1 z-10 bg-transparent border-none cursor-pointer"
            >
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-0.5 py-1"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon 
                    className="w-5 h-5 transition-colors duration-200"
                    style={{ color: isActive ? item.color : "#6E6E73" }}
                  />
                </motion.div>
                <motion.span 
                  initial={false}
                  animate={{
                    color: isActive ? item.color : "#6E6E73",
                    fontWeight: isActive ? 600 : 500,
                  }}
                  className="text-[9px] tracking-wide"
                >
                  {item.label}
                </motion.span>
              </motion.div>
            </button>
          );
        })}
      </div>
      
      {/* Safe area for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)] bg-card" />
    </nav>
  );
}
