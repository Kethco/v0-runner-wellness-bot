"use client";

import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const history = [
  {
    date: "Today",
    sleep: "Great",
    feeling: "Great",
    energy: 5,
    soreness: "None",
    readiness: "Yes",
  },
  {
    date: "Yesterday",
    sleep: "Good",
    feeling: "Good",
    energy: 4,
    soreness: "Mild",
    readiness: "Yes",
  },
  {
    date: "Apr 28",
    sleep: "OK",
    feeling: "Fine",
    energy: 3,
    soreness: "Moderate",
    readiness: "Maybe",
  },
  {
    date: "Apr 27",
    sleep: "Great",
    feeling: "Great",
    energy: 5,
    soreness: "None",
    readiness: "Yes",
  },
  {
    date: "Apr 26",
    sleep: "Good",
    feeling: "Good",
    energy: 4,
    soreness: "Mild",
    readiness: "Yes",
  },
];

const getScoreColor = (value: string | number) => {
  if (value === "Great" || value === 5 || value === "None" || value === "Yes") {
    return "bg-green-500/20 text-green-400";
  }
  if (value === "Good" || value === 4 || value === "Mild") {
    return "bg-blue-500/20 text-blue-400";
  }
  if (value === "OK" || value === "Fine" || value === 3 || value === "Moderate" || value === "Maybe") {
    return "bg-orange-500/20 text-orange-400";
  }
  return "bg-red-500/20 text-red-400";
};

export function CheckInHistory() {
  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">Check-in History</h3>
        <Button
          variant="ghost"
          className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto hover:bg-transparent hover:text-primary/80"
        >
          View All
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
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
            {history.map((row, i) => (
              <tr key={i} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 text-xs font-medium">{row.date}</td>
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(row.sleep)}`}>
                    {row.sleep}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(row.feeling)}`}>
                    {row.feeling}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(row.energy)}`}>
                    {row.energy}/5
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(row.soreness)}`}>
                    {row.soreness}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getScoreColor(row.readiness)}`}>
                    {row.readiness}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
