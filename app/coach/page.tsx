"use client";

import { useState } from "react";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
  MessageSquare,
  TrendingUp,
  Moon,
  Zap,
  Activity,
  Search,
  Filter,
  Send,
} from "lucide-react";

// Mock athlete data
interface Athlete {
  id: string;
  name: string;
  phone: string;
  lastCheckin: string | null;
  streak: number;
  todayCheckin: {
    sleep: string;
    energy: number;
    soreness: string;
    readiness: string;
  } | null;
  status: "checked-in" | "pending" | "at-risk";
  goalRace?: string;
}

const mockAthletes: Athlete[] = [
  {
    id: "1",
    name: "Sarah Chen",
    phone: "+1234567891",
    lastCheckin: "2026-05-01T07:30:00Z",
    streak: 14,
    todayCheckin: { sleep: "Great", energy: 5, soreness: "None", readiness: "Yes" },
    status: "checked-in",
    goalRace: "Half Marathon - Sep 20",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    phone: "+1234567892",
    lastCheckin: "2026-05-01T08:15:00Z",
    streak: 7,
    todayCheckin: { sleep: "OK", energy: 3, soreness: "Moderate", readiness: "Maybe" },
    status: "at-risk",
    goalRace: "10K - Jun 15",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    phone: "+1234567893",
    lastCheckin: "2026-04-30T07:45:00Z",
    streak: 21,
    todayCheckin: null,
    status: "pending",
    goalRace: "Marathon - Oct 12",
  },
  {
    id: "4",
    name: "James Kim",
    phone: "+1234567894",
    lastCheckin: "2026-05-01T06:50:00Z",
    streak: 5,
    todayCheckin: { sleep: "Good", energy: 4, soreness: "Mild", readiness: "Yes" },
    status: "checked-in",
  },
  {
    id: "5",
    name: "Olivia Thompson",
    phone: "+1234567895",
    lastCheckin: "2026-05-01T09:00:00Z",
    streak: 3,
    todayCheckin: { sleep: "Poor", energy: 2, soreness: "High", readiness: "No" },
    status: "at-risk",
    goalRace: "5K - May 10",
  },
];

function getStatusBadge(status: Athlete["status"]) {
  switch (status) {
    case "checked-in":
      return <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Checked In</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
    case "at-risk":
      return <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30">At Risk</Badge>;
  }
}

function getSorenessBadge(soreness: string) {
  const colors: Record<string, string> = {
    "None": "bg-emerald-500/20 text-emerald-500",
    "Mild": "bg-yellow-500/20 text-yellow-500",
    "Moderate": "bg-orange-500/20 text-orange-500",
    "High": "bg-red-500/20 text-red-500",
  };
  return <Badge className={colors[soreness] || ""}>{soreness}</Badge>;
}

export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>(mockAthletes);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const checkedInCount = athletes.filter((a) => a.status === "checked-in").length;
  const atRiskCount = athletes.filter((a) => a.status === "at-risk").length;
  const pendingCount = athletes.filter((a) => a.status === "pending").length;

  const filteredAthletes = athletes.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastCheckin = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleInvite = () => {
    // In real app, this would send an invite
    setInvitePhone("");
    setIsInviteOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Coach Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your team&apos;s wellness and readiness
            </p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Athlete
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Invite an Athlete</DialogTitle>
                <DialogDescription>
                  Send an invitation via SMS to add them to your team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Phone number (e.g. +1234567890)"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} className="gap-2">
                  <Send className="w-4 h-4" />
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{athletes.length}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Athletes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{checkedInCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Checked In Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{atRiskCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">At Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Check-in Progress */}
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Check-in Progress</CardTitle>
            <CardDescription>
              {checkedInCount} of {athletes.length} athletes have checked in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(checkedInCount / athletes.length) * 100} className="h-3" />
          </CardContent>
        </Card>

        {/* Athletes Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Team Roster</CardTitle>
                <CardDescription>Today&apos;s wellness data from your athletes</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search athletes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[250px] bg-secondary border-border"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Athlete</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      <Moon className="w-4 h-4 inline" />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      <Zap className="w-4 h-4 inline" />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      <Activity className="w-4 h-4 inline" />
                    </TableHead>
                    <TableHead className="text-muted-foreground">Ready</TableHead>
                    <TableHead className="text-muted-foreground">Streak</TableHead>
                    <TableHead className="text-muted-foreground">Goal</TableHead>
                    <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAthletes.map((athlete) => (
                    <TableRow key={athlete.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {athlete.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{athlete.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatLastCheckin(athlete.lastCheckin)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(athlete.status)}</TableCell>
                      <TableCell className="text-center">
                        {athlete.todayCheckin ? (
                          <span className="text-foreground">{athlete.todayCheckin.sleep}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {athlete.todayCheckin ? (
                          <div className="flex justify-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i < athlete.todayCheckin!.energy ? "bg-yellow-400" : "bg-secondary"
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {athlete.todayCheckin ? (
                          getSorenessBadge(athlete.todayCheckin.soreness)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {athlete.todayCheckin ? (
                          <span className={
                            athlete.todayCheckin.readiness === "Yes" 
                              ? "text-emerald-500" 
                              : athlete.todayCheckin.readiness === "No"
                              ? "text-red-500"
                              : "text-yellow-500"
                          }>
                            {athlete.todayCheckin.readiness}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-foreground font-medium">{athlete.streak}</span>
                          <span className="text-xs text-muted-foreground">days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {athlete.goalRace || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <TrendingUp className="w-4 h-4" />
                              View Trends
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Send Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Alerts */}
        {atRiskCount > 0 && (
          <Card className="mt-6 border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                Athletes Needing Attention
              </CardTitle>
              <CardDescription>
                These athletes may need rest or recovery guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {athletes
                  .filter((a) => a.status === "at-risk")
                  .map((athlete) => (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-red-500/20 text-red-500 text-xs">
                            {athlete.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{athlete.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {athlete.todayCheckin && (
                              <>
                                Energy: {athlete.todayCheckin.energy}/5 | 
                                Soreness: {athlete.todayCheckin.soreness} | 
                                Ready: {athlete.todayCheckin.readiness}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
