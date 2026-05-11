"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles, MessageCircle, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts || !Array.isArray(message.parts)) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface RunningBuddyProps {
  userName?: string;
  onClose?: () => void;
  isFullPage?: boolean;
}

export function RunningBuddy({ userName, onClose, isFullPage = false }: RunningBuddyProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/buddy" }),
    onError: (err) => {
      if (err.message?.includes("429") || err.message?.includes("limit")) {
        setRateLimitError("You've reached your message limit (20/hour). Take a breather and come back soon!");
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const hasError = status === "error" || rateLimitError;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const quickPrompts = [
    "How am I doing?",
    "I'm not feeling motivated",
    "What should I run today?",
    "Encourage me",
  ];

  return (
    <div className={`flex flex-col bg-[#0A0A0A] ${isFullPage ? "h-full" : "h-[70vh] max-h-[600px]"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#AF52DE] to-[#FF2D55] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">Running Buddy</h2>
            <p className="text-xs text-[#8E8E93]">Your personal running companion</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#8E8E93] hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#AF52DE]/20 to-[#FF2D55]/20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-[#AF52DE]" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">
              Hey{userName ? `, ${userName}` : ""}! I&apos;m your Running Buddy.
            </h3>
            <p className="text-[#8E8E93] text-sm mb-6 max-w-xs mx-auto">
              I know your training, your wellness, and your journey. Ask me anything or just chat.
            </p>
            
            {/* Quick prompts */}
            <div className="flex flex-wrap justify-center gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    sendMessage({ text: prompt });
                  }}
                  className="px-3 py-2 rounded-full bg-[#1C1C1E] border border-[#2A2A2A] text-sm text-white hover:border-[#AF52DE] hover:bg-[#AF52DE]/10 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message) => {
              const text = getMessageText(message);
              const isUser = message.role === "user";
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUser 
                      ? "bg-[#FF4500]" 
                      : "bg-gradient-to-br from-[#AF52DE] to-[#FF2D55]"
                  }`}>
                    {isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
                    <div className={`inline-block rounded-2xl px-4 py-3 ${
                      isUser 
                        ? "bg-[#FF4500] text-white rounded-tr-md" 
                        : "bg-[#1C1C1E] text-white rounded-tl-md border border-[#2A2A2A]"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        
        {/* Loading indicator */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#AF52DE] to-[#FF2D55] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#1C1C1E] rounded-2xl rounded-tl-md px-4 py-3 border border-[#2A2A2A]">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#AF52DE] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#AF52DE] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#AF52DE] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
        
        {/* Rate limit error */}
        {(rateLimitError || (error && status === "error")) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-2 p-3 rounded-xl bg-[#FF4500]/10 border border-[#FF4500]/30"
          >
            <p className="text-[#FF4500] text-sm text-center">
              {rateLimitError || "Something went wrong. Try again in a moment."}
            </p>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#2A2A2A]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message your Running Buddy..."
            disabled={isLoading}
            className="flex-1 bg-[#1C1C1E] border border-[#2A2A2A] rounded-full px-4 py-3 text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#AF52DE] transition-colors text-sm"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[#AF52DE] to-[#FF2D55] hover:opacity-90 disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </form>
    </div>
  );
}
