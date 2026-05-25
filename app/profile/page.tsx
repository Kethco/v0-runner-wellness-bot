"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Camera,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import { MeshBackground } from "@/components/mesh-background";
import { ShoeTracker } from "@/components/shoe-tracker";

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize avatar URL from profile data
  useEffect(() => {
    if (profileData?.profile?.avatar_url) {
      setAvatarUrl(profileData.profile.avatar_url);
    } else if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [profileData, user]);

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setAvatarUrl(data.url);
      toast({ title: "Avatar updated", description: "Your profile picture has been updated" });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image. Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
  <div className="min-h-screen mesh-gradient-bg noise-texture">
      <MeshBackground />
      <Navbar />
      
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[70px] pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
          <p className="text-[#8E8E93] mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-5">
          {/* Profile Header Card - Always Visible */}
          <div className="section-card p-6">
              <div className="flex items-center gap-5">
                {/* Styled Avatar with Upload */}
                <div className="relative group">
                  <Avatar className="w-20 h-20 avatar-ring-glow">
                    <AvatarImage src={avatarUrl || user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-[#FF6B00] to-[#FF4500] text-white text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Upload overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                    {isUploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </label>
                  {/* Status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#30D158] rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{displayName}</h2>
                  <p className="text-sm text-[#8E8E93]">{user?.email}</p>
                  <p className="text-xs text-[#636366] mt-1">Hover avatar to change photo</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="premium-badge px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                      <Activity className="w-3 h-3" />
                      Runner
                    </span>
                    <span className="bg-[#1C1C1E] border border-[#3A3A3C] px-3 py-1 rounded-full text-xs font-medium text-[#AEAEB2] flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Since {memberSince}
                    </span>
                  </div>
                </div>
              </div>
          </div>

          {/* Personal Information - Collapsible */}
          <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <div className="section-card overflow-hidden">
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer hover:bg-white/[0.02] transition-colors p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="icon-container p-2.5">
                        <User className="w-5 h-5 text-[#FF6B00]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">Personal Information</h3>
                        <p className="text-sm text-[#8E8E93] mt-0.5">
                          {isInfoOpen ? "Click to collapse" : "Tap to view and edit your details"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[#6E6E73] transition-transform duration-200 ${isInfoOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 pt-0">
                  <div className="premium-divider mb-5" />
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-transparent border-[#3A3A3C] hover:bg-white/5 hover:border-[#4A4A4C] text-white"
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#AEAEB2] text-sm">Full Name</Label>
                      <Input
                        id="name"
                        value={editedProfile.name}
                        disabled={!isEditing}
                        onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        className="premium-input bg-[#1C1C1E] border-[#3A3A3C] text-white placeholder:text-[#6E6E73] disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#AEAEB2] text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="premium-input bg-[#1C1C1E] border-[#3A3A3C] text-white placeholder:text-[#6E6E73] disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[#AEAEB2] text-sm">Gender</Label>
                      <Select 
                        value={editedProfile.gender} 
                        onValueChange={(v) => setEditedProfile({ ...editedProfile, gender: v })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="premium-input bg-[#1C1C1E] border-[#3A3A3C] text-white">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-[#3A3A3C]">
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthYear" className="text-[#AEAEB2] text-sm">Birth Year</Label>
                      <Input
                        id="birthYear"
                        type="number"
                        value={editedProfile.birthYear}
                        disabled={!isEditing}
                        onChange={(e) => setEditedProfile({ ...editedProfile, birthYear: e.target.value })}
                        className="premium-input bg-[#1C1C1E] border-[#3A3A3C] text-white placeholder:text-[#6E6E73] disabled:opacity-60"
                        placeholder="e.g. 1990"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="location" className="text-[#AEAEB2] text-sm">Location (for weather)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="location"
                          value={editedProfile.location}
                          onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                          className="premium-input bg-[#1C1C1E] border-[#3A3A3C] text-white placeholder:text-[#6E6E73]"
                          placeholder="e.g. New York, Los Angeles, Chicago"
                        />
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            if (!editedProfile.location) return;
                            try {
                              const res = await fetch("/api/profile", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ location: editedProfile.location }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                toast({ title: "Location saved!", description: "Your weather forecast will update." });
                              } else {
                                toast({ title: "Failed to save", description: data.error || "Unknown error", variant: "destructive" });
                              }
                            } catch {
                              toast({ title: "Failed to save location", variant: "destructive" });
                            }
                          }}
                          className="shrink-0 bg-[#FF6B00] hover:bg-[#FF4500] text-white"
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-[#6E6E73]">Used for weather forecast on your training plan</p>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <Button className="mt-4 bg-[#FF6B00] hover:bg-[#FF4500] text-white" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  )}

                  {editedProfile.birthYear && calculateAge(editedProfile.birthYear) && (
                    <div className="mt-4 pt-4 border-t border-[#2C2C2E]">
                      <span className="bg-[#1C1C1E] border border-[#3A3A3C] px-3 py-1.5 rounded-full text-xs font-medium text-[#AEAEB2]">
                        Age {calculateAge(editedProfile.birthYear)}
                      </span>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Shoe Tracker */}
          <ShoeTracker />

          {/* Privacy & Data Sharing */}
          <div className="section-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-container-blue p-2.5">
                <Shield className="w-5 h-5 text-[#0099FF]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Privacy & Data Sharing</h3>
                <p className="text-sm text-[#8E8E93] mt-0.5">Control who can see your data</p>
              </div>
            </div>
            <div className="premium-divider mb-4" />
            <div className="flex items-center justify-between p-4 bg-[#1C1C1E] rounded-xl border border-[#2C2C2E]">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${privacyMode === "solo" ? "bg-[#0099FF]/15 border border-[#0099FF]/20" : "bg-[#30D158]/15 border border-[#30D158]/20"}`}>
                  {privacyMode === "solo" ? (
                    <Lock className="w-5 h-5 text-[#0099FF]" />
                  ) : (
                    <Users className="w-5 h-5 text-[#30D158]" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-white">
                    {privacyMode === "solo" ? "Solo Mode" : "Coach Mode"}
                  </h4>
                  <p className="text-sm text-[#8E8E93]">
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
                <SelectTrigger className="w-[120px] bg-[#2C2C2E] border-[#3A3A3C] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-[#3A3A3C]">
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appearance */}
          <div className="section-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-container p-2.5">
                <Sun className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Appearance</h3>
                <p className="text-sm text-[#8E8E93] mt-0.5">Choose your preferred theme</p>
              </div>
            </div>
            <div className="premium-divider mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: MoonIcon },
                { value: "system", label: "System", icon: Monitor },
              ].map((opt) => {
                // Determine if this option is selected - only after mount to avoid hydration mismatch
                const isSelected = mounted ? theme === opt.value : false;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: isSelected ? '#FF6B00' : '#3A3A3C',
                      backgroundColor: isSelected ? 'rgba(255, 107, 0, 0.1)' : '#1C1C1E',
                      color: isSelected ? '#FF6B00' : '#8E8E93',
                    }}
                  >
                    <opt.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          <div className="section-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-container-purple p-2.5">
                <Bell className="w-5 h-5 text-[#AF52DE]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Notifications</h3>
                <p className="text-sm text-[#8E8E93] mt-0.5">Manage your notification preferences</p>
              </div>
            </div>
            <div className="premium-divider mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Morning Check-in Reminder</h4>
                  <p className="text-sm text-[#8E8E93]">Daily reminder via SMS</p>
                </div>
                <Switch
                  checked={notifications.morningReminder}
                  onCheckedChange={(v) => setNotifications({ ...notifications, morningReminder: v })}
                  className="data-[state=checked]:bg-[#FF6B00]"
                />
              </div>
              {notifications.morningReminder && (
                <div className="ml-0 pl-4 border-l-2 border-[#FF6B00]/30">
                  <Label className="text-xs text-[#8E8E93] mb-1 block">Reminder Time</Label>
                  <Select defaultValue="7:00">
                    <SelectTrigger className="w-32 h-8 text-sm bg-[#1C1C1E] border-[#3A3A3C] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-[#3A3A3C]">
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
              <div className="premium-divider" />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Weekly Summary Report</h4>
                  <p className="text-sm text-[#8E8E93]">Every Sunday at 6 PM</p>
                </div>
                <Switch
                  checked={notifications.weeklyReport}
                  onCheckedChange={(v) => setNotifications({ ...notifications, weeklyReport: v })}
                  className="data-[state=checked]:bg-[#FF6B00]"
                />
              </div>
              <div className="premium-divider" />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">AI Training Tips</h4>
                  <p className="text-sm text-[#8E8E93]">Personalized advice after check-ins</p>
                </div>
                <Switch
                  checked={notifications.aiTips}
                  onCheckedChange={(v) => setNotifications({ ...notifications, aiTips: v })}
                  className="data-[state=checked]:bg-[#FF6B00]"
                />
              </div>
              <div className="premium-divider" />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Injury Prevention Alerts</h4>
                  <p className="text-sm text-[#8E8E93]">Warnings when fatigue patterns are detected</p>
                </div>
                <Switch
                  checked={notifications.injuryAlerts}
                  onCheckedChange={(v) => setNotifications({ ...notifications, injuryAlerts: v })}
                  className="data-[state=checked]:bg-[#FF6B00]"
                />
              </div>
            </div>
          </div>

          {/* Subscription Management */}
          <SubscriptionCard user={user} />

          {/* Data Export */}
          <div className="section-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-container-green p-2.5">
                <Download className="w-5 h-5 text-[#30D158]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Export Your Data</h3>
                <p className="text-sm text-[#8E8E93] mt-0.5">Download your check-ins and run history</p>
              </div>
            </div>
            <div className="premium-divider mb-4" />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">All Data (CSV)</p>
                  <p className="text-xs text-[#6E6E73]">Check-ins and runs in spreadsheet format</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open("/api/export?format=csv&type=all", "_blank");
                    toast({ title: "Export started", description: "Your CSV download will begin shortly." });
                  }}
                  className="bg-transparent border-[#3A3A3C] hover:bg-white/5 hover:border-[#4A4A4C] text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
              </div>
              <div className="premium-divider" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">All Data (JSON)</p>
                  <p className="text-xs text-[#6E6E73]">Full data in developer-friendly format</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open("/api/export?type=all", "_blank");
                    toast({ title: "Export started", description: "Your JSON download will begin shortly." });
                  }}
                  className="bg-transparent border-[#3A3A3C] hover:bg-white/5 hover:border-[#4A4A4C] text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="section-card p-5 border-[#FF453A]/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/20">
                <Trash2 className="w-5 h-5 text-[#FF453A]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#FF453A]">Danger Zone</h3>
                <p className="text-sm text-[#8E8E93] mt-0.5">Irreversible actions</p>
              </div>
            </div>
            <div className="premium-divider mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Delete Account</h4>
                <p className="text-sm text-[#8E8E93]">
                  Permanently delete your account and all data
                </p>
              </div>
              <DeleteAccountDialog />
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-4 text-sm text-[#6E6E73] justify-center pt-4">
            <a href="/about" className="hover:text-white transition-colors flex items-center gap-1">
              Our Story <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/privacy" className="hover:text-white transition-colors flex items-center gap-1">
              Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/terms" className="hover:text-white transition-colors flex items-center gap-1">
              Terms of Service <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/help" className="hover:text-white transition-colors flex items-center gap-1">
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
    <div className="section-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="icon-container p-2.5">
          <CreditCard className="w-5 h-5 text-[#FF6B00]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Subscription</h3>
          <p className="text-sm text-[#8E8E93] mt-0.5">Manage your plan and billing</p>
        </div>
      </div>
      <div className="premium-divider mb-4" />
      <div className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-[#1C1C1E] rounded-xl border border-[#2C2C2E]">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white">{planNames[plan] || plan}</h4>
              {mounted && isTrialPlan && daysLeft > 0 && (
                <span className="bg-[#0099FF]/15 border border-[#0099FF]/25 text-[#0099FF] px-2 py-0.5 rounded-full text-xs font-medium">
                  {daysLeft} days left
                </span>
              )}
              {isCoachAthlete && (
                <span className="bg-[#30D158]/15 border border-[#30D158]/25 text-[#30D158] px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-[#8E8E93]">{planPrices[plan] || ""}</p>
          </div>
          {!isCoachAthlete && (
            <Button variant="outline" size="sm" asChild className="bg-transparent border-[#3A3A3C] hover:bg-white/5 hover:border-[#4A4A4C] text-white">
              <a href="/pricing">
                {isTrialPlan ? "Upgrade" : "Change Plan"}
              </a>
            </Button>
          )}
        </div>
        
        {/* Trial Info */}
        {mounted && isTrialPlan && daysLeft > 0 && (
          <div className="flex items-start gap-3 p-4 bg-[#0099FF]/10 border border-[#0099FF]/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-[#0099FF] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-white">Trial Period</h4>
              <p className="text-sm text-[#8E8E93]">
                Your free trial ends on {endDateStr || "soon"}. Upgrade to keep your data and continue using all features.
              </p>
            </div>
          </div>
        )}
        
        {/* Coach Athlete Info */}
        {isCoachAthlete && (
          <div className="flex items-start gap-3 p-4 bg-[#30D158]/10 border border-[#30D158]/20 rounded-xl">
            <Users className="w-5 h-5 text-[#30D158] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-white">Team Membership</h4>
              <p className="text-sm text-[#8E8E93]">
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
                <Button variant="ghost" size="sm" className="text-[#6E6E73] hover:text-[#FF453A] hover:bg-[#FF453A]/10">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1C1C1E] border-[#3A3A3C]">
                <DialogHeader>
                  <DialogTitle className="text-white">Cancel Subscription?</DialogTitle>
                  <DialogDescription className="text-[#8E8E93]">
                    Are you sure you want to cancel? You&apos;ll lose access to:
                  </DialogDescription>
                </DialogHeader>
                <ul className="text-sm text-[#8E8E93] space-y-2 py-4">
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#FF453A]" />
                    AI coaching recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#FF453A]" />
                    30-day analytics and trends
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#FF453A]" />
                    Unlimited goals
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#FF453A]" />
                    Race predictions
                  </li>
                </ul>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="bg-transparent border-[#3A3A3C] text-white hover:bg-white/5">
                    Keep Subscription
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="bg-[#FF453A] hover:bg-[#FF453A]/80"
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
                <Button variant="ghost" size="sm" className="text-[#6E6E73] hover:text-[#FF453A] hover:bg-[#FF453A]/10">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Trial
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1C1C1E] border-[#3A3A3C]">
                <DialogHeader>
                  <DialogTitle className="text-white">Cancel Free Trial?</DialogTitle>
                  <DialogDescription className="text-[#8E8E93]">
                    Your trial will end immediately and your account will be deactivated. You can always sign up again later.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="bg-transparent border-[#3A3A3C] text-white hover:bg-white/5">
                    Keep Trial
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="bg-[#FF453A] hover:bg-[#FF453A]/80"
                  >
                    {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, Cancel Trial
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
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
        <Button variant="destructive" size="sm" className="bg-[#FF453A] hover:bg-[#FF453A]/80">
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1C1C1E] border-[#3A3A3C]">
        <DialogHeader>
          <DialogTitle className="text-white">Are you sure?</DialogTitle>
          <DialogDescription className="text-[#8E8E93]">
            This action cannot be undone. All your check-ins, runs, and account data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting} className="bg-transparent border-[#3A3A3C] text-white hover:bg-white/5">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-[#FF453A] hover:bg-[#FF453A]/80"
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete Everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
