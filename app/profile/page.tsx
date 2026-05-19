"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";

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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  Bell,
  CreditCard,
  Calendar,
  Activity,
  Users,
  Lock,
  Trash2,
  ExternalLink,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Sun,
  Moon as MoonIcon,
  Monitor,
  Download,
  MapPin,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: profileData } = useSWR(user ? "/api/profile" : null, fetcher);
  const { data: statsData } = useSWR(user ? "/api/checkins?limit=1" : null, fetcher);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: "",
    gender: "",
    birthYear: "",
    location: "",
  });
  const [notifications, setNotifications] = useState({
    morningReminder: true,
    weeklyReport: true,
    aiTips: true,
    injuryAlerts: true,
  });
  const [privacyMode, setPrivacyMode] = useState<"solo" | "coach">("solo");
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Initialize edited profile when data loads
  useEffect(() => {
    if (profileData?.profile) {
      // Combine first_name and last_name from profile, or fall back to signup metadata
      const fullName = profileData.profile.first_name && profileData.profile.last_name 
        ? `${profileData.profile.first_name} ${profileData.profile.last_name}`.trim()
        : profileData.profile.name || `${user?.user_metadata?.first_name || ""} ${user?.user_metadata?.last_name || ""}`.trim();
      
      setEditedProfile({
        name: fullName || user?.user_metadata?.name || user?.email?.split("@")[0] || "",
        gender: profileData.profile.gender || "",
        birthYear: profileData.profile.birth_year?.toString() || "",
        location: profileData.profile.location || "",
      });
    } else if (user) {
      // Use signup metadata for new users
      const fullName = `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim();
      setEditedProfile({
        name: fullName || user.user_metadata?.name || user.email?.split("@")[0] || "",
        gender: "",
        birthYear: "",
        location: "",
      });
    }
  }, [profileData, user]);

  const displayName = editedProfile.name || user?.email?.split("@")[0] || "Runner";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  
  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  const calculateAge = (birthYear: string) => {
    const year = parseInt(birthYear);
    if (isNaN(year)) return null;
    return new Date().getFullYear() - year;
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedProfile.name,
          gender: editedProfile.gender || null,
          birth_year: editedProfile.birthYear ? parseInt(editedProfile.birthYear) : null,
          location: editedProfile.location || null,
        }),
      });
      if (response.ok) {
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

return (
  <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[70px] pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Header Card - Always Visible */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-5">
                {/* Styled Avatar with Initials Badge */}
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-[#FF4500] to-[#FF6B00] text-white text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Activity className="w-3 h-3" />
                      Runner
                    </Badge>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      Since {memberSince}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information - Collapsible */}
          <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <Card className="border-border bg-card">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isInfoOpen ? "rotate-180" : ""}`} />
                  </div>
                  <CardDescription>
                    {isInfoOpen ? "Click to collapse" : "Tap to view and edit your details"}
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editedProfile.name}
                        disabled={!isEditing}
                        onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        className="bg-secondary border-border disabled:opacity-70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-secondary border-border disabled:opacity-70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={editedProfile.gender} 
                        onValueChange={(v) => setEditedProfile({ ...editedProfile, gender: v })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthYear">Birth Year</Label>
                      <Input
                        id="birthYear"
                        type="number"
                        value={editedProfile.birthYear}
                        disabled={!isEditing}
                        onChange={(e) => setEditedProfile({ ...editedProfile, birthYear: e.target.value })}
                        className="bg-secondary border-border disabled:opacity-70"
                        placeholder="e.g. 1990"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="location">Location (for weather)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="location"
                          value={editedProfile.location}
                          onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="e.g. New York, Los Angeles, Chicago"
                        />
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            if (!editedProfile.location) return;
                            try {
                              await fetch("/api/profile", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ location: editedProfile.location }),
                              });
                            } catch (err) {
                              console.error("Failed to save location:", err);
                            }
                          }}
                          className="shrink-0"
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Used for weather forecast on your training plan</p>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <Button className="mt-4" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  )}

                  {editedProfile.birthYear && calculateAge(editedProfile.birthYear) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Badge variant="secondary">
                        Age {calculateAge(editedProfile.birthYear)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Privacy & Data Sharing */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Data Sharing
              </CardTitle>
              <CardDescription>Control who can see your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${privacyMode === "solo" ? "bg-blue-500/20" : "bg-emerald-500/20"}`}>
                      {privacyMode === "solo" ? (
                        <Lock className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Users className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {privacyMode === "solo" ? "Solo Mode" : "Coach Mode"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {privacyMode === "solo" 
                          ? "Your data is private - only you can see it"
                          : "Your coach can view your check-ins and trends"
                        }
                      </p>
                    </div>
                  </div>
                  <Select 
                    value={privacyMode} 
                    onValueChange={(v) => setPrivacyMode(v as "solo" | "coach")}
                  >
                    <SelectTrigger className="w-[120px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Choose your preferred theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: MoonIcon },
                  { value: "system", label: "System", icon: Monitor },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      theme === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <opt.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Morning Check-in Reminder</h4>
                    <p className="text-sm text-muted-foreground">Daily reminder via SMS</p>
                  </div>
                  <Switch
                    checked={notifications.morningReminder}
                    onCheckedChange={(v) => setNotifications({ ...notifications, morningReminder: v })}
                  />
                </div>
                {notifications.morningReminder && (
                  <div className="ml-0 pl-4 border-l-2 border-primary/30">
                    <Label className="text-xs text-muted-foreground mb-1 block">Reminder Time</Label>
                    <Select defaultValue="7:00">
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6:00">6:00 AM</SelectItem>
                        <SelectItem value="6:30">6:30 AM</SelectItem>
                        <SelectItem value="7:00">7:00 AM</SelectItem>
                        <SelectItem value="7:30">7:30 AM</SelectItem>
                        <SelectItem value="8:00">8:00 AM</SelectItem>
                        <SelectItem value="8:30">8:30 AM</SelectItem>
                        <SelectItem value="9:00">9:00 AM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Weekly Summary Report</h4>
                    <p className="text-sm text-muted-foreground">Every Sunday at 6 PM</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReport}
                    onCheckedChange={(v) => setNotifications({ ...notifications, weeklyReport: v })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">AI Training Tips</h4>
                    <p className="text-sm text-muted-foreground">Personalized advice after check-ins</p>
                  </div>
                  <Switch
                    checked={notifications.aiTips}
                    onCheckedChange={(v) => setNotifications({ ...notifications, aiTips: v })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Injury Prevention Alerts</h4>
                    <p className="text-sm text-muted-foreground">Warnings when fatigue patterns are detected</p>
                  </div>
                  <Switch
                    checked={notifications.injuryAlerts}
                    onCheckedChange={(v) => setNotifications({ ...notifications, injuryAlerts: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <SubscriptionCard user={user} />

          {/* Data Export */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>Download your check-ins and run history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">All Data (CSV)</p>
                    <p className="text-xs text-muted-foreground">Check-ins and runs in spreadsheet format</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open("/api/export?format=csv&type=all", "_blank");
                      toast({ title: "Export started", description: "Your CSV download will begin shortly." });
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">All Data (JSON)</p>
                    <p className="text-xs text-muted-foreground">Full data in developer-friendly format</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open("/api/export?type=all", "_blank");
                      toast({ title: "Export started", description: "Your JSON download will begin shortly." });
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <DeleteAccountDialog />
              </div>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center pt-4">
            <a href="/about" className="hover:text-foreground flex items-center gap-1">
              Our Story <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/privacy" className="hover:text-foreground flex items-center gap-1">
              Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/terms" className="hover:text-foreground flex items-center gap-1">
              Terms of Service <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/help" className="hover:text-foreground flex items-center gap-1">
              Help Center <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

// Subscription Management Component
function SubscriptionCard({ user }: { user: { user_metadata?: { plan?: string }; created_at?: string } | null }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trialInfo, setTrialInfo] = useState({ daysLeft: 7, endDateStr: "" });
  
  const plan = user?.user_metadata?.plan || "free_trial";
  
  // Calculate trial info on client only to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const createdAt = user?.created_at ? new Date(user.created_at) : new Date();
    const trialEndDate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    setTrialInfo({
      daysLeft,
      endDateStr: trialEndDate.toLocaleDateString(),
    });
  }, [user?.created_at]);
  
  const { daysLeft, endDateStr } = trialInfo;
  
  const planNames: Record<string, string> = {
    free_trial: "Free Trial",
    pro_monthly: "Pro Monthly",
    pro_annual: "Pro Annual",
    coach_trial: "Coach Free Trial",
    coach_starter: "Coach Starter",
    coach_pro: "Coach Pro",
    coach_elite: "Coach Elite",
    coach_athlete: "Team Member (Coach Pays)",
  };
  
  const planPrices: Record<string, string> = {
    free_trial: "$0/7 days",
    pro_monthly: "$9.99/month",
    pro_annual: "$99.99/year",
    coach_trial: "$0/7 days",
    coach_starter: "$29.99/month",
    coach_pro: "$49.99/month",
    coach_elite: "$79.99/month",
    coach_athlete: "Free",
  };
  
  const isTrialPlan = plan === "free_trial" || plan === "coach_trial";
  const isCoachAthlete = plan === "coach_athlete";
  
  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (res.ok) {
        toast({ 
          title: "Subscription Cancelled", 
          description: "Your subscription has been cancelled. You can continue using the app until the end of your billing period.",
        });
        setShowCancelDialog(false);
      } else {
        const data = await res.json();
        toast({ 
          title: "Error", 
          description: data.error || "Failed to cancel subscription", 
          variant: "destructive" 
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };
  
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription
        </CardTitle>
        <CardDescription>Manage your plan and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">{planNames[plan] || plan}</h4>
              {mounted && isTrialPlan && daysLeft > 0 && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  {daysLeft} days left
                </Badge>
              )}
              {isCoachAthlete && (
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{planPrices[plan] || ""}</p>
          </div>
          {!isCoachAthlete && (
            <Button variant="outline" size="sm" asChild>
              <a href="/pricing">
                {isTrialPlan ? "Upgrade" : "Change Plan"}
              </a>
            </Button>
          )}
        </div>
        
        {/* Trial Info */}
        {mounted && isTrialPlan && daysLeft > 0 && (
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Trial Period</h4>
              <p className="text-sm text-muted-foreground">
                Your free trial ends on {endDateStr || "soon"}. Upgrade to keep your data and continue using all features.
              </p>
            </div>
          </div>
        )}
        
        {/* Coach Athlete Info */}
        {isCoachAthlete && (
          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Users className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Team Membership</h4>
              <p className="text-sm text-muted-foreground">
                Your account is managed by your coach. Contact your coach if you need to make changes to your subscription.
              </p>
            </div>
          </div>
        )}
        
        {/* Cancel Subscription */}
        {!isTrialPlan && !isCoachAthlete && (
          <div className="pt-2">
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Cancel Subscription?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel? You&apos;ll lose access to:
                  </DialogDescription>
                </DialogHeader>
                <ul className="text-sm text-muted-foreground space-y-2 py-4">
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    AI coaching recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    30-day analytics and trends
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    Unlimited goals
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    Race predictions
                  </li>
                </ul>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                    Keep Subscription
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        {/* Downgrade from Trial */}
        {isTrialPlan && (
          <div className="pt-2">
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Trial
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Cancel Free Trial?</DialogTitle>
                  <DialogDescription>
                    Your trial will end immediately and your account will be deactivated. You can always sign up again later.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                    Keep Trial
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, Cancel Trial
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Delete Account Dialog Component
function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (isDeleting) return; // Prevent double-clicks
    
    setIsDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        // Small delay to show toast before redirect
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to delete account", variant: "destructive" });
        setIsDeleting(false);
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. All your check-ins, runs, and account data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete Everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
