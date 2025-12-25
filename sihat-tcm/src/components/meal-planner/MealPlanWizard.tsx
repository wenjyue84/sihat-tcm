'use client'

import { useState, useEffect } from 'react'
import { generateMealPlan, getActiveMealPlan, getDietaryPreferences, DietaryPreferences } from '@/app/actions/meal-planner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles, UtensilsCrossed, RefreshCw, Settings, ChefHat } from 'lucide-react'
import { WeeklyCalendarView } from './WeeklyCalendarView'
import { DietaryPreferencesForm } from './DietaryPreferencesForm'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { translateConstitution } from '@/lib/translations'
import { ALLERGIES, DIETARY_TYPES } from './DietaryPreferencesForm'
import { extractConstitutionType } from '@/lib/tcm-utils'

interface MealPlanWizardProps {
    latestDiagnosis?: any
}

export function MealPlanWizard({ latestDiagnosis }: MealPlanWizardProps) {
    const [mealPlan, setMealPlan] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(null)
    const [showPreferencesForm, setShowPreferencesForm] = useState(false)
    const { t } = useLanguage()
    const strings = t.patientDashboard.mealPlanner

    // Load existing plan and preferences on mount
    useEffect(() => {
        async function loadData() {
            try {
                // Load active meal plan
                const planResult = await getActiveMealPlan()
                if (planResult.success && planResult.data) {
                    setMealPlan(planResult.data)
                }

                // Load dietary preferences
                const prefResult = await getDietaryPreferences()
                if (prefResult.success && prefResult.data) {
                    setDietaryPreferences(prefResult.data)
                } else {
                    // If no preferences found, show form by default
                    setShowPreferencesForm(true)
                }
            } catch (err) {
                console.error('[MealPlanWizard] Error loading data:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
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
                sessionId: latestDiagnosis?.id || latestDiagnosis?.session_id,
                dietaryPreferences: dietaryPreferences || undefined
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
                <p className="text-slate-600">{t.common.loading}</p>
            </Card>
        )
    }

    // Show existing meal plan
    if (mealPlan && !generating) {
        return <WeeklyCalendarView mealPlan={mealPlan} onRefresh={() => setMealPlan(null)} />
    }

    // Preferences Form State
    if ((!dietaryPreferences || showPreferencesForm) && !generating) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-2xl mx-auto"
                >
                    <DietaryPreferencesForm
                        initialPreferences={dietaryPreferences}
                        onSaved={(prefs) => {
                            setDietaryPreferences(prefs)
                            setShowPreferencesForm(false)
                        }}
                    />
                </motion.div>
            </AnimatePresence>
        )
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
                <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-200 shadow-xl">
                    {/* Decorative food pattern background */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div className="absolute top-10 right-10 text-6xl">🍜</div>
                        <div className="absolute bottom-10 left-10 text-6xl">🥘</div>
                        <div className="absolute top-20 left-20 text-4xl">🥗</div>
                        <div className="absolute bottom-20 right-20 text-4xl">🍵</div>
                    </div>

                    <div className="relative p-8 md:p-12 text-center">
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
                            // Initial state with preferences summary
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-4">
                                        <ChefHat className="w-10 h-10" />
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                                            {strings.readyToGenerate}
                                        </h2>
                                        <p className="text-slate-600 max-w-md mx-auto">
                                            {strings.generateDescription.replace('{constitution}', translateConstitution(extractConstitutionType(latestDiagnosis?.constitution?.name || latestDiagnosis?.constitution), t))}
                                        </p>
                                    </div>
                                </div>

                                {/* Preferences Summary Card */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-left border border-amber-200/60 max-w-md mx-auto relative group shadow-sm hover:shadow-md transition-all">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                                        onClick={() => setShowPreferencesForm(true)}
                                    >
                                        <Settings className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>

                                    <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center">
                                        <UtensilsCrossed className="w-4 h-4 mr-2" />
                                        {strings.yourPreferences}
                                    </h3>
                                    <div className="space-y-1 text-sm text-amber-900/80">
                                        <p><span className="font-medium">{strings.dietaryType}:</span> {
                                            dietaryPreferences?.dietary_type && dietaryPreferences.dietary_type !== 'none'
                                                ? (DIETARY_TYPES.find(d => d.id === dietaryPreferences.dietary_type) ? (strings as any)[DIETARY_TYPES.find(d => d.id === dietaryPreferences.dietary_type)!.key] : dietaryPreferences.dietary_type)
                                                : strings.noRestrictions
                                        }</p>
                                        {dietaryPreferences?.allergies && dietaryPreferences.allergies.length > 0 && (
                                            <p><span className="font-medium">{strings.allergies}:</span> {
                                                dietaryPreferences.allergies.map(id => {
                                                    const allergy = ALLERGIES.find(a => a.id === id)
                                                    return allergy ? (strings as any)[allergy.key] : id
                                                }).join(', ')
                                            }</p>
                                        )}
                                        {dietaryPreferences?.disliked_foods && dietaryPreferences.disliked_foods.length > 0 && (
                                            <p><span className="font-medium">{strings.dislikedFoods}:</span> {dietaryPreferences.disliked_foods.join(', ')}</p>
                                        )}
                                        <p><span className="font-medium">{strings.servingSize}:</span> {dietaryPreferences?.serving_size} {dietaryPreferences?.serving_size === 1 ? strings.person : strings.people}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                                    {latestDiagnosis ? (
                                        <Button
                                            size="lg"
                                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-900/20 text-lg py-6"
                                            onClick={handleGenerate}
                                        >
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            {strings.generatePlan}
                                        </Button>
                                    ) : (
                                        <div className="space-y-4">
                                            <Button
                                                disabled
                                                size="lg"
                                                className="w-full bg-slate-200 text-slate-400 cursor-not-allowed shadow-none text-lg py-6"
                                            >
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                {strings.generatePlan}
                                            </Button>
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                                                {strings.completeDiagnosisFirst}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}

