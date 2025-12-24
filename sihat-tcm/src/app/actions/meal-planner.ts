'use server'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { MEAL_PLANNER_PROMPT } from '@/lib/systemPrompts'

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

interface GenerateMealPlanInput {
    diagnosisReport: any // The full diagnosis report JSON
    sessionId?: string
}

/**
 * Generate a personalized 7-day TCM meal plan using AI
 */
export async function generateMealPlan({ diagnosisReport, sessionId }: GenerateMealPlanInput) {
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

        // Extract relevant data from diagnosis report
        const constitution = extractConstitution(diagnosisReport)
        const syndrome = extractSyndrome(diagnosisReport)
        const avoidList = extractFoodsToAvoid(diagnosisReport)
        const beneficialList = extractBeneficialFoods(diagnosisReport)

        // Prepare the prompt
        const prompt = MEAL_PLANNER_PROMPT
            .replace('{{constitution}}', constitution)
            .replace('{{syndrome}}', syndrome)
            .replace('{{avoid_list}}', avoidList.join(', ') || 'None specified')
            .replace('{{beneficial_list}}', beneficialList.join(', ') || 'General healthy foods')

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

