"use client";

import { useState } from "react";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Moon, Zap, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

// Mock trend data - 14 days
const trendData = [
  { date: "Apr 17", sleep: 3, energy: 4, soreness: 1, readiness: 1, feeling: 3 },
  { date: "Apr 18", sleep: 4, energy: 5, soreness: 1, readiness: 1, feeling: 4 },
  { date: "Apr 19", sleep: 3, energy: 4, soreness: 2, readiness: 1, feeling: 3 },
  { date: "Apr 20", sleep: 2, energy: 3, soreness: 2, readiness: 0.5, feeling: 2 },
  { date: "Apr 21", sleep: 4, energy: 5, soreness: 1, readiness: 1, feeling: 4 },
  { date: "Apr 22", sleep: 3, energy: 4, soreness: 2, readiness: 1, feeling: 3 },
  { date: "Apr 23", sleep: 3, energy: 4, soreness: 1, readiness: 1, feeling: 3 },
  { date: "Apr 24", sleep: 2, energy: 3, soreness: 3, readiness: 0.5, feeling: 2 },
  { date: "Apr 25", sleep: 1, energy: 2, soreness: 4, readiness: 0, feeling: 1 },
  { date: "Apr 26", sleep: 4, energy: 5, soreness: 1, readiness: 1, feeling: 4 },
  { date: "Apr 27", sleep: 3, energy: 4, soreness: 2, readiness: 1, feeling: 3 },
  { date: "Apr 28", sleep: 2, energy: 3, soreness: 3, readiness: 0.5, feeling: 2 },
  { date: "Apr 29", sleep: 3, energy: 4, soreness: 2, readiness: 1, feeling: 3 },
  { date: "Apr 30", sleep: 4, energy: 5, soreness: 1, readiness: 1, feeling: 4 },
];

// Weekly comparison data
const weeklyData = [
  { week: "Week 1", avgEnergy: 3.8, avgSleep: 3.2, avgSoreness: 1.8, readyDays: 5 },
  { week: "Week 2", avgEnergy: 4.1, avgSleep: 3.5, avgSoreness: 1.5, readyDays: 6 },
  { week: "Current", avgEnergy: 4.3, avgSleep: 3.6, avgSoreness: 1.4, readyDays: 6 },
];

// Radar chart data for wellness overview
const radarData = [
  { metric: "Sleep", value: 78, fullMark: 100 },
  { metric: "Energy", value: 82, fullMark: 100 },
  { metric: "Recovery", value: 75, fullMark: 100 },
  { metric: "Readiness", value: 85, fullMark: 100 },
  { metric: "Consistency", value: 90, fullMark: 100 },
];

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const percentage = previous !== 0 ? Math.abs((diff / previous) * 100).toFixed(0) : 0;
  
  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-emerald-500">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm">+{percentage}%</span>
      </div>
    );
  } else if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <TrendingDown className="w-4 h-4" />
        <span className="text-sm">-{percentage}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="w-4 h-4" />
      <span className="text-sm">0%</span>
    </div>
  );
}

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("14d");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wellness Trends</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress and identify patterns
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={timeRange === "7d" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRange("7d")}
            >
              7 Days
            </Button>
            <Button 
              variant={timeRange === "14d" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRange("14d")}
            >
              14 Days
            </Button>
            <Button 
              variant={timeRange === "30d" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRange("30d")}
            >
              30 Days
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Moon className="w-5 h-5 text-blue-400" />
                <TrendIndicator current={3.6} previous={3.2} />
              </div>
              <div className="text-2xl font-bold text-foreground">3.6</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Sleep Score</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <TrendIndicator current={4.3} previous={3.8} />
              </div>
              <div className="text-2xl font-bold text-foreground">4.3</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Energy</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-primary" />
                <TrendIndicator current={1.4} previous={1.8} />
              </div>
              <div className="text-2xl font-bold text-foreground">Low</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Soreness</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <TrendIndicator current={85} previous={78} />
              </div>
              <div className="text-2xl font-bold text-foreground">85%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Ready to Train</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="energy">Energy</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Wellness Radar */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Wellness Score</CardTitle>
                  <CardDescription>Overall performance across metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Trend Lines */}
              <Card className="border-border bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Daily Trends</CardTitle>
                  <CardDescription>Sleep, energy, and recovery patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="sleep" stroke="#60a5fa" strokeWidth={2} dot={false} name="Sleep" />
                        <Line type="monotone" dataKey="energy" stroke="#facc15" strokeWidth={2} dot={false} name="Energy" />
                        <Line type="monotone" dataKey="feeling" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Feeling" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Comparison */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Week-over-Week Comparison</CardTitle>
                <CardDescription>Compare your averages across weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="avgEnergy" fill="#facc15" name="Avg Energy" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgSleep" fill="#60a5fa" name="Avg Sleep" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="readyDays" fill="hsl(var(--primary))" name="Ready Days" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sleep" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Sleep Quality Trend</CardTitle>
                <CardDescription>Your sleep scores over time (1=Poor, 4=Great)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area type="monotone" dataKey="sleep" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} strokeWidth={2} name="Sleep Score" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="energy" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Energy Level Trend</CardTitle>
                <CardDescription>Your energy levels over time (1-5 scale)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area type="monotone" dataKey="energy" stroke="#facc15" fill="#facc15" fillOpacity={0.3} strokeWidth={2} name="Energy Level" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recovery" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Recovery & Soreness</CardTitle>
                <CardDescription>Track your recovery (lower soreness = better recovery)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area type="monotone" dataKey="soreness" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} name="Soreness Level" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Injury Alert */}
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Injury Prevention Insight</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You reported moderate/high soreness on 2 out of the last 5 days. Consider adding an extra rest day 
                      or easy recovery session to prevent accumulated fatigue.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
