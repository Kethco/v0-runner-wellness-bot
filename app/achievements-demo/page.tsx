"use client"

import { Flame, Target, Mountain, Zap } from "lucide-react"
import { AchievementCard } from "@/components/achievement-card"

export default function AchievementsDemoPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-[#FF5A00]">
            Achievements
          </p>
          <h1 className="mt-1 text-2xl font-bold text-balance text-[#FAFAFA]">
            Keep your streak alive
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
            Earn badges as you build consistency and crush new distances.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <AchievementCard
            title="Consistent Runner"
            description="Log a run on 30 different days this month."
            icon={Flame}
            accent="green"
            difficulty="Easy"
            progress={60}
            progressLabel="18 / 30 days"
          />

          <AchievementCard
            title="Mile Crusher"
            description="Run a sub-7:00 mile to unlock this badge."
            icon={Zap}
            accent="orange"
            difficulty="Medium"
            progress={82}
            progressLabel="7:12 best pace"
          />

          <AchievementCard
            title="Summit Seeker"
            description="Accumulate 5,000 ft of elevation gain in a single week."
            icon={Mountain}
            accent="purple"
            difficulty="Hard"
            progress={34}
            progressLabel="1,720 / 5,000 ft"
            glass
          />

          <AchievementCard
            title="Marathon Ready"
            description="Complete a 20-mile long run in your training block."
            icon={Target}
            accent="orange"
            difficulty="Hard"
            progress={45}
            progressLabel="9 / 20 mi"
          />
        </div>
      </div>
    </main>
  )
}
