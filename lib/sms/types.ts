export interface CheckinSession {
  step: "sleep" | "feeling" | "energy" | "soreness" | "readiness" | "notes" | "complete";
  data: {
    sleepRating?: number;
    sleepHours?: number;
    feeling?: string;
    energy?: number;
    soreness?: number;
    sorenessLocation?: string;
    readiness?: number;
    notes?: string;
  };
  isAfternoonUpdate?: boolean;
}

export interface SMSSession {
  id: string;
  phone: string;
  user_id: string | null;
  current_step: string | null;
  session_data: CheckinSession | Record<string, unknown>;
  expires_at: string;
}

export const CHECKIN_STEPS = {
  sleep: {
    question: "Good morning! Let's check in. How was your sleep last night?\n\nReply with a number 1-5:\n1 = Terrible\n2 = Poor\n3 = Okay\n4 = Good\n5 = Great",
    nextStep: "feeling",
  },
  feeling: {
    question: "How are you feeling overall today?\n\nReply:\n• great\n• good\n• okay\n• tired\n• exhausted",
    nextStep: "energy",
  },
  energy: {
    question: "What's your energy level?\n\nReply 1-5:\n1 = Empty\n2 = Low\n3 = Moderate\n4 = High\n5 = Full",
    nextStep: "soreness",
  },
  soreness: {
    question: "How sore are you?\n\nReply 1-5:\n1 = None\n2 = Slight\n3 = Moderate\n4 = Very\n5 = Severe",
    nextStep: "readiness",
  },
  readiness: {
    question: "How ready do you feel to train?\n\nReply 1-5:\n1 = Not at all\n2 = Slightly\n3 = Moderately\n4 = Very\n5 = Completely",
    nextStep: "notes",
  },
  notes: {
    question: "Any notes to add? (Reply 'skip' to finish without notes)",
    nextStep: "complete",
  },
};

export const AFTERNOON_STEPS = {
  energy: {
    question: "Afternoon check! How's your energy now?\n\nReply 1-5:\n1 = Empty\n2 = Low\n3 = Moderate\n4 = High\n5 = Full",
    nextStep: "soreness",
  },
  soreness: {
    question: "How sore are you feeling?\n\nReply 1-5:\n1 = None\n2 = Slight\n3 = Moderate\n4 = Very\n5 = Severe",
    nextStep: "notes",
  },
  notes: {
    question: "Any notes? (Reply 'skip' to finish)",
    nextStep: "complete",
  },
};

export const COMMANDS = {
  checkin: "Start a morning wellness check-in",
  update: "Quick afternoon energy/soreness update",
  trends: "View your 7-day wellness trends",
  streak: "Check your current streak",
  goal: "Set or view your race goals",
  help: "Show all available commands",
  ai: "Get AI coaching advice",
};
