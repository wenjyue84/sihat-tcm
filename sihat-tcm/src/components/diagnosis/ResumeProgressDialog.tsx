'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion } from 'framer-motion'
import { RotateCcw, Play, Clock } from 'lucide-react'

interface ResumeProgressDialogProps {
    isOpen: boolean
    savedStep: string
    savedTimestamp: string
    onResume: () => void
    onStartNew: () => void
}

export function ResumeProgressDialog({
    isOpen,
    savedStep,
    savedTimestamp,
    onResume,
    onStartNew
}: ResumeProgressDialogProps) {
    const { t } = useLanguage()

    // Format the saved time into a human-readable relative time
    const formatTimeAgo = (timestamp: string) => {
        const savedTime = new Date(timestamp).getTime()
        const now = Date.now()
        const diffMs = now - savedTime
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

        if (diffMins < 1) return t.resumeProgress?.justNow || 'just now'
        if (diffMins < 60) return `${diffMins} ${t.resumeProgress?.minutesAgo || 'minutes ago'}`
        if (diffHours < 24) return `${diffHours} ${t.resumeProgress?.hoursAgo || 'hours ago'}`
        return new Date(timestamp).toLocaleDateString()
    }

    // Map step ID to readable name
    const getStepDisplayName = (stepId: string) => {
        const stepNames: Record<string, string> = {
            'basic_info': t.steps?.basics || 'Basics',
            'wen_inquiry': t.steps?.inquiry || 'Inquiry',
            'wang_tongue': t.steps?.tongue || 'Tongue',
            'wang_face': t.steps?.face || 'Face',
            'wang_part': t.steps?.bodyPart || 'Body Part',
            'wen_audio': t.steps?.audio || 'Audio',
            'qie': t.steps?.pulse || 'Pulse',
            'smart_connect': t.steps?.smartConnect || 'Smart Connect',
            'summary': t.steps?.summary || 'Summary',
        }
        return stepNames[stepId] || stepId
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onStartNew() }}>
            <DialogContent className="sm:max-w-sm bg-white border-gray-200 shadow-xl">
                <DialogHeader className="space-y-2 pb-3">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md"
                    >
                        <Play className="w-5 h-5 text-white ml-0.5" />
                    </motion.div>
                    <DialogTitle className="text-lg font-semibold text-center text-gray-900">
                        {t.resumeProgress?.title || 'Resume Previous Session?'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-600 text-sm leading-relaxed">
                        {t.resumeProgress?.description || 'We found a previous diagnosis session. Would you like to continue where you left off?'}
                    </DialogDescription>
                </DialogHeader>

                {/* Session Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2.5"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">
                                {t.resumeProgress?.savedAt || 'Saved'}
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {formatTimeAgo(savedTimestamp)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <span className="text-sm">📍</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">
                                {t.resumeProgress?.lastStep || 'Last Step'}
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {getStepDisplayName(savedStep)}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <DialogFooter className="flex flex-row gap-2.5 mt-4 pt-3 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={onStartNew}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        {t.resumeProgress?.startNew || 'Start New'}
                    </Button>
                    <Button
                        onClick={onResume}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-all"
                    >
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        {t.resumeProgress?.resume || 'Resume'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
