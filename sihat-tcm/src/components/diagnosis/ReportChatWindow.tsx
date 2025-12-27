"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Minimize2, Maximize2, Sparkles, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/stores/useAppStore";
import { useDoctorLevel } from "@/stores/useAppStore";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ReportChatWindowProps {
  reportData: any;
  patientInfo?: any;
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  onMessageSent?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  messages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
}

export function ReportChatWindow({
  reportData,
  patientInfo,
  isOpen,
  onClose,
  initialMessage,
  onMessageSent,
  isExpanded = false,
  onToggleExpand,
  messages: controlledMessages,
  onMessagesChange,
}: ReportChatWindowProps) {
  const { t: globalT, language } = useLanguage();
  const { getModel, getDoctorInfo } = useDoctorLevel();
  const doctorInfo = getDoctorInfo();

  // Use the global translations for report chat
  const t = globalT.reportChat;

  // ============================================================================
  // CONTROLLED/UNCONTROLLED STATE PATTERN FOR MESSAGES
  // ============================================================================

  const [internalMessages, setInternalMessages] = useState<Message[]>([]);

  // Determine which messages to use (controlled or internal)
  const messages = controlledMessages || internalMessages;

  // CRITICAL: Use a ref to always have the latest messages value
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Custom setMessages that handles both controlled and uncontrolled modes
  const setMessages = (action: React.SetStateAction<Message[]>) => {
    const currentMessages = messagesRef.current;
    const newMessages = typeof action === "function" ? action(currentMessages) : action;

    messagesRef.current = newMessages;

    if (onMessagesChange) {
      onMessagesChange(newMessages);
    } else {
      setInternalMessages(newMessages);
    }
  };
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSentInitialMessage = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized, isExpanded]);

  // Handle initial message
  useEffect(() => {
    if (isOpen && initialMessage && !hasSentInitialMessage.current && !isLoading) {
      hasSentInitialMessage.current = true;
      sendMessage(initialMessage);
      if (onMessageSent) {
        onMessageSent();
      }
    }
    if (!isOpen) {
      hasSentInitialMessage.current = false;
    }
  }, [isOpen, initialMessage, onMessageSent]);

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
        messages: [...messages, userMessage],
        reportData,
        patientInfo,
        language,
        model: doctorInfo?.model || "gemini-2.0-flash",
      };

      const response = await fetch("/api/report-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ReportChatWindow] Response not OK:", errorText);
        throw new Error(`Failed to get response: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
          )
        );
      }
    } catch (error: any) {
      console.error("[ReportChatWindow] Chat error:", error.message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  if (!isOpen) return null;

  if (isExpanded) {
    return (
      <div className="flex flex-col w-full h-full bg-white border-l border-stone-200 md:shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{t.title}</h3>
              <p className="text-emerald-100 text-xs">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleExpand}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Exit Full Screen"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-stone-50 to-white">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-stone-600 text-sm">{t.emptyState.text}</p>
              </div>

              {/* Suggestion Chips */}
              <div className="space-y-2">
                <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                  {t.emptyState.quickQuestions}
                </p>
                <div className="flex flex-wrap gap-2">
                  {t.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-2 bg-white border border-stone-200 rounded-full text-stone-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-sm"
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-emerald-100"
                      : "bg-gradient-to-br from-teal-500 to-emerald-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-sm"
                      : "bg-white border border-stone-200 text-stone-700 rounded-tl-sm shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))
          )}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-stone-500 text-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
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
        <form onSubmit={handleSubmit} className="p-4 border-t border-stone-100 bg-white shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-stone-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 p-0 flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          height: isMinimized ? "auto" : "500px",
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-4 right-4 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 flex flex-col"
        style={{ maxHeight: isMinimized ? "auto" : "80vh" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{t.title}</h3>
              <p className="text-emerald-100 text-xs">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleExpand ? onToggleExpand : () => setIsMinimized(!isMinimized)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {onToggleExpand ? (
                <Maximize2 className="w-4 h-4" />
              ) : isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-stone-50 to-white">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-stone-600 text-sm">{t.emptyState.text}</p>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="space-y-2">
                    <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                      {t.emptyState.quickQuestions}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {t.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-3 py-2 bg-white border border-stone-200 rounded-full text-stone-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-sm"
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === "user"
                          ? "bg-emerald-100"
                          : "bg-gradient-to-br from-teal-500 to-emerald-600"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-tr-sm"
                          : "bg-white border border-stone-200 text-stone-700 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-stone-500 text-sm">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
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
            <form onSubmit={handleSubmit} className="p-4 border-t border-stone-100 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-stone-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 p-0 flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Floating Chat Button Component
export function ReportChatButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-40 group"
    >
      <MessageCircle className="w-6 h-6 text-white" />
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-stone-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {t.reportChat.floatingButton}
      </span>
    </motion.button>
  );
}
