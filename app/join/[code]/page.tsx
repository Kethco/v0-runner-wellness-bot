"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, User, Phone, ArrowRight, Check, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

type InviteData = {
  id: string;
  athleteName: string;
  coachName: string;
  coachId: string;
};

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const code = params.code as string;

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<"loading" | "signup" | "verify" | "accepting" | "success" | "error">("loading");
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invite details
  useEffect(() => {
    async function fetchInvite() {
      const response = await fetch(`/api/invite/${code}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setStep("error");
      } else {
        setInvite(data.invite);
        setStep("signup");
      }
      setIsLoading(false);
    }
    
    if (code) {
      fetchInvite();
    }
  }, [code]);

  // If user is already logged in, accept the invite automatically
  useEffect(() => {
    async function acceptInvite() {
      if (user && invite && step === "signup") {
        setStep("accepting");
        const response = await fetch(`/api/invite/${code}`, {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setStep("error");
        } else {
          setStep("success");
          setTimeout(() => router.push("/"), 2000);
        }
      }
    }
    
    if (!authLoading && user && invite) {
      acceptInvite();
    }
  }, [authLoading, user, invite, code, step, router]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone is required for SMS check-ins";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !invite) return;
    
    setIsSubmitting(true);
    const supabase = createClient();
    
    // Parse athlete name from invite
    const nameParts = invite.athleteName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");
    
    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback?invite=${code}`,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: formData.phone,
          user_type: "athlete",
          role: "athlete",
          plan: "coach_athlete", // Athletes invited by coach - coach pays, no trial expiration
          coach_id: invite.coachId,
          invite_code: code,
        },
      },
    });
    
    if (signUpError) {
      setFormErrors({ email: signUpError.message });
      setIsSubmitting(false);
    } else {
      setStep("verify");
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading || step === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1C1C1E] border-[#3A3A3C]">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FF3B30]/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#FF3B30]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Invalid Invite</h2>
            <p className="text-[#8E8E93] mb-6">{error || "This invite link is invalid or has expired."}</p>
            <Link href="/login">
              <Button className="bg-[#FF4500] hover:bg-[#FF6B00]">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Accepting state (for logged-in users)
  if (step === "accepting") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1C1C1E] border-[#3A3A3C]">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Joining Team...</h2>
            <p className="text-[#8E8E93]">Connecting you with {invite?.coachName}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="w-full max-w-md bg-[#1C1C1E] border-[#3A3A3C]">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#30D158]/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#30D158]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">You&apos;re In!</h2>
              <p className="text-[#8E8E93] mb-2">
                You&apos;ve joined {invite?.coachName}&apos;s team.
              </p>
              <p className="text-sm text-[#8E8E93]">Redirecting to dashboard...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Verify email state
  if (step === "verify") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1C1C1E] border-[#3A3A3C]">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#0A84FF]/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#0A84FF]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-[#8E8E93] mb-4">
              We sent a confirmation link to <span className="text-white">{formData.email}</span>
            </p>
            <p className="text-sm text-[#8E8E93]">
              Click the link in your email to complete signup and join {invite?.coachName}&apos;s team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#FF4500] rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight text-white">RUNNER</span>
            <span className="text-xl font-bold tracking-tight text-[#FF4500]">WELLNESS</span>
          </div>
        </div>

        {/* Invite Header */}
        <Card className="bg-gradient-to-r from-[#FF4500]/20 to-[#FF6B00]/20 border-[#FF4500]/30 mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF4500]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#FF4500]" />
              </div>
              <div>
                <p className="text-sm text-[#FF9500]">You&apos;ve been invited!</p>
                <h2 className="text-lg font-bold text-white">{invite?.coachName}</h2>
                <p className="text-sm text-[#8E8E93]">wants you to join their team</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signup Form */}
        <Card className="bg-[#1C1C1E] border-[#3A3A3C]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-white">Create Your Account</CardTitle>
            <CardDescription className="text-[#8E8E93]">
              Sign up as <span className="text-white font-medium">{invite?.athleteName}</span> to start tracking your wellness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#8E8E93]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-[#2C2C2E] border-[#3A3A3C] text-white"
                  />
                </div>
                {formErrors.email && <p className="text-xs text-[#FF3B30]">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#8E8E93]">Phone (for SMS check-ins)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 bg-[#2C2C2E] border-[#3A3A3C] text-white"
                  />
                </div>
                {formErrors.phone && <p className="text-xs text-[#FF3B30]">{formErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#8E8E93]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 bg-[#2C2C2E] border-[#3A3A3C] text-white"
                  />
                </div>
                {formErrors.password && <p className="text-xs text-[#FF3B30]">{formErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#8E8E93]">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 bg-[#2C2C2E] border-[#3A3A3C] text-white"
                  />
                </div>
                {formErrors.confirmPassword && <p className="text-xs text-[#FF3B30]">{formErrors.confirmPassword}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#FF4500] hover:bg-[#FF6B00] text-white gap-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Join Team"}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <p className="text-xs text-[#8E8E93] text-center mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#FF4500] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-[#8E8E93]">What you&apos;ll get:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Daily wellness tracking",
              "AI coaching tips",
              "Streak motivation",
              "Coach insights",
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#8E8E93]">
                <Check className="w-4 h-4 text-[#30D158]" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
