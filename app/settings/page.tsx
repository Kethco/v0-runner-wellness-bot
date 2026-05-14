"use client";

import { useState } from "react";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Bell,
  Clock,
  Globe,
  Palette,
  Smartphone,
  Download,
  RefreshCw,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Notifications
    morningReminderTime: "07:00",
    morningReminderEnabled: true,
    afternoonReminderTime: "14:00",
    afternoonReminderEnabled: false,
    weeklyReportDay: "sunday",
    weeklyReportEnabled: true,
    
    // Preferences
    timezone: "America/New_York",
    language: "en",
    units: "imperial",
    theme: "dark",
    
    // Data
    autoSync: true,
    dataRetention: "forever",
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[60px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Customize your Runner Wellness experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Notification Settings */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure when and how you receive reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Morning Reminder */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Morning Check-in Reminder</h4>
                  <p className="text-sm text-muted-foreground">Daily reminder to complete your morning check-in</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="time"
                    value={settings.morningReminderTime}
                    onChange={(e) => setSettings({ ...settings, morningReminderTime: e.target.value })}
                    className="w-28 bg-secondary border-border"
                    disabled={!settings.morningReminderEnabled}
                  />
                  <Switch
                    checked={settings.morningReminderEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, morningReminderEnabled: v })}
                  />
                </div>
              </div>
              
              <Separator />

              {/* Afternoon Reminder */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Afternoon Update Reminder</h4>
                  <p className="text-sm text-muted-foreground">Optional reminder for afternoon wellness check</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="time"
                    value={settings.afternoonReminderTime}
                    onChange={(e) => setSettings({ ...settings, afternoonReminderTime: e.target.value })}
                    className="w-28 bg-secondary border-border"
                    disabled={!settings.afternoonReminderEnabled}
                  />
                  <Switch
                    checked={settings.afternoonReminderEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, afternoonReminderEnabled: v })}
                  />
                </div>
              </div>

              <Separator />

              {/* Weekly Report */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Weekly Summary Report</h4>
                  <p className="text-sm text-muted-foreground">Receive a weekly wellness summary</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={settings.weeklyReportDay}
                    onValueChange={(v) => setSettings({ ...settings, weeklyReportDay: v })}
                    disabled={!settings.weeklyReportEnabled}
                  >
                    <SelectTrigger className="w-32 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch
                    checked={settings.weeklyReportEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, weeklyReportEnabled: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Preferences
              </CardTitle>
              <CardDescription>Regional and display settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timezone
                  </Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(v) => setSettings({ ...settings, timezone: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </Label>
                  <Select
                    value={settings.language}
                    onValueChange={(v) => setSettings({ ...settings, language: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Espa&#241;ol</SelectItem>
                      <SelectItem value="fr">Fran&#231;ais</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Distance Units</Label>
                  <Select
                    value={settings.units}
                    onValueChange={(v) => setSettings({ ...settings, units: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imperial">Miles</SelectItem>
                      <SelectItem value="metric">Kilometers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme
                  </Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(v) => setSettings({ ...settings, theme: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Sync */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Data & Sync
              </CardTitle>
              <CardDescription>Manage your data and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Auto-sync SMS Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync check-ins from SMS to dashboard
                  </p>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(v) => setSettings({ ...settings, autoSync: v })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Data Retention</h4>
                  <p className="text-sm text-muted-foreground">
                    How long to keep your historical check-in data
                  </p>
                </div>
                <Select
                  value={settings.dataRetention}
                  onValueChange={(v) => setSettings({ ...settings, dataRetention: v })}
                >
                  <SelectTrigger className="w-36 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export All Data
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
