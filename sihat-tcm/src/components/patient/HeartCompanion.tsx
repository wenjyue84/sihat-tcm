"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Send, User, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/stores/useAppStore";
import { useDoctorLevel } from "@/stores/useAppStore";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface HeartCompanionProps {
  profile?: any;
}

export function HeartCompanion({ profile }: HeartCompanionProps) {
  const { t: globalT, language } = useLanguage();
  const { getModel, getDoctorInfo } = useDoctorLevel();
  const doctorInfo = getDoctorInfo();

  const t = globalT.heartCompanion || {
    title: "Heart Companion",
    subtitle: "Your friend for emotional wellness",
    placeholder: "Share what's on your mind...",
    thinking: "Thinking...",
    emptyState: {
      text: "Hi! I'm here to listen. How are you feeling today?",
      quickQuestions: "You might want to talk about:",
    },
    suggestions: [
      "I'm feeling stressed",
      "I need someone to talk to",
      "How can I manage my emotions?",
      "Tell me about TCM and emotions",
    ],
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSentInitialMessage = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Send initial greeting if no messages
  useEffect(() => {
    if (messages.length === 0 && !hasSentInitialMessage.current) {
      const greetings: Record<string, string> = {
        en: `Hi${profile?.full_name ? ` ${profile.full_name.split(" ")[0]}` : ""}! 👋 I'm your Heart Companion. I'm here to listen and support you. How are you feeling today?`,
        zh: `你好${profile?.full_name ? ` ${profile.full_name}` : ""}！👋 我是你的心伴。我在这里倾听和支持你。你今天感觉怎么样？`,
        ms: `Hai${profile?.full_name ? ` ${profile.full_name.split(" ")[0]}` : ""}! 👋 Saya teman hati anda. Saya di sini untuk mendengar dan menyokong anda. Bagaimana perasaan anda hari ini?`,
      };

      const greetingMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: greetings[language] || greetings.en,
      };

      setMessages([greetingMessage]);
      hasSentInitialMessage.current = true;
    }
  }, [language, profile]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const requestBody = {
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        language,
        model: doctorInfo?.model || "gemini-2.0-flash",
        profile: profile ? { name: profile.full_name, age: profile.age, gender: profile.gender } : undefined,
      };

      const response = await fetch("/api/heart-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[HeartCompanion] Response not OK:", errorText);
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
            )
          );
        }
      }
    } catch (error: any) {
      console.error("[HeartCompanion] Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. 💚",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-lg bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t.title}</h2>
            <p className="text-emerald-100 text-sm mt-1">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white via-emerald-50/20 to-white">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Heart className="w-10 h-10 text-emerald-700" />
              </div>
              <p className="text-slate-600 text-base">{t.emptyState.text}</p>
            </div>

            {/* Suggestion Chips */}
            <div className="space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium text-center">
                {t.emptyState.quickQuestions}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {t.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-sm px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-full text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-pink-400 to-rose-500"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Heart className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm shadow-lg"
                    : "bg-white border-2 border-pink-100 text-slate-700 rounded-tl-sm shadow-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))
        )}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border-2 border-pink-100 rounded-3xl rounded-tl-sm px-5 py-3.5 shadow-md">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="flex gap-1.5">
                  <span
                    className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span>{t.thinking}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-emerald-100 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            disabled={isLoading}
            className="flex-1 px-5 py-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:bg-white transition-all disabled:opacity-50 placeholder:text-emerald-600/50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 p-0 flex items-center justify-center disabled:opacity-50 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </Card>
  );
}

