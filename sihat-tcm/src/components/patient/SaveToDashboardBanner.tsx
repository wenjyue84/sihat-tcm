'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileHeart, TrendingUp, Lock, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SaveToDashboardBannerProps {
    isGuest: boolean
    isSaved: boolean
    onViewDashboard?: () => void
}

export function SaveToDashboardBanner({ isGuest, isSaved, onViewDashboard }: SaveToDashboardBannerProps) {
    const router = useRouter()
    const [dismissed, setDismissed] = useState(false)

    // Don't show if user is logged in and already saved, or if dismissed
    if ((!isGuest && isSaved) || dismissed) {
        return null
    }

    // Guest user - show sign-in CTA
    if (isGuest) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="sticky top-4 z-30 px-4"
                >
                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl border-0">
                        {/* Decorative blur effects */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        
                        <div className="relative p-6">
                            {/* Dismiss button */}
                            <button
                                onClick={() => setDismissed(true)}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                {/* Icon Section */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <FileHeart className="w-8 h-8" />
                                    </div>
                                    <div className="hidden md:block h-12 w-px bg-white/30" />
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        Save Your Diagnosis & Track Your Recovery
                                    </h3>
                                    <p className="text-emerald-50 text-sm md:text-base mb-4 leading-relaxed">
                                        Create a free account to save this report, visualize your health trends over time, 
                                        and build your personal TCM health passport.
                                    </p>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>Track Progress</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                                            <Lock className="w-4 h-4" />
                                            <span>Secure & Private</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                                            <FileHeart className="w-4 h-4" />
                                            <span>View Anytime</span>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <Button
                                        size="lg"
                                        onClick={() => router.push('/login?redirect=/patient')}
                                        className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-lg"
                                    >
                                        Sign In to Save This Report
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </AnimatePresence>
        )
    }

    // Logged-in user - show success + dashboard link
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="sticky top-4 z-30 px-4"
            >
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
                    <div className="relative p-5">
                        {/* Dismiss button */}
                        <button
                            onClick={() => setDismissed(true)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-emerald-100 transition-colors"
                        >
                            <X className="w-4 h-4 text-emerald-600" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                <FileHeart className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-emerald-900 mb-1">
                                    Report Saved to Your Health Passport!
                                </h3>
                                <p className="text-sm text-emerald-700">
                                    View your diagnosis history and track your wellness journey.
                                </p>
                            </div>
                                    <Button
                                        onClick={onViewDashboard || (() => router.push('/patient'))}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                                    >
                                        View Dashboard
                                    </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}

