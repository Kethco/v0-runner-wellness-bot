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
import { Moon, Zap, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2, BarChart3 } from "lucide-react";

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

  const checkins = data?.checkins || [];

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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Failed to load trends. Please try again.</p>
        </main>
      </div>
    );
  }

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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : checkins.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Wellness Data Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Complete daily check-ins to see your wellness trends and track your progress over time.
              </p>
              <Button asChild>
                <a href="/">Go to Dashboard</a>
              </Button>
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
