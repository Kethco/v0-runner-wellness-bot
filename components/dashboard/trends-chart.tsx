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
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.ok ? res.json() : { checkins: [] });

interface Checkin {
  id: string;
  date: string;
  sleep_rating: number;
  energy: number;
  readiness: number;
}

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
            <span className="font-bold text-foreground">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Convert 1-5 scale to percentage (1=20%, 5=100%)
function toPercentage(value: number): number {
  return Math.round((value / 5) * 100);
}

export function TrendsChart() {
  const { data, isLoading } = useSWR("/api/checkins?limit=7", fetcher, {
    refreshInterval: 60000,
  });

  const checkins: Checkin[] = data?.checkins || [];
  
  // Transform checkins to chart data (reverse to show oldest first)
  const chartData = [...checkins].reverse().map((c) => ({
    date: formatDate(c.date),
    sleep: toPercentage(c.sleep_rating || 3),
    energy: toPercentage(c.energy || 3),
    readiness: toPercentage(c.readiness || 3),
  }));

  if (isLoading) {
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
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading trends...</div>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
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
        <div className="h-64 w-full flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground mb-2">No check-in data yet</p>
          <p className="text-xs text-muted-foreground">
            Complete daily check-ins to see your wellness trends
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold">Wellness Trends</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Last {chartData.length} day{chartData.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
