"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, ArrowRight, Smartphone, Zap, Brain, Target, TrendingUp, Flame, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"email" | "sms">("email");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        setErrors({ email: error.message });
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    }
  };

  const handleSmsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setSmsSent(true);
    }
  };

  const benefits = [
    { icon: Brain, title: "AI-Powered Coaching", desc: "Get personalized advice based on your wellness data" },
    { icon: Target, title: "Smart Goal Tracking", desc: "Set and crush your weekly running goals" },
    { icon: TrendingUp, title: "Progress Insights", desc: "Visualize your improvement over time" },
    { icon: Flame, title: "Streak Motivation", desc: "Build habits with daily check-in streaks" },
    { icon: Zap, title: "Quick Check-ins", desc: "30-second daily wellness assessments" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left side - Benefits (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#FF4500] via-[#FF6B00] to-[#FF8C00] p-12 flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-16">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight text-white">RUNNER</span>
                <span className="text-xl font-bold tracking-tight text-white/80">WELLNESS</span>
              </div>
            </div>
            
            {/* Hero text */}
            <h1 className="text-4xl font-bold text-white mb-4">
              Run smarter.<br />Recover better.
            </h1>
            <p className="text-white/80 text-lg mb-12">
              Your personal running wellness companion that helps you train intelligently and prevent burnout.
            </p>
            
            {/* Benefits list */}
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{benefit.title}</h3>
                    <p className="text-white/70 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Testimonial */}
          <div className="mt-12 p-6 bg-white/10 backdrop-blur rounded-2xl">
            <p className="text-white/90 italic mb-4">
              &quot;This app helped me finally understand the connection between my sleep, energy, and running performance. Game changer!&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold">JM</span>
              </div>
              <div>
                <p className="text-white font-medium">Jordan M.</p>
                <p className="text-white/60 text-sm">Marathon Runner</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Logo (mobile only) */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight">RUNNER</span>
                <span className="text-xl font-bold tracking-tight text-primary">WELLNESS</span>
              </div>
            </div>
            
            {/* Benefits preview (mobile only) */}
            <div className="lg:hidden mb-8 p-4 bg-gradient-to-r from-[#FF4500]/10 to-[#FF6B00]/10 rounded-xl border border-[#FF4500]/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#FF4500]" />
                <span className="font-semibold text-foreground">Why runners love us</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-[#FF4500]" />
                  <span>AI Coaching</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#FF4500]" />
                  <span>Goal Tracking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF4500]" />
                  <span>Streak Motivation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#FF4500]" />
                  <span>Quick Check-ins</span>
                </div>
              </div>
            </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue tracking your wellness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "email" | "sms")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-2">
                  <Smartphone className="w-4 h-4" />
                  SMS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="sms">
                {!smsSent ? (
                  <form onSubmit={handleSmsLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

                    <Button type="submit" className="w-full gap-2">
                      Send Login Code
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      We&apos;ll send a one-time login code from +1 844 503 0386
                    </p>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Check your SMS</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We sent a login code to<br />
                      <span className="font-medium text-foreground">{formData.phone}</span>
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSmsSent(false)}
                      className="w-full"
                    >
                      Use a different number
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <Separator className="my-4" />
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
