"use client";

import { useState } from "react";
import { Play, ChevronRight, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CheckInModal } from "./checkin-modal";

interface CheckInCardProps {
  streak?: number;
  hasCheckedInToday?: boolean;
}

export function CheckInCard({ streak = 12, hasCheckedInToday = false }: CheckInCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        {/* Check-in CTA */}
        <Card
          className={`p-4 border-0 cursor-pointer group transition-all ${
            hasCheckedInToday
              ? "bg-secondary"
              : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          }`}
          onClick={() => !hasCheckedInToday && setIsModalOpen(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-black uppercase tracking-widest mb-0.5 ${
                hasCheckedInToday ? "text-muted-foreground" : "text-primary-foreground"
              }`}>
                {hasCheckedInToday ? "Checked In" : "Daily Check-in"}
              </p>
              <p className={`text-[11px] ${
                hasCheckedInToday ? "text-muted-foreground" : "text-primary-foreground/80"
              }`}>
                {hasCheckedInToday
                  ? "Great job! Come back tomorrow"
                  : "Log how you feel today"}
              </p>
            </div>
            {!hasCheckedInToday && (
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center group-hover:bg-primary-foreground/30 transition-colors">
                <Play className="w-4 h-4 fill-primary-foreground text-primary-foreground" />
              </div>
            )}
            {hasCheckedInToday && (
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        </Card>

        {/* Streak Card */}
        <Card className="bg-card border-border p-4 text-center">
          <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-black text-yellow-500">{streak}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
            Day Streak
          </p>
        </Card>
      </div>

      <CheckInModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
