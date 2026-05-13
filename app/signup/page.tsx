"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Eye, EyeOff, Users, User, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type UserType = "athlete" | "coach";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "form" | "success">("select");
  const [userType, setUserType] = useState<UserType>("athlete");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    programName: "",
  });

  const handleSelectType = (type: UserType) => {
    setUserType(type);
    setStep("form");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Valid email is required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required for SMS check-ins");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (userType === "coach" && !formData.programName.trim()) {
      setError("Program or school name is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          user_type: userType,
          plan: userType === "coach" ? "coach_trial" : "free_trial",
          program_name: formData.programName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Auto-login after signup
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        setStep("success");
        setIsLoading(false);
        return;
      }

      // Redirect based on user type
      router.push(userType === "coach" ? "/coach" : "/");
      router.refresh();
      
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Runner Wellness</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-lg mx-auto">
          
          {/* Step 1: Select Type */}
          {step === "select" && (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Join Runner Wellness
                </h1>
                <p className="text-muted-foreground text-lg">
                  Start your free 7-day trial
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleSelectType("athlete")}
                  className="w-full group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-1">I&apos;m a Runner</h3>
                      <p className="text-muted-foreground">
                        Track wellness, log runs, get daily SMS check-ins
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectType("coach")}
                  className="w-full group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-1">I&apos;m a Coach</h3>
                      <p className="text-muted-foreground">
                        Monitor team wellness, manage athlete check-ins
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Form */}
          {step === "form" && (
            <div className="space-y-6">
              <div>
                <button 
                  onClick={() => { setStep("select"); setError(""); }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {userType === "coach" ? "Create Coach Account" : "Create Your Account"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {userType === "coach" 
                    ? "Set up your account to start managing your team" 
                    : "Start your free 7-day trial"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Jordan"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </div>

                {userType === "coach" && (
                  <div className="space-y-2">
                    <Label htmlFor="programName">Program / School Name</Label>
                    <Input
                      id="programName"
                      placeholder="Lincoln High School Track"
                      value={formData.programName}
                      onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                      className="h-12"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    For daily SMS wellness check-ins
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </form>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Account Created!</h1>
                <p className="text-muted-foreground">
                  {userType === "coach" 
                    ? "Your coach account is ready. Log in to set up your team."
                    : "Your account is ready. Log in to get started."}
                </p>
              </div>
              <Button onClick={() => router.push("/login")} className="w-full h-12">
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
