'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Share2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface FloatingShareButtonProps {
    url: string;
    title: string;
}

export function FloatingShareButton({ url, title }: FloatingShareButtonProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const whatsappLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 right-6 z-50 md:hidden"
                >
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
                            >
                                <Button
                                    size="icon"
                                    className="rounded-full bg-[#25D366] hover:bg-[#25D366]/90 shadow-lg w-12 h-12"
                                    onClick={() => window.open(whatsappLink, '_blank')}
                                >
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        size="icon"
                        className={`rounded-full shadow-xl w-14 h-14 ${isOpen ? 'bg-stone-800' : 'bg-emerald-600'}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? (
                            <X className="w-6 h-6 text-white" />
                        ) : (
                            <Share2 className="w-6 h-6 text-white" />
                        )}
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
