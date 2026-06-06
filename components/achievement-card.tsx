"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type AchievementAccent = "orange" | "green" | "purple"
export type AchievementDifficulty = "Easy" | "Medium" | "Hard"

const accentMap: Record<
  AchievementAccent,
  {
    bar: string
    icon: string
    iconBg: string
    rail: string
    glow: string
    text: string
  }
> = {
  orange: {
    bar: "bg-[#FF5A00]",
    icon: "text-[#FF5A00]",
    iconBg: "bg-[#FF5A00]/12",
    rail: "from-[#FF5A00] to-[#FF8A00]",
    glow: "shadow-[0_0_24px_-6px_rgba(255,90,0,0.55)]",
    text: "text-[#FF7A2E]",
  },
  green: {
    bar: "bg-[#22C55E]",
    icon: "text-[#22C55E]",
    iconBg: "bg-[#22C55E]/12",
    rail: "from-[#22C55E] to-[#4ADE80]",
    glow: "shadow-[0_0_24px_-6px_rgba(34,197,94,0.5)]",
    text: "text-[#3DD27A]",
  },
  purple: {
    bar: "bg-[#A855F7]",
    icon: "text-[#A855F7]",
    iconBg: "bg-[#A855F7]/12",
    rail: "from-[#A855F7] to-[#C084FC]",
    glow: "shadow-[0_0_24px_-6px_rgba(168,85,247,0.5)]",
    text: "text-[#B873F9]",
  },
}

const difficultyMap: Record<AchievementDifficulty, string> = {
  Easy: "bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/25",
  Medium: "bg-[#FF5A00]/15 text-[#FF8A3D] border-[#FF5A00]/25",
  Hard: "bg-[#A855F7]/15 text-[#C084FC] border-[#A855F7]/25",
}

export interface AchievementCardProps {
  title: string
  description: string
  icon: LucideIcon
  accent?: AchievementAccent
  difficulty: AchievementDifficulty
  /** Progress value 0-100 */
  progress: number
  /** e.g. "18 / 30 days" */
  progressLabel?: string
  /** Adds glassmorphism: translucent bg + backdrop blur */
  glass?: boolean
  className?: string
  onClick?: () => void
}

export function AchievementCard({
  title,
  description,
  icon: Icon,
  accent = "orange",
  difficulty,
  progress,
  progressLabel,
  glass = false,
  className,
  onClick,
}: AchievementCardProps) {
  const a = accentMap[accent]
  const clamped = Math.max(0, Math.min(100, progress))

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[20px] p-6",
        "border border-[#2A2A2E]",
        glass
          ? "bg-[#1C1C1E]/70 backdrop-blur-xl"
          : "bg-[#1C1C1E]",
        // layered depth shadow
        "shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(0,0,0,0.4)]",
        "transition-all duration-300",
        onClick && "cursor-pointer hover:border-[#3A3A40] hover:-translate-y-0.5",
        className,
      )}
    >
      {/* accent rail on the left */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 h-full w-1 bg-gradient-to-b",
          a.rail,
        )}
      />

      {/* subtle top inner glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            a.iconBg,
            a.glow,
          )}
        >
          <Icon className={cn("h-6 w-6", a.icon)} aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate text-base font-semibold text-[#FAFAFA]">
              {title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                difficultyMap[difficulty],
              )}
            >
              {difficulty}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[#A1A1AA] text-pretty">
            {description}
          </p>
        </div>
      </div>

      {/* progress area */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-[#71717A]">
            Progress
          </span>
          <span className={cn("text-xs font-semibold", a.text)}>
            {progressLabel ?? `${clamped}%`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A2E]">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out",
              a.rail,
            )}
            style={{ width: `${clamped}%` }}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title} progress`}
          />
        </div>
      </div>
    </div>
  )
}
