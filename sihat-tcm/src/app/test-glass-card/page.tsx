'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useState } from 'react'
import { Sparkles, Zap, Shield, Moon, Sun, Eye, Palette, Activity } from 'lucide-react'

/**
 * TEST PAGE: Enhanced GlassCard Component
 * 
 * Access at: http://localhost:3000/test-glass-card
 * 
 * VERIFICATION CHECKLIST:
 * ✅ Cards animate in with entrance animation (fade + scale)
 * ✅ PC: Hover causes subtle scale-up and shadow deepens
 * ✅ Mobile: Touch causes scale-down feedback
 * ✅ Glow variant shows animated shimmer border
 * ✅ Dark mode toggle works correctly
 * ✅ Reduced motion is respected
 * ✅ All intensity levels (low/medium/high) visible difference
 */

export default function TestGlassCardPage() {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [showKey, setShowKey] = useState(0)

    const handleReload = () => setShowKey(prev => prev + 1)

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'}`}>
            {/* Header Controls */}
            <div className="sticky top-0 z-50 backdrop-blur-lg bg-white/30 dark:bg-slate-800/50 border-b border-white/20 dark:border-slate-700/50 p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        GlassCard Test Page
                    </h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleReload}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
                        >
                            <Activity className="w-4 h-4" />
                            Replay Animation
                        </button>
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors flex items-center gap-2"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {isDarkMode ? 'Light' : 'Dark'}
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto p-6 space-y-12" key={showKey}>
                {/* Section: Variants */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Variants
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(['default', 'elevated', 'subtle', 'glow'] as const).map((variant) => (
                            <GlassCard key={variant} variant={variant} className="group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${variant === 'glow' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        <Zap className={`w-5 h-5 ${variant === 'glow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`} />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white capitalize">{variant}</h3>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Variant: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">{variant}</code>
                                </p>
                            </GlassCard>
                        ))}
                    </div>
                </section>

                {/* Section: Intensity Levels */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Blur Intensity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['low', 'medium', 'high'] as const).map((intensity) => (
                            <GlassCard key={intensity} intensity={intensity} variant="elevated">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white capitalize">{intensity}</h3>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Intensity: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">{intensity}</code>
                                </p>
                                <div className="mt-3 h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                                        style={{ width: intensity === 'low' ? '33%' : intensity === 'medium' ? '66%' : '100%' }}
                                    />
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </section>

                {/* Section: Glow Effect Demo */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Glow Effect (Hover on PC)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassCard glow variant="elevated" intensity="high">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Glow Enabled</h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                This card has the <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">glow</code> prop enabled. Hover to see the shimmer effect!
                            </p>
                        </GlassCard>

                        <GlassCard variant="elevated" intensity="high">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Standard Card</h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                This is a standard card without glow for comparison.
                            </p>
                        </GlassCard>
                    </div>
                </section>

                {/* Section: Animation Toggle */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Animation Control
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassCard animated={true} variant="elevated">
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Animated: ON</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Entrance animation plays. Hover/tap effects active.
                            </p>
                        </GlassCard>

                        <GlassCard animated={false} variant="elevated">
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Animated: OFF</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                No entrance animation. Static appearance.
                            </p>
                        </GlassCard>
                    </div>
                </section>

                {/* Verification Checklist */}
                <section className="p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">✅ Verification Checklist</h2>
                    <div className="grid gap-2 text-sm">
                        {[
                            'Cards animate in on page load (fade + scale)',
                            'PC: Hover causes scale-up and deeper shadow',
                            'Mobile: Touch causes scale-down feedback',
                            'Glow variant shows shimmer effect',
                            'Dark mode toggle works correctly',
                            'All intensity levels show visible difference',
                            'No z-index conflicts between cards',
                        ].map((item, i) => (
                            <label key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <input type="checkbox" className="w-4 h-4 rounded accent-emerald-500" />
                                {item}
                            </label>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}
