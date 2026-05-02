"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  ArrowUpRight,
  CheckCircle2,
  UserPlus,
  Zap,
  CalendarDays,
  Target,
  Shield,
  LogOut,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

interface AdminStats {
  overview: {
    totalUsers: number;
    newUsersWeek: number;
    newUsersMonth: number;
    activeToday: number;
    activeWeek: number;
    engagementRate: number;
    weeklyEngagementRate: number;
  };
  activity: {
    totalCheckins: number;
    checkinsWeek: number;
    totalRuns: number;
    runsWeek: number;
    dailyCheckins: { date: string; count: number }[];
  };
  teams: {
    totalTeams: number;
    totalCoaches: number;
    athletesInTeams: number;
  };
  users: {
    byType: { athlete: number; coach: number };
    byPlan: Record<string, number>;
    recent: Array<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      user_type: string;
      plan: string;
      created_at: string;
    }>;
  };
  revenue: {
    mrr: number;
    activeSubscriptions: number;
    subscriptionsByPlan: Record<string, number>;
    balance: number;
  };
}

const PLAN_COLORS: Record<string, string> = {
  free_trial: "#94a3b8",
  pro_monthly: "#3b82f6",
  pro_annual: "#8b5cf6",
  coach_starter: "#22c55e",
  coach_pro: "#14b8a6",
  coach_elite: "#f59e0b",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      fetchStats();
    };

    checkAdmin();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const planData = stats
    ? Object.entries(stats.users.byPlan).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        color: PLAN_COLORS[name] || "#64748b",
      }))
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchStats} disabled={isLoading} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/">View App</a>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Users"
                value={stats?.overview.totalUsers || 0}
                icon={Users}
                change={stats?.overview.newUsersWeek || 0}
                changeLabel="new this week"
                positive
              />
              <MetricCard
                title="Active Today"
                value={stats?.overview.activeToday || 0}
                icon={Activity}
                change={stats?.overview.engagementRate || 0}
                changeLabel="% engagement"
                isPercentage
              />
              <MetricCard
                title="MRR"
                value={stats?.revenue.mrr || 0}
                icon={DollarSign}
                isCurrency
              />
              <MetricCard
                title="Active Subs"
                value={stats?.revenue.activeSubscriptions || 0}
                icon={CheckCircle2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Check-ins (7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.activity.dailyCheckins || []}>
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { weekday: "short" })}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => [value, "Check-ins"]}
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Users by Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center">
                    {planData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={planData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={false}
                          >
                            {planData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [value, "Users"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground">No data</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickStat icon={Target} label="Total Check-ins" value={stats?.activity.totalCheckins || 0} />
              <QuickStat icon={Zap} label="Runs Logged" value={stats?.activity.totalRuns || 0} />
              <QuickStat icon={Users} label="Teams Created" value={stats?.teams.totalTeams || 0} />
              <QuickStat icon={UserPlus} label="Athletes in Teams" value={stats?.teams.athletesInTeams || 0} />
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <MetricCard title="Athletes" value={stats?.users.byType.athlete || 0} icon={Users} />
              <MetricCard title="Coaches" value={stats?.users.byType.coach || 0} icon={Users} />
              <MetricCard
                title="Active This Week"
                value={stats?.overview.activeWeek || 0}
                icon={Activity}
                change={stats?.overview.weeklyEngagementRate || 0}
                changeLabel="% of total"
                isPercentage
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Signups</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.users.recent
                    .filter(
                      (u) =>
                        !searchQuery ||
                        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                            {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.user_type === "coach" ? "default" : "secondary"}>
                            {user.user_type}
                          </Badge>
                          <Badge variant="outline">{user.plan?.replace(/_/g, " ") || "free trial"}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  {(!stats?.users.recent || stats.users.recent.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No users yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <MetricCard title="Monthly Recurring Revenue" value={stats?.revenue.mrr || 0} icon={DollarSign} isCurrency />
              <MetricCard title="Active Subscriptions" value={stats?.revenue.activeSubscriptions || 0} icon={CheckCircle2} />
              <MetricCard title="Stripe Balance" value={stats?.revenue.balance || 0} icon={DollarSign} isCurrency />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscriptions by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(stats?.revenue.subscriptionsByPlan || {}).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats?.revenue.subscriptionsByPlan || {}).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between">
                        <span className="text-sm">{plan}</span>
                        <Badge>{count} subscribers</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No active subscriptions yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Revenue Insights</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats?.revenue.activeSubscriptions === 0
                        ? "No paying customers yet. Focus on user acquisition and conversion from free trials."
                        : `You have ${stats?.revenue.activeSubscriptions} paying customers generating $${stats?.revenue.mrr.toFixed(2)}/month in recurring revenue.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard title="Check-ins Today" value={stats?.overview.activeToday || 0} icon={CalendarDays} />
              <MetricCard title="Check-ins This Week" value={stats?.activity.checkinsWeek || 0} icon={Activity} />
              <MetricCard title="Runs This Week" value={stats?.activity.runsWeek || 0} icon={Zap} />
              <MetricCard title="Total Runs" value={stats?.activity.totalRuns || 0} icon={Target} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check-in Activity (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.activity.dailyCheckins || []}>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) =>
                          new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                        }
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [value, "Check-ins"]}
                        labelFormatter={(d) => new Date(d).toLocaleDateString()}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.teams.totalTeams || 0}</p>
                    <p className="text-sm text-muted-foreground">Teams</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.teams.totalCoaches || 0}</p>
                    <p className="text-sm text-muted-foreground">Coaches</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.teams.athletesInTeams || 0}</p>
                    <p className="text-sm text-muted-foreground">Athletes in Teams</p>
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

function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  positive,
  isCurrency,
  isPercentage,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  positive?: boolean;
  isCurrency?: boolean;
  isPercentage?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">
          {isCurrency ? `$${value.toFixed(2)}` : value.toLocaleString()}
        </p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {!isPercentage && positive && <ArrowUpRight className="w-3 h-3 text-green-500" />}
            <span className={`text-xs ${isPercentage ? "text-muted-foreground" : "text-green-500"}`}>
              {isPercentage ? `${change}%` : `+${change}`} {changeLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-lg font-bold">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
