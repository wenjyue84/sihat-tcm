import { DiagnosisSession } from '@/types/database'
import { FiveElementsScore } from '@/components/patient/FiveElementsRadar'

/**
 * Calculate Five Elements health scores from a diagnosis session
 * 
 * This function analyzes TCM diagnosis data and calculates health scores (0-100)
 * for each of the five organs based on the Five Elements theory:
 * - Liver (Wood, 肝)
 * - Heart (Fire, 心)
 * - Spleen (Earth, 脾)
 * - Lung (Metal, 肺)
 * - Kidney (Water, 肾)
 */
export function calculateFiveElementsScores(
    diagnosis: DiagnosisSession | null
): FiveElementsScore {
    // Initialize base scores (neutral health state)
    const scores: FiveElementsScore = {
        liver: 70,
        heart: 70,
        spleen: 70,
        lung: 70,
        kidney: 70,
        timestamp: diagnosis?.created_at
    }

    if (!diagnosis) {
        return scores
    }

    // Parse constitution and pattern data
    const constitution = (diagnosis.constitution?.toLowerCase() || '')
    const pattern = (diagnosis.pattern_differentiation?.toLowerCase() || '')
    const symptoms = (diagnosis.symptoms?.toLowerCase() || '')

    // Adjust scores based on constitution type
    if (constitution.includes('qi') && constitution.includes('deficiency')) {
        scores.spleen -= 15
        scores.lung -= 10
    }
    if (constitution.includes('yang') && constitution.includes('deficiency')) {
        scores.kidney -= 15
        scores.spleen -= 10
    }
    if (constitution.includes('yin') && constitution.includes('deficiency')) {
        scores.kidney -= 15
        scores.liver -= 10
    }
    if (constitution.includes('damp') || constitution.includes('phlegm')) {
        scores.spleen -= 15
        scores.lung -= 12
    }
    if (constitution.includes('heat') || constitution.includes('fire')) {
        scores.heart -= 15
        scores.liver -= 12
    }
    if (constitution.includes('blood') && constitution.includes('stasis')) {
        scores.liver -= 15
        scores.heart -= 12
    }
    if (constitution.includes('balanced') || constitution.includes('平和')) {
        scores.liver += 10
        scores.heart += 12
        scores.spleen += 8
        scores.lung += 10
        scores.kidney += 9
    }

    // Adjust based on pattern differentiation
    if (pattern.includes('liver qi stagnation') || pattern.includes('肝气郁结')) {
        scores.liver -= 10
    }
    if (pattern.includes('heart fire') || pattern.includes('心火')) {
        scores.heart -= 10
    }
    if (pattern.includes('spleen qi deficiency') || pattern.includes('脾气虚')) {
        scores.spleen -= 10
    }
    if (pattern.includes('lung yin deficiency') || pattern.includes('肺阴虚')) {
        scores.lung -= 10
    }
    if (pattern.includes('kidney yang deficiency') || pattern.includes('肾阳虚')) {
        scores.kidney -= 10
    }
    if (pattern.includes('kidney yin deficiency') || pattern.includes('肾阴虚')) {
        scores.kidney -= 12
    }

    // Adjust based on specific symptoms
    if (symptoms.includes('anger') || symptoms.includes('irritable') || symptoms.includes('易怒')) {
        scores.liver -= 5
    }
    if (symptoms.includes('insomnia') || symptoms.includes('anxiety') || symptoms.includes('失眠')) {
        scores.heart -= 5
    }
    if (symptoms.includes('fatigue') || symptoms.includes('tired') || symptoms.includes('疲乏')) {
        scores.spleen -= 5
    }
    if (symptoms.includes('cough') || symptoms.includes('asthma') || symptoms.includes('咳嗽')) {
        scores.lung -= 5
    }
    if (symptoms.includes('back pain') || symptoms.includes('腰痛')) {
        scores.kidney -= 5
    }

    // Clamp scores between 0 and 100
    Object.keys(scores).forEach(key => {
        if (key !== 'timestamp') {
            const score = scores[key as keyof Omit<FiveElementsScore, 'timestamp'>]
            if (typeof score === 'number') {
                scores[key as keyof Omit<FiveElementsScore, 'timestamp'>] = Math.max(
                    0,
                    Math.min(100, score)
                ) as any
            }
        }
    })

    return scores
}

/**
 * Calculate historical Five Elements scores from diagnosis history
 * 
 * @param diagnosisHistory - Array of diagnosis sessions sorted by date
 * @returns Array of Five Elements scores with timestamps
 */
export function calculateHistoricalScores(
    diagnosisHistory: DiagnosisSession[]
): FiveElementsScore[] {
    if (!diagnosisHistory || diagnosisHistory.length === 0) {
        return []
    }

    return diagnosisHistory
        .filter(d => d.created_at) // Only include diagnoses with valid timestamps
        .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
        .map(diagnosis => calculateFiveElementsScores(diagnosis))
        .slice(-10) // Keep only the last 10 for performance
}

/**
 * Get the average score across all five elements
 */
export function getAverageElementScore(scores: FiveElementsScore): number {
    const { liver, heart, spleen, lung, kidney } = scores
    return Math.round((liver + heart + spleen + lung + kidney) / 5)
}

/**
 * Identify which elements need the most attention (lowest scores)
 */
export function getWeakElements(scores: FiveElementsScore, threshold: number = 60): string[] {
    const elements: string[] = []

    if (scores.liver < threshold) elements.push('liver')
    if (scores.heart < threshold) elements.push('heart')
    if (scores.spleen < threshold) elements.push('spleen')
    if (scores.lung < threshold) elements.push('lung')
    if (scores.kidney < threshold) elements.push('kidney')

    return elements
}

/**
 * Get health status based on score
 */
export function getHealthStatus(score: number): {
    status: 'excellent' | 'good' | 'fair' | 'poor'
    color: string
    message: string
} {
    if (score >= 80) {
        return {
            status: 'excellent',
            color: '#10b981',
            message: 'Excellent health'
        }
    } else if (score >= 70) {
        return {
            status: 'good',
            color: '#3b82f6',
            message: 'Good health'
        }
    } else if (score >= 60) {
        return {
            status: 'fair',
            color: '#f59e0b',
            message: 'Fair - needs attention'
        }
    } else {
        return {
            status: 'poor',
            color: '#ef4444',
            message: 'Poor - requires care'
        }
    }
}
