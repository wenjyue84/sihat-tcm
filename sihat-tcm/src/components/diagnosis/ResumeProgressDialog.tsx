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
        <Dialog open={isOpen} onOpenChange={() => { /* Prevent closing by clicking outside */ }}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 text-white">
                <DialogHeader className="space-y-3">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25"
                    >
                        <Play className="w-8 h-8 text-white ml-1" />
                    </motion.div>
                    <DialogTitle className="text-xl font-bold text-center text-white">
                        {t.resumeProgress?.title || 'Resume Previous Session?'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-300">
                        {t.resumeProgress?.description || 'We found a previous diagnosis session. Would you like to continue where you left off?'}
                    </DialogDescription>
                </DialogHeader>

                {/* Session Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">
                                {t.resumeProgress?.savedAt || 'Saved'}
                            </p>
                            <p className="font-medium text-white">
                                {formatTimeAgo(savedTimestamp)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📍</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">
                                {t.resumeProgress?.lastStep || 'Last Step'}
                            </p>
                            <p className="font-medium text-white">
                                {getStepDisplayName(savedStep)}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button
                        variant="outline"
                        onClick={onStartNew}
                        className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-all"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t.resumeProgress?.startNew || 'Start New'}
                    </Button>
                    <Button
                        onClick={onResume}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        {t.resumeProgress?.resume || 'Resume'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
