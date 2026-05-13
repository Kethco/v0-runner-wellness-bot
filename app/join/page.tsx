"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Lock, User, Mail, CheckCircle2 } from "lucide-react";

function JoinForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const coachId = searchParams.get("c") || "";
  const athleteName = searchParams.get("n") || "";
  
  const [formData, setFormData] = useState({
    name: athleteName,
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // If no coach ID, show error
  if (!coachId) {
    return (
      <Card className="w-full max-w-md bg-[#1C1C1E] border-[#3A3A3C]">
        <CardContent className="pt-6 text-center">
          <p className="text-red-500">Invalid invite link. Please ask your coach for a new link.</p>
          <Button 
            onClick={() => router.push("/signup")} 
            variant="outline"
            className="mt-4"
          >
            Sign up without a team
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.name.split(" ")[0] || formData.name,
          last_name: formData.name.split(" ").slice(1).join(" ") || "",
          user_type: "athlete",
          coach_id: coachId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <Card className="w-full max-w-md bg-[#1C1C1E] border-[#3A3A3C]">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Account Created!</h2>
          <p className="text-[#8E8E93]">You can now log in to start tracking your wellness.</p>
          <Button 
            onClick={() => router.push("/login")} 
            className="w-full bg-[#FF4500] hover:bg-[#FF6B00]"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-[#1C1C1E] border-[#3A3A3C]">
      <CardHeader className="text-center space-y-2">
        <div className="w-12 h-12 bg-[#FF4500]/20 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-6 h-6 text-[#FF4500]" />
        </div>
        <CardTitle className="text-xl text-white">Join Your Team</CardTitle>
        <CardDescription className="text-[#8E8E93]">
          Create your account to start tracking your wellness
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[#8E8E93]">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
                className="pl-10 bg-[#2C2C2E] border-[#3A3A3C] text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8E8E93]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="pl-10 bg-[#2C2C2E] border-[#3A3A3C] text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8E8E93]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password (min 6 characters)"
                className="pl-10 bg-[#2C2C2E] border-[#3A3A3C] text-white"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#FF4500] hover:bg-[#FF6B00]"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      }>
        <JoinForm />
      </Suspense>
    </div>
  );
}
