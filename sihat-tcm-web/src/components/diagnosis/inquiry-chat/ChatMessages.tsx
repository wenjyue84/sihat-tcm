import { useRef, useEffect } from "react";
import { ThinkingAnimation } from "../ThinkingAnimation";
import { BasicInfoData } from "../BasicInfoForm";
import { Message } from "./useInquiryChat";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isMaximized: boolean;
  basicInfo?: BasicInfoData;
  initialPrompts: string[];
  onOptionSelect: (option: string) => void;
}

// Helper to extract options from message content
const extractOptions = (content: string) => {
  const match = content.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/);
  if (match) {
    const optionsStr = match[1];
    const cleanContent = content.replace(/<OPTIONS>[\s\S]*?<\/OPTIONS>/, "").trim();
    const options = optionsStr
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o);
    return { cleanContent: cleanContent, options };
  }
  return { cleanContent: content, options: [] as string[] };
};

export function ChatMessages({
  messages,
  isLoading,
  isMaximized,
  basicInfo,
  initialPrompts,
  onOptionSelect,
}: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isMaximized]);

  // Filter messages for display
  const displayMessages = messages.filter(
    (m) =>
      m.role !== "system" &&
      !initialPrompts.some((p) => m.content.includes(p)) &&
      !m.content.includes("uploaded the following files")
  );

  return (
    <div
      ref={scrollAreaRef}
      className={`flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-stone-100 ${isMaximized ? "mb-20 md:mb-0" : ""}`}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#6ee7b7 #f5f5f4",
      }}
    >
      <div className="space-y-4 p-2 pb-24 md:pb-2">
        {displayMessages
          .filter((m) => m.content || m.role === "user")
          .map((m) => {
            const { cleanContent } = extractOptions(m.content);
            return (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] p-3 rounded-lg whitespace-pre-wrap text-sm md:text-base ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-stone-100 text-stone-800 rounded-bl-none"
                  }`}
                >
                  {cleanContent}
                </div>
              </div>
            );
          })}

        {/* Suggested Options */}
        {!isLoading &&
          displayMessages.length > 0 &&
          displayMessages[displayMessages.length - 1].role === "assistant" &&
          (() => {
            const { options } = extractOptions(displayMessages[displayMessages.length - 1].content);
            if (options.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-2 justify-start pl-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOptionSelect(option)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm active:scale-95"
                  >
                    {option}
                  </button>
                ))}
              </div>
            );
          })()}

        {isLoading &&
          (displayMessages.length === 0 ||
            !displayMessages[displayMessages.length - 1]?.content) && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <ThinkingAnimation basicInfo={basicInfo} variant="compact" />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
