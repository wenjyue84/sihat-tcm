'use server'

import { createClient } from '@/lib/supabase/server'
import { mockMedicalReports } from '@/lib/mockMedicalReports'
import { devLog } from '@/lib/systemLogger'
import type {
    DiagnosisSession,
    SaveDiagnosisInput,
    MedicalReport,
    SaveMedicalReportInput,
    HealthTrends,
    ActionResult,
    DiagnosisReport,
    VitalSigns
} from '@/types/database'

// Re-export types for backward compatibility
export type { DiagnosisSession, SaveDiagnosisInput, MedicalReport, SaveMedicalReportInput }

/**
 * Helper function to extract symptoms from diagnosis report
 */
function extractSymptomsFromReport(report: DiagnosisReport): string[] | null {
    const symptoms: string[] = []
    
    // Extract from analysis key_findings - parse common symptom keywords
    if (report.analysis?.key_findings?.from_inquiry) {
        const inquiryText = report.analysis.key_findings.from_inquiry.toLowerCase()
        
        // Common symptom keywords to look for
        const symptomKeywords: Record<string, string> = {
            'headache': 'Headache',
            'fatigue': 'Fatigue',
            'dizziness': 'Dizziness',
            'nausea': 'Nausea',
            'insomnia': 'Insomnia',
            'night sweats': 'Night sweats',
            'dry mouth': 'Dry mouth',
            'chest tightness': 'Chest tightness',
            'bloating': 'Bloating',
            'palpitations': 'Palpitations',
            'shortness of breath': 'Shortness of breath',
            'back pain': 'Back pain',
            'joint pain': 'Joint pain',
            'cold extremities': 'Cold extremities',
            'hot flashes': 'Hot flashes'
        }
        
        // Check for each symptom keyword
        for (const [keyword, symptom] of Object.entries(symptomKeywords)) {
            if (inquiryText.includes(keyword) && !symptoms.includes(symptom)) {
                symptoms.push(symptom)
            }
        }
    }
    
    return symptoms.length > 0 ? symptoms : null
}

/**
 * Helper function to extract medicines from diagnosis report
 */
function extractMedicinesFromReport(report: DiagnosisReport): string[] | null {
    // Check input_data first (most reliable)
    if (report.input_data?.medicines && report.input_data.medicines.length > 0) {
        return report.input_data.medicines
    }
    
    // Extract from herbal_formulas in recommendations
    const medicines: string[] = []
    if (report.recommendations?.herbal_formulas) {
        report.recommendations.herbal_formulas.forEach(formula => {
            if (formula.name) {
                medicines.push(formula.name)
            }
        })
    }
    
    return medicines.length > 0 ? medicines : null
}

/**
 * Helper function to extract vital signs from diagnosis report
 */
function extractVitalSignsFromReport(report: DiagnosisReport): VitalSigns | null {
    if (report.patient_summary?.vital_signs) {
        return report.patient_summary.vital_signs
    }
    return null
}

/**
 * Helper function to get mock symptoms based on diagnosis type
 */
function getMockSymptomsForDiagnosis(diagnosis: string): string[] {
    const diagnosisLower = diagnosis.toLowerCase()
    
    if (diagnosisLower.includes('yin deficiency') || diagnosisLower.includes('阴虚')) {
        return ['Night sweats', 'Insomnia', 'Dry mouth', 'Hot palms and soles']
    } else if (diagnosisLower.includes('yang deficiency') || diagnosisLower.includes('阳虚')) {
        return ['Cold extremities', 'Lower back pain', 'Fatigue', 'Frequent urination']
    } else if (diagnosisLower.includes('qi deficiency') || diagnosisLower.includes('气虚')) {
        return ['Fatigue', 'Shortness of breath', 'Weak voice', 'Spontaneous sweating']
    } else if (diagnosisLower.includes('qi stagnation') || diagnosisLower.includes('气滞')) {
        return ['Chest tightness', 'Irritability', 'Bloating', 'Sighing']
    } else if (diagnosisLower.includes('blood deficiency') || diagnosisLower.includes('血虚')) {
        return ['Dizziness', 'Palpitations', 'Poor memory', 'Pale complexion']
    } else if (diagnosisLower.includes('damp heat') || diagnosisLower.includes('湿热')) {
        return ['Heavy feeling', 'Sticky mouth', 'Yellow discharge', 'Urinary discomfort']
    } else if (diagnosisLower.includes('wind-cold') || diagnosisLower.includes('风寒')) {
        return ['Chills', 'Runny nose', 'Body aches', 'Headache']
    } else if (diagnosisLower.includes('phlegm') || diagnosisLower.includes('痰')) {
        return ['Chest oppression', 'Cough with phlegm', 'Heaviness', 'Foggy thinking']
    }
    
    return ['Fatigue', 'General discomfort', 'Sleep issues']
}

