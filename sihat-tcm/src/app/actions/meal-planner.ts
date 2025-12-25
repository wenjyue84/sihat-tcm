'use server'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { MEAL_PLANNER_PROMPT, MEAL_SWAP_PROMPT, FOOD_CHECKER_PROMPT } from '@/lib/systemPrompts'

// Zod schema for structured meal plan output
const MealSchema = z.object({
    name: z.string(),
    tcm_benefit: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.string(),
    temperature: z.string().optional(),
    prep_time: z.string().optional(),
    cook_time: z.string().optional()
})

const DayPlanSchema = z.object({
    day: z.number(),
    date: z.string(),
    theme: z.string().optional(),
    meals: z.object({
        breakfast: MealSchema,
        lunch: MealSchema,
        dinner: MealSchema,
        snack: MealSchema
    })
})

// Shopping list as array of categories (Gemini API doesn't support z.record with dynamic keys)
const ShoppingCategorySchema = z.object({
    category: z.string().describe('Category name like Vegetables, Proteins, Grains, etc.'),
    items: z.array(z.string()).describe('List of items in this category')
})

const MealPlanSchema = z.object({
    weekly_plan: z.array(DayPlanSchema),
    shopping_list: z.array(ShoppingCategorySchema).describe('Shopping list organized by category'),
    tcm_principles: z.string(),
    weekly_focus: z.string().optional()
})

type MealPlan = z.infer<typeof MealPlanSchema>

const FoodCheckResultSchema = z.object({
    suitability: z.enum(['suitable', 'moderate', 'avoid']),
    score: z.number(),
    tcm_nature: z.string(),
    tcm_flavor: z.string(),
    recommendation: z.string(),
    explanation: z.string(),
    alternatives: z.array(z.string())
})

// Dietary preferences interface
export interface DietaryPreferences {
    allergies: string[]
    dietary_type: string
    disliked_foods: string[]
    serving_size: number
}

interface GenerateMealPlanInput {
    diagnosisReport: any // The full diagnosis report JSON
    sessionId?: string
    dietaryPreferences?: DietaryPreferences
}

/**
 * Generate a personalized 7-day TCM meal plan using AI
 */
export async function generateMealPlan({ diagnosisReport, sessionId, dietaryPreferences }: GenerateMealPlanInput) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in.'
            }
        }

        // Check if user already has an active meal plan
        const { data: existingPlan } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

        if (existingPlan) {
            return {
                success: true,
                data: existingPlan,
                cached: true
            }
        }

        // Fetch dietary preferences if not provided
        let preferences = dietaryPreferences
        if (!preferences) {
            const prefResult = await getDietaryPreferences()
            if (prefResult.success && prefResult.data) {
                preferences = prefResult.data
            }
        }

        // Extract relevant data from diagnosis report
        const constitution = extractConstitution(diagnosisReport)
        const syndrome = extractSyndrome(diagnosisReport)
        const avoidList = extractFoodsToAvoid(diagnosisReport)
        const beneficialList = extractBeneficialFoods(diagnosisReport)

        // Build dietary restrictions text
        let dietaryRestrictionsText = ''
        if (preferences) {
            const allergiesText = preferences.allergies?.length > 0
                ? `ALLERGIES TO STRICTLY AVOID: ${preferences.allergies.join(', ')}`
                : ''
            const dietaryTypeText = preferences.dietary_type && preferences.dietary_type !== 'none'
                ? `DIETARY RESTRICTION: ${preferences.dietary_type}`
                : ''
            const dislikedText = preferences.disliked_foods?.length > 0
                ? `DISLIKED FOODS TO AVOID: ${preferences.disliked_foods.join(', ')}`
                : ''
            const servingSizeText = preferences.serving_size
                ? `SERVING SIZE: ${preferences.serving_size} people (adjust all recipe quantities accordingly)`
                : ''

            dietaryRestrictionsText = [allergiesText, dietaryTypeText, dislikedText, servingSizeText]
                .filter(Boolean)
                .join('\n')
        }

        // Prepare the prompt
        let prompt = MEAL_PLANNER_PROMPT
            .replace('{{constitution}}', constitution)
            .replace('{{syndrome}}', syndrome)
            .replace('{{avoid_list}}', avoidList.join(', ') || 'None specified')
            .replace('{{beneficial_list}}', beneficialList.join(', ') || 'General healthy foods')

        // Append dietary preferences to prompt if available
        if (dietaryRestrictionsText) {
            prompt += `\n\n## User Dietary Preferences\n${dietaryRestrictionsText}\n\nIMPORTANT: You MUST respect all dietary preferences above. Do NOT include any allergens, restricted foods, or disliked foods in ANY recipe.`
        }

        console.log('[MealPlanner] Generating plan for constitution:', constitution)

        // Generate meal plan using AI
        const { object: mealPlan } = await generateObject({
            model: google('gemini-2.0-flash-exp'),
            schema: MealPlanSchema,
            prompt
        })

        // Save to database
        const { data: savedPlan, error: saveError } = await supabase
            .from('meal_plans')
            .insert({
                user_id: user.id,
                diagnosis_session_id: sessionId || null,
                plan_json: mealPlan as any,
                constitution,
                syndrome,
                is_active: true
            })
            .select()
            .single()

        if (saveError) {
            console.error('[MealPlanner] Error saving plan:', saveError)
            return {
                success: false,
                error: 'Failed to save meal plan'
            }
        }

        return {
            success: true,
            data: savedPlan,
            cached: false
        }
    } catch (error: any) {
        console.error('[MealPlanner] Error generating meal plan:', error)
        return {
            success: false,
            error: error.message || 'Failed to generate meal plan'
        }
    }
}

