"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Footprints, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Edit2,
  Star,
  Archive,
  ChevronRight,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Shoe {
  id: string;
  brand: string;
  model: string;
  nickname: string | null;
  purchase_date: string;
  initial_miles: number;
  total_miles: number;
  max_miles: number;
  is_default: boolean;
  is_retired: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return { shoes: [] };
  return res.json();
};

// Popular running shoe brands for suggestions
const SHOE_BRANDS = [
  "Nike", "Adidas", "Brooks", "ASICS", "New Balance", 
  "Saucony", "Hoka", "On", "Altra", "Mizuno"
];

export function ShoeTracker() {
  const { data, isLoading } = useSWR("/api/shoes", fetcher);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRetired, setShowRetired] = useState(false);

  const shoes: Shoe[] = data?.shoes || [];
  const activeShoes = shoes.filter(s => !s.is_retired);
  const retiredShoes = shoes.filter(s => s.is_retired);

  const getMileageStatus = (shoe: Shoe) => {
    const percentage = (shoe.total_miles / shoe.max_miles) * 100;
    if (percentage >= 100) return { status: "replace", color: "#FF3B30", label: "Replace Now" };
    if (percentage >= 80) return { status: "warning", color: "#FF9500", label: "Getting Worn" };
    if (percentage >= 60) return { status: "moderate", color: "#FFD60A", label: "Good Condition" };
    return { status: "good", color: "#30D158", label: "Like New" };
  };

  const handleAddShoe = async (formData: {
    brand: string;
    model: string;
    nickname: string;
    purchaseDate: string;
    initialMiles: number;
    maxMiles: number;
    isDefault: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/shoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        mutate("/api/shoes");
        setShowAddModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateShoe = async (id: string, updates: Partial<Shoe>) => {
    try {
      await fetch("/api/shoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      mutate("/api/shoes");
    } catch (error) {
      console.error("Failed to update shoe:", error);
    }
  };

  const handleDeleteShoe = async (id: string) => {
    try {
      await fetch(`/api/shoes?id=${id}`, { method: "DELETE" });
      mutate("/api/shoes");
    } catch (error) {
      console.error("Failed to delete shoe:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1C1C1E] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FF9500]/15 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-[#FF9500]" />
          </div>
          <h3 className="text-white font-semibold text-lg">Shoe Tracker</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#8E8E93] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1C1C1E] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF9500]/15 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-[#FF9500]" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Shoe Tracker</h3>
            <p className="text-[#8E8E93] text-sm">{activeShoes.length} active shoe{activeShoes.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#FF9500] hover:bg-[#FF9500]/10"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Active Shoes List */}
      {activeShoes.length === 0 ? (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowAddModal(true)}
          className="w-full p-6 rounded-xl border-2 border-dashed border-[#3A3A3C] hover:border-[#FF9500]/50 transition-colors flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-full bg-[#FF9500]/15 flex items-center justify-center">
            <Plus className="w-6 h-6 text-[#FF9500]" />
          </div>
          <p className="text-white font-medium">Add Your First Shoe</p>
          <p className="text-[#8E8E93] text-sm text-center">Track mileage and know when it&apos;s time for a new pair</p>
        </motion.button>
      ) : (
        <div className="space-y-3">
          {activeShoes.map((shoe) => {
            const status = getMileageStatus(shoe);
            const percentage = Math.min((shoe.total_miles / shoe.max_miles) * 100, 100);
            
            return (
              <motion.div
                key={shoe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#2C2C2E] rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">
                        {shoe.nickname || `${shoe.brand} ${shoe.model}`}
                      </p>
                      {shoe.is_default && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FF9500]/15 text-[#FF9500] text-xs font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    {shoe.nickname && (
                      <p className="text-[#8E8E93] text-sm">{shoe.brand} {shoe.model}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingShoe(shoe)}
                    className="p-2 rounded-lg hover:bg-[#3A3A3C] transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-[#8E8E93]" />
                  </button>
                </div>

                {/* Mileage Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#8E8E93] text-sm">
                      {shoe.total_miles.toFixed(1)} / {shoe.max_miles} miles
                    </span>
                    <span className="text-sm font-medium" style={{ color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="h-2 bg-[#3A3A3C] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                  </div>
                </div>

                {/* Status Icon */}
                {status.status === "replace" && (
                  <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-[#FF3B30]/10">
                    <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />
                    <span className="text-[#FF3B30] text-sm">
                      These shoes have exceeded their recommended mileage
                    </span>
                  </div>
                )}
                {status.status === "warning" && (
                  <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-[#FF9500]/10">
                    <AlertTriangle className="w-4 h-4 text-[#FF9500]" />
                    <span className="text-[#FF9500] text-sm">
                      Consider shopping for a replacement soon
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Retired Shoes Toggle */}
      {retiredShoes.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowRetired(!showRetired)}
            className="flex items-center gap-2 text-[#8E8E93] text-sm hover:text-white transition-colors"
          >
            <Archive className="w-4 h-4" />
            <span>{retiredShoes.length} retired shoe{retiredShoes.length !== 1 ? "s" : ""}</span>
            <ChevronRight className={cn("w-4 h-4 transition-transform", showRetired && "rotate-90")} />
          </button>
          
          <AnimatePresence>
            {showRetired && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3">
                  {retiredShoes.map((shoe) => (
                    <div
                      key={shoe.id}
                      className="bg-[#2C2C2E]/50 rounded-xl p-3 flex items-center justify-between opacity-60"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">
                          {shoe.nickname || `${shoe.brand} ${shoe.model}`}
                        </p>
                        <p className="text-[#8E8E93] text-xs">
                          {shoe.total_miles.toFixed(1)} miles total
                        </p>
                      </div>
                      <button
                        onClick={() => handleUpdateShoe(shoe.id, { isRetired: false })}
                        className="text-xs text-[#FF9500] hover:underline"
                      >
                        Reactivate
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add Shoe Modal */}
      <AddShoeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddShoe}
        isSubmitting={isSubmitting}
      />

      {/* Edit Shoe Modal */}
      {editingShoe && (
        <EditShoeModal
          shoe={editingShoe}
          open={!!editingShoe}
          onClose={() => setEditingShoe(null)}
          onUpdate={handleUpdateShoe}
          onDelete={handleDeleteShoe}
        />
      )}
    </div>
  );
}

// Add Shoe Modal Component
function AddShoeModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    brand: string;
    model: string;
    nickname: string;
    purchaseDate: string;
    initialMiles: number;
    maxMiles: number;
    isDefault: boolean;
  }) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    nickname: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    initialMiles: 0,
    maxMiles: 500,
    isDefault: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1C1C1E] border-[#3A3A3C] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Footprints className="w-5 h-5 text-[#FF9500]" />
            Add New Shoe
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand */}
          <div className="space-y-2">
            <Label className="text-[#8E8E93]">Brand</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SHOE_BRANDS.slice(0, 5).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setFormData({ ...formData, brand })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-colors",
                    formData.brand === brand
                      ? "bg-[#FF9500] text-white"
                      : "bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C]"
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
            <Input
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Or type brand name..."
              className="bg-[#2C2C2E] border-[#3A3A3C] text-white"
              required
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="text-[#8E8E93]">Model</Label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., Pegasus 40, Gel-Nimbus 25"
              className="bg-[#2C2C2E] border-[#3A3A3C] text-white"
              required
            />
          </div>

          {/* Nickname (Optional) */}
          <div className="space-y-2">
            <Label className="text-[#8E8E93]">Nickname (Optional)</Label>
            <Input
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="e.g., My Lucky Blues"
              className="bg-[#2C2C2E] border-[#3A3A3C] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Purchase Date */}
            <div className="space-y-2">
              <Label className="text-[#8E8E93]">Purchase Date</Label>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="bg-[#2C2C2E] border-[#3A3A3C] text-white"
              />
            </div>

            {/* Initial Miles */}
            <div className="space-y-2">
              <Label className="text-[#8E8E93]">Starting Miles</Label>
              <Input
                type="number"
                value={formData.initialMiles}
                onChange={(e) => setFormData({ ...formData, initialMiles: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                className="bg-[#2C2C2E] border-[#3A3A3C] text-white"
              />
            </div>
          </div>

          {/* Max Miles */}
          <div className="space-y-2">
            <Label className="text-[#8E8E93]">Replace at (miles)</Label>
            <div className="flex gap-2">
              {[300, 400, 500, 600].map((miles) => (
                <button
                  key={miles}
                  type="button"
                  onClick={() => setFormData({ ...formData, maxMiles: miles })}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm transition-colors",
                    formData.maxMiles === miles
                      ? "bg-[#FF9500] text-white"
                      : "bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C]"
                  )}
                >
                  {miles}
                </button>
              ))}
            </div>
          </div>

          {/* Set as Default */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#2C2C2E]">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FF9500]" />
              <span className="text-white text-sm">Set as default shoe</span>
            </div>
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-[#8E8E93]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.brand || !formData.model}
              className="bg-[#FF9500] hover:bg-[#FF9500]/90 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Add Shoe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Shoe Modal Component
function EditShoeModal({
  shoe,
  open,
  onClose,
  onUpdate,
  onDelete,
}: {
  shoe: Shoe;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Shoe>) => void;
  onDelete: (id: string) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRetire = () => {
    onUpdate(shoe.id, { isRetired: true });
    onClose();
  };

  const handleSetDefault = () => {
    onUpdate(shoe.id, { isDefault: true });
    onClose();
  };

  const handleDelete = () => {
    onDelete(shoe.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1C1C1E] border-[#3A3A3C] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {shoe.nickname || `${shoe.brand} ${shoe.model}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#2C2C2E] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{shoe.total_miles.toFixed(1)}</p>
              <p className="text-[#8E8E93] text-sm">Miles Run</p>
            </div>
            <div className="bg-[#2C2C2E] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{Math.max(0, shoe.max_miles - shoe.total_miles).toFixed(0)}</p>
              <p className="text-[#8E8E93] text-sm">Miles Left</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!shoe.is_default && (
              <button
                onClick={handleSetDefault}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] transition-colors"
              >
                <Star className="w-5 h-5 text-[#FF9500]" />
                <span className="text-white">Set as Default</span>
              </button>
            )}
            
            <button
              onClick={handleRetire}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] transition-colors"
            >
              <Archive className="w-5 h-5 text-[#8E8E93]" />
              <span className="text-white">Retire Shoe</span>
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#FF3B30]/10 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-[#FF3B30]" />
                <span className="text-[#FF3B30]">Delete Shoe</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/30">
                <p className="text-[#FF3B30] text-sm mb-3">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
