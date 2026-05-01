"use client";

import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { date: "Apr 24", sleep: 75, energy: 80, readiness: 78 },
  { date: "Apr 25", sleep: 82, energy: 85, readiness: 84 },
  { date: "Apr 26", sleep: 78, energy: 72, readiness: 75 },
  { date: "Apr 27", sleep: 90, energy: 88, readiness: 89 },
  { date: "Apr 28", sleep: 65, energy: 60, readiness: 62 },
  { date: "Apr 29", sleep: 85, energy: 82, readiness: 84 },
  { date: "Apr 30", sleep: 88, energy: 91, readiness: 88 },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendsChart() {
  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold">Wellness Trends</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Last 7 days
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
            />
            <Line
              type="monotone"
              dataKey="sleep"
              name="Sleep"
              stroke="oklch(0.65 0.20 280)"
              strokeWidth={2}
              dot={{ r: 3, fill: "oklch(0.65 0.20 280)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="oklch(0.70 0.18 150)"
              strokeWidth={2}
              dot={{ r: 3, fill: "oklch(0.70 0.18 150)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="readiness"
              name="Readiness"
              stroke="oklch(0.65 0.22 25)"
              strokeWidth={2}
              dot={{ r: 3, fill: "oklch(0.65 0.22 25)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
