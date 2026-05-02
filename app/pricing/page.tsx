"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/dashboard/navbar";
import { PRODUCTS, type Product } from "@/lib/products";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const trialProduct = PRODUCTS.find((p) => p.id === "free_trial")!;
  const proProduct = isYearly 
    ? PRODUCTS.find((p) => p.id === "pro_annual")!
    : PRODUCTS.find((p) => p.id === "pro_monthly")!;
  const coachProduct = PRODUCTS.find((p) => p.id === "coach")!;

  const formatPrice = (product: Product) => {
    if (product.priceInCents === 0) return "Free";
    const price = product.priceInCents / 100;
    if (product.interval === "year") {
      return `$${price.toFixed(2)}/year`;
    }
    return `$${price.toFixed(2)}/mo`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your training goals. Upgrade or downgrade anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Label htmlFor="billing-toggle" className={!isYearly ? "text-foreground" : "text-muted-foreground"}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? "text-foreground" : "text-muted-foreground"}>
              Yearly
              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Trial */}
          <Card className="border-border bg-card relative">
            <div className="absolute -top-3 left-4">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                7-DAY TRIAL
              </span>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl">{trialProduct.name}</CardTitle>
              <CardDescription>{trialProduct.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-black">Free</span>
                <span className="text-sm text-muted-foreground ml-2">for 7 days</span>
              </div>
              <ul className="space-y-3">
                {trialProduct.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary bg-card relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> Most Popular
              </span>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl">{proProduct.name}</CardTitle>
              <CardDescription>{proProduct.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-black">{formatPrice(proProduct)}</span>
                {isYearly && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (~$8.33/mo)
                  </span>
                )}
              </div>
              <ul className="space-y-3">
                {proProduct.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full gap-2" asChild>
                <Link href={`/checkout?plan=${proProduct.id}`}>
                  Subscribe Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Coach Plan */}
          <Card className="border-border bg-card relative">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">{coachProduct.name}</CardTitle>
              </div>
              <CardDescription>{coachProduct.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-black">{formatPrice(coachProduct)}</span>
              </div>
              <ul className="space-y-3">
                {coachProduct.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/checkout?plan=${coachProduct.id}`}>
                  Subscribe Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ or Trust Section */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Start with a 7-day free trial. Upgrade anytime. Cancel anytime.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Questions? <Link href="/help" className="text-primary hover:underline">Contact support</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
