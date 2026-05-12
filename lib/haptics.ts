"use client";

// Haptic feedback utility for mobile devices
// Uses the Vibration API with fallback to no-op on unsupported devices

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const patterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20], // short-pause-short
  warning: [30, 50, 30], // medium-pause-medium
  error: [50, 30, 50, 30, 50], // long pattern for errors
};

export function haptic(style: HapticStyle = "light"): void {
  // Check if vibration is supported
  if (typeof navigator === "undefined" || !navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate(patterns[style]);
  } catch {
    // Silently fail if vibration fails
  }
}

// Convenience functions
export const hapticLight = () => haptic("light");
export const hapticMedium = () => haptic("medium");
export const hapticHeavy = () => haptic("heavy");
export const hapticSuccess = () => haptic("success");
export const hapticWarning = () => haptic("warning");
export const hapticError = () => haptic("error");
