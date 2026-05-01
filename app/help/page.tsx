"use client";

import { useState } from "react";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  MessageCircle,
  Book,
  Phone,
  Mail,
  Search,
  CheckCircle,
  Smartphone,
  TrendingUp,
  Users,
  Target,
  Zap,
} from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    icon: Smartphone,
    questions: [
      {
        q: "How do I start my daily check-in?",
        a: "You can start a check-in by clicking the 'Start Check-in' button on your dashboard, or by sending 'checkin' to our WhatsApp bot. The check-in takes about 30 seconds and asks about your sleep, energy, soreness, and readiness.",
      },
      {
        q: "What time should I do my morning check-in?",
        a: "We recommend doing your check-in within the first hour of waking up, ideally before any training. This gives the most accurate baseline reading of how your body feels.",
      },
      {
        q: "What is the afternoon update?",
        a: "The afternoon update is a quick 2-question check (energy and soreness) that you can do later in the day. It helps track how your body responds to training and life stress throughout the day.",
      },
    ],
  },
  {
    category: "Trends & Analytics",
    icon: TrendingUp,
    questions: [
      {
        q: "How do I interpret my wellness score?",
        a: "Your wellness score (1-5) is based on your readiness rating. 5 means you feel great and ready to train hard. 3 is neutral. 1-2 suggests you should consider rest or easy training.",
      },
      {
        q: "What do the injury alerts mean?",
        a: "Injury alerts are triggered when we detect patterns that historically precede injuries: consecutive days of high soreness, declining sleep quality, or sustained low energy. They are warnings, not diagnoses.",
      },
      {
        q: "How accurate are the race predictions?",
        a: "Race predictions use your recent training data combined with industry-standard formulas. They are estimates to guide goal-setting, not guarantees. Many factors affect race day performance.",
      },
    ],
  },
  {
    category: "Coach Features",
    icon: Users,
    questions: [
      {
        q: "How do I connect with my coach?",
        a: "Your coach will send you an invite link or code. Enter it in Settings > Privacy > Link Coach. Once connected, your coach can see your check-ins and trends in their dashboard.",
      },
      {
        q: "Can I hide data from my coach?",
        a: "Yes! Switch to 'Solo Mode' in your profile settings. Your data remains private until you switch back to 'Coach Mode'. Your coach will see that you are in solo mode but cannot access your data.",
      },
      {
        q: "What data does my coach see?",
        a: "In Coach Mode, your coach can see: daily check-in scores, weekly trends, streak information, and injury alerts. They cannot see your private notes unless you explicitly share them.",
      },
    ],
  },
  {
    category: "Goals & Races",
    icon: Target,
    questions: [
      {
        q: "How do I set a race goal?",
        a: "Go to the Goals page and click 'Add Goal'. Enter your race name, date, distance, and target time. We will track your countdown and provide race-specific insights.",
      },
      {
        q: "Can I have multiple active goals?",
        a: "Yes! You can track multiple races. Your primary goal (next upcoming race) will be featured on your dashboard, while all goals are visible on the Goals page.",
      },
    ],
  },
  {
    category: "AI Coach",
    icon: Zap,
    questions: [
      {
        q: "How does the AI coach work?",
        a: "Our AI analyzes your check-in patterns, training load, and wellness trends to provide personalized recommendations. It considers factors like accumulated fatigue, sleep debt, and historical patterns.",
      },
      {
        q: "Should I always follow AI recommendations?",
        a: "The AI provides suggestions based on data patterns, but it does not know your full context. Use AI insights as one input among many, including how you feel and advice from your coach or healthcare provider.",
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          </div>
          <p className="text-muted-foreground">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border h-12"
          />
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Book className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Documentation</h3>
                <p className="text-xs text-muted-foreground">Full user guide</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">WhatsApp Commands</h3>
                <p className="text-xs text-muted-foreground">Bot reference</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Phone className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Live Support</h3>
                <p className="text-xs text-muted-foreground">Chat with us</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <div className="space-y-6 mb-12">
          <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
          
          {filteredFaqs.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
              </CardContent>
            </Card>
          ) : (
            filteredFaqs.map((category) => (
              <Card key={category.category} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <category.icon className="w-5 h-5 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, i) => (
                      <AccordionItem key={i} value={`${category.category}-${i}`}>
                        <AccordionTrigger className="text-left text-sm hover:no-underline">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Contact Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">
                  We typically respond within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    className="bg-secondary border-border resize-none"
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  Send Message
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
