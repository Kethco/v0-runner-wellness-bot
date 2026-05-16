"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MapPin, GraduationCap, Lightbulb, Users, Trophy } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[70px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Our Story</h1>
          </div>
          <p className="text-muted-foreground">
            The journey behind Runner Wellness
          </p>
        </div>

        <div className="space-y-6">
          {/* Founder Introduction */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <p className="text-xl text-foreground font-medium mb-2">
                Hi, I&apos;m Come
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Founder of Runner Wellness
              </p>
            </CardContent>
          </Card>

          {/* Origins */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Where It All Began
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                I was born in Burundi. As a little kid, I was inspired by Vénuste Niyongabo winning 
                Burundi&apos;s first-ever Olympic gold medal in the 5,000 meters at the 1996 Atlanta 
                Olympic Games. That moment changed my life. I started running and joined a local running club.
              </p>
            </CardContent>
          </Card>

          {/* Ethiopia Years */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Running as Therapy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                As a refugee, I left Burundi and spent six formative years in Ethiopia — the land of 
                running legends. During those difficult times, running became far more than a sport; 
                it became my therapy, my resilience, and my greatest source of strength.
              </p>
            </CardContent>
          </Card>

          {/* Athletic & Coaching Career */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                From Athlete to Coach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                That passion carried me forward. I competed in Cross Country and Track at Whitworth 
                University in Spokane, WA, and later served as an Assistant Coach for a high school 
                cross country program at Northwest Christian High School in Colbert, WA.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Those experiences gave me deep insight into the challenges runners and coaches face 
                every day — balancing training load, preventing injury, staying mentally strong, and 
                managing team wellness.
              </p>
            </CardContent>
          </Card>

          {/* Building Runner Wellness */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Building the Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Today, as a Data Scientist and AI Engineer, I combined my technical expertise with 
                everything I learned on my journey to build Runner Wellness — the complete running 
                wellness platform I wish I had as both an athlete and a coach.
              </p>
            </CardContent>
          </Card>

          {/* Platform Features */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                What We Offer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Runner Wellness brings together:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Intelligent AI coaching tailored to your wellness data</li>
                <li>Daily Readiness scoring to optimize training</li>
                <li>Recovery insights to prevent overtraining</li>
                <li>Mental wellness tools (Mind & Soul)</li>
                <li>Race predictions and goal tracking</li>
                <li>A powerful coach dashboard for team management</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                All designed to help runners train smarter, recover better, and stay consistent for 
                the long term.
              </p>
            </CardContent>
          </Card>

          {/* Mission */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Running has taken me across continents and through life&apos;s toughest challenges. 
                Now, I want Runner Wellness to help you on your own journey — physically, mentally, 
                and emotionally.
              </p>
              <p className="text-foreground font-medium mt-4">
                Welcome to the Runner Wellness community.
              </p>
              <p className="text-primary font-bold text-lg mt-2">
                Let&apos;s run stronger — together.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
