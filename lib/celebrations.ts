import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";
import { hapticSuccess, hapticHeavy, hapticMedium } from "@/lib/haptics";

// Motivational messages for different actions
const RUN_MESSAGES = [
  { title: "Great run!", description: "Every mile makes you stronger." },
  { title: "You crushed it!", description: "Keep that momentum going!" },
  { title: "Fantastic effort!", description: "Your dedication is inspiring." },
  { title: "Way to go!", description: "Another run in the books!" },
  { title: "Awesome work!", description: "You're building something great." },
];

const CHECKIN_MESSAGES = [
  { title: "Check-in complete!", description: "Self-awareness is key to progress." },
  { title: "Well done!", description: "Tracking helps you improve." },
  { title: "Great habit!", description: "Consistency builds champions." },
];

const MILESTONE_MESSAGES = {
  25: { title: "25% there!", description: "Great start to your week!" },
  50: { title: "Halfway!", description: "You're crushing your goal!" },
  75: { title: "Almost there!", description: "The finish line is in sight!" },
  100: { title: "Goal achieved!", description: "You're a champion!" },
};

// Fire confetti burst
export function fireConfetti(intensity: "light" | "medium" | "heavy" = "medium") {
  const configs = {
    light: { particleCount: 50, spread: 60 },
    medium: { particleCount: 100, spread: 70 },
    heavy: { particleCount: 150, spread: 100 },
  };
  
  const config = configs[intensity];
  
  confetti({
    ...config,
    origin: { y: 0.7 },
    colors: ["#FF4500", "#FF6B00", "#FFD700", "#30D158", "#00D4FF"],
  });
}

// Fire confetti from both sides (for big achievements)
export function fireConfettiCannon() {
  const duration = 2000;
  const end = Date.now() + duration;

  const colors = ["#FF4500", "#FF6B00", "#FFD700", "#30D158"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// Celebrate logging a run
export function celebrateRun() {
  const message = RUN_MESSAGES[Math.floor(Math.random() * RUN_MESSAGES.length)];
  
  hapticSuccess();
  fireConfetti("light");
  
  toast({
    title: message.title,
    description: message.description,
    duration: 3000,
  });
}

// Celebrate check-in
export function celebrateCheckin() {
  const message = CHECKIN_MESSAGES[Math.floor(Math.random() * CHECKIN_MESSAGES.length)];
  
  hapticMedium();
  toast({
    title: message.title,
    description: message.description,
    duration: 3000,
  });
}

// Streak milestone messages
const STREAK_MILESTONES: Record<number, { title: string; description: string; intensity: "light" | "medium" | "heavy" }> = {
  3: { title: "3-Day Streak!", description: "You're building a habit. Keep it up!", intensity: "light" },
  7: { title: "7-Day Streak!", description: "A full week of consistency. You're on fire!", intensity: "medium" },
  14: { title: "2-Week Streak!", description: "Two weeks strong. This is becoming second nature.", intensity: "medium" },
  21: { title: "21-Day Streak!", description: "They say it takes 21 days to form a habit. You did it!", intensity: "heavy" },
  30: { title: "30-Day Streak!", description: "A full month of dedication. You're a champion!", intensity: "heavy" },
  50: { title: "50-Day Streak!", description: "Fifty days of pure commitment. Legendary!", intensity: "heavy" },
  100: { title: "100-Day Streak!", description: "Triple digits! You're in the elite club now.", intensity: "heavy" },
  365: { title: "365-Day Streak!", description: "A full year. You are the definition of consistency.", intensity: "heavy" },
};

// Celebrate streak milestones
export function celebrateStreakMilestone(streak: number) {
  const milestone = STREAK_MILESTONES[streak];
  if (!milestone) return false;
  
  if (milestone.intensity === "heavy") {
    hapticHeavy();
    fireConfettiCannon();
  } else if (milestone.intensity === "medium") {
    hapticSuccess();
    fireConfetti("medium");
  } else {
    hapticMedium();
    fireConfetti("light");
  }
  
  toast({
    title: milestone.title,
    description: milestone.description,
    duration: 5000,
  });
  
  return true;
}

// Check if streak just hit a milestone
export function checkStreakMilestone(previousStreak: number, currentStreak: number): number | null {
  const milestones = [3, 7, 14, 21, 30, 50, 100, 365];
  for (const m of milestones) {
    if (previousStreak < m && currentStreak >= m) {
      return m;
    }
  }
  return null;
}

// Celebrate milestone achievement
export function celebrateMilestone(milestone: 25 | 50 | 75 | 100) {
  const message = MILESTONE_MESSAGES[milestone];
  
  if (milestone === 100) {
    hapticHeavy();
    fireConfettiCannon();
  } else if (milestone === 75) {
    hapticSuccess();
    fireConfetti("medium");
  } else {
    hapticMedium();
    fireConfetti("light");
  }
  
  toast({
    title: message.title,
    description: message.description,
    duration: 4000,
  });
}

// Check if user crossed a milestone
export function checkMilestone(
  previousPercent: number,
  currentPercent: number
): 25 | 50 | 75 | 100 | null {
  const milestones: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100];
  
  for (const milestone of milestones) {
    if (previousPercent < milestone && currentPercent >= milestone) {
      return milestone;
    }
  }
  
  return null;
}
