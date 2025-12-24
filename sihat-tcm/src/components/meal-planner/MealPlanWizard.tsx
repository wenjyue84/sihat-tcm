'use client'

import { useState, useEffect } from 'react'
import { generateMealPlan, getActiveMealPlan } from '@/app/actions/meal-planner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles, UtensilsCrossed, RefreshCw } from 'lucide-react'
import { WeeklyCalendarView } from './WeeklyCalendarView'
import { motion, AnimatePresence } from 'framer-motion'

interface MealPlanWizardProps {
    latestDiagnosis?: any
}

export function MealPlanWizard({ latestDiagnosis }: MealPlanWizardProps) {
    const [mealPlan, setMealPlan] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Load existing plan on mount
    useEffect(() => {
        async function loadPlan() {
            try {
                const result = await getActiveMealPlan()
                if (result.success && result.data) {
                    setMealPlan(result.data)
                }
            } catch (err) {
                console.error('[MealPlanWizard] Error loading plan:', err)
            } finally {
                setLoading(false)
            }
        }
        loadPlan()
    }, [])

    // Generate new meal plan
    const handleGenerate = async () => {
        if (!latestDiagnosis) {
            setError('Please complete a TCM diagnosis first to generate a personalized meal plan.')
            return
        }

        setGenerating(true)
        setError(null)

        const messages = [
            '🔍 Analyzing your TCM constitution...',
            '🌿 Selecting harmonizing ingredients...',
            '⚖️ Balancing Yin and Yang energies...',
            '🍲 Creating your personalized menu...',
            '✨ Adding therapeutic recipes...',
            '📋 Organizing your shopping list...'
        ]

        let messageIndex = 0
        setLoadingMessage(messages[0])

        const interval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length
            setLoadingMessage(messages[messageIndex])
        }, 2500)

        try {
            const result = await generateMealPlan({
                diagnosisReport: latestDiagnosis,
                sessionId: latestDiagnosis?.id || latestDiagnosis?.session_id
            })

            clearInterval(interval)

            if (result.success) {
                setMealPlan(result.data)
                setError(null)
            } else {
                setError(result.error || 'Failed to generate meal plan')
            }
        } catch (err: any) {
            clearInterval(interval)
            setError(err.message || 'An unexpected error occurred')
        } finally {
            setGenerating(false)
        }
    }

    // Loading state
    if (loading) {
        return (
            <Card className="p-8 text-center bg-white/60 backdrop-blur-md">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
                <p className="text-slate-600">Loading meal planner...</p>
            </Card>
        )
    }

    // Show existing meal plan
    if (mealPlan && !generating) {
        return <WeeklyCalendarView mealPlan={mealPlan} onRefresh={() => setMealPlan(null)} />
    }

    // Empty state - generate new plan
    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-200">
                    {/* Decorative food pattern background */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-10 right-10 text-6xl">🍜</div>
                        <div className="absolute bottom-10 left-10 text-6xl">🥘</div>
                        <div className="absolute top-20 left-20 text-4xl">🥗</div>
                        <div className="absolute bottom-20 right-20 text-4xl">🍵</div>
                    </div>

                    <div className="relative p-12 text-center">
                        {generating ? (
                            // Generating state
                            <div>
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center animate-pulse">
                                    <UtensilsCrossed className="w-12 h-12 text-amber-600 animate-bounce" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                                    Creating Your Personalized Meal Plan
                                </h3>
                                <p className="text-amber-700 text-lg mb-6 font-medium">
                                    {loadingMessage}
                                </p>
                                <div className="w-64 h-2 mx-auto bg-amber-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" style={{ width: '70%' }} />
                                </div>
                                <p className="text-sm text-slate-500 mt-4">
                                    This usually takes 10-15 seconds...
                                </p>
                            </div>
                        ) : (
                            // Initial state
                            <div>
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                    <UtensilsCrossed className="w-12 h-12 text-amber-600" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                                    🍜 TCM AI Meal Planner
                                </h3>
                                <p className="text-slate-600 text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                                    Get a personalized 7-day meal plan tailored to your TCM constitution.
                                    Each recipe balances Yin and Yang, supports your healing journey, and tastes delicious!
                                </p>

                                {/* Features */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                                    {[
                                        { icon: '🌿', text: 'TCM Principles' },
                                        { icon: '🍲', text: '28 Recipes' },
                                        { icon: '🛒', text: 'Smart Shopping List' }
                                    ].map((feature, i) => (
                                        <div key={i} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
                                            <div className="text-3xl mb-2">{feature.icon}</div>
                                            <p className="text-sm font-medium text-slate-700">{feature.text}</p>
                                        </div>
                                    ))}
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}

                                {latestDiagnosis ? (
                                    <Button
                                        onClick={handleGenerate}
                                        size="lg"
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg text-lg px-8 py-6"
                                    >
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Generate My Meal Plan
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <Button
                                            disabled
                                            size="lg"
                                            className="bg-gradient-to-r from-amber-500/50 to-orange-500/50 text-white/80 shadow-lg text-lg px-8 py-6 cursor-not-allowed"
                                        >
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Generate My Meal Plan
                                        </Button>
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-sm text-amber-800 font-medium mb-2">
                                                🔓 Complete a TCM diagnosis first to unlock this feature
                                            </p>
                                            <Button
                                                onClick={() => window.location.href = '/'}
                                                variant="outline"
                                                size="sm"
                                                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                                            >
                                                Start My Diagnosis
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-slate-400 mt-6">
                                    Plans are personalized based on your constitution, syndrome, and dietary recommendations
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}