/**
 * Get active meal plan for current user
 */
export async function getActiveMealPlan() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        const { data, error } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') {
            return { success: false, error: error.message }
        }

        return {
            success: true,
            data: data || null
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Update meal plan progress (mark days as completed)
 */
export async function updateMealPlanProgress(planId: string, completedDays: number) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        const { error } = await supabase
            .from('meal_plans')
            .update({ completed_days: completedDays })
            .eq('id', planId)
            .eq('user_id', user.id)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Deactivate current meal plan (allows generating a new one)
 */
export async function deactivateMealPlan(planId: string) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        const { error } = await supabase
            .from('meal_plans')
            .update({ is_active: false })
            .eq('id', planId)
            .eq('user_id', user.id)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        }
    }
}

// Helper functions to extract data from diagnosis report
function extractConstitution(report: any): string {
    return report?.constitution || report?.constitution_type || 'Balanced'
}

function extractSyndrome(report: any): string {
    return report?.diagnosis?.primary_pattern || report?.diagnosis || 'General wellness'
}

function extractFoodsToAvoid(report: any): string[] {
    const avoid = report?.recommendations?.avoid || []
    if (Array.isArray(avoid)) return avoid
    if (typeof avoid === 'string') return avoid.split(',').map((s: string) => s.trim())
    return []
}

function extractBeneficialFoods(report: any): string[] {
    const food = report?.recommendations?.food || []
    if (Array.isArray(food)) return food
    if (typeof food === 'string') return food.split(',').map((s: string) => s.trim())
    return []
}


/**
 * Fetch user's dietary preferences
 */
