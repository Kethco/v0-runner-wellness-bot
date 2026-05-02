"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Mail, Lock, User, Phone, ArrowRight, Check, Users, PersonStanding } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

const FEATURES = [
  "Track sleep, energy, soreness & readiness daily",
  "AI-powered training recommendations",
  "7-day trends and injury prevention alerts",
  "Connect with your coach for team insights",
  "SMS check-ins via +1 844 503 0386",
];

type UserType = "athlete" | "coach";
type PlanType = "free_trial" | "pro_monthly" | "pro_annual" | "coach_starter" | "coach_pro" | "coach_elite";

const PLANS = {
  athlete: [
    { 
      id: "free_trial" as PlanType, 
      name: "Free Trial", 
      price: "$0", 
      period: "for 7 days",
      features: ["Daily check-ins", "7-day trends", "1 active goal", "SMS support"],
      popular: false,
      badge: "7-DAY TRIAL"
    },
    { 
      id: "pro_monthly" as PlanType, 
      name: "Pro Monthly", 
      price: "$9.99", 
      period: "/month",
      features: ["Everything in Free", "AI coaching tips", "Unlimited goals", "30-day analytics", "Race predictions"],
      popular: true,
      badge: null
    },
    { 
      id: "pro_annual" as PlanType, 
      name: "Pro Annual", 
      price: "$99.99", 
      period: "/year",
      features: ["Everything in Pro Monthly", "Save $20/year (2 months free)", "Priority support", "Early access to features"],
      popular: false,
      badge: "BEST VALUE"
    },
  ],
  coach: [
    { 
      id: "coach_starter" as PlanType, 
      name: "Coach Starter", 
      price: "$29.99", 
      period: "/month",
      features: ["Up to 15 athletes", "Team dashboard", "At-risk alerts", "SMS invitations"],
      popular: false,
      badge: null
    },
    { 
      id: "coach_pro" as PlanType, 
      name: "Coach Pro", 
      price: "$49.99", 
      period: "/month",
      features: ["Up to 30 athletes", "Everything in Starter", "AI recommendations", "Weekly reports"],
      popular: true,
      badge: "MOST POPULAR"
    },
    { 
      id: "coach_elite" as PlanType, 
      name: "Coach Elite", 
      price: "$79.99", 
      period: "/month",
      features: ["Up to 50 athletes", "Everything in Pro", "Multiple teams", "Dedicated support"],
      popular: false,
      badge: "LARGE TEAMS"
    },
  ],
};

