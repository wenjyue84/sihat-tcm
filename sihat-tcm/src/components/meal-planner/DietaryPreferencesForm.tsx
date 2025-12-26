'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Utensils, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/stores/useAppStore'
import { saveDietaryPreferences, DietaryPreferences } from '@/app/actions/meal-planner'

interface DietaryPreferencesFormProps {
    initialPreferences?: DietaryPreferences | null
    onSaved: (prefs: DietaryPreferences) => void
}

export const ALLERGIES = [
    { id: 'nuts', key: 'allergyNuts' },
    { id: 'shellfish', key: 'allergyShellfish' },
    { id: 'dairy', key: 'allergyDairy' },
    { id: 'eggs', key: 'allergyEggs' },
    { id: 'gluten', key: 'allergyGluten' },
    { id: 'soy', key: 'allergySoy' },
    { id: 'sesame', key: 'allergySesame' },
]

export const DIETARY_TYPES = [
    { id: 'none', key: 'dietNoRestrictions' },
    { id: 'vegetarian', key: 'dietVegetarian' },
    { id: 'vegan', key: 'dietVegan' },
    { id: 'pescatarian', key: 'dietPescatarian' },
    { id: 'halal', key: 'dietHalal' },
    { id: 'kosher', key: 'dietKosher' },
]

export function DietaryPreferencesForm({ initialPreferences, onSaved }: DietaryPreferencesFormProps) {
    const { t } = useLanguage()
    const strings = t.patientDashboard.mealPlanner

    const [loading, setLoading] = useState(false)
    const [preferences, setPreferences] = useState<DietaryPreferences>({
        allergies: initialPreferences?.allergies || [],
        dietary_type: initialPreferences?.dietary_type || 'none',
        disliked_foods: initialPreferences?.disliked_foods || [],
        serving_size: initialPreferences?.serving_size || 1
    })

    const [dislikedInput, setDislikedInput] = useState(
        initialPreferences?.disliked_foods?.join(', ') || ''
    )

    const handleAllergyToggle = (allergyId: string) => {
        setPreferences(prev => {
            const current = prev.allergies || []
            const updated = current.includes(allergyId)
                ? current.filter(id => id !== allergyId)
                : [...current, allergyId]
            return { ...prev, allergies: updated }
        })
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Process disliked foods input
            const processedDisliked = dislikedInput
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)

            const finalPreferences = {
                ...preferences,
                disliked_foods: processedDisliked
            }

            const result = await saveDietaryPreferences(finalPreferences)

            if (result.success) {
                toast.success(strings.preferencesSaved)
                onSaved(finalPreferences)
            } else {
                toast.error(result.error || strings.savePreferencesError || 'Failed to save preferences')
            }
        } catch (error: any) {
            const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred'
            toast.error(errorMessage)
            console.error('Error saving dietary preferences:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full border-amber-200/50 bg-amber-50/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Utensils className="h-5 w-5" />
                    {strings.dietaryPreferences}
                </CardTitle>
                <CardDescription>
                    {strings.subtitle}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Allergies Section */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        {strings.allergies}
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {ALLERGIES.map(allergy => (
                            <div key={allergy.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`allergy-${allergy.id}`}
                                    checked={preferences.allergies?.includes(allergy.id)}
                                    onCheckedChange={() => handleAllergyToggle(allergy.id)}
                                />
                                <Label htmlFor={`allergy-${allergy.id}`} className="cursor-pointer font-normal">
                                    {(strings as any)[allergy.key] || allergy.id}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dietary Restriction Section - Custom Radio Group */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">
                        {strings.dietaryType}
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {DIETARY_TYPES.map(type => {
                            const isSelected = preferences.dietary_type === type.id
                            return (
                                <div
                                    key={type.id}
                                    onClick={() => setPreferences(prev => ({ ...prev, dietary_type: type.id }))}
                                    className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer transition-all ${isSelected
                                        ? 'bg-amber-100 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-600' : 'border-slate-400'
                                        }`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-amber-600" />}
                                    </div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-amber-900' : 'text-slate-700'}`}>
                                        {(strings as any)[type.key] || type.id}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Disliked Foods Section */}
                <div className="space-y-2">
                    <Label className="text-base font-semibold">
                        {strings.dislikedFoods}
                    </Label>
                    <Input
                        placeholder={strings.dislikedFoodsPlaceholder}
                        value={dislikedInput}
                        onChange={(e) => setDislikedInput(e.target.value)}
                        className="bg-white/50"
                    />
                    <p className="text-xs text-muted-foreground">
                        Separate multiple items with commas
                    </p>
                </div>

                {/* Serving Size Section */}
                <div className="space-y-2">
                    <Label className="text-base font-semibold">
                        {strings.servingSize}
                    </Label>
                    <Select
                        value={String(preferences.serving_size)}
                        onValueChange={(val) => setPreferences(prev => ({ ...prev, serving_size: parseInt(val) }))}
                    >
                        <SelectTrigger className="w-[180px] bg-white/50">
                            <SelectValue placeholder={strings.servingSizePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 person</SelectItem>
                            <SelectItem value="2">2 people</SelectItem>
                            <SelectItem value="3">3 people</SelectItem>
                            <SelectItem value="4">4 people</SelectItem>
                            <SelectItem value="5">5 people</SelectItem>
                            <SelectItem value="6">6 people</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {strings.savePreferences}
                </Button>
            </CardFooter>
        </Card>
    )
}
