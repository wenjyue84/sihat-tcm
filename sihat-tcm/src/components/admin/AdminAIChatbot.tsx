'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function AdminAIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            const assistantMessageId = (Date.now() + 1).toString();

            // Add placeholder for assistant message
            setMessages(prev => [...prev, {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
            }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    // Parse the streaming data (handles different formats)
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        // Handle text stream format
                        if (line.startsWith('0:')) {
                            try {
                                const text = JSON.parse(line.slice(2));
                                assistantContent += text;
                            } catch {
                                // If not JSON, just append raw
                                assistantContent += line.slice(2);
                            }
                        } else if (!line.startsWith('d:') && !line.startsWith('e:')) {
                            // Plain text chunk
                            assistantContent += line;
                        }
                    }

                    // Update the assistant message
                    setMessages(prev => prev.map(m =>
                        m.id === assistantMessageId
                            ? { ...m, content: assistantContent }
                            : m
                    ));
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="pointer-events-auto bg-white w-[400px] h-[600px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="h-14 bg-slate-900 flex items-center justify-between px-4 shrink-0">
                            <div className="flex items-center gap-2 text-white">
                                <div className="p-1.5 bg-indigo-500 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Admin Assistant</h3>
                                    <p className="text-[10px] text-slate-300">Powered by Gemini 3.0</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center space-y-3 px-8 opacity-70">
                                    <Bot className="w-12 h-12 stroke-1" />
                                    <p className="text-sm">Hi! I can help you manage users, troubleshoot settings, or explain system prompts. Ask me anything!</p>
                                </div>
                            )}

                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex w-full",
                                        m.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap",
                                            m.role === 'user'
                                                ? "bg-slate-900 text-white rounded-tr-none"
                                                : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                                        )}
                                    >
                                        {m.content || (m.role === 'assistant' && isLoading ? '...' : '')}
                                    </div>
                                </div>
                            ))}
                            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                                <div className="flex justify-start w-full">
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask about admin features..."
                                    className="pr-10 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 rounded-full pl-4"
                                    disabled={isLoading}
                                />
                                <Button
                                    disabled={isLoading || !inputValue.trim()}
                                    size="icon"
                                    type="submit"
                                    className="absolute right-1 h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5 text-white ml-0.5" />
                                </Button>
                            </form>
                            <div className="text-[10px] text-center text-slate-400 mt-2">
                                AI can provide inaccurate info. Verify important settings.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button (Floating Bubble) */}
            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pointer-events-auto h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/20 flex items-center justify-center border-2 border-white/10 hover:bg-slate-800 transition-colors relative z-50 group"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sparkles"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="relative"
                        >
                            <Sparkles className="w-6 h-6" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tooltip on hover when closed */}
                {!isOpen && (
                    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                        Ask AI Admin
                        <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                    </div>
                )}
            </motion.button>
        </div>
    );
}
