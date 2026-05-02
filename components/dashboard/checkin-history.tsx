"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CheckIn {
  id: string;
  date: string;
  sleep_rating: number;
  feeling: string;
  energy: number;
  soreness: number;
  readiness: number;
}

const sleepLabels: Record<number, string> = { 1: "Poor", 2: "OK", 3: "Good", 4: "Great" };
const feelingLabels: Record<string, string> = { 
  "low": "Low", "fine": "Fine", "good": "Good", "great": "Great",
  "exhausted": "Low", "tired": "Fine", "okay": "Fine"
};
const sorenessLabels: Record<number, string> = { 1: "None", 2: "Mild", 3: "Moderate", 4: "High", 5: "High" };
const readinessLabels: Record<number, string> = { 1: "No", 2: "No", 3: "Maybe", 4: "Yes", 5: "Yes" };

const getScoreColor = (value: string | number) => {
  if (value === "Great" || value === 5 || value === 4 || value === "None" || value === "Yes") {
    return "bg-green-500/20 text-green-400";
  }
  if (value === "Good" || value === 3 || value === "Mild") {
    return "bg-blue-500/20 text-blue-400";
  }
  if (value === "OK" || value === "Fine" || value === 2 || value === "Moderate" || value === "Maybe") {
    return "bg-orange-500/20 text-orange-400";
  }
  return "bg-red-500/20 text-red-400";
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CheckInHistory() {
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/checkins?limit=5");
        if (response.ok) {
          const data = await response.json();
          setHistory(data.checkins || []);
        }
      } catch (error) {
        console.error("[v0] Failed to fetch check-in history:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-card border-border p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-card border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Check-in History</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          No check-ins yet. Complete your first check-in to start tracking!
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">Check-in History</h3>
        <Link href="/history">
          <Button
            variant="ghost"
            className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto hover:bg-transparent hover:text-primary/80"
          >
            View All
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left pb-3 font-medium">Date</th>
              <th className="text-center pb-3 font-medium">Sleep</th>
              <th className="text-center pb-3 font-medium">Feeling</th>
              <th className="text-center pb-3 font-medium">Energy</th>
              <th className="text-center pb-3 font-medium">Soreness</th>
              <th className="text-center pb-3 font-medium">Ready</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => {
              const sleep = sleepLabels[row.sleep_rating] || "OK";
              const feeling = feelingLabels[row.feeling?.toLowerCase()] || row.feeling || "Fine";
              const soreness = sorenessLabels[row.soreness] || "None";
              const readiness = readinessLabels[row.readiness] || "Maybe";
              
              return (
                <tr key={row.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 text-xs font-medium">{formatDate(row.date)}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(sleep)}`}>
                      {sleep}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(feeling)}`}>
                      {feeling}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(row.energy)}`}>
                      {row.energy}/5
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(soreness)}`}>
                      {soreness}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(readiness)}`}>
                      {readiness}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
