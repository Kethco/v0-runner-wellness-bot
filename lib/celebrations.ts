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

// Fireworks effect for major achievements
export function fireFireworks() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Random position fireworks
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() * 0.3 },
      colors: ["#FF4500", "#FFD700", "#FF6B00"],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() * 0.3 },
      colors: ["#30D158", "#00D4FF", "#FF4500"],
    });
  }, 250);
}

// Emoji rain effect
export function fireEmojiRain(emoji: string = "🏃") {
  const scalar = 2;
  const shapes = confetti.shapeFromText({ text: emoji, scalar });

  const defaults = {
    spread: 180,
    ticks: 100,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 20,
    shapes: [shapes],
    scalar,
    zIndex: 9999,
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 15,
      origin: { x: Math.random(), y: -0.1 },
    });
  }

  // Multiple bursts
  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
  setTimeout(shoot, 300);
}

// Star burst for PRs and records
export function fireStarBurst() {
  const count = 200;
  const defaults = {
    origin: { y: 0.6 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#FFD700"],
  });
  fire(0.2, {
    spread: 60,
    colors: ["#FF4500", "#FFD700"],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#FF6B00", "#FF4500", "#FFD700"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#30D158", "#FFD700"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#FF4500", "#FF6B00"],
  });
}

// Celebrate logging a run
export function celebrateRun(miles?: number) {
  const message = RUN_MESSAGES[Math.floor(Math.random() * RUN_MESSAGES.length)];
  
  hapticSuccess();
  
  // Bigger celebration for longer runs
  if (miles && miles >= 10) {
    fireStarBurst();
    fireEmojiRain("🏃");
  } else if (miles && miles >= 5) {
    fireConfetti("heavy");
  } else {
    fireConfetti("light");
  }
  
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
  
  if (streak >= 100) {
    hapticHeavy();
    fireFireworks();
    fireEmojiRain("🔥");
  } else if (milestone.intensity === "heavy") {
    hapticHeavy();
    fireConfettiCannon();
    fireEmojiRain("🔥");
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

// Celebrate a new Personal Record
export function celebratePersonalRecord(recordType: string) {
  const messages: Record<string, { title: string; description: string }> = {
    pace: { title: "New PR! Fastest Pace!", description: "You've just set a new personal best pace!" },
    distance: { title: "New PR! Longest Run!", description: "Your longest run ever. Incredible!" },
    time: { title: "New PR! Longest Duration!", description: "Your longest time on feet. Amazing endurance!" },
    weekly: { title: "New PR! Best Week!", description: "Your highest weekly mileage ever!" },
    monthly: { title: "New PR! Best Month!", description: "Your highest monthly mileage. Legendary!" },
    default: { title: "New Personal Record!", description: "You've outdone yourself!" },
  };

  const message = messages[recordType] || messages.default;
  
  hapticHeavy();
  fireStarBurst();
  
  setTimeout(() => {
    fireEmojiRain("⭐");
  }, 500);
  
  toast({
    title: message.title,
    description: message.description,
    duration: 5000,
  });
}

// Celebrate completing a challenge
export function celebrateChallengeComplete(challengeName: string) {
  hapticHeavy();
  fireConfettiCannon();
  fireEmojiRain("🏆");
  
  toast({
    title: "Challenge Complete!",
    description: `You crushed "${challengeName}"!`,
    duration: 5000,
  });
}
