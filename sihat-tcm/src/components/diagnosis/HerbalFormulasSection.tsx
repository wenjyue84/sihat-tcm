'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Leaf, Pill, Info, Lock, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HerbShop } from './HerbShop'

interface HerbalIngredient {
    name: string
    weight?: string
    unit?: string
}

interface HerbalFormula {
    name: string
    ingredients: (string | HerbalIngredient)[]
    dosage?: string
    purpose?: string
}

interface HerbalFormulasSectionProps {
    formulas: HerbalFormula[]
    reportId?: string
    onSectionClick?: (question: string) => void
    isPhysician?: boolean
}

export function HerbalFormulasSection({
    formulas,
    reportId,
    onSectionClick,
    isPhysician = false
}: HerbalFormulasSectionProps) {
    const [expandedFormulas, setExpandedFormulas] = useState<Set<number>>(new Set())
    const [requestedFormulas, setRequestedFormulas] = useState<Set<number>>(new Set())

    const toggleFormula = (index: number) => {
        const newExpanded = new Set(expandedFormulas)
        if (newExpanded.has(index)) {
            newExpanded.delete(index)
        } else {
            newExpanded.add(index)
        }
        setExpandedFormulas(newExpanded)
    }

    const handleRequestDetails = async (index: number) => {
        // Mark as requested
        const newRequested = new Set(requestedFormulas)
        newRequested.add(index)
        setRequestedFormulas(newRequested)

        // In a real app, this would make an API call to request physician approval
        console.log(`Requested details for formula ${index} in report ${reportId}`)
    }

    const formatIngredient = (ingredient: string | HerbalIngredient, showWeight: boolean): string => {
        if (typeof ingredient === 'string') {
            return ingredient
        }
        if (showWeight && ingredient.weight) {
            return `${ingredient.name} (${ingredient.weight}${ingredient.unit || 'g'})`
        }
        return ingredient.name
    }

    if (!formulas || formulas.length === 0) {
        return null
    }

    return (
        <div className="space-y-6">
            {/* Formula Information Cards */}
            <div className="space-y-4">
                {formulas.map((formula, idx) => (
                    <div
                        key={idx}
                        className="bg-white/60 dark:bg-white/10 rounded-lg p-4 border border-amber-200/50 dark:border-amber-700/50"
                    >
                        <div className="flex items-start justify-between">
                            <button
                                onClick={() => toggleFormula(idx)}
                                className="flex items-center gap-2 text-left font-semibold text-amber-900 dark:text-amber-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                            >
                                <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                {formula.name}
                            </button>
                        </div>

                        {formula.purpose && (
                            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 flex items-start gap-2">
                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                                {formula.purpose}
                            </p>
                        )}

                        {expandedFormulas.has(idx) && (
                            <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-700/50">
                                <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                                    Ingredients:
                                </h5>
                                <ul className="grid grid-cols-2 gap-1 text-sm text-stone-600 dark:text-stone-300">
                                    {formula.ingredients.map((ing, i) => (
                                        <li key={i} className="flex items-center gap-1">
                                            <div className="h-1 w-1 rounded-full bg-amber-400" />
                                            {formatIngredient(ing, isPhysician)}
                                        </li>
                                    ))}
                                </ul>

                                {!isPhysician && (
                                    <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-700/50">
                                        {requestedFormulas.has(idx) ? (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                                <Check className="h-4 w-4" />
                                                Request sent - pending physician approval
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRequestDetails(idx)}
                                                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                                            >
                                                <Lock className="h-4 w-4 mr-2" />
                                                Request Full Formula Details
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {formula.dosage && (
                                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 italic">
                                        Dosage: {formula.dosage}
                                    </p>
                                )}
                            </div>
                        )}

                        {!expandedFormulas.has(idx) && (
                            <button
                                onClick={() => toggleFormula(idx)}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 mt-2"
                            >
                                Show details →
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* One-Click Remedy Shop Section */}
            <div className="mt-6 pt-4 border-t border-amber-200/30 dark:border-amber-700/30">
                <HerbShop
                    formulas={formulas.map(f => ({ name: f.name }))}
                />
            </div>
        </div>
    )
}