/**
 * Helper function to get mock medicines based on diagnosis type
 */
function getMockMedicinesForDiagnosis(diagnosis: string): string[] {
    const diagnosisLower = diagnosis.toLowerCase()
    
    if (diagnosisLower.includes('yin deficiency') || diagnosisLower.includes('阴虚')) {
        return ['Liu Wei Di Huang Wan', 'Zhi Bai Di Huang Wan']
    } else if (diagnosisLower.includes('yang deficiency') || diagnosisLower.includes('阳虚')) {
        return ['Jin Gui Shen Qi Wan', 'You Gui Wan']
    } else if (diagnosisLower.includes('qi deficiency') || diagnosisLower.includes('气虚')) {
        return ['Si Jun Zi Tang', 'Bu Zhong Yi Qi Tang']
    } else if (diagnosisLower.includes('qi stagnation') || diagnosisLower.includes('气滞')) {
        return ['Xiao Yao San', 'Chai Hu Shu Gan San']
    } else if (diagnosisLower.includes('blood deficiency') || diagnosisLower.includes('血虚')) {
        return ['Si Wu Tang', 'Gui Pi Tang']
    } else if (diagnosisLower.includes('damp heat') || diagnosisLower.includes('湿热')) {
        return ['Ba Zheng San', 'Long Dan Xie Gan Tang']
    } else if (diagnosisLower.includes('wind-cold') || diagnosisLower.includes('风寒')) {
        return ['Gui Zhi Tang', 'Ma Huang Tang']
    } else if (diagnosisLower.includes('phlegm') || diagnosisLower.includes('痰')) {
        return ['Er Chen Tang', 'Wen Dan Tang']
    }
    
    return ['General TCM Formula']
}

/**
 * Helper function to extract treatment plan summary from diagnosis report
 */
function extractTreatmentPlanFromReport(report: DiagnosisReport): string | null {
    const planParts: string[] = []
    
    if (report.recommendations) {
        const rec = report.recommendations
        
        // Dietary recommendations
        if (rec.food_therapy?.beneficial && rec.food_therapy.beneficial.length > 0) {
            planParts.push(`Diet: ${rec.food_therapy.beneficial.slice(0, 3).join(', ')}`)
        } else if (rec.food && rec.food.length > 0) {
            planParts.push(`Diet: ${rec.food.slice(0, 3).join(', ')}`)
        }
        
        // Lifestyle recommendations
        if (rec.lifestyle && rec.lifestyle.length > 0) {
            planParts.push(`Lifestyle: ${rec.lifestyle.slice(0, 2).join(', ')}`)
        }
        
        // Herbal formulas
        if (rec.herbal_formulas && rec.herbal_formulas.length > 0) {
            const formulaNames = rec.herbal_formulas.map(f => f.name).join(', ')
            planParts.push(`Herbs: ${formulaNames}`)
        }
    }
    
    return planParts.length > 0 ? planParts.join(' | ') : null
}

/**
 * Save a new diagnosis session to the database
 * @param reportData - The diagnosis report data to save
 * @returns The created diagnosis session or error
 */
