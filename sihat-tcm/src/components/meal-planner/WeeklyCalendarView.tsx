'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, ShoppingCart, RefreshCw, CheckCircle2 } from 'lucide-react'
import { MealCard } from './MealCard'
import { ShoppingListWidget } from './ShoppingListWidget'
import { motion, AnimatePresence } from 'framer-motion'
import { updateMealPlanProgress, deactivateMealPlan, swapMeal } from '@/app/actions/meal-planner'
import { useLanguage } from '@/stores/useAppStore'
import { translateConstitution } from '@/lib/translations'

interface WeeklyCalendarViewProps {
    mealPlan: any
    onRefresh?: () => void
}

export function WeeklyCalendarView({ mealPlan, onRefresh }: WeeklyCalendarViewProps) {
    const { t } = useLanguage()
    const [selectedDay, setSelectedDay] = useState(1)
    const [showShoppingList, setShowShoppingList] = useState(false)
    const [completedDays, setCompletedDays] = useState<number[]>([])

    const planData = mealPlan.plan_json
    const weeklyPlan = planData.weekly_plan || []
    const currentDayPlan = weeklyPlan.find((d: any) => d.day === selectedDay)

    // Handle day completion
    const toggleDayComplete = async (day: number) => {
        const newCompleted = completedDays.includes(day)
            ? completedDays.filter(d => d !== day)
            : [...completedDays, day]

        setCompletedDays(newCompleted)

        // Update in database
        await updateMealPlanProgress(mealPlan.id, newCompleted.length)
    }

    // Handle regeneration
    const handleRegenerate = async () => {
        if (confirm(t.patientDashboard.mealPlanner.generateNewPlanConfirm)) {
            await deactivateMealPlan(mealPlan.id)
            onRefresh?.()
        }
    }

    const handleSwap = async (mealType: string, currentMeal: any) => {
        const res = await swapMeal(
            mealPlan.id,
            selectedDay - 1,
            mealType as any,
            currentMeal
        )

        if (res.success) {
            onRefresh?.()
        } else {
            throw new Error(res.error)
        }
    }

    const nextDay = () => setSelectedDay(prev => Math.min(prev + 1, 7))
    const prevDay = () => setSelectedDay(prev => Math.max(prev - 1, 1))

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{t.patientDashboard.mealPlanner.yourMealPlan}</h2>
                        <p className="text-amber-100">
                            {t.patientDashboard.mealPlanner.constitution}: {translateConstitution(mealPlan.constitution, t)} • {completedDays.length}/7 {t.patientDashboard.mealPlanner.daysCompleted}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowShoppingList(!showShoppingList)}
                            variant="secondary"
                            className="bg-white/20 hover:bg-white/30 text-white border-white/40"
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {t.patientDashboard.mealPlanner.shoppingList}
                        </Button>
                        <Button
                            onClick={handleRegenerate}
                            variant="secondary"
                            className="bg-white/20 hover:bg-white/30 text-white border-white/40"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t.patientDashboard.mealPlanner.newPlan}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* TCM Principles */}
            {planData.tcm_principles && (
                <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                        🌿 {t.patientDashboard.mealPlanner.tcmPrinciples}
                    </h3>
                    <p className="text-emerald-800 leading-relaxed">
                        {planData.tcm_principles}
                    </p>
                </Card>
            )}

            {/* Day Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                    onClick={prevDay}
                    disabled={selectedDay === 1}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                {weeklyPlan.map((day: any) => (
                    <motion.button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative shrink-0 px-4 py-3 rounded-lg font-medium transition-all ${selectedDay === day.day
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg'
                            : 'bg-white border-2 border-amber-200 text-slate-700 hover:border-amber-400'
                            }`}
                    >
                        <div className="text-xs opacity-80 mb-1">{t.patientDashboard.mealPlanner.day} {day.day}</div>
                        <div className="text-sm font-bold">{day.theme || `${t.patientDashboard.mealPlanner.day} ${day.day}`}</div>
                        {completedDays.includes(day.day) && (
                            <CheckCircle2 className="absolute -top-2 -right-2 w-5 h-5 text-emerald-500 bg-white rounded-full" />
                        )}
                    </motion.button>
                ))}

                <Button
                    onClick={nextDay}
                    disabled={selectedDay === 7}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Meals for Selected Day */}
            <AnimatePresence mode="wait">
                {currentDayPlan && (
                    <motion.div
                        key={selectedDay}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800">
                                {currentDayPlan.theme || `Day ${selectedDay}`}
                            </h3>
                            <Button
                                onClick={() => toggleDayComplete(selectedDay)}
                                size="sm"
                                variant={completedDays.includes(selectedDay) ? 'default' : 'outline'}
                                className={completedDays.includes(selectedDay) ? 'bg-emerald-600' : ''}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {completedDays.includes(selectedDay) ? t.patientDashboard.mealPlanner.completed : t.patientDashboard.mealPlanner.markComplete}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                                const meal = currentDayPlan.meals[mealType]
                                if (!meal) return null

                                return (
                                    <MealCard
                                        key={mealType}
                                        mealType={mealType}
                                        meal={meal}
                                        onSwap={() => handleSwap(mealType, meal)}
                                    />
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shopping List Modal */}
            {showShoppingList && (
                <ShoppingListWidget
                    shoppingList={planData.shopping_list}
                    onClose={() => setShowShoppingList(false)}
                />
            )}
        </div>
    )
}


