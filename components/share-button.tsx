"use client";

import { useCallback, useRef } from "react";
import { Share2, Download, Twitter, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface ShareCardProps {
  type: "pr" | "achievement" | "weekly";
  title: string;
  subtitle?: string;
  stat?: string;
  statLabel?: string;
  date?: string;
}

export function ShareButton({ 
  type, 
  title, 
  subtitle, 
  stat, 
  statLabel,
  date 
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const generateShareText = useCallback(() => {
    const appName = "Runner Wellness Bot";
    
    if (type === "pr") {
      return `New Personal Record! ${title} - ${stat}\n\nTracked with ${appName}`;
    } else if (type === "achievement") {
      return `Achievement Unlocked: ${title}!\n${subtitle || ""}\n\nTracked with ${appName}`;
    } else {
      return `Weekly Stats: ${stat} ${statLabel}\n\nTracked with ${appName}`;
    }
  }, [type, title, subtitle, stat, statLabel]);

  const shareToTwitter = useCallback(() => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }, [generateShareText]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  }, [generateShareText]);

  const shareNative = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: generateShareText(),
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  }, [title, generateShareText, copyToClipboard]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-[#2A2A2A] border-[#3A3A3A] hover:bg-[#3A3A3A] hover:border-[#4A4A4A]"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#2A2A2A]">
        <DropdownMenuItem 
          onClick={shareNative}
          className="cursor-pointer focus:bg-[#2A2A2A]"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={shareToTwitter}
          className="cursor-pointer focus:bg-[#2A2A2A]"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Post to X
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={copyToClipboard}
          className="cursor-pointer focus:bg-[#2A2A2A]"
        >
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Copy Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
