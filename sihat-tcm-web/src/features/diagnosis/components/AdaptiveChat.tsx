"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { BasicInfo } from "@/types/diagnosis";
import type { ChatMessage } from "@/types/api";

interface AdaptiveChatProps {
  onComplete: (data: { chat: ChatMessage[] }) => void;
  basicInfo: BasicInfo | null;
  initialMessages?: ChatMessage[];
}

export function AdaptiveChat({ onComplete, basicInfo, initialMessages }: AdaptiveChatProps) {
  const [input, setInput] = useState("");
  const hasSentInitialMessage = useRef(false);

  // Construct the initial system message based on basic info
  const systemMessage = `You are a TCM assistant. The patient is a ${basicInfo?.age || "unknown"}-year-old ${basicInfo?.gender || "person"} named ${basicInfo?.name || "Patient"}. 
    They have reported the following symptoms: "${basicInfo?.symptoms || "Not specified"}".
    Your goal is to ask relevant follow-up questions to gather more details for a TCM diagnosis. 
    Focus on the "Ten Questions" (Shi Wen) of TCM. Ask one question at a time. Keep it brief and professional.`;

  // Memoize transport to avoid recreating on every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          basicInfo: basicInfo,
          model: "gemini-1.5-flash",
          language: "en",
        },
      }),
    [basicInfo]
  );

  const { messages, sendMessage, error } = useChat({
    transport,
    messages:
      initialMessages && initialMessages.length > 0
        ? (initialMessages as any)
        : [{ id: "1", role: "system", parts: [{ type: "text", text: systemMessage }] }],
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("useChat error:", errorMessage);
    },
  });

  // Helper function to extract text from message parts
  const getMessageText = (message: (typeof messages)[0]): string => {
    const textParts = message.parts?.filter(
      (part): part is { type: "text"; text: string } => part.type === "text"
    );
    return textParts?.map((part) => part.text).join("") || "";
  };

  // Trigger the first question from AI when the component mounts
  useEffect(() => {
    if (!hasSentInitialMessage.current && messages.length === 1 && messages[0].role === "system") {
      hasSentInitialMessage.current = true;
      sendMessage({ text: "Please start the diagnosis." });
    }
  }, [messages, sendMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await sendMessage({ text: input });
    } catch (e) {
      console.error("SendMessage error:", e);
    }
    setInput("");
  };

  return (
    <Card className="p-6 space-y-4 h-[500px] flex flex-col">
      <h2 className="text-xl font-semibold">Wen (Inquiry)</h2>
      <ScrollArea className="flex-1 p-4 border rounded-lg">
        {messages
          .filter((m) => {
            const text = getMessageText(m);
            return m.role !== "system" && text !== "Please start the diagnosis.";
          })
          .map((m) => {
            const text = getMessageText(m);
            return (
              <div key={m.id} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
                <span
                  className={`inline-block p-2 rounded-lg ${m.role === "user" ? "bg-emerald-100" : "bg-gray-100"}`}
                >
                  {text}
                </span>
              </div>
            );
          })}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
        />
        <Button type="submit">Send</Button>
      </form>
      <Button
        variant="outline"
        onClick={() => {
          const chatMessages: ChatMessage[] = messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: getMessageText(m),
          }));
          onComplete({ chat: chatMessages });
        }}
      >
        Finish Chat
      </Button>
    </Card>
  );
}
