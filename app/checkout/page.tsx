"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkout } from "@/components/checkout/checkout";
import { getProduct } from "@/lib/products";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const [fromSignup, setFromSignup] = useState(false);

  useEffect(() => {
    // Check if coming from signup flow
    const pendingPlan = localStorage.getItem("pending_plan");
    if (pendingPlan) {
      setFromSignup(true);
    }
  }, []);

  if (!planId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">No plan selected</h2>
        <p className="text-muted-foreground mb-6">
          Please select a plan from our pricing page.
        </p>
        <Button asChild>
          <Link href="/pricing">View Pricing</Link>
        </Button>
      </div>
    );
  }

  const product = getProduct(planId);

  if (!product || product.priceInCents === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Invalid plan</h2>
        <p className="text-muted-foreground mb-6">
          The selected plan is not available for checkout.
        </p>
        <Button asChild>
          <Link href="/pricing">View Pricing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {fromSignup && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-primary font-medium">
            Account created! Complete your subscription below to activate your {product.name} plan.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="order-2 md:order-1">
          <h2 className="text-lg font-bold mb-4">Order Summary</h2>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">
                  ${(product.priceInCents / 100).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{product.interval}
                </span>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 space-y-2">
              {product.features.slice(0, 4).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>Secure payment via Stripe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="order-1 md:order-2">
          <h2 className="text-lg font-bold mb-4">Payment Details</h2>
          <Checkout productId={planId} />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href="/pricing">
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Link>
        </Button>

        <Suspense fallback={
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        }>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