export async function saveDiagnosis(reportData: SaveDiagnosisInput): Promise<ActionResult<DiagnosisSession>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in to save your diagnosis.'
            }
        }

        // Extract symptoms from full_report or use provided symptoms
        const symptoms = reportData.symptoms || extractSymptomsFromReport(reportData.full_report)
        
        // Extract medicines from full_report or use provided medicines
        const medicines = reportData.medicines || extractMedicinesFromReport(reportData.full_report)
        
        // Extract vital signs from full_report or use provided vital_signs
        const vitalSigns = reportData.vital_signs || extractVitalSignsFromReport(reportData.full_report)
        
        // Extract treatment plan from recommendations
        const treatmentPlan = reportData.treatment_plan || extractTreatmentPlanFromReport(reportData.full_report)

        // Insert diagnosis session
        const { data, error } = await supabase
            .from('diagnosis_sessions')
            .insert({
                user_id: user.id,
                primary_diagnosis: reportData.primary_diagnosis,
                constitution: reportData.constitution,
                overall_score: reportData.overall_score,
                full_report: reportData.full_report,
                notes: reportData.notes,
                symptoms: symptoms,
                medicines: medicines,
                vital_signs: vitalSigns,
                clinical_notes: reportData.clinical_notes,
                treatment_plan: treatmentPlan,
                follow_up_date: reportData.follow_up_date
            })
            .select()
            .single()

        if (error) {
            devLog('error', 'Actions', '[saveDiagnosis] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true,
            data: data as DiagnosisSession
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[saveDiagnosis] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to save diagnosis'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Get all diagnosis sessions for the current user (paginated, newest first)
 * @param limit - Number of sessions to fetch (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of diagnosis sessions or error
 */
export async function getPatientHistory(limit: number = 50, offset: number = 0): Promise<ActionResult<DiagnosisSession[]>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in to view your history.'
            }
        }

        // Fetch diagnosis sessions ordered by created_at (newest first)
        const { data, error, count } = await supabase
            .from('diagnosis_sessions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            devLog('error', 'Actions', '[getPatientHistory] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true,
            data: data as DiagnosisSession[],
            total: count || 0
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[getPatientHistory] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch history'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Get a single diagnosis session by ID
 * @param sessionId - The ID of the diagnosis session
 * @returns The diagnosis session or error
 */
export async function getSessionById(sessionId: string): Promise<ActionResult<DiagnosisSession>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in to view this session.'
            }
        }

        // Fetch single session (RLS will ensure user owns this session)
        const { data, error } = await supabase
            .from('diagnosis_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (error) {
            devLog('error', 'Actions', '[getSessionById] Error', { error })
            return {
                success: false,
                error: error.code === 'PGRST116' ? 'Session not found' : error.message
            }
        }

        return {
            success: true,
            data: data as DiagnosisSession
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[getSessionById] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch session'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Update notes for a diagnosis session
 * @param sessionId - The ID of the diagnosis session
 * @param notes - The updated notes text
 * @returns Success status or error
 */
export async function updateSessionNotes(sessionId: string, notes: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in to update notes.'
            }
        }

        // Update notes (RLS will ensure user owns this session)
        const { error } = await supabase
            .from('diagnosis_sessions')
            .update({ notes })
            .eq('id', sessionId)
            .eq('user_id', user.id)

        if (error) {
            devLog('error', 'Actions', '[updateSessionNotes] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[updateSessionNotes] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to update notes'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Delete a diagnosis session
 * @param sessionId - The ID of the diagnosis session to delete
 * @returns Success status or error
 */
export async function deleteSession(sessionId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in to delete sessions.'
            }
        }

        // Delete session (RLS will ensure user owns this session)
        const { error } = await supabase
            .from('diagnosis_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', user.id)

        if (error) {
            devLog('error', 'Actions', '[deleteSession] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[deleteSession] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete session'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Calculate health trend statistics for the dashboard
 * @param days - Number of days to analyze (default: 30)
 * @returns Trend statistics or error
 */
export async function getHealthTrends(days: number = 30): Promise<ActionResult<HealthTrends>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated.'
            }
        }

        // Calculate date threshold
        const dateThreshold = new Date()
        dateThreshold.setDate(dateThreshold.getDate() - days)

        // Fetch recent sessions
        const { data, error } = await supabase
            .from('diagnosis_sessions')
            .select('overall_score, primary_diagnosis, created_at')
            .eq('user_id', user.id)
            .gte('created_at', dateThreshold.toISOString())
            .order('created_at', { ascending: true })

        if (error) {
            devLog('error', 'Actions', '[getHealthTrends] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        // Calculate trends
        const sessions = data || []
        const scores = sessions.map(s => s.overall_score).filter((s): s is number => s !== null && s !== undefined)

        const avgScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null

        const improvement = scores.length >= 2
            ? scores[scores.length - 1] - scores[0]
            : null

        // Count diagnosis types
        const diagnosisCounts: Record<string, number> = {}
        sessions.forEach(s => {
            diagnosisCounts[s.primary_diagnosis] = (diagnosisCounts[s.primary_diagnosis] || 0) + 1
        })

        return {
            success: true,
            data: {
                sessionCount: sessions.length,
                averageScore: avgScore,
                improvement,
                diagnosisCounts,
                sessions: sessions.map(s => ({
                    score: s.overall_score,
                    date: s.created_at
                }))
            }
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[getHealthTrends] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to calculate trends'
        return {
            success: false,
            error: errorMessage
        }
    }
}


/**
 * Seed the patient's history with comprehensive mock diagnosis sessions
 * Useful for development or restoring demo data for testing all features
 */
export async function seedPatientHistory() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated.'
            }
        }

        const now = new Date()

        // Comprehensive mock diagnoses with full report data
        const mockSessions = [
            {
                primary_diagnosis: 'Yin Deficiency with Empty Heat',
                constitution: 'Yin Deficiency Constitution',
                overall_score: 68,
                notes: 'Noticed improvement in sleep after following diet recommendations. Still experiencing some night sweats.',
                daysAgo: 2,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Yin Deficiency with Empty Heat',
                        secondary_patterns: ['Kidney Yin Deficiency', 'Heart-Kidney Disharmony'],
                        affected_organs: ['Kidney', 'Heart', 'Liver'],
                        pathomechanism: 'Prolonged stress and overwork have depleted Kidney Yin, leading to Empty Heat rising.'
                    },
                    constitution: { type: 'Yin Deficiency', description: 'Tendency towards dryness, feeling hot, restlessness.' },
                    analysis: {
                        summary: 'Patient presents classic signs of Yin Deficiency with Empty Heat.',
                        key_findings: {
                            from_inquiry: 'Night sweats, insomnia, feeling hot in palms and soles at night.',
                            from_visual: 'Tongue is red with scanty coating, peeled in center.',
                            from_pulse: 'Pulse is thin and rapid, weak in Kidney position.'
                        }
                    },
                    recommendations: {
                        food: ['Black sesame', 'Goji berries', 'Duck', 'Tofu', 'Asparagus'],
                        avoid: ['Spicy foods', 'Alcohol', 'Coffee', 'Lamb'],
                        lifestyle: ['Sleep before 11 PM', 'Gentle exercise', 'Meditation'],
                        acupoints: ['KI3 (Taixi)', 'KI6 (Zhaohai)', 'SP6 (Sanyinjiao)'],
                        herbal_formulas: [{ name: 'Liu Wei Di Huang Wan', purpose: 'Nourish Kidney Yin' }]
                    },
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' },
                    follow_up: { timeline: '4 weeks', expected_improvement: 'Better sleep, reduced night sweats' }
                }
            },
            {
                primary_diagnosis: 'Liver Qi Stagnation',
                constitution: 'Qi Stagnation Constitution',
                overall_score: 62,
                notes: 'Very stressful week at work. Breathing exercises helped with chest tightness.',
                daysAgo: 7,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Liver Qi Stagnation',
                        secondary_patterns: ['Spleen Qi Deficiency'],
                        affected_organs: ['Liver', 'Spleen', 'Stomach'],
                        pathomechanism: 'Emotional stress causing Liver Qi to stagnate.'
                    },
                    constitution: 'Qi Stagnation Constitution',
                    analysis: {
                        summary: 'Work-related stress causing Liver Qi Stagnation.',
                        key_findings: {
                            from_inquiry: 'Irritability, sighing, chest tightness, bloating.',
                            from_visual: 'Tongue slightly purple on sides.',
                            from_pulse: 'Pulse is wiry.'
                        }
                    },
                    recommendations: {
                        food: ['Green vegetables', 'Citrus', 'Mint', 'Turmeric'],
                        avoid: ['Greasy foods', 'Alcohol'],
                        acupoints: ['LV3 (Taichong)', 'LI4 (Hegu)', 'GB34'],
                        herbal_formulas: [{ name: 'Xiao Yao San', purpose: 'Soothe Liver Qi' }]
                    },
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' }
                }
            },
            {
                primary_diagnosis: 'Spleen Qi Deficiency',
                constitution: 'Qi Deficiency Constitution',
                overall_score: 65,
                notes: 'Started eating congee for breakfast. Energy slightly improved.',
                daysAgo: 14,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Spleen Qi Deficiency',
                        secondary_patterns: ['Dampness Accumulation'],
                        affected_organs: ['Spleen', 'Stomach']
                    },
                    constitution: 'Qi Deficiency Constitution',
                    analysis: {
                        summary: 'Irregular eating habits weakened Spleen Qi.',
                        key_findings: {
                            from_inquiry: 'Fatigue after eating, loose stools, poor appetite.',
                            from_visual: 'Pale tongue with teeth marks.',
                            from_pulse: 'Weak and soft pulse.'
                        }
                    },
                    recommendations: {
                        food: ['Congee', 'Sweet potato', 'Ginger', 'Chinese yam'],
                        avoid: ['Cold drinks', 'Raw foods', 'Dairy'],
                        herbal_formulas: [{ name: 'Si Jun Zi Tang', purpose: 'Tonify Spleen Qi' }]
                    },
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' }
                }
            },
            {
                primary_diagnosis: 'Damp Heat in Lower Jiao',
                constitution: 'Damp Heat Constitution',
                overall_score: 55,
                notes: 'Had too many heavy meals during business trip. Need to watch diet.',
                daysAgo: 21,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Damp Heat in Lower Jiao',
                        affected_organs: ['Bladder', 'Large Intestine']
                    },
                    constitution: 'Damp Heat Constitution',
                    analysis: {
                        summary: 'Greasy food and humid weather caused Damp Heat.',
                        key_findings: {
                            from_inquiry: 'Frequent urination with burning, incomplete emptying.',
                            from_visual: 'Thick yellow greasy coating.',
                            from_pulse: 'Slippery and rapid.'
                        }
                    },
                    recommendations: {
                        food: ['Mung beans', 'Watermelon', 'Barley', 'Bitter melon'],
                        avoid: ['Spicy food', 'Alcohol', 'Shellfish'],
                        herbal_formulas: [{ name: 'Ba Zheng San', purpose: 'Clear Damp Heat' }]
                    },
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' }
                }
            },
            {
                primary_diagnosis: 'Blood Deficiency',
                constitution: 'Blood Deficiency Constitution',
                overall_score: 70,
                notes: 'Red date tea became my daily habit. Feeling better.',
                daysAgo: 35,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Blood Deficiency',
                        secondary_patterns: ['Heart Blood Deficiency'],
                        affected_organs: ['Heart', 'Liver', 'Spleen']
                    },
                    constitution: 'Blood Deficiency Constitution',
                    analysis: {
                        summary: 'Overwork depleted Blood affecting Heart.',
                        key_findings: {
                            from_inquiry: 'Dizziness, palpitations, poor memory.',
                            from_visual: 'Pale and thin tongue.',
                            from_pulse: 'Thin and choppy.'
                        }
                    },
                    recommendations: {
                        food: ['Red dates', 'Goji berries', 'Dark greens', 'Bone broth'],
                        avoid: ['Excessive caffeine'],
                        herbal_formulas: [{ name: 'Si Wu Tang', purpose: 'Nourish Blood' }]
                    },
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' }
                }
            },
            {
                primary_diagnosis: 'Kidney Yang Deficiency',
                constitution: 'Yang Deficiency Constitution',
                overall_score: 58,
                notes: 'Winter was tough. Warmer clothes and ginger tea helped.',
                daysAgo: 49,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Kidney Yang Deficiency',
                        affected_organs: ['Kidney', 'Spleen', 'Bladder']
                    },
                    analysis: {
                        summary: 'Cold exposure aggravated Yang weakness.',
                        key_findings: {
                            from_inquiry: 'Cold extremities, lower back pain, nocturia.',
                            from_visual: 'Pale swollen tongue with wet coating.',
                            from_pulse: 'Deep and weak.'
                        }
                    },
                    recommendations: {
                        food: ['Lamb', 'Walnuts', 'Cinnamon', 'Ginger'],
                        avoid: ['Cold drinks', 'Raw foods'],
                        herbal_formulas: [{ name: 'Jin Gui Shen Qi Wan', purpose: 'Warm Kidney Yang' }]
                    },
                    constitution: 'Kidney Yang Deficiency Constitution',
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' }
                }
            },
            {
                primary_diagnosis: 'Phlegm-Damp Obstruction',
                constitution: 'Phlegm-Damp Constitution',
                overall_score: 60,
                notes: 'Cut down on dairy. Mental clarity improved.',
                daysAgo: 63,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Phlegm-Damp Obstruction',
                        affected_organs: ['Spleen', 'Lung']
                    },
                    constitution: 'Phlegm-Damp Constitution',
                    analysis: {
                        summary: 'Weak Spleen led to Phlegm accumulation.',
                        key_findings: {
                            from_inquiry: 'Heaviness, chest oppression, foggy thinking.',
                            from_visual: 'Thick greasy white coating.',
                            from_pulse: 'Slippery.'
                        }
                    },
                    recommendations: {
                        food: ['Barley', 'White radish', 'Tangerine peel tea'],
                        avoid: ['Dairy', 'Sweets', 'Greasy foods'],
                        herbal_formulas: [{ name: 'Er Chen Tang', purpose: 'Transform Phlegm' }]
                    },
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' }
                }
            },
            {
                primary_diagnosis: 'Wind-Cold Invasion',
                constitution: 'Normal Constitution',
                overall_score: 75,
                notes: 'Caught cold after getting wet in rain. Ginger tea worked wonders!',
                daysAgo: 84,
                full_report: {
                    diagnosis: {
                        primary_pattern: 'Wind-Cold Invasion',
                        affected_organs: ['Lung', 'Bladder Channel']
                    },
                    constitution: 'Normal Constitution',
                    analysis: {
                        summary: 'External Wind-Cold attacking Wei Qi level.',
                        key_findings: {
                            from_inquiry: 'Chills, runny nose, body aches, no sweating.',
                            from_visual: 'Thin white coating.',
                            from_pulse: 'Tight and floating.'
                        }
                    },
                    recommendations: {
                        food: ['Ginger tea', 'Scallion congee', 'Chicken soup'],
                        avoid: ['Cold drinks', 'Sour foods'],
                        lifestyle: ['Rest', 'Stay warm'],
                        herbal_formulas: [{ name: 'Gui Zhi Tang', purpose: 'Dispel Wind-Cold' }]
                    },
                    patient_profile: { name: 'Test Patient', age: 42, gender: 'Male' }
                }
            }
        ]

        const sessions = mockSessions.map(session => {
            const date = new Date(now)
            date.setDate(date.getDate() - session.daysAgo)
            
            // Extract symptoms and medicines from full_report for mock data
            const symptoms = extractSymptomsFromReport(session.full_report) || getMockSymptomsForDiagnosis(session.primary_diagnosis)
            const medicines = extractMedicinesFromReport(session.full_report) || getMockMedicinesForDiagnosis(session.primary_diagnosis)
            const vitalSigns = extractVitalSignsFromReport(session.full_report) || {
                bpm: 70 + Math.floor(Math.random() * 20),
                blood_pressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)}`,
                temperature: 36.5 + (Math.random() * 0.8),
                heart_rate: 65 + Math.floor(Math.random() * 25)
            }
            const treatmentPlan = extractTreatmentPlanFromReport(session.full_report) || 'Dietary adjustments | Lifestyle modifications | Herbal support'
            
            return {
                user_id: user.id,
                primary_diagnosis: session.primary_diagnosis,
                constitution: session.constitution,
                overall_score: session.overall_score,
                full_report: session.full_report,
                notes: session.notes,
                symptoms: symptoms,
                medicines: medicines,
                vital_signs: vitalSigns,
                treatment_plan: treatmentPlan,
                clinical_notes: `Patient presented with ${symptoms?.slice(0, 2).join(' and ') || 'symptoms'}. Recommended ${medicines?.[0] || 'herbal support'} for treatment.`,
                created_at: date.toISOString()
            }
        })

        const { error } = await supabase
            .from('diagnosis_sessions')
            .insert(sessions)

        if (error) {
            devLog('error', 'Actions', '[seedPatientHistory] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[seedPatientHistory] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to seed patient history'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Get all medical reports for the current user
 * @returns Array of medical reports or error
 */
export async function getMedicalReports(): Promise<ActionResult<MedicalReport[]>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated.'
            }
        }

        // Fetch reports ordered by date (newest first)
        const { data, error } = await supabase
            .from('medical_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            devLog('error', 'Actions', '[getMedicalReports] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true,
            data: data as MedicalReport[]
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[getMedicalReports] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch medical reports'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Save a new medical report metadata to the database
 * @param reportData - The report metadata to save
 */
export async function saveMedicalReport(reportData: SaveMedicalReportInput): Promise<ActionResult<MedicalReport>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated.'
            }
        }

        const { data, error } = await supabase
            .from('medical_reports')
            .insert({
                user_id: user.id,
                name: reportData.name,
                date: reportData.date,
                size: reportData.size,
                type: reportData.type,
                file_url: reportData.file_url,
                extracted_text: reportData.extracted_text
            })
            .select()
            .single()

        if (error) {
            devLog('error', 'Actions', '[saveMedicalReport] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true,
            data: data as MedicalReport
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[saveMedicalReport] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to save medical report'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Delete a medical report
 * @param reportId - The ID of the report to delete
 */
export async function deleteMedicalReport(reportId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated.'
            }
        }

        const { error } = await supabase
            .from('medical_reports')
            .delete()
            .eq('id', reportId)
            .eq('user_id', user.id)

        if (error) {
            devLog('error', 'Actions', '[deleteMedicalReport] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[deleteMedicalReport] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete medical report'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Seed the patient's medical reports with mock documents
 * Useful for development or restoring demo data for testing
 */
export async function seedMedicalReports() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated.'
            }
        }

        const now = new Date()

        // Mock medical reports matching the content in mockMedicalReports.ts
        const mockReports = [
            {
                name: 'Blood Test Result.pdf',
                date: '2023-11-15',
                size: '245 KB',
                type: 'application/pdf',
                daysAgo: 40
            },
            {
                name: 'X-Ray Report - Chest.pdf',
                date: '2023-10-20',
                size: '1.2 MB',
                type: 'application/pdf',
                daysAgo: 66
            },
            {
                name: 'Annual Health Checkup.pdf',
                date: '2023-08-12',
                size: '520 KB',
                type: 'application/pdf',
                daysAgo: 135
            },
            {
                name: 'MRI Scan Report.pdf',
                date: '2023-06-05',
                size: '3.8 MB',
                type: 'application/pdf',
                daysAgo: 203
            },
            {
                name: 'Prescription History.pdf',
                date: '2023-05-20',
                size: '180 KB',
                type: 'application/pdf',
                daysAgo: 219
            }
        ]

        const reports = mockReports.map(report => {
            const createdDate = new Date(now)
            createdDate.setDate(createdDate.getDate() - report.daysAgo)

            // Get mock content if available
            const extractedText = mockMedicalReports[report.name] || null

            return {
                user_id: user.id,
                name: report.name,
                date: report.date,
                size: report.size,
                type: report.type,
                file_url: null, // No actual file, just metadata
                extracted_text: extractedText,
                created_at: createdDate.toISOString()
            }
        })

        const { error } = await supabase
            .from('medical_reports')
            .insert(reports)

        if (error) {
            devLog('error', 'Actions', '[seedMedicalReports] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[seedMedicalReports] Unexpected error', { error })
    }
}

/**
 * Get the symptoms from the last inquiry for the current user
 * @returns The symptoms string or error
 */
export async function getLastSymptoms(): Promise<ActionResult<string>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in to import symptoms.'
            }
        }

        // Fetch last inquiry ordered by created_at (newest first)
        const { data, error } = await supabase
            .from('inquiries')
            .select('symptoms')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            devLog('error', 'Actions', '[getLastSymptoms] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        if (!data) {
            return {
                success: false,
                error: 'No previous symptoms found.'
            }
        }

        return {
            success: true,
            data: data.symptoms || ''
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[getLastSymptoms] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch symptoms'
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Get the medicines from the last diagnosis for the current user
 * @returns Array of medicine names or error
 */
export async function getLastMedicines(): Promise<ActionResult<string[]>> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated. Please log in to import medicines.'
            }
        }

        // Fetch last diagnosis session ordered by created_at (newest first)
        const { data, error } = await supabase
            .from('diagnosis_sessions')
            .select('full_report')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            devLog('error', 'Actions', '[getLastMedicines] Error', { error })
            return {
                success: false,
                error: error.message
            }
        }

        if (!data) {
            return {
                success: false,
                error: 'No previous diagnosis found.'
            }
        }

        // Try to extract medicines from the full_report
        // We look for reportWithProfile.input_data.medicines (new format)
        // or recommendations.herbal_formulas (as long-term meds often overlap)
        const report = data.full_report as any
        const medicines = report.input_data?.medicines || []

        return {
            success: true,
            data: medicines
        }
    } catch (error: unknown) {
        devLog('error', 'Actions', '[getLastMedicines] Unexpected error', { error })
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch medicines'
        return {
            success: false,
            error: errorMessage
        }
    }
}

