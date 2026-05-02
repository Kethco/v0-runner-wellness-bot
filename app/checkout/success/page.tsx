"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCheckoutSessionStatus } from "@/app/actions/stripe";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    getCheckoutSessionStatus(sessionId)
      .then((result) => {
        if (result.status === "complete") {
          setStatus("success");
          setCustomerEmail(result.customerEmail || null);
          // Clear pending plan from localStorage
          localStorage.removeItem("pending_plan");
          localStorage.removeItem("pending_email");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, [sessionId]);

  if (status === "loading") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We couldn&apos;t confirm your payment. Please try again or contact support.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/pricing">Try Again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/help">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to Pro!</CardTitle>
        <CardDescription>
          Your subscription is now active
          {customerEmail && (
            <>
              <br />
              <span className="text-foreground">{customerEmail}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-secondary rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">What&apos;s next?</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Complete your daily wellness check-in</li>
            <li>• Set up your training goals</li>
            <li>• Get personalized AI coaching tips</li>
          </ul>
        </div>
        <Button className="w-full" asChild>
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense
        fallback={
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
