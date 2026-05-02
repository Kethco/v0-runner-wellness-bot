"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

const SMS_COMMANDS = [
  { command: "checkin", description: "Morning wellness check-in" },
  { command: "update", description: "Afternoon energy/soreness update" },
  { command: "trends", description: "View your 7-day averages" },
  { command: "streak", description: "See your streak progress" },
  { command: "goal", description: "Check your active goals" },
  { command: "help", description: "List all commands" },
];

const PHONE_NUMBER = "+1 844 503 0386";

export function SMSGuideCard() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyNumber = async () => {
    await navigator.clipboard.writeText(PHONE_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wide">SMS Check-ins</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 bg-secondary px-3 py-2 rounded text-sm font-mono">
            {PHONE_NUMBER}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={copyNumber}
            className="gap-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {!expanded && (
          <p className="text-sm text-muted-foreground">
            Text <span className="font-mono bg-secondary px-1 rounded">checkin</span> to log your daily wellness
          </p>
        )}

        {expanded && (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Available Commands
            </p>
            {SMS_COMMANDS.map((cmd) => (
              <div key={cmd.command} className="flex items-center justify-between text-sm">
                <code className="font-mono bg-secondary px-2 py-1 rounded">{cmd.command}</code>
                <span className="text-muted-foreground">{cmd.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
