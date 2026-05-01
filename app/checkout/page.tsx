"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkout } from "@/components/checkout/checkout";
import { getProduct, PRODUCTS } from "@/lib/products";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Subscribe to {product.name}
        </h1>
        <p className="text-muted-foreground">
          {product.description}
        </p>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-medium">{product.name}</span>
          <span className="text-lg font-bold">
            ${(product.priceInCents / 100).toFixed(2)}
            {product.interval && `/${product.interval}`}
          </span>
        </div>
      </div>

      <Checkout productId={planId} />
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
