"use client";

import { useState } from "react";
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
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  CreditCard,
  Calendar,
  Activity,
  Users,
  Lock,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react";

// Mock user data matching backend UserProfile
const mockUser = {
  name: "Alex Runner",
  email: "alex@example.com",
  phone: "+1234567890",
  role: "runner" as const,
  user_mode: "athlete" as const,
  coachPhone: "+0987654321",
  joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
  gender: "M" as const,
  birthYear: 1990,
  plan: "solo_pro" as const,
  trialStartAt: undefined,
};

const PLAN_DETAILS = {
  trial: { name: "Free Trial", price: "$0", features: ["7-day trial", "Basic check-ins", "Limited trends"] },
  solo_pro: { name: "Solo Pro", price: "$4.99/mo", features: ["Unlimited check-ins", "Full trends", "AI coaching", "Race predictions"] },
  coach_starter: { name: "Coach Starter", price: "$19.99/mo", features: ["Up to 5 athletes", "Team dashboard", "All Solo Pro features"] },
  coach_team: { name: "Coach Team", price: "$49.99/mo", features: ["Up to 25 athletes", "Priority support", "Custom branding"] },
  coach_club: { name: "Coach Club", price: "$99.99/mo", features: ["Unlimited athletes", "API access", "White-label option"] },
};

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState({
    morningReminder: true,
    weeklyReport: true,
    aiTips: true,
    injuryAlerts: true,
  });
  const [privacyMode, setPrivacyMode] = useState<"solo" | "coach">("coach");

  const planInfo = PLAN_DETAILS[user.plan] || PLAN_DETAILS.trial;
  const memberSince = new Date(user.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calculateAge = (birthYear: number) => {
    return new Date().getFullYear() - birthYear;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, preferences, and subscription
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={user.name}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                        className="bg-secondary border-border disabled:opacity-70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                        className="bg-secondary border-border disabled:opacity-70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={user.gender} 
                        onValueChange={(v) => setUser({ ...user, gender: v as "M" | "F" })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthYear">Birth Year</Label>
                      <Input
                        id="birthYear"
                        type="number"
                        value={user.birthYear}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, birthYear: parseInt(e.target.value) })}
                        className="bg-secondary border-border disabled:opacity-70"
                      />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <Button className="mt-4" onClick={() => setIsEditing(false)}>
                      Save Changes
                    </Button>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Badge variant="secondary" className="gap-1">
                      <Activity className="w-3 h-3" />
                      {user.role === "coach" ? "Coach" : "Runner"}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      Member since {memberSince}
                    </Badge>
                    {user.birthYear && (
                      <Badge variant="secondary">
                        Age {calculateAge(user.birthYear)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>Your current plan and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{planInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">{planInfo.price}</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground font-medium">Plan includes:</p>
                <ul className="space-y-1">
                  {planInfo.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Change Plan
                </Button>
                <Button variant="outline" size="sm">
                  Billing History
                </Button>
              </div>
            </CardContent>
          </Card>

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

                {privacyMode === "coach" && user.coachPhone && (
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Linked Coach</h4>
                      <p className="text-sm text-muted-foreground">{user.coachPhone}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Unlink
                    </Button>
                  </div>
                )}
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
                    <p className="text-sm text-muted-foreground">Daily reminder at 7 AM</p>
                  </div>
                  <Switch
                    checked={notifications.morningReminder}
                    onCheckedChange={(v) => setNotifications({ ...notifications, morningReminder: v })}
                  />
                </div>
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
                    Permanently delete your account and all data (GDPR Art. 17)
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. All your check-ins, trends, and account data will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive">Delete Everything</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center pt-4">
            <a href="#" className="hover:text-foreground flex items-center gap-1">
              Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
            <a href="#" className="hover:text-foreground flex items-center gap-1">
              Terms of Service <ExternalLink className="w-3 h-3" />
            </a>
            <a href="#" className="hover:text-foreground flex items-center gap-1">
              Data Usage <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
