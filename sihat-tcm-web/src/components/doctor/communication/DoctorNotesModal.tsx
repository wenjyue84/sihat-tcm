/**
 * DoctorNotesModal Component
 * Allows doctors to add/edit private notes for a patient conversation
 */

"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface DoctorNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientName: string;
    currentNotes: string;
    onSave: (notes: string) => Promise<void>;
}

export function DoctorNotesModal({
    isOpen,
    onClose,
    patientName,
    currentNotes,
    onSave,
}: DoctorNotesModalProps) {
    const [notes, setNotes] = useState(currentNotes);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNotes(currentNotes);
    }, [currentNotes, isOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(notes);
            onClose();
        } catch (err) {
            console.error("Error saving notes:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <StickyNote className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        Doctor Notes
                                    </h2>
                                    <p className="text-purple-100 text-sm">{patientName}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-3">
                                These notes are private and will not be visible to the patient.
                            </p>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your clinical observations, notes, or follow-up reminders..."
                                className="min-h-[200px] resize-none border-gray-200 focus:border-indigo-300"
                            />

                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="outline" onClick={onClose} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Save Notes
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
