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
