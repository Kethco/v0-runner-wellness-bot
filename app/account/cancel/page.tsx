"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function CancelAccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect to home
      await signOut();
      router.push("/?deleted=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#1C1C1E] rounded-2xl p-8 border border-[#3A3A3C]"
      >
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#8E8E93] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#FF3B30]/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#FF3B30]" />
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Cancel Account
        </h1>
        <p className="text-[#8E8E93] text-center mb-8">
          This action is permanent and cannot be undone. All your data will be deleted.
        </p>

        <div className="space-y-4 mb-8 bg-[#2C2C2E] rounded-xl p-4">
          <h3 className="text-white font-medium">What will be deleted:</h3>
          <ul className="space-y-2 text-[#AEAEB2] text-sm">
            <li>- Your profile and account information</li>
            <li>- All check-in history and wellness data</li>
            <li>- Run logs and statistics</li>
            <li>- AI coaching advice history</li>
            {user?.user_metadata?.user_type === "coach" && (
              <>
                <li>- Your team and athlete connections</li>
                <li>- All athlete invite links</li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#8E8E93] mb-2 block">
              Type <span className="text-[#FF3B30] font-bold">DELETE</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="DELETE"
              className="bg-[#2C2C2E] border-[#3A3A3C] text-white"
            />
          </div>

          {error && (
            <p className="text-[#FF3B30] text-sm">{error}</p>
          )}

          <Button
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== "DELETE"}
            className="w-full h-12 bg-[#FF3B30] hover:bg-[#FF453A] text-white disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting Account...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </>
            )}
          </Button>

          <Link href="/" className="block">
            <Button
              variant="ghost"
              className="w-full text-[#8E8E93] hover:text-white"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
