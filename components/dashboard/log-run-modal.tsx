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
}

export function LogRunModal({ onRunLogged }: LogRunModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    miles: "",
    pace: "",
    duration: "",
    feeling: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miles: parseFloat(formData.miles),
          pace: formData.pace || null,
          duration_minutes: formData.duration ? parseInt(formData.duration) : null,
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
          feeling: "",
          notes: "",
          date: new Date().toISOString().split("T")[0],
        });
        onRunLogged?.();
      }
    } catch (error) {
      console.error("Error logging run:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Log Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Run</DialogTitle>
          <DialogDescription>
            Record your run details to track your weekly mileage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="feeling">How did it feel?</Label>
            <Select
              value={formData.feeling}
              onValueChange={(value) => setFormData({ ...formData, feeling: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feeling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="race">Race</SelectItem>
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
