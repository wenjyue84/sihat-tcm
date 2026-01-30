/**
 * EmptyState Component
 * Beautiful empty states for inbox and chat area
 */

"use client";

import { MessageSquare, Inbox, Send } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
    type: "inbox" | "chat";
}

export function EmptyState({ type }: EmptyStateProps) {
    if (type === "inbox") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 px-4"
            >
                <div className="relative mb-6">
                    {/* Main Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
                        <Inbox className="w-10 h-10 text-blue-500" />
                    </div>
                    {/* Decorative dots */}
                    <motion.div
                        className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-400 rounded-full"
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No conversations yet
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                    When patients request verification, their messages will appear here.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
        >
            {/* Animated illustration */}
            <div className="relative mb-8">
                <motion.div
                    className="w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center"
                    animate={{ rotate: [0, 2, -2, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    <MessageSquare className="w-16 h-16 text-blue-400" strokeWidth={1.5} />
                </motion.div>

                {/* Floating send icon */}
                <motion.div
                    className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg"
                    animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <Send className="w-5 h-5 text-white" />
                </motion.div>

                {/* Decorative elements */}
                <motion.div
                    className="absolute top-8 -left-6 w-6 h-6 bg-purple-200 rounded-lg"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-2 right-8 w-4 h-4 bg-amber-300 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
            </div>

            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a conversation
            </h3>
            <p className="text-gray-500 max-w-sm">
                Choose a patient from the inbox to view their messages and respond to their verification request.
            </p>

            {/* Stats hint */}
            <div className="mt-8 flex gap-4">
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
                    <span className="text-amber-600 font-medium text-sm">💡 Tip</span>
                    <p className="text-xs text-amber-700 mt-1">
                        Reply to activate the conversation
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
