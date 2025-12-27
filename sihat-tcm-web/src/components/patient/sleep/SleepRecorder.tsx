'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function SleepRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = saveRecording;

            mediaRecorderRef.current.start();
            setIsRecording(true);

            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

            toast.success('Recording started');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.error('Could not access microphone. Please ensure permissions are granted.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const saveRecording = async () => {
        setIsUploading(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `sleep-${Date.now()}.webm`, { type: 'audio/webm' });

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            // Upload to Storage
            const filename = `${user.id}/${Date.now()}.webm`;
            const { error: uploadError } = await supabase.storage
                .from('sleep-recordings')
                .upload(filename, file);

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw new Error('Failed to upload audio file. Storage bucket might be missing.');
            }

            // Create DB Record
            const { error: dbError } = await supabase
                .from('sleep_logs')
                .insert({
                    patient_id: user.id,
                    sleep_start: new Date(Date.now() - duration * 1000).toISOString(),
                    sleep_end: new Date().toISOString(),
                    duration_minutes: Math.ceil(duration / 60),
                    audio_url: filename,
                    quality_score: Math.floor(Math.random() * (100 - 70) + 70), // Mock score
                    analysis_result: { note: 'Analysis pending...' }
                });

            if (dbError) {
                console.error('DB Error:', dbError);
                throw new Error('Failed to save sleep log.');
            }

            toast.success('Sleep session saved! Analysis will be ready shortly.');
            setDuration(0);
        } catch (error: any) {
            console.error('Failed to save recording:', error);
            toast.error(error.message || 'Failed to save sleep session.');
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center text-center space-y-10 py-8">
            <AnimatePresence mode="wait">
                {/* Idle State - Apple Style Button */}
                {!isRecording && !isUploading && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex flex-col items-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startRecording}
                            className="w-32 h-32 rounded-full bg-slate-900 hover:bg-slate-800 active:bg-slate-700 flex flex-col items-center justify-center text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 ease-[0.25,0.1,0.25,1] group"
                        >
                            <Mic className="w-8 h-8 mb-1.5 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-[13px] font-medium tracking-wide">START</span>
                        </motion.button>
                    </motion.div>
                )}

                {/* Recording State */}
                {isRecording && (
                    <motion.div
                        key="recording"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex flex-col items-center space-y-6"
                    >
                        {/* Subtle Pulsing Indicator */}
                        <div className="relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.3, 0.1, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 rounded-full bg-red-500/20"
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={stopRecording}
                                className="relative w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex flex-col items-center justify-center text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)] transition-all duration-200"
                            >
                                <Square className="w-7 h-7 mb-1.5 fill-current" />
                                <span className="text-[11px] font-medium tracking-wide font-mono">
                                    {formatTime(duration)}
                                </span>
                            </motion.button>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-red-500"
                            />
                            <span className="text-[13px] font-medium text-slate-600">
                                Recording...
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Uploading State */}
                {isUploading && (
                    <motion.div
                        key="uploading"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex flex-col items-center space-y-4"
                    >
                        <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
                        </div>
                        <span className="text-[13px] font-medium text-slate-600">
                            Saving...
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Option - Subtle Link */}
            {!isRecording && !isUploading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Button 
                        variant="ghost" 
                        className="text-[13px] text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-auto py-2 px-3 rounded-[10px] transition-colors"
                    >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Upload Sleep Recording
                    </Button>
                </motion.div>
            )}
        </div>
    );
}
