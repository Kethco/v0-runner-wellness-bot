"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
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
import { Moon, Zap, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2, BarChart3, Lightbulb } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { TrendsPageSkeleton } from "@/components/skeletons";
import { ScatterChart, Scatter, ZAxis } from "recharts";
import { ActivityHeatmap } from "@/components/activity-heatmap";

interface Checkin {
  id: string;
  date: string;
  sleep_rating: number;
  energy: number;
  soreness: number;
  readiness: number;
  feeling?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-4 h-4" />
        <span className="text-sm">--</span>
      </div>
    );
  }
  
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
  
  const days = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
  const { data, error, isLoading } = useSWR<{ checkins: Checkin[] }>(
    `/api/checkins?limit=${days}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Fetch runs for heatmap (last 12 weeks)
  const { data: runsData } = useSWR<{ runs: { date: string; miles: number }[] }>(
    "/api/runs?limit=100",
    fetcher,
    { refreshInterval: 60000 }
  );

  const checkins = data?.checkins || [];
  const runs = runsData?.runs || [];

  // Process checkins into chart data
  const trendData = useMemo(() => {
    return checkins
      .map((c) => ({
        date: new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sleep: c.sleep_rating,
        energy: c.energy,
        soreness: c.soreness,
        readiness: c.readiness,
        feeling: c.feeling === "great" ? 4 : c.feeling === "good" ? 3 : c.feeling === "okay" ? 2 : 1,
      }))
      .reverse(); // Oldest first for chart
  }, [checkins]);

  // Calculate averages
  const stats = useMemo(() => {
    if (checkins.length === 0) {
      return { avgSleep: 0, avgEnergy: 0, avgSoreness: 0, readyPercent: 0 };
    }
    const avgSleep = checkins.reduce((sum, c) => sum + c.sleep_rating, 0) / checkins.length;
    const avgEnergy = checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length;
    const avgSoreness = checkins.reduce((sum, c) => sum + c.soreness, 0) / checkins.length;
    const readyDays = checkins.filter((c) => c.readiness >= 4).length;
    const readyPercent = (readyDays / checkins.length) * 100;
    return { avgSleep, avgEnergy, avgSoreness, readyPercent };
  }, [checkins]);

  // Calculate previous period for comparison
  const prevStats = useMemo(() => {
    const halfLen = Math.floor(checkins.length / 2);
    const recent = checkins.slice(0, halfLen);
    const older = checkins.slice(halfLen);
    
    if (older.length === 0) return { avgSleep: 0, avgEnergy: 0, avgSoreness: 0, readyPercent: 0 };
    
    return {
      avgSleep: older.reduce((sum, c) => sum + c.sleep_rating, 0) / older.length,
      avgEnergy: older.reduce((sum, c) => sum + c.energy, 0) / older.length,
      avgSoreness: older.reduce((sum, c) => sum + c.soreness, 0) / older.length,
      readyPercent: (older.filter((c) => c.readiness >= 4).length / older.length) * 100,
    };
  }, [checkins]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (checkins.length === 0) return [];
    return [
      { metric: "Sleep", value: (stats.avgSleep / 4) * 100, fullMark: 100 },
      { metric: "Energy", value: (stats.avgEnergy / 5) * 100, fullMark: 100 },
      { metric: "Recovery", value: ((5 - stats.avgSoreness) / 4) * 100, fullMark: 100 },
      { metric: "Readiness", value: stats.readyPercent, fullMark: 100 },
      { metric: "Consistency", value: (checkins.length / days) * 100, fullMark: 100 },
    ];
  }, [checkins, stats, days]);

  // Weekly comparison data
  const weeklyData = useMemo(() => {
    if (checkins.length < 7) return [];
    
    const weeks: { week: string; avgEnergy: number; avgSleep: number; readyDays: number }[] = [];
    const weekSize = 7;
    
    for (let i = 0; i < Math.min(3, Math.ceil(checkins.length / weekSize)); i++) {
      const weekCheckins = checkins.slice(i * weekSize, (i + 1) * weekSize);
      if (weekCheckins.length === 0) continue;
      
      weeks.push({
        week: i === 0 ? "Current" : `Week ${i + 1}`,
        avgEnergy: Number((weekCheckins.reduce((s, c) => s + c.energy, 0) / weekCheckins.length).toFixed(1)),
        avgSleep: Number((weekCheckins.reduce((s, c) => s + c.sleep_rating, 0) / weekCheckins.length).toFixed(1)),
        readyDays: weekCheckins.filter((c) => c.readiness >= 4).length,
      });
    }
    
    return weeks.reverse();
  }, [checkins]);

  // Check for injury risk
  const injuryRisk = useMemo(() => {
    const recent5 = checkins.slice(0, 5);
    const highSorenessDays = recent5.filter((c) => c.soreness >= 3).length;
    return highSorenessDays >= 2;
  }, [checkins]);

  const getSorenessLabel = (val: number) => {
    if (val <= 1.5) return "Low";
    if (val <= 2.5) return "Moderate";
    return "High";
  };

  // Treat errors as empty state (user may not be logged in or have no data yet)
  const showEmptyState = error || checkins.length === 0;

  // Correlation data: Sleep vs Energy scatter points
  const correlationData = useMemo(() => {
    if (checkins.length < 3) return { sleepEnergy: [], sleepReadiness: [], insights: [] };
    
    const sleepEnergy = checkins.map(c => ({
      sleep: c.sleep_rating,
      energy: c.energy,
      date: new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
    
    const sleepReadiness = checkins.map(c => ({
      sleep: c.sleep_rating,
      readiness: c.readiness,
      date: new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

    // Compute simple correlation insights
    const insights: string[] = [];
    
    // Sleep-Energy correlation
    const highSleepDays = checkins.filter(c => c.sleep_rating >= 3);
    const lowSleepDays = checkins.filter(c => c.sleep_rating <= 2);
    if (highSleepDays.length > 0 && lowSleepDays.length > 0) {
      const avgEnergyHighSleep = highSleepDays.reduce((s, c) => s + c.energy, 0) / highSleepDays.length;
      const avgEnergyLowSleep = lowSleepDays.reduce((s, c) => s + c.energy, 0) / lowSleepDays.length;
      const diff = avgEnergyHighSleep - avgEnergyLowSleep;
      if (diff > 0.5) {
        insights.push(`When you sleep well, your energy averages ${avgEnergyHighSleep.toFixed(1)} vs ${avgEnergyLowSleep.toFixed(1)} on poor sleep nights - a ${diff.toFixed(1)} point boost.`);
      }
    }

    // Soreness-Readiness correlation
    const lowSorenessDays = checkins.filter(c => c.soreness <= 2);
    const highSorenessDays = checkins.filter(c => c.soreness >= 3);
    if (lowSorenessDays.length > 0 && highSorenessDays.length > 0) {
      const avgReadyLowSore = lowSorenessDays.reduce((s, c) => s + c.readiness, 0) / lowSorenessDays.length;
      const avgReadyHighSore = highSorenessDays.reduce((s, c) => s + c.readiness, 0) / highSorenessDays.length;
      if (avgReadyLowSore - avgReadyHighSore > 0.5) {
        insights.push(`Low soreness days see ${avgReadyLowSore.toFixed(1)} avg readiness vs ${avgReadyHighSore.toFixed(1)} on high soreness days.`);
      }
    }

    // Best day of week
    const dayBuckets: Record<string, { total: number; count: number }> = {};
    checkins.forEach(c => {
      const day = new Date(c.date).toLocaleDateString("en-US", { weekday: "long" });
      if (!dayBuckets[day]) dayBuckets[day] = { total: 0, count: 0 };
      dayBuckets[day].total += c.readiness;
      dayBuckets[day].count += 1;
    });
    const bestDay = Object.entries(dayBuckets).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
    if (bestDay && bestDay[1].count >= 2) {
      insights.push(`${bestDay[0]}s tend to be your best day, averaging ${(bestDay[1].total / bestDay[1].count).toFixed(1)} readiness.`);
    }

    return { sleepEnergy, sleepReadiness, insights };
  }, [checkins]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[70px]">
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

{isLoading ? (
  <TrendsPageSkeleton />
  ) : showEmptyState ? (
<Card className="border-border bg-card">
  <CardContent className="py-6">
    <EmptyState
      icon={BarChart3}
      title="Your Trends Will Appear Here"
      description="Complete daily check-ins to unlock powerful insights about your sleep, energy, and recovery patterns over time."
      actionLabel="Go to Dashboard"
      actionHref="/"
      color="#5E5CE6"
    />
  </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Moon className="w-5 h-5 text-blue-400" />
                    <TrendIndicator current={stats.avgSleep} previous={prevStats.avgSleep} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.avgSleep.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Sleep Score</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <TrendIndicator current={stats.avgEnergy} previous={prevStats.avgEnergy} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.avgEnergy.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Energy</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <TrendIndicator current={prevStats.avgSoreness} previous={stats.avgSoreness} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{getSorenessLabel(stats.avgSoreness)}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Soreness</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <TrendIndicator current={stats.readyPercent} previous={prevStats.readyPercent} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.readyPercent.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Ready to Train</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Charts */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-secondary">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="correlations">Insights</TabsTrigger>
                <TabsTrigger value="sleep">Sleep</TabsTrigger>
                <TabsTrigger value="energy">Energy</TabsTrigger>
                <TabsTrigger value="recovery">Recovery</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Activity Heatmap */}
                {runs.length > 0 && (
                  <ActivityHeatmap runs={runs} weeks={12} />
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Wellness Radar */}
                  <Card className="border-border bg-[#1C1C1E]">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Wellness Score</CardTitle>
                      <CardDescription>Overall performance across metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#3A3A3C" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "#8E8E93", fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              name="Score"
                              dataKey="value"
                              stroke="#30D158"
                              fill="#30D158"
                              fillOpacity={0.4}
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
                {weeklyData.length > 0 && (
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
                )}
              </TabsContent>

              <TabsContent value="correlations" className="space-y-6">
                {/* Correlation Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Sleep vs Energy</CardTitle>
                      <CardDescription>How does sleep quality affect your energy?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" dataKey="sleep" name="Sleep" domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Sleep Score", position: "bottom", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                            <YAxis type="number" dataKey="energy" name="Energy" domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Energy Level", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                            <ZAxis range={[60, 60]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(value: number, name: string) => [value, name]}
                            />
                            <Scatter data={correlationData.sleepEnergy} fill="#60a5fa" fillOpacity={0.7} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Sleep vs Readiness</CardTitle>
                      <CardDescription>How sleep impacts your training readiness</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" dataKey="sleep" name="Sleep" domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Sleep Score", position: "bottom", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                            <YAxis type="number" dataKey="readiness" name="Readiness" domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Readiness", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                            <ZAxis range={[60, 60]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(value: number, name: string) => [value, name]}
                            />
                            <Scatter data={correlationData.sleepReadiness} fill="#30D158" fillOpacity={0.7} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                {correlationData.insights.length > 0 && (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-[#FFD700]" />
                        Pattern Insights
                      </CardTitle>
                      <CardDescription>What your data tells us about your performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {correlationData.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                            <div className="w-6 h-6 rounded-full bg-[#FFD700]/15 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-[#FFD700]">{i + 1}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                {injuryRisk && (
                  <Card className="border-amber-500/50 bg-amber-500/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Injury Prevention Insight</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            You reported moderate/high soreness on 2 or more of the last 5 days. Consider adding an extra rest day 
                            or easy recovery session to prevent accumulated fatigue.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
