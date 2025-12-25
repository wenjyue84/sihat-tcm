'use client'

import { X, ShoppingCart, Printer, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

// Support both new array format and legacy Record format
type ShoppingCategory = { category: string; items: string[] }
type ShoppingListData = ShoppingCategory[] | Record<string, string[]>

interface ShoppingListWidgetProps {
    shoppingList: ShoppingListData
    onClose: () => void
}

// Convert to normalized format
function normalizeShoppingList(data: ShoppingListData): ShoppingCategory[] {
    if (Array.isArray(data)) {
        return data
    }
    // Legacy Record format - convert to array
    return Object.entries(data).map(([category, items]) => ({ category, items }))
}

export function ShoppingListWidget({ shoppingList, onClose }: ShoppingListWidgetProps) {
    const { t } = useLanguage()
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

    // Normalize the shopping list to always be an array
    const normalizedList = useMemo(() => normalizeShoppingList(shoppingList), [shoppingList])

    const toggleItem = (item: string) => {
        const newSet = new Set(checkedItems)
        if (newSet.has(item)) {
            newSet.delete(item)
        } else {
            newSet.add(item)
        }
        setCheckedItems(newSet)
    }

    const handlePrint = () => {
        window.print()
    }

    const totalItems = normalizedList.reduce((sum, cat) => sum + cat.items.length, 0)
    const checkedCount = checkedItems.size

    // Dynamic category translations
    const getCategoryName = (category: string): string => {
        const categoryMap: Record<string, string> = {
            'Produce': t.patientDashboard.mealPlanner.categoryProduce,
            'Proteins': t.patientDashboard.mealPlanner.categoryProteins,
            'Grains': t.patientDashboard.mealPlanner.categoryGrains,
            'Spices': t.patientDashboard.mealPlanner.categorySpices,
            'Herbs': t.patientDashboard.mealPlanner.categoryHerbs,
            'Dairy': t.patientDashboard.mealPlanner.categoryDairy,
            'Pantry': t.patientDashboard.mealPlanner.categoryPantry,
            'Beverages': t.patientDashboard.mealPlanner.categoryBeverages,
            'Other': t.patientDashboard.mealPlanner.categoryOther,
        }
        return categoryMap[category] || category
    }

    const categoryEmojis: Record<string, string> = {
        'Produce': '🥬',
        'Proteins': '🥩',
        'Grains': '🌾',
        'Spices': '🌶️',
        'Herbs': '🌿',
        'Dairy': '🥛',
        'Pantry': '🏺',
        'Beverages': '☕',
        'Other': '📦'
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

                {/* Widget */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white print:bg-white print:text-slate-800 print:border-b">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                                    <ShoppingCart className="w-8 h-8" />
                                    {t.patientDashboard.mealPlanner.shoppingList}
                                </h2>
                                <p className="text-emerald-100 print:text-slate-600">
                                    {checkedCount}/{totalItems} {t.patientDashboard.mealPlanner.itemsChecked} • {normalizedList.length} {t.patientDashboard.mealPlanner.categories}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                                <button
                                    onClick={handlePrint}
                                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                    title="Print"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 pt-4 print:hidden">
                        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(checkedCount / totalItems) * 100}%` }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {normalizedList.map((categoryData) => {
                            const { category, items } = categoryData
                            const emoji = categoryEmojis[category] || categoryEmojis['Other']
                            const categoryChecked = items.filter((item: string) => checkedItems.has(item)).length

                            return (
                                <div key={category} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <span className="text-2xl">{emoji}</span>
                                            {getCategoryName(category)}
                                        </h3>
                                        <Badge variant="secondary" className="text-xs">
                                            {categoryChecked}/{items.length}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {items.map((item: string, index: number) => {
                                            const isChecked = checkedItems.has(item)
                                            return (
                                                <motion.button
                                                    key={index}
                                                    onClick={() => toggleItem(item)}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left print:border print:p-2 ${isChecked
                                                        ? 'bg-emerald-50 border-emerald-300 print:bg-gray-50'
                                                        : 'bg-white border-slate-200 hover:border-emerald-300'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isChecked
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'bg-white border-slate-300'
                                                        }`}>
                                                        {isChecked && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className={`text-sm ${isChecked ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                                        {item}
                                                    </span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-6 flex justify-end gap-3 print:hidden">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            {t.patientDashboard.mealPlanner.printList}
                        </Button>
                        <Button
                            onClick={onClose}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                            {t.patientDashboard.mealPlanner.doneShopping}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}


