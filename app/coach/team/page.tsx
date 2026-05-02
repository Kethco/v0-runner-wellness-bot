"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Plus, Copy, Check, Send, UserPlus, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getProduct } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/dashboard/navbar";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_at: string;
  team_members: TeamMember[];
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [inviteContacts, setInviteContacts] = useState("");
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  // Get coach's plan and limits
  const coachPlan = user?.user_metadata?.plan || "coach_starter";
  const planInfo = getProduct(coachPlan);
  const maxAthletes = planInfo?.maxAthletes || 15;
  const totalAthletes = teams.reduce((sum, t) => sum + (t.team_members?.length || 0), 0);
  const isAtLimit = totalAthletes >= maxAthletes;
  const nearLimit = totalAthletes >= maxAthletes * 0.8;

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (data.teams) {
        setTeams(data.teams);
      }
    } catch (e) {
      console.error("Failed to fetch teams:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function createTeam() {
    if (!newTeamName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });
      
      if (res.ok) {
        setNewTeamName("");
        setNewTeamDescription("");
        fetchTeams();
      }
    } catch (e) {
      console.error("Failed to create team:", e);
    } finally {
      setIsCreating(false);
    }
  }

  function copyInviteCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function sendInvites() {
    if (!selectedTeam || !inviteContacts.trim()) return;
    
    setIsSendingInvites(true);
    setInviteResult(null);
    
    // Parse contacts (phone numbers, one per line)
    const contacts = inviteContacts
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Check if it looks like an email or phone
        if (line.includes("@")) {
          return { email: line };
        } else {
          // Assume it's a phone number
          return { phone: line.replace(/[^\d+]/g, "") };
        }
      });

    try {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          contacts,
        }),
      });
      
      const data = await res.json();
      setInviteResult(data.message || "Invites sent!");
      setInviteContacts("");
    } catch (e) {
      setInviteResult("Failed to send invites");
    } finally {
      setIsSendingInvites(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/coach">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Create teams and invite your athletes</p>
          </div>
        </div>

        {/* Athlete Usage Card */}
        <Card className={`mb-6 ${isAtLimit ? "border-destructive" : nearLimit ? "border-yellow-500" : ""}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isAtLimit ? "bg-destructive/20" : nearLimit ? "bg-yellow-500/20" : "bg-primary/20"
                }`}>
                  <Users className={`w-5 h-5 ${isAtLimit ? "text-destructive" : nearLimit ? "text-yellow-500" : "text-primary"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {totalAthletes} / {maxAthletes} Athletes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {planInfo?.name || "Coach Starter"} Plan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAtLimit && (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    Limit reached
                  </span>
                )}
                {(nearLimit || isAtLimit) && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/pricing">Upgrade Plan</Link>
                  </Button>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  isAtLimit ? "bg-destructive" : nearLimit ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, (totalAthletes / maxAthletes) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Create New Team */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Team
            </CardTitle>
            <CardDescription>
              Create a team and get an invite code to share with your athletes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="e.g., Varsity Cross Country"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamDescription">Description (optional)</Label>
              <Textarea
                id="teamDescription"
                placeholder="e.g., Fall 2024 season"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                rows={2}
              />
            </div>
            <Button 
              onClick={createTeam} 
              disabled={!newTeamName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Team"}
            </Button>
          </CardContent>
        </Card>

        {/* Teams List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Your Teams</h2>
          
          {isLoading ? (
            <p className="text-muted-foreground">Loading teams...</p>
          ) : teams.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No teams yet. Create your first team above!</p>
              </CardContent>
            </Card>
          ) : (
            teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      {team.description && (
                        <CardDescription>{team.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-secondary px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-sm font-mono font-bold">{team.invite_code}</span>
                        <button
                          onClick={() => copyInviteCode(team.invite_code)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedCode === team.invite_code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{team.team_members?.length || 0} athletes</span>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={inviteDialogOpen && selectedTeam?.id === team.id} onOpenChange={(open) => {
                        setInviteDialogOpen(open);
                        if (open) setSelectedTeam(team);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite Athletes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invite Athletes to {team.name}</DialogTitle>
                            <DialogDescription>
                              Enter phone numbers (one per line) to send SMS invites with your team code.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="bg-secondary p-4 rounded-lg text-center">
                              <p className="text-sm text-muted-foreground mb-1">Team Invite Code</p>
                              <p className="text-2xl font-mono font-bold">{team.invite_code}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Share this code directly or send SMS invites below
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Phone Numbers</Label>
                              <Textarea
                                placeholder="+15551234567&#10;+15559876543&#10;..."
                                value={inviteContacts}
                                onChange={(e) => setInviteContacts(e.target.value)}
                                rows={5}
                              />
                              <p className="text-xs text-muted-foreground">
                                One phone number per line. Include country code.
                              </p>
                            </div>
                            {inviteResult && (
                              <p className="text-sm text-primary">{inviteResult}</p>
                            )}
                            {isAtLimit && (
                              <p className="text-sm text-destructive flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                You&apos;ve reached your athlete limit. Upgrade to invite more.
                              </p>
                            )}
                            <Button 
                              onClick={sendInvites} 
                              disabled={!inviteContacts.trim() || isSendingInvites || isAtLimit}
                              className="w-full gap-2"
                            >
                              <Send className="w-4 h-4" />
                              {isSendingInvites ? "Sending..." : "Send SMS Invites"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Team Members */}
                  {team.team_members && team.team_members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium mb-2">Athletes</p>
                      <div className="grid gap-2">
                        {team.team_members.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between bg-secondary/50 px-3 py-2 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {member.profiles?.first_name || "Unknown"} {member.profiles?.last_name || ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
