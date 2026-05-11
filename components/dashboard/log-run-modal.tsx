"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogRunModalProps {
  onRunLogged?: () => void;
  children?: React.ReactNode;
}

export function LogRunModal({ onRunLogged, children }: LogRunModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    miles: "",
    pace: "",
    duration: "",
    runType: "easy",
    feeling: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miles: parseFloat(formData.miles),
          pace: formData.pace || null,
          duration_minutes: formData.duration ? parseInt(formData.duration) : null,
          runType: formData.runType,
          feeling: formData.feeling || null,
          notes: formData.notes || null,
          date: formData.date,
        }),
      });

      if (response.ok) {
        setOpen(false);
        setFormData({
          miles: "",
          pace: "",
          duration: "",
          runType: "easy",
          feeling: "",
          notes: "",
          date: new Date().toISOString().split("T")[0],
        });
        onRunLogged?.();
      } else {
        const errorData = await response.json();
        if (errorData.error === "Unauthorized") {
          setError("Please log in to save your run");
        } else {
          setError(errorData.error || "Failed to save run. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to save run. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
<DialogTrigger asChild>
  {children || (
    <Button size="sm" className="gap-2 bg-gradient-to-r from-[#FF4500] to-[#FF6B00] hover:opacity-90 text-white border-0 shadow-lg shadow-[#FF4500]/20">
      <Plus className="w-4 h-4" />
      Log Run
    </Button>
  )}
  </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Run</DialogTitle>
          <DialogDescription>
            Record your run details to track your weekly mileage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="miles">Distance (miles) *</Label>
              <Input
                id="miles"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                placeholder="5.0"
                value={formData.miles}
                onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pace">Pace (min/mi)</Label>
              <Input
                id="pace"
                type="text"
                placeholder="8:30"
                pattern="^\d{1,2}:\d{2}$"
                value={formData.pace}
                onChange={(e) => setFormData({ ...formData, pace: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="600"
                placeholder="45"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="runType">Run Type</Label>
            <Select
              value={formData.runType}
              onValueChange={(value) => setFormData({ ...formData, runType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select run type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy Run</SelectItem>
                <SelectItem value="tempo">Tempo Run</SelectItem>
                <SelectItem value="long">Long Run</SelectItem>
                <SelectItem value="interval">Intervals</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
                <SelectItem value="fartlek">Fartlek</SelectItem>
                <SelectItem value="hills">Hill Training</SelectItem>
                <SelectItem value="race">Race</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeling">Effort Level</Label>
            <Select
              value={formData.feeling}
              onValueChange={(value) => setFormData({ ...formData, feeling: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="How hard was it?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="max">Max Effort</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Morning run, felt great..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading || !formData.miles}>
              {isLoading ? "Logging..." : "Log Run"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
