"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Mail, Lock, User, Phone, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  "Track sleep, energy, soreness & readiness daily",
  "AI-powered training recommendations",
  "7-day trends and injury prevention alerts",
  "Connect with your coach for team insights",
  "SMS check-ins via +1 844 503 0386",
];

export default function SignUpPage() {
  const [step, setStep] = useState<"form" | "verify" | "success">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep("verify");
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

          {step === "form" && (
            <Card className="border-border bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription>
                  Enter your details to start your free trial
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

                  <Button type="submit" className="w-full gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
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