export default function SignUpPage() {
  const [step, setStep] = useState<"type" | "plan" | "form" | "verify" | "success">("type");
  const [userType, setUserType] = useState<UserType>("athlete");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("free_trial");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required for SMS check-ins";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      const supabase = createClient();
      
      // Extract first and last name
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: formData.phone,
            user_type: userType,
            plan: selectedPlan,
          },
        },
      });
      
      if (error) {
        setErrors({ email: error.message });
        setIsLoading(false);
      } else {
        // For paid plans, redirect to checkout page
        if (selectedPlan !== "free_trial") {
          // Store plan in localStorage for checkout page
          localStorage.setItem("pending_plan", selectedPlan);
          localStorage.setItem("pending_email", formData.email);
          window.location.href = `/checkout?plan=${selectedPlan}`;
        } else {
          setStep("verify");
        }
        setIsLoading(false);
      }
    }
  };

  const handleVerify = () => {
    setStep("success");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight">RUNNER</span>
              <span className="text-xl font-bold tracking-tight text-primary">WELLNESS</span>
            </div>
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-4">
            Train smarter.<br />
            Recover better.<br />
            <span className="text-primary">Run faster.</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            Join thousands of runners using daily wellness tracking to optimize their training and prevent injuries.
          </p>

          <div className="space-y-4">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Start your 7-day free trial. No credit card required.
        </p>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold tracking-tight">RUNNER</span>
              <span className="text-lg font-bold tracking-tight text-primary">WELLNESS</span>
            </div>
          </div>

          {/* Step 1: Choose user type */}
          {step === "type" && (
            <Card className="border-border bg-card">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">How will you use Runner Wellness?</CardTitle>
                <CardDescription>
                  Choose your account type to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  onClick={() => { setUserType("athlete"); setStep("plan"); }}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-left hover:border-primary ${
                    userType === "athlete" ? "border-primary bg-primary/10" : "border-border bg-secondary"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <PersonStanding className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">Solo Runner</h3>
                      <p className="text-sm text-muted-foreground">
                        Track your own wellness, get AI coaching tips, and improve your training
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { setUserType("coach"); setSelectedPlan("coach_pro"); setStep("plan"); }}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-left hover:border-primary ${
                    userType === "coach" ? "border-primary bg-primary/10" : "border-border bg-secondary"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">Coach</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your team, monitor athlete wellness, and get alerts for at-risk runners
                      </p>
                    </div>
                  </div>
                </button>

                <p className="text-center text-sm text-muted-foreground pt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Choose plan */}
          {step === "plan" && (
            <Card className="border-border bg-card">
              <CardHeader className="space-y-1">
                <button 
                  onClick={() => setStep("type")}
                  className="text-sm text-muted-foreground hover:text-foreground mb-2 text-left"
                >
                  &larr; Back
                </button>
                <CardTitle className="text-2xl font-bold">
                  {userType === "coach" ? "Coach Plan" : "Choose your plan"}
                </CardTitle>
                <CardDescription>
                  {userType === "coach" 
                    ? "Everything you need to manage your team" 
                    : "Start free or unlock more features with Pro"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PLANS[userType].map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-5 rounded-lg border-2 transition-all text-left relative ${
                      selectedPlan === plan.id ? "border-primary bg-primary/10" : "border-border bg-secondary"
                    }`}
                  >
                    {(plan.popular || plan.badge) && (
                      <span className={`absolute -top-3 left-4 text-xs font-bold px-2 py-1 rounded ${
                        plan.badge === "BEST VALUE" ? "bg-green-600 text-white" : 
                        plan.badge === "7-DAY TRIAL" ? "bg-blue-600 text-white" : 
                        "bg-primary text-primary-foreground"
                      }`}>
                        {plan.badge || "POPULAR"}
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <div className="text-right">
                        <span className="text-2xl font-black">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}

                <Button 
                  onClick={() => setStep("form")} 
                  className="w-full gap-2 mt-4"
                >
                  {selectedPlan === "free_trial" ? "Start 7-Day Free Trial" : `Continue with ${PLANS[userType].find(p => p.id === selectedPlan)?.name}`}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Account details */}
          {step === "form" && (
            <Card className="border-border bg-card">
              <CardHeader className="space-y-1">
                <button 
                  onClick={() => setStep("plan")}
                  className="text-sm text-muted-foreground hover:text-foreground mb-2 text-left"
                >
                  &larr; Back
                </button>
                <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                <CardDescription>
                  {selectedPlan === "free_trial" 
                    ? "Start your 7-day free trial - no credit card required" 
                    : `Enter your details for your ${selectedPlan.includes("pro") ? "Pro" : "Coach"} account`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Jordan Runner"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="jordan@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (for SMS check-ins)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>

                <div className="mt-6">
                  <Separator className="my-4" />
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="underline">Privacy Policy</Link>
                </p>
              </CardContent>
            </Card>
          )}

          {step === "verify" && (
            <Card className="border-border bg-card">
              <CardHeader className="space-y-1 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                <CardDescription>
                  We sent a verification link to<br />
                  <span className="text-foreground font-medium">{formData.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleVerify} className="w-full">
                  I&apos;ve verified my email
                </Button>
                <Button variant="outline" className="w-full">
                  Resend verification email
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Did not receive the email? Check your spam folder or{" "}
                  <button 
                    onClick={() => setStep("form")} 
                    className="text-primary hover:underline"
                  >
                    try a different email
                  </button>
                </p>
              </CardContent>
            </Card>
          )}

          {step === "success" && (
            <Card className="border-border bg-card">
              <CardHeader className="space-y-1 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl font-bold">You&apos;re all set!</CardTitle>
                <CardDescription>
                  Welcome to Runner Wellness, {formData.name.split(" ")[0]}!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your 7-day free trial has started</p>
                  <p className="text-2xl font-bold text-foreground">7 days remaining</p>
                </div>
                <Link href="/">
                  <Button className="w-full gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  Pro tip: Text &quot;checkin&quot; to +1 844 503 0386 to start your first check-in!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
