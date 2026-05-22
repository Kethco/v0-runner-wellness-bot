"use client";

import { Sparkles } from "lucide-react";
import { useMemo } from "react";

// Curated running and wellness motivational quotes
const QUOTES = [
  { text: "The miracle isn't that I finished. The miracle is that I had the courage to start.", author: "John Bingham" },
  { text: "Run when you can, walk if you have to, crawl if you must; just never give up.", author: "Dean Karnazes" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
  { text: "Running is the greatest metaphor for life, because you get out of it what you put into it.", author: "Oprah Winfrey" },
  { text: "The real purpose of running isn't to win a race. It's to test the limits of the human heart.", author: "Bill Bowerman" },
  { text: "I run because if I didn't, I'd be sluggish and glum and spend too much time on the couch.", author: "Grete Waitz" },
  { text: "Every morning in Africa, a gazelle wakes up. It knows it must outrun the fastest lion or it will be killed. Every morning a lion wakes up. It knows it must run faster than the slowest gazelle or it will starve. It doesn't matter whether you're a lion or a gazelle. When the sun comes up, you'd better be running.", author: "African Proverb" },
  { text: "There is magic in misery. Just ask any runner.", author: "Dean Karnazes" },
  { text: "Don't dream of winning, train for it!", author: "Mo Farah" },
  { text: "Remember, the feeling you get from a good run is far better than the feeling you get from sitting around wishing you were running.", author: "Sarah Condor" },
  { text: "Running is nothing more than a series of arguments between the part of your brain that wants to stop and the part that wants to keep going.", author: "Unknown" },
  { text: "The obsession with running is really an obsession with the potential for more and more life.", author: "George Sheehan" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "Pain is temporary. Quitting lasts forever.", author: "Lance Armstrong" },
  { text: "If you want to become the best runner you can be, start now. Don't spend the rest of your life wondering if you can do it.", author: "Priscilla Welch" },
  { text: "It's not about being the best. It's about being better than you were yesterday.", author: "Unknown" },
  { text: "Run often. Run long. But never outrun your joy of running.", author: "Julie Isphording" },
  { text: "Running allows me to set my mind free. Nothing seems impossible. Nothing unattainable.", author: "Kara Goucher" },
  { text: "The body achieves what the mind believes.", author: "Unknown" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Rest but never quit. Even the sun has a sinking spell each evening. But it always rises the next morning.", author: "Muhammad Ali" },
  { text: "I always tell my runners: if you want to run, run a mile. If you want to experience a different life, run a marathon.", author: "Emil Zatopek" },
  { text: "The will to win means nothing without the will to prepare.", author: "Juma Ikangaa" },
  { text: "Running is alone time that lets my brain unspool the tangles that build up over days.", author: "Rob Haneisen" },
  { text: "A runner must run with dreams in his heart.", author: "Emil Zatopek" },
  { text: "Your health account, your bank account, they're the same thing. The more you put in, the more you can take out.", author: "Jack LaLanne" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Wellness is not a 'medical fix' but a way of living - a lifestyle sensitive and responsive to all the dimensions of body, mind, and spirit.", author: "Greg Anderson" },
  { text: "The greatest wealth is health.", author: "Virgil" },
];

function getDailyQuote(): { text: string; author: string } {
  // Use date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % QUOTES.length;
  return QUOTES[index];
}

export function DailyQuote() {
  const quote = useMemo(() => getDailyQuote(), []);

  return (
    <div className="glass-subtle p-4 relative overflow-hidden min-h-[100px]">
      {/* Subtle accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#FF6B00] to-transparent opacity-60" />
      
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF4500]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
            Daily Inspiration
          </p>
          <p className="text-sm text-white/80 leading-relaxed italic">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-xs text-white/40 mt-2">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
