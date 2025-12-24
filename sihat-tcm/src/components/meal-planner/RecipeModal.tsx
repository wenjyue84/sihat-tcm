'use client'

import { X, ChefHat, Clock, Flame, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

interface RecipeModalProps {
    meal: {
        name: string
        tcm_benefit: string
        ingredients: string[]
        instructions: string
        temperature?: string
        prep_time?: string
        cook_time?: string
        serving_size?: string
        notes?: string
    }
    mealType: string
    onClose: () => void
}

export function RecipeModal({ meal, mealType, onClose }: RecipeModalProps) {
    const temperatureEmojis = {
        Warming: '🔥',
        Neutral: '⚖️',
        Cooling: '❄️'
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-white/20 text-white hover:bg-white/30 uppercase text-xs">
                                        {mealType}
                                    </Badge>
                                    {meal.temperature && (
                                        <Badge className="bg-white/20 text-white hover:bg-white/30 text-xs">
                                            <Flame className="w-3 h-3 mr-1" />
                                            {temperatureEmojis[meal.temperature as keyof typeof temperatureEmojis]} {meal.temperature}
                                        </Badge>
                                    )}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-2">{meal.name}</h2>
                                <p className="text-amber-100 flex items-center gap-2">
                                    <Leaf className="w-4 h-4" />
                                    {meal.tcm_benefit}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Meta Information */}
                        <div className="flex flex-wrap gap-4">
                            {meal.prep_time && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="text-xs text-slate-500">Prep Time</p>
                                        <p className="font-semibold">{meal.prep_time}</p>
                                    </div>
                                </div>
                            )}
                            {meal.cook_time && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <ChefHat className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="text-xs text-slate-500">Cook Time</p>
                                        <p className="font-semibold">{meal.cook_time}</p>
                                    </div>
                                </div>
                            )}
                            {meal.serving_size && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="text-2xl">🍽️</span>
                                    <div>
                                        <p className="text-xs text-slate-500">Serves</p>
                                        <p className="font-semibold">{meal.serving_size}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-amber-100" />

                        {/* Ingredients */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <span className="text-2xl">🥘</span>
                                Ingredients
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {meal.ingredients.map((ingredient, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100"
                                    >
                                        <span className="text-amber-600 font-bold text-sm mt-0.5">•</span>
                                        <span className="text-slate-700 text-sm">{ingredient}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <span className="text-2xl">👨‍🍳</span>
                                Instructions
                            </h3>
                            <div className="prose prose-sm max-w-none">
                                {meal.instructions.split('\n').filter(Boolean).map((step, index) => {
                                    // Check if it's a numbered step
                                    const match = step.match(/^(\d+)[.)]\s*(.*)/)
                                    if (match) {
                                        return (
                                            <div key={index} className="flex gap-3 mb-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                                                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm">
                                                    {match[1]}
                                                </div>
                                                <p className="text-slate-700 leading-relaxed pt-1">{match[2]}</p>
                                            </div>
                                        )
                                    }
                                    return (
                                        <p key={index} className="text-slate-700 mb-2 leading-relaxed">
                                            {step}
                                        </p>
                                    )
                                })}
                            </div>
                        </div>

                        {/* TCM Notes */}
                        {meal.notes && (
                            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                                <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                                    🌿 TCM Notes
                                </h4>
                                <p className="text-sm text-emerald-800 leading-relaxed">
                                    {meal.notes}
                                </p>
                            </div>
                        )}

                        {/* Close Button */}
                        <div className="flex justify-end pt-4 border-t border-amber-100">
                            <Button
                                onClick={onClose}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            >
                                Close Recipe
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

