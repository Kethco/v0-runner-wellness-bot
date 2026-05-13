"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Search,
  Flame,
  Copy,
  Check,
  Trash2,
  X,
  Activity,
  Table,
  LayoutGrid,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { toast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(res => res.json());

type Athlete = {
  id: string;
  name: string;
  email: string;
  phone: string;
  latestCheckin: {
    date: string;
    sleep_rating: number;
    energy: number;
    soreness: number;
    readiness: number;
  } | null;
  weeklyMiles: number;
  streak: number;
  riskLevel: "low" | "medium" | "high";
  connectedAt: string;
};

type Invite = {
  id: string;
  athlete_name: string;
  athlete_email: string | null;
  invite_code: string;
  inviteUrl: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
};

export default function CoachDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: athletesData, mutate: mutateAthletes } = useSWR(
    user ? "/api/coach/athletes" : null, 
    fetcher,
    { refreshInterval: 30000 } // Auto-refresh every 30 seconds to catch new check-ins
  );
  const { data: invitesData, mutate: mutateInvites } = useSWR(
    user ? "/api/coach/invites" : null, 
    fetcher,
    { refreshInterval: 60000 } // Refresh invites every minute
  );

  const athletes: Athlete[] = athletesData?.athletes || [];
  const invites: Invite[] = invitesData?.invites || [];
  const pendingInvites = invites.filter(i => i.status === "pending");

  // Redirect non-authenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter athletes
  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const checkedInToday = athletes.filter(a => {
    if (!a.latestCheckin) return false;
    const today = new Date().toISOString().split("T")[0];
    return a.latestCheckin.date === today;
  }).length;
  const atRiskCount = athletes.filter(a => a.riskLevel === "high").length;
  const pendingCount = athletes.filter(a => !a.latestCheckin || a.latestCheckin.date !== new Date().toISOString().split("T")[0]).length;

  const copyInviteLink = (invite: Invite) => {
    navigator.clipboard.writeText(invite.inviteUrl);
    setCopiedId(invite.id);
    toast({ title: "Link copied!", description: `Invite link for ${invite.athlete_name} copied.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteInvite = async (inviteId: string) => {
    await fetch(`/api/coach/invites?inviteId=${inviteId}`, { method: "DELETE", credentials: "include" });
    mutateInvites();
    toast({ title: "Invite cancelled" });
  };

  const removeAthlete = async (athleteId: string, athleteName: string) => {
    if (!confirm(`Remove ${athleteName} from your roster?`)) return;
    await fetch(`/api/coach/athletes?athleteId=${athleteId}`, { method: "DELETE", credentials: "include" });
    mutateAthletes();
    toast({ title: "Athlete removed" });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-[#3A3A3C]">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#FF4500]">
              {user?.user_metadata?.program_name || "Coach Dashboard"}
            </p>
            <h1 className="text-xl font-bold text-white">
              Coach {user?.user_metadata?.last_name || user?.user_metadata?.first_name || ""}
            </h1>
          </div>
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="bg-[#FF4500] hover:bg-[#FF6B00] text-white gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Athletes
          </Button>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF4500]/20 rounded-lg">
                  <Users className="w-5 h-5 text-[#FF4500]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{athletes.length}</div>
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">Athletes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#30D158]/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#30D158]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{checkedInToday}</div>
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">Checked In</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF9500]/20 rounded-lg">
                  <Clock className="w-5 h-5 text-[#FF9500]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{pendingCount}</div>
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF3B30]/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-[#FF3B30]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{atRiskCount}</div>
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">At Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Check-in Progress */}
        {athletes.length > 0 && (
          <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Today&apos;s Check-in Progress</CardTitle>
              <CardDescription className="text-[#8E8E93]">
                {checkedInToday} of {athletes.length} athletes have checked in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={athletes.length > 0 ? (checkedInToday / athletes.length) * 100 : 0} 
                className="h-3 bg-[#3A3A3C]" 
              />
            </CardContent>
          </Card>
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#FF4500]" />
                Pending Invites ({pendingInvites.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingInvites.map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#2C2C2E]"
                >
                  <div>
                    <p className="font-medium text-white">{invite.athlete_name}</p>
                    <p className="text-xs text-[#8E8E93]">Waiting to join</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(invite)}
                      className="text-[#8E8E93] hover:text-white"
                    >
                      {copiedId === invite.id ? (
                        <Check className="w-4 h-4 text-[#30D158]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInvite(invite.id)}
                      className="text-[#8E8E93] hover:text-[#FF3B30]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search and View Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <Input
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1C1C1E] border-[#3A3A3C] text-white"
            />
          </div>
          <div className="flex items-center bg-[#1C1C1E] rounded-lg border border-[#3A3A3C] p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("cards")}
              className={`px-3 ${viewMode === "cards" ? "bg-[#2C2C2E] text-white" : "text-[#8E8E93]"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`px-3 ${viewMode === "table" ? "bg-[#2C2C2E] text-white" : "text-[#8E8E93]"}`}
            >
              <Table className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Athletes List */}
        <div className="space-y-3">
          {filteredAthletes.length === 0 && athletes.length === 0 ? (
            <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-[#3A3A3C] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No athletes yet</h3>
                <p className="text-[#8E8E93] mb-4">Add athletes to start tracking their wellness</p>
                <Button 
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#FF4500] hover:bg-[#FF6B00]"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Athletes
                </Button>
              </CardContent>
            </Card>
          ) : filteredAthletes.length === 0 ? (
            <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
              <CardContent className="py-8 text-center">
                <p className="text-[#8E8E93]">No athletes match your search</p>
              </CardContent>
            </Card>
          ) : viewMode === "cards" ? (
            filteredAthletes.map((athlete) => (
              <AthleteCard 
                key={athlete.id} 
                athlete={athlete} 
                onRemove={() => removeAthlete(athlete.id, athlete.name)}
              />
            ))
          ) : (
            <AthleteTable athletes={filteredAthletes} onRemove={removeAthlete} />
          )}
        </div>

        {/* At-Risk Alerts */}
        {atRiskCount > 0 && (
          <Card className="border-[#FF3B30]/30 bg-[#FF3B30]/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-[#FF3B30]">
                <AlertTriangle className="w-5 h-5" />
                Athletes Needing Attention
              </CardTitle>
              <CardDescription className="text-[#8E8E93]">
                These athletes may need rest or recovery guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {athletes
                .filter((a) => a.riskLevel === "high")
                .map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between p-3 bg-[#1C1C1E] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF3B30]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#FF3B30]">
                          {athlete.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">{athlete.name}</div>
                        <div className="text-xs text-[#8E8E93]">
                          {athlete.latestCheckin && (
                            <>
                              Sleep: {athlete.latestCheckin.sleep_rating}/5 | 
                              Energy: {athlete.latestCheckin.energy}/5 | 
                              Soreness: {athlete.latestCheckin.soreness}/5
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 border-[#3A3A3C] text-white">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Athletes Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <BulkInviteModal 
            onClose={() => setShowInviteModal(false)} 
            onSuccess={() => {
              mutateInvites();
            }}
            coachId={user?.id || ""}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function AthleteCard({ athlete, onRemove }: { athlete: Athlete; onRemove: () => void }) {
  const riskColors = {
    low: { bg: "bg-[#30D158]/20", text: "text-[#30D158]", label: "Good" },
    medium: { bg: "bg-[#FF9500]/20", text: "text-[#FF9500]", label: "Monitor" },
    high: { bg: "bg-[#FF3B30]/20", text: "text-[#FF3B30]", label: "At Risk" },
  };
  const risk = riskColors[athlete.riskLevel];

  const today = new Date().toISOString().split("T")[0];
  const checkedInToday = athlete.latestCheckin?.date === today;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {athlete.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-white">{athlete.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>
                {risk.label}
              </span>
              {checkedInToday ? (
                <Badge className="bg-[#30D158]/20 text-[#30D158] border-0 text-xs">Checked In</Badge>
              ) : (
                <Badge className="bg-[#FF9500]/20 text-[#FF9500] border-0 text-xs">Pending</Badge>
              )}
              <span className="text-xs text-[#8E8E93] flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#FF9500]" />
                {athlete.streak}
              </span>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-[#8E8E93]">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#2C2C2E] border-[#3A3A3C]">
            <DropdownMenuItem className="text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Trends
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRemove} className="text-[#FF3B30]">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Wellness Metrics */}
      {athlete.latestCheckin && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <MetricBadge label="Sleep" value={athlete.latestCheckin.sleep_rating} />
          <MetricBadge label="Energy" value={athlete.latestCheckin.energy} />
          <MetricBadge label="Soreness" value={athlete.latestCheckin.soreness} inverted />
          <MetricBadge label="Ready" value={athlete.latestCheckin.readiness} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-[#8E8E93]">
        <span>{athlete.weeklyMiles.toFixed(1)} mi this week</span>
        <span>Last: {athlete.latestCheckin 
          ? new Date(athlete.latestCheckin.date).toLocaleDateString() 
          : "Never"}</span>
      </div>
    </motion.div>
  );
}

function MetricBadge({ label, value, inverted }: { label: string; value: number; inverted?: boolean }) {
  const score = inverted ? 6 - value : value;
  const color = score >= 4 ? "text-[#30D158]" : score >= 3 ? "text-[#FF9500]" : "text-[#FF3B30]";
  
  return (
    <div className="text-center p-2 rounded-lg bg-[#2C2C2E]">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[#8E8E93]">{label}</p>
    </div>
  );
}

function AthleteTable({ athletes, onRemove }: { athletes: Athlete[]; onRemove: (id: string, name: string) => void }) {
  const riskColors = {
    low: { bg: "bg-[#30D158]/20", text: "text-[#30D158]", label: "Good" },
    medium: { bg: "bg-[#FF9500]/20", text: "text-[#FF9500]", label: "Monitor" },
    high: { bg: "bg-[#FF3B30]/20", text: "text-[#FF3B30]", label: "At Risk" },
  };
  
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-xl border border-[#3A3A3C] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#1C1C1E]">
            <tr className="border-b border-[#3A3A3C]">
              <th className="text-left p-4 font-semibold text-white">Athlete</th>
              <th className="text-center p-4 font-semibold text-white">Status</th>
              <th className="text-center p-4 font-semibold text-white">Sleep</th>
              <th className="text-center p-4 font-semibold text-white">Energy</th>
              <th className="text-center p-4 font-semibold text-white">Soreness</th>
              <th className="text-center p-4 font-semibold text-white">Ready</th>
              <th className="text-center p-4 font-semibold text-white">Miles</th>
              <th className="text-center p-4 font-semibold text-white">Streak</th>
              <th className="text-right p-4 font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete, index) => {
              const risk = riskColors[athlete.riskLevel];
              const checkedInToday = athlete.latestCheckin?.date === today;
              
              return (
                <tr 
                  key={athlete.id} 
                  className={`border-b border-[#3A3A3C] ${index % 2 === 0 ? "bg-[#1C1C1E]" : "bg-[#2C2C2E]"}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3A3A3C] flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {athlete.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{athlete.name}</p>
                        <p className="text-xs text-[#8E8E93]">{athlete.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${risk.bg} ${risk.text}`}>
                      {risk.label}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold ${
                      athlete.latestCheckin ? (
                        athlete.latestCheckin.sleep_rating >= 4 ? "text-[#30D158]" :
                        athlete.latestCheckin.sleep_rating >= 3 ? "text-[#FF9500]" : "text-[#FF3B30]"
                      ) : "text-[#8E8E93]"
                    }`}>
                      {athlete.latestCheckin?.sleep_rating ?? "-"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold ${
                      athlete.latestCheckin ? (
                        athlete.latestCheckin.energy >= 4 ? "text-[#30D158]" :
                        athlete.latestCheckin.energy >= 3 ? "text-[#FF9500]" : "text-[#FF3B30]"
                      ) : "text-[#8E8E93]"
                    }`}>
                      {athlete.latestCheckin?.energy ?? "-"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold ${
                      athlete.latestCheckin ? (
                        athlete.latestCheckin.soreness <= 2 ? "text-[#30D158]" :
                        athlete.latestCheckin.soreness <= 3 ? "text-[#FF9500]" : "text-[#FF3B30]"
                      ) : "text-[#8E8E93]"
                    }`}>
                      {athlete.latestCheckin?.soreness ?? "-"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold ${
                      athlete.latestCheckin ? (
                        athlete.latestCheckin.readiness >= 4 ? "text-[#30D158]" :
                        athlete.latestCheckin.readiness >= 3 ? "text-[#FF9500]" : "text-[#FF3B30]"
                      ) : "text-[#8E8E93]"
                    }`}>
                      {athlete.latestCheckin?.readiness ?? "-"}
                    </span>
                  </td>
                  <td className="p-4 text-center text-white">
                    {athlete.weeklyMiles.toFixed(1)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-white flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 text-[#FF9500]" />
                      {athlete.streak}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[#8E8E93]">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#2C2C2E] border-[#3A3A3C]">
                        <DropdownMenuItem className="text-white">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View Trends
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-white">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onRemove(athlete.id, athlete.name)} 
                          className="text-[#FF3B30]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkInviteModal({ onClose, onSuccess, coachId }: { onClose: () => void; onSuccess: () => void; coachId: string }) {
  const [athleteNames, setAthleteNames] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdInvites, setCreatedInvites] = useState<Invite[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = () => {
    const names = athleteNames
      .split("\n")
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) {
      toast({ title: "Please enter at least one athlete name" });
      return;
    }

    // Generate simple invite links with production domain
    const baseUrl = "https://www.runnerwellnessapp.com";
    
    const invites: Invite[] = names.map((name, index) => {
      const inviteUrl = `${baseUrl}/join?c=${coachId}&n=${encodeURIComponent(name)}`;
      
      return {
        id: `invite-${index}`,
        athlete_name: name,
        athlete_email: null,
        invite_code: coachId,
        inviteUrl,
        status: "pending" as const,
        created_at: new Date().toISOString(),
      };
    });

    setCreatedInvites(invites);
    toast({ title: "Invites created!", description: `${invites.length} invite links generated.` });
    onSuccess();
  };

  const copyToClipboard = (text: string): boolean => {
    // Fallback for when Clipboard API is blocked
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      // Show the text so user can manually copy
      prompt("Copy this link:", text);
      return false;
    }
  };

  const copyLink = (invite: Invite) => {
    copyToClipboard(invite.inviteUrl);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied!", description: invite.inviteUrl });
  };

  const copyAllLinks = () => {
    const allLinks = createdInvites
      .map(i => `${i.athlete_name}: ${i.inviteUrl}`)
      .join("\n");
    copyToClipboard(allLinks);
    toast({ title: "All links copied!" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 pt-8 pb-24 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#1C1C1E] rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Athletes</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5 text-[#8E8E93]" />
          </Button>
        </div>

        {createdInvites.length === 0 ? (
          <>
            <p className="text-[#8E8E93] mb-4">
              Enter athlete names below (one per line) or import from a CSV file.
            </p>
            
            {/* CSV Import */}
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#3A3A3C] rounded-xl cursor-pointer hover:bg-[#2C2C2E] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-8 h-8 text-[#8E8E93] mb-2" />
                  <p className="text-sm text-[#8E8E93]">
                    <span className="font-semibold text-[#FF4500]">Click to upload CSV</span> or drag and drop
                  </p>
                  <p className="text-xs text-[#8E8E93]">CSV with names in first column</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        // Parse CSV - take first column, skip header if it looks like one
                        const lines = text.split(/\r?\n/).filter(line => line.trim());
                        const names: string[] = [];
                        lines.forEach((line, index) => {
                          const firstCol = line.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
                          if (firstCol && firstCol.length > 0) {
                            // Skip if it looks like a header
                            if (index === 0 && /^(name|athlete|student|player)/i.test(firstCol)) return;
                            names.push(firstCol);
                          }
                        });
                        setAthleteNames(prev => {
                          const existing = prev.split("\n").filter(n => n.trim());
                          const combined = [...existing, ...names];
                          return combined.join("\n");
                        });
                        toast({ title: "CSV imported!", description: `Added ${names.length} athletes.` });
                      };
                      reader.readAsText(file);
                    }
                    e.target.value = ""; // Reset input
                  }}
                />
              </label>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#3A3A3C]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1C1C1E] px-2 text-[#8E8E93]">or type names</span>
              </div>
            </div>
            
            <textarea
              value={athleteNames}
              onChange={(e) => setAthleteNames(e.target.value)}
              placeholder="John Smith&#10;Sarah Johnson&#10;Mike Williams&#10;Emily Davis"
              className="w-full h-36 p-4 rounded-xl bg-[#2C2C2E] border border-[#3A3A3C] text-white placeholder:text-[#8E8E93] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4500] mt-4"
            />
            <p className="text-xs text-[#8E8E93] mt-2">
              {athleteNames.split("\n").filter(n => n.trim()).length} athletes entered
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onClose} className="flex-1 border-[#3A3A3C] text-white">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="flex-1 bg-[#FF4500] hover:bg-[#FF6B00]"
              >
                {isLoading ? "Creating..." : "Generate Invite Links"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[#8E8E93] mb-4">
              Send these links to your athletes. Each link is unique and can only be used once.
            </p>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {createdInvites.map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#2C2C2E]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{invite.athlete_name}</p>
                    <p className="text-xs text-[#8E8E93] truncate">{invite.inviteUrl}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(invite)}
                    className="ml-2 text-[#8E8E93] hover:text-white"
                  >
                    {copiedId === invite.id ? (
                      <Check className="w-4 h-4 text-[#30D158]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={copyAllLinks}
                className="flex-1 border-[#3A3A3C] text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Links
              </Button>
              <Button 
                onClick={() => onClose()}
                className="flex-1 bg-[#FF4500] hover:bg-[#FF6B00]"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