export async function getDietaryPreferences() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated'
            }
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('dietary_preferences')
            .eq('id', user.id)
            .single()

        if (error) throw error

        return {
            success: true,
            data: profile?.dietary_preferences as DietaryPreferences | null
        }
    } catch (error: any) {
        console.error('Error fetching preferences:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Save user's dietary preferences
 */
export async function saveDietaryPreferences(preferences: DietaryPreferences) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated'
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({ dietary_preferences: preferences })
            .eq('id', user.id)

        if (error) throw error

        return {
            success: true
        }
    } catch (error: any) {
        console.error('Error saving preferences:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Replace a single meal in the plan with a new one
 */
export async function swapMeal(
    planId: string,
    dayIndex: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    currentMeal: any
) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { success: false, error: 'Not authenticated' }

        // 1. Get the current plan
        const { data: plan, error: fetchError } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !plan) return { success: false, error: 'Meal plan not found' }

        // 2. Get dietary preferences
        const prefResult = await getDietaryPreferences()
        const preferences = prefResult.success ? prefResult.data : null

        // 3. Prepare the prompt
        let dietaryText = preferences ? [
            preferences.allergies?.length ? `Allergies: ${preferences.allergies.join(', ')}` : '',
            preferences.dietary_type !== 'none' ? `Diet: ${preferences.dietary_type}` : '',
            preferences.disliked_foods?.length ? `Dislikes: ${preferences.disliked_foods.join(', ')}` : ''
        ].filter(Boolean).join('\n') : 'No restrictions'

        const prompt = MEAL_SWAP_PROMPT
            .replace('{{constitution}}', plan.constitution || 'Balanced')
            .replace('{{syndrome}}', plan.syndrome || 'General wellness')
            .replace('{{dietary_preferences}}', dietaryText)
            .replace('{{current_meal_name}}', currentMeal.name)
            .replace('{{current_meal_ingredients}}', currentMeal.ingredients.join(', '))
            .replace('{{day_time}}', `Day ${dayIndex + 1}, ${mealType}`)

        // 4. Generate the new meal
        const { object: newMeal } = await generateObject({
            model: google('gemini-2.0-flash-exp'),
            schema: MealSchema,
            prompt
        })

        // 5. Update the plan JSON
        const updatedPlanJson = JSON.parse(JSON.stringify(plan.plan_json))
        if (updatedPlanJson.weekly_plan && updatedPlanJson.weekly_plan[dayIndex]) {
            updatedPlanJson.weekly_plan[dayIndex].meals[mealType] = newMeal
        } else {
            return { success: false, error: 'Could not find the specific day in the meal plan' }
        }

        // 6. Save back to database
        const { error: updateError } = await supabase
            .from('meal_plans')
            .update({ plan_json: updatedPlanJson })
            .eq('id', planId)
            .eq('user_id', user.id)

        if (updateError) throw updateError

        return {
            success: true,
            data: updatedPlanJson
        }
    } catch (error: any) {
        console.error('[MealPlanner] Error swapping meal:', error)
        return {
            success: false,
            error: error.message || 'Failed to swap meal'
        }
    }
}


/**
 * Check the suitability of a specific food item based on TCM diagnosis
 */
export async function checkFoodSuitability({
    foodInput,
    diagnosisReport,
    imageBase64
}: {
    foodInput: string;
    diagnosisReport: any;
    imageBase64?: string;
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Extract TCM context from diagnosis report
        const constitution = diagnosisReport?.diagnosis?.primary_pattern ||
            diagnosisReport?.constitution?.type ||
            (typeof diagnosisReport?.constitution === 'string' ? diagnosisReport.constitution : 'Unknown')

        const syndrome = diagnosisReport?.diagnosis?.primary_pattern ||
            diagnosisReport?.analysis?.pattern_rationale ||
            'General assessment'

        // Get dietary preferences
        const prefResult = await getDietaryPreferences()
        const preferences = prefResult.success ? prefResult.data : null

        let prompt = FOOD_CHECKER_PROMPT
            .replace('{{constitution}}', constitution)
            .replace('{{syndrome}}', syndrome)
            .replace('{{dietary_preferences}}', preferences ? JSON.stringify(preferences) : 'None')
            .replace('{{food_input}}', foodInput || (imageBase64 ? 'Analyzing image' : 'Unknown'))
            .replace('{{image_context}}', imageBase64 ? 'A photo of the food is provided for visual analysis.' : '')

        const { object: result } = await generateObject({
            model: google('gemini-2.0-flash-exp'),
            schema: FoodCheckResultSchema,
            messages: [
                {
                    role: 'user' as const,
                    content: imageBase64 ? [
                        { type: 'text' as const, text: prompt },
                        { type: 'image' as const, image: imageBase64 }
                    ] : [
                        { type: 'text' as const, text: prompt }
                    ]
                }
            ]
        })

        return {
            success: true,
            data: result
        }
    } catch (error: any) {
        console.error('[checkFoodSuitability] Error:', error)
        return {
            success: false,
            error: error.message || 'Failed to check food suitability'
        }
    }
}

