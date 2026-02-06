/**
 * MessageBubble Component
 * Individual message with read receipts and animations
 */

"use client";

import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "doctor";
  content: string;
  timestamp: string;
  read?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isDoctor: boolean;
}

export function MessageBubble({ message, isDoctor }: MessageBubbleProps) {
  const isFromDoctor = message.role === "doctor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", duration: 0.3 }}
      className={`flex ${isFromDoctor ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isFromDoctor
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div
          className={`flex items-center justify-end gap-1 mt-1 ${
            isFromDoctor ? "text-blue-100" : "text-gray-400"
          }`}
        >
          <span className="text-[10px]">{format(new Date(message.timestamp), "h:mm a")}</span>
          {isFromDoctor && (
            <span className="ml-0.5">
              {message.read ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
              ) : (
                <Check className="w-3.5 h-3.5 text-blue-200/60" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * TypingIndicator Component
 * Shows when the other party is typing
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex justify-start"
    >
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * DateDivider Component
 * Shows date between message groups
 */
export function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
        {format(new Date(date), "MMMM d, yyyy")}
      </span>
    </div>
  );
}
