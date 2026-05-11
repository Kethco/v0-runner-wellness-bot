"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Sparkles, Target, User } from "lucide-react";

const navItems = [
  { icon: Activity, label: "Home", href: "/" },
  { icon: TrendingUp, label: "Runs", href: "/runs" },
  { icon: Sparkles, label: "Mind", href: "/mind" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  
  // Find active index for pill animation
  const activeIndex = navItems.findIndex(item => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-[#2A2A2A]">
      <div className="relative flex items-center justify-around py-3 px-2 max-w-lg mx-auto">
        {/* Animated pill indicator */}
        <motion.div
          className="absolute top-2 h-[52px] bg-[#FF4500]/15 rounded-2xl"
          initial={false}
          animate={{
            x: `calc(${activeIndex * 100}% + ${activeIndex * 4}px)`,
            width: `calc(${100 / navItems.length}% - 8px)`,
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
            <Link key={item.href} href={item.href} className="flex-1 z-10">
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-1 py-2"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive ? "text-[#FF4500]" : "text-[#6E6E73]"
                    }`} 
                  />
                </motion.div>
                <motion.span 
                  initial={false}
                  animate={{
                    color: isActive ? "#FF4500" : "#6E6E73",
                    fontWeight: isActive ? 700 : 500,
                  }}
                  className="text-[10px] tracking-wide"
                >
                  {item.label}
                </motion.span>
              </motion.div>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#0D0D0D]" />
    </nav>
  );
}
