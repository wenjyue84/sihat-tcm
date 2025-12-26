'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coffee, Sun, Moon, Cookie, ChefHat, Clock, Flame, RefreshCw, Loader2 } from 'lucide-react'
import { RecipeModal } from './RecipeModal'
import { motion } from 'framer-motion'
import { useLanguage } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface MealCardProps {
    mealType: string
    meal: {
        name: string
        tcm_benefit: string
        ingredients: string[]
        instructions: string
        temperature?: string
        prep_time?: string
        cook_time?: string
    }
    onSwap?: () => Promise<void>
}

const mealIcons = {
    breakfast: Coffee,
    lunch: Sun,
    dinner: Moon,
    snack: Cookie
}

const mealColors = {
    breakfast: 'from-yellow-400 to-amber-500',
    lunch: 'from-orange-400 to-red-500',
    dinner: 'from-indigo-400 to-purple-500',
    snack: 'from-emerald-400 to-teal-500'
}

const temperatureColors = {
    Warming: 'bg-red-100 text-red-700 border-red-200',
    Neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    Cooling: 'bg-blue-100 text-blue-700 border-blue-200'
}

export function MealCard({ mealType, meal, onSwap }: MealCardProps) {
    const [showModal, setShowModal] = useState(false)
    const [swapping, setSwapping] = useState(false)
    const { t } = useLanguage()
    const strings = t.patientDashboard.mealPlanner

    const Icon = mealIcons[mealType as keyof typeof mealIcons] || ChefHat
    const gradientColor = mealColors[mealType as keyof typeof mealColors] || 'from-slate-400 to-slate-500'

    const handleSwap = async () => {
        if (!onSwap) return
        setSwapping(true)
        try {
            await onSwap()
            toast.success(strings.swapSuccess)
        } catch (error) {
            console.error('Swap failed:', error)
            toast.error(strings.swapError)
        } finally {
            setSwapping(false)
        }
    }

    return (
        <>
            <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
            >
                <Card
                    onClick={() => setShowModal(true)}
                    className="group cursor-pointer overflow-hidden bg-white/60 backdrop-blur-md border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300"
                >
                    {/* Header with Icon */}
                    <div className={`bg-gradient-to-r ${gradientColor} p-4 text-white`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs opacity-90 uppercase tracking-wide">{mealType}</p>
                                <h4 className="text-lg font-bold line-clamp-1">{meal.name}</h4>
                            </div>
                            {onSwap && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ${swapping ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSwap()
                                    }}
                                    disabled={swapping}
                                    title={strings.swap}
                                >
                                    {swapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                        {/* TCM Benefit Badge */}
                        <div className="mb-3">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
                                🌿 {meal.tcm_benefit}
                            </Badge>
                        </div>

                        {/* Temperature & Time Info */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {meal.temperature && (
                                <span className={`text-xs px-2 py-1 rounded-full border ${temperatureColors[meal.temperature as keyof typeof temperatureColors] || temperatureColors.Neutral}`}>
                                    <Flame className="w-3 h-3 inline mr-1" />
                                    {meal.temperature}
                                </span>
                            )}
                            {(meal.prep_time || meal.cook_time) && (
                                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {[meal.prep_time, meal.cook_time].filter(Boolean).join(' + ')}
                                </span>
                            )}
                        </div>

                        {/* Ingredients Preview */}
                        <div className="text-sm text-slate-600">
                            <p className="font-medium mb-1">Key Ingredients:</p>
                            <p className="line-clamp-2">
                                {meal.ingredients.slice(0, 4).join(', ')}
                                {meal.ingredients.length > 4 && '...'}
                            </p>
                        </div>

                        {/* Hover Indicator */}
                        <div className="mt-4 pt-3 border-t border-amber-100">
                            <p className="text-xs text-amber-600 font-medium group-hover:text-amber-700 transition-colors">
                                Click to view full recipe →
                            </p>
                        </div>
                    </div>

                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-200/30 to-transparent pointer-events-none" />
                </Card>
            </motion.div>

            {/* Recipe Modal */}
            {showModal && (
                <RecipeModal
                    meal={meal}
                    mealType={mealType}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    )
}


