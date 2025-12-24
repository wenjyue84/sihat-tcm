'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Server Actions for "My Health Passport" - Patient History System
 * 
 * These actions handle saving, retrieving, and managing diagnosis sessions
 * for logged-in users. All operations respect RLS policies.
 */

export interface DiagnosisSession {
    id: string
    user_id: string
    primary_diagnosis: string
    constitution?: string
    overall_score?: number
    full_report: any // JSONB - complete report from AI
    notes?: string
    created_at: string
    updated_at: string
}

export interface SaveDiagnosisInput {
    primary_diagnosis: string
    constitution?: string
    overall_score?: number
    full_report: any
    notes?: string
}

/**
 * Save a new diagnosis session to the database
 * @param reportData - The diagnosis report data to save
 * @returns The created diagnosis session or error
 */
export async function saveDiagnosis(reportData: SaveDiagnosisInput) {
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

        // Insert diagnosis session
        const { data, error } = await supabase
            .from('diagnosis_sessions')
            .insert({
                user_id: user.id,
                primary_diagnosis: reportData.primary_diagnosis,
                constitution: reportData.constitution,
                overall_score: reportData.overall_score,
                full_report: reportData.full_report,
                notes: reportData.notes
            })
            .select()
            .single()

        if (error) {
            console.error('[saveDiagnosis] Error:', error)
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true,
            data: data as DiagnosisSession
        }
    } catch (error: any) {
        console.error('[saveDiagnosis] Unexpected error:', error)
        return {
            success: false,
            error: error.message || 'Failed to save diagnosis'
        }
    }
}

/**
 * Get all diagnosis sessions for the current user (paginated, newest first)
 * @param limit - Number of sessions to fetch (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of diagnosis sessions or error
 */
export async function getPatientHistory(limit: number = 50, offset: number = 0) {
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
            console.error('[getPatientHistory] Error:', error)
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
    } catch (error: any) {
        console.error('[getPatientHistory] Unexpected error:', error)
        return {
            success: false,
            error: error.message || 'Failed to fetch history'
        }
    }
}

/**
 * Get a single diagnosis session by ID
 * @param sessionId - The ID of the diagnosis session
 * @returns The diagnosis session or error
 */
export async function getSessionById(sessionId: string) {
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
            console.error('[getSessionById] Error:', error)
            return {
                success: false,
                error: error.code === 'PGRST116' ? 'Session not found' : error.message
            }
        }

        return {
            success: true,
            data: data as DiagnosisSession
        }
    } catch (error: any) {
        console.error('[getSessionById] Unexpected error:', error)
        return {
            success: false,
            error: error.message || 'Failed to fetch session'
        }
    }
}

/**
 * Update notes for a diagnosis session
 * @param sessionId - The ID of the diagnosis session
 * @param notes - The updated notes text
 * @returns Success status or error
 */
export async function updateSessionNotes(sessionId: string, notes: string) {
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
            console.error('[updateSessionNotes] Error:', error)
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: any) {
        console.error('[updateSessionNotes] Unexpected error:', error)
        return {
            success: false,
            error: error.message || 'Failed to update notes'
        }
    }
}

/**
 * Delete a diagnosis session
 * @param sessionId - The ID of the diagnosis session to delete
 * @returns Success status or error
 */
export async function deleteSession(sessionId: string) {
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
            console.error('[deleteSession] Error:', error)
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: any) {
        console.error('[deleteSession] Unexpected error:', error)
        return {
            success: false,
            error: error.message || 'Failed to delete session'
        }
    }
}

/**
 * Calculate health trend statistics for the dashboard
 * @param days - Number of days to analyze (default: 30)
 * @returns Trend statistics or error
 */
export async function getHealthTrends(days: number = 30) {
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
            console.error('[getHealthTrends] Error:', error)
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
    } catch (error: any) {
        console.error('[getHealthTrends] Unexpected error:', error)
        return {
            success: false,
            error: error.message || 'Failed to calculate trends'
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
            return {
                user_id: user.id,
                primary_diagnosis: session.primary_diagnosis,
                constitution: session.constitution,
                overall_score: session.overall_score,
                full_report: session.full_report,
                notes: session.notes,
                created_at: date.toISOString()
            }
        })

        const { error } = await supabase
            .from('diagnosis_sessions')
            .insert(sessions)

        if (error) {
            console.error('[seedPatientHistory] Error:', error)
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: true
        }
    } catch (error: any) {
        console.error('[seedPatientHistory] Unexpected error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}
