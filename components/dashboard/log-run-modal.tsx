"use client";

import { useState, useEffect } from "react";
import { X, Plus, Footprints } from "lucide-react";
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
import { celebrateRun } from "@/lib/celebrations";
import { PRCelebrationModal } from "@/components/pr-celebration-modal";

interface Shoe {
  id: string;
  brand: string;
  model: string;
  nickname: string | null;
  is_default: boolean;
  total_miles: number;
  max_miles: number;
}

interface PRResult {
  isNewPR: boolean;
  distanceLabel: string | null;
  newTime: string | null;
  previousTime: string | null;
  improvementDisplay: string | null;
}

interface LogRunModalProps {
  onRunLogged?: () => void;
  children?: React.ReactNode;
}

// Helper to get local date in YYYY-MM-DD format
const getLocalDateStr = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export function LogRunModal({ onRunLogged, children }: LogRunModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prCelebration, setPrCelebration] = useState<PRResult | null>(null);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [formData, setFormData] = useState({
    miles: "",
    pace: "",
    duration: "",
    runType: "easy",
    feeling: "",
    notes: "",
    date: getLocalDateStr(),
    shoeId: "",
  });

  // Fetch shoes when modal opens
  useEffect(() => {
    if (open) {
      fetch("/api/shoes")
        .then(res => res.json())
        .then(data => {
          const activeShoes = (data.shoes || []).filter((s: Shoe) => !s.is_retired);
          setShoes(activeShoes);
          // Set default shoe if available and not already selected
          if (!formData.shoeId) {
            const defaultShoe = activeShoes.find((s: Shoe) => s.is_default);
            if (defaultShoe) {
              setFormData(prev => ({ ...prev, shoeId: defaultShoe.id }));
            }
          }
        })
        .catch(err => console.error("Failed to fetch shoes:", err));
    }
  }, [open]);

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
          shoeId: formData.shoeId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setOpen(false);
        setFormData({
          miles: "",
          pace: "",
          duration: "",
          runType: "easy",
          feeling: "",
          notes: "",
          date: getLocalDateStr(),
          shoeId: "",
        });
        
        // Check if we got a new PR
        if (data.pr?.isNewPR) {
          // Show PR celebration instead of regular celebration
          setTimeout(() => {
            setPrCelebration(data.pr);
          }, 300);
        } else {
          // Regular run celebration
          setTimeout(() => celebrateRun(), 300);
        }
        
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
    <>
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
                max={getLocalDateStr()}
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

          {/* Shoe Selector */}
          {shoes.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-[#FF9500]" />
                Shoe Used
              </Label>
              <Select
                value={formData.shoeId}
                onValueChange={(value) => setFormData({ ...formData, shoeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shoe (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No shoe selected</SelectItem>
                  {shoes.map((shoe) => (
                    <SelectItem key={shoe.id} value={shoe.id}>
                      <span className="flex items-center gap-2">
                        {shoe.nickname || `${shoe.brand} ${shoe.model}`}
                        {shoe.is_default && (
                          <span className="text-xs text-[#FF9500]">(Default)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
    
    {/* PR Celebration Modal */}
    <PRCelebrationModal
      isOpen={!!prCelebration?.isNewPR}
      onClose={() => setPrCelebration(null)}
      distanceLabel={prCelebration?.distanceLabel || ""}
      newTime={prCelebration?.newTime || ""}
      previousTime={prCelebration?.previousTime}
      improvementDisplay={prCelebration?.improvementDisplay}
    />
    </>
  );
}
