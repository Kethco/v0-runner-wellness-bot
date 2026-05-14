"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, Trash2, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[60px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
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
                At Runner Wellness, we take your privacy seriously. This policy explains how we collect, 
                use, and protect your personal information when you use our wellness tracking service.
              </p>
            </CardContent>
          </Card>

          {/* Data We Collect */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Wellness Data</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Daily check-in responses (sleep, energy, soreness, readiness)</li>
                  <li>Running activity data (distance, pace, duration)</li>
                  <li>Goal and race information</li>
                  <li>Notes and comments you provide</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Account Information</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Name and email address</li>
                  <li>Phone number (for SMS check-ins)</li>
                  <li>Age and gender (optional, for personalized insights)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Data */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide personalized wellness insights and trends</li>
                <li>Generate AI coaching recommendations</li>
                <li>Detect injury risk patterns and send alerts</li>
                <li>Share data with your coach (if you opt into Coach Mode)</li>
                <li>Improve our service through aggregated, anonymized analytics</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>We use secure cloud infrastructure with SOC 2 compliance</li>
                <li>Access to personal data is restricted to authorized personnel only</li>
                <li>Regular security audits and penetration testing</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights (GDPR) */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Your Rights (GDPR Article 17)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Right to Access:</strong> Request a copy of all your personal data</li>
                <li><strong className="text-foreground">Right to Rectification:</strong> Correct any inaccurate data</li>
                <li><strong className="text-foreground">Right to Erasure:</strong> Delete your account and all associated data</li>
                <li><strong className="text-foreground">Right to Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong className="text-foreground">Right to Object:</strong> Opt out of certain data processing activities</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise any of these rights, visit your Profile settings or contact us at privacy@runnerwellness.app
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-foreground mt-2">
                <a href="mailto:privacy@runnerwellness.app" className="text-primary hover:underline">
                  privacy@runnerwellness.app
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
