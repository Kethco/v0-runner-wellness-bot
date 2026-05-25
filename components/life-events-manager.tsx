"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plane,
  Thermometer,
  Briefcase,
  Palmtree,
  AlertTriangle,
  Plus,
  Calendar,
  X,
  Loader2,
  ArrowRight,
  Pencil,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface LifeEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  training_impact: string;
  can_run: boolean;
  notes: string;
}

const EVENT_TYPES = [
  { value: "travel", label: "Travel", icon: Plane, color: "text-blue-500", bg: "bg-blue-500/15" },
  { value: "illness", label: "Illness", icon: Thermometer, color: "text-red-500", bg: "bg-red-500/15" },
  { value: "busy", label: "Busy Period", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/15" },
  { value: "vacation", label: "Vacation", icon: Palmtree, color: "text-green-500", bg: "bg-green-500/15" },
  { value: "injury", label: "Injury", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/15" },
];

const TRAINING_IMPACTS = [
  { value: "none", label: "No Impact", description: "Training proceeds as normal" },
  { value: "reduced", label: "Reduced Training", description: "Lighter workouts, shorter runs" },
  { value: "no_training", label: "No Training", description: "Complete rest from running" },
];

export function LifeEventsManager() {
  const { data, error, isLoading, mutate } = useSWR<{ events: LifeEvent[] }>("/api/life-events", fetcher);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState<{
    adjustments: Array<{
      workoutId: string;
      originalDate: string;
      newDate: string | null;
      action: string;
      reason: string;
    }>;
  } | null>(null);
  const [newEvent, setNewEvent] = useState({
    eventType: "travel",
    title: "",
    startDate: "",
    endDate: "",
    trainingImpact: "no_training",
    canRun: false,
    notes: "",
  });

  const handleResyncPlan = async () => {
    setIsResyncing(true);
    try {
      // Call the direct skip endpoint
      const response = await fetch("/api/debug/workouts", { method: "POST" });
      const result = await response.json();
      
      if (result.updates && result.updates.length > 0) {
        setAdjustmentResult({
          adjustments: result.updates.map((u: any) => ({
            workoutId: u.date,
            originalDate: u.date,
            newDate: null,
            action: "skipped",
            reason: `${u.type} workout skipped for life event`,
          }))
        });
      } else {
        // Show debug info to help diagnose
        const debugMsg = result.debug 
          ? `\n\nDebug info:\n- Total workouts in plan: ${result.debug.totalWorkoutsInPlan}\n- Sample dates: ${result.debug.sampleDates?.slice(0,5).join(", ")}\n- Events: ${result.debug.events?.map((e: any) => `${e.start} to ${e.end}`).join(", ")}\n- Matches found: ${result.debug.matches?.length || 0}`
          : "";
        alert((result.message || "No workouts to skip") + debugMsg);
      }
    } catch (err) {
      alert("Failed to update plan: " + err);
    }
    setIsResyncing(false);
  };

  const events = data?.events || [];
  
  // Get upcoming events (within next 30 days)
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const upcomingEvents = events.filter(e => e.end_date >= today && e.start_date <= thirtyDaysFromNow);

  const handleAddEvent = async () => {
    if (!newEvent.eventType || !newEvent.startDate || !newEvent.endDate) {
      return;
    }

    setIsSaving(true);
    try {
      const method = editingEvent ? "PUT" : "POST";
      const body = editingEvent 
        ? { ...newEvent, id: editingEvent.id }
        : newEvent;
      
      const response = await fetch("/api/life-events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        mutate();
        
        // Show adjustment results if workouts were rescheduled
        if (result.adjustments?.adjustments?.length > 0) {
          setAdjustmentResult(result.adjustments);
        }
        
        setNewEvent({
          eventType: "travel",
          title: "",
          startDate: "",
          endDate: "",
          trainingImpact: "reduced",
          canRun: true,
          notes: "",
        });
        setEditingEvent(null);
        setIsDialogOpen(false);
      }
    } catch (err) {
      console.error("Failed to save life event:", err);
    }
    setIsSaving(false);
  };

  const handleEditEvent = (event: LifeEvent) => {
    setEditingEvent(event);
    setNewEvent({
      eventType: event.event_type,
      title: event.title || "",
      startDate: event.start_date,
      endDate: event.end_date,
      trainingImpact: event.training_impact,
      canRun: event.can_run,
      notes: event.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setNewEvent({
      eventType: "travel",
      title: "",
      startDate: "",
      endDate: "",
      trainingImpact: "reduced",
      canRun: true,
      notes: "",
    });
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await fetch(`/api/life-events?id=${id}`, { method: "DELETE" });
      mutate();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start + "T12:00:00");
    const endDate = new Date(end + "T12:00:00");
    
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    
    if (start === end) {
      return startDate.toLocaleDateString("en-US", options);
    }
    
    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
  };

  const getDaysAway = (date: string) => {
    const eventDate = new Date(date);
    const now = new Date();
    const days = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return "ongoing";
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    return `in ${days} days`;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/15">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <CardTitle className="text-base">Life Events</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleResyncPlan}
              disabled={isResyncing}
            >
              {isResyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Resync Plan"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Mark travel, illness, or busy periods so your plan can adapt
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add travel or busy periods so your training adapts
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {upcomingEvents.map((event) => {
              const typeInfo = getEventTypeInfo(event.event_type);
              const Icon = typeInfo.icon;
              const isOngoing = event.start_date <= today;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-xl ${typeInfo.bg} border border-transparent hover:border-border transition-colors group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-background/50`}>
                      <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {event.title || typeInfo.label}
                        </p>
                        {isOngoing && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Now
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateRange(event.start_date, event.end_date)}
                        {!isOngoing && (
                          <span className="ml-2 text-muted-foreground/70">
                            ({getDaysAway(event.start_date)})
                          </span>
                        )}
                      </p>
                      {event.training_impact !== "none" && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {event.training_impact === "no_training" 
                            ? "No training during this period"
                            : "Reduced training intensity"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-white/10"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </CardContent>

      {/* Add/Edit Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Life Event" : "Add Life Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent 
                ? "Update the details of your life event."
                : "Mark periods that might affect your training so your plan can adapt."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label>Event Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = newEvent.eventType === type.value;
                  
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, eventType: type.value })}
                      className={`p-3 rounded-xl border transition-all text-center ${
                        isSelected
                          ? `${type.bg} border-primary/50`
                          : "bg-secondary border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? type.color : "text-muted-foreground"}`} />
                      <span className={`text-xs ${isSelected ? "font-medium" : "text-muted-foreground"}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                placeholder="e.g., Business trip to NYC"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  min={newEvent.startDate}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Training Impact */}
            <div className="space-y-2">
              <Label>Training Impact</Label>
              <Select
                value={newEvent.trainingImpact}
                onValueChange={(v) => setNewEvent({ 
                  ...newEvent, 
                  trainingImpact: v,
                  // Auto-set canRun to false when "no_training" is selected
                  canRun: v === "no_training" ? false : newEvent.canRun
                })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_IMPACTS.map((impact) => (
                    <SelectItem key={impact.value} value={impact.value}>
                      <div>
                        <p className="font-medium">{impact.label}</p>
                        <p className="text-xs text-muted-foreground">{impact.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Can Run Toggle */}
            {newEvent.trainingImpact !== "no_training" && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div>
                  <Label>Can still run</Label>
                  <p className="text-xs text-muted-foreground">
                    Will you have access to run during this period?
                  </p>
                </div>
                <Switch
                  checked={newEvent.canRun}
                  onCheckedChange={(v) => setNewEvent({ ...newEvent, canRun: v })}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAddEvent}
              disabled={isSaving || !newEvent.startDate || !newEvent.endDate}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingEvent ? "Save Changes" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Results Dialog */}
      <Dialog open={!!adjustmentResult} onOpenChange={() => setAdjustmentResult(null)}>
        <DialogContent className="sm:max-w-md bg-[#1C1C1E] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-500" />
              </div>
              Training Plan Adjusted
            </DialogTitle>
            <DialogDescription>
              Your workouts have been automatically rescheduled around your life event.
            </DialogDescription>
          </DialogHeader>
          
          {adjustmentResult && (
            <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
              {adjustmentResult.adjustments.map((adj, i) => (
                <motion.div
                  key={adj.workoutId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    adj.action === "rescheduled" 
                      ? "bg-blue-500/10 border-blue-500/30" 
                      : adj.action === "reduced"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className={`text-[10px] ${
                      adj.action === "rescheduled" 
                        ? "bg-blue-500/20 text-blue-400" 
                        : adj.action === "reduced"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {adj.action === "rescheduled" ? "Moved" : adj.action === "reduced" ? "Reduced" : "Skipped"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(adj.originalDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{adj.reason}</p>
                  {adj.newDate && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      → Moved to {new Date(adj.newDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setAdjustmentResult(null)} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
