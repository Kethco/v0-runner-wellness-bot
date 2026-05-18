"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedNumber({ 
  value, 
  decimals = 0, 
  duration = 1.5,
  className = "",
  suffix = "",
  prefix = ""
}: AnimatedNumberProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  
  // Spring animation for smooth counting
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
    duration: duration * 1000 
  });
  
  const display = useTransform(spring, (current) => {
    return `${prefix}${current.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isInView]);

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

// Simpler version that just counts up without spring physics
export function CountingNumber({
  value,
  decimals = 0,
  duration = 1.2,
  className = "",
  suffix = "",
  prefix = ""
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const endTime = startTime + duration * 1000;
          
          const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            
            // Ease out cubic for satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(eased * value);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  // Update display if value changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      setDisplayValue(value);
    }
  }, [value, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}
