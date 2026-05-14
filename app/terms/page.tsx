"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CreditCard, Shield, Ban, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[70px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: May 1, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Runner Wellness. By using our service, you agree to these terms. 
                Please read them carefully before creating an account or using the app.
              </p>
            </CardContent>
          </Card>

          {/* Medical Disclaimer */}
          <Card className="border-destructive/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Important Medical Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Runner Wellness is NOT a medical device or service.</strong> 
                The information provided by our app, including AI coaching recommendations, wellness trends, 
                and injury alerts, is for informational purposes only and should not be considered medical advice.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Always consult a qualified healthcare provider before making training decisions</li>
                <li>Do not ignore professional medical advice because of something you read in this app</li>
                <li>If you experience pain, injury, or health concerns, seek medical attention immediately</li>
                <li>Our AI recommendations are based on general wellness patterns, not your specific medical history</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Runner Wellness provides:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Daily wellness check-in tracking via web and SMS</li>
                <li>Visualization of wellness trends over time</li>
                <li>AI-powered training recommendations and insights</li>
                <li>Coach-athlete data sharing features</li>
                <li>Race goal tracking and predictions</li>
              </ul>
            </CardContent>
          </Card>

          {/* Subscription & Billing */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Free Trial</h4>
                <p className="text-muted-foreground">
                  New users receive a 7-day free trial with access to basic features. 
                  No credit card required to start your trial.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Paid Plans</h4>
                <p className="text-muted-foreground">
                  Subscriptions are billed monthly. You can cancel at any time from your Profile settings. 
                  Cancellation takes effect at the end of your current billing period.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Refunds</h4>
                <p className="text-muted-foreground">
                  We offer a 30-day money-back guarantee for first-time subscribers. 
                  Contact support@runnerwellness.app for refund requests.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Uses */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Prohibited Uses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Share your account credentials with others</li>
                <li>Scrape or harvest data from our service</li>
                <li>Reverse engineer or copy our software</li>
                <li>Use bots or automated systems to interact with the service</li>
              </ul>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, Runner Wellness shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages, including but not 
                limited to loss of profits, data, or other intangible losses resulting from your use 
                of the service.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our total liability for any claims arising from your use of the service shall not 
                exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Questions about these terms? Contact us at{" "}
                <a href="mailto:legal@runnerwellness.app" className="text-primary hover:underline">
                  legal@runnerwellness.app
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
