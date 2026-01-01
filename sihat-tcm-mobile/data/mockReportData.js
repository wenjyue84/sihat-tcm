/**
 * Mock Report Data
 * TCM diagnosis report templates based on constitution types
 */

/**
 * Generate comprehensive mock report based on constitution
 * @param {Object} constitution - The constitution object with type property
 * @returns {Object} The mock report data
 */
export function generateMockReport(constitution) {
    const reports = {
        'Yang Deficiency': {
            diagnosis: {
                primary_pattern: 'Yang Deficiency',
                secondary_patterns: ['Kidney Yang Deficiency', 'Spleen Yang Deficiency'],
                affected_organs: ['Kidney', 'Spleen'],
            },
            constitution: {
                type: 'Yang Deficiency',
                description: 'Your body tends to feel cold and lacks vital energy. You may experience fatigue, cold extremities, and low metabolism.',
            },
            analysis: {
                summary: 'Based on your symptoms and assessment, you present with classic signs of Yang Deficiency. This means your body\'s warming and active energy is insufficient.',
                key_findings: {
                    from_inquiry: 'Cold hands and feet, fatigue, preference for warmth',
                    from_visual: 'Pale tongue with white coating',
                    from_pulse: 'Deep and slow pulse',
                },
            },
            recommendations: {
                food: ['Ginger', 'Cinnamon', 'Lamb', 'Walnuts', 'Leeks', 'Fennel'],
                avoid: ['Cold drinks', 'Raw foods', 'Ice cream', 'Salads', 'Watermelon'],
                lifestyle: ['Keep warm, especially lower back and feet', 'Avoid cold environments', 'Get adequate sleep', 'Practice gentle warming exercises'],
                acupoints: ['KI3 (Taixi) - Inner ankle', 'CV4 (Guanyuan) - Lower abdomen', 'GV4 (Mingmen) - Lower back'],
                exercise: ['Tai Chi', 'Qigong', 'Gentle yoga', 'Walking in sunshine'],
                sleep_guidance: 'Sleep before 11 PM, keep feet warm at night',
                emotional_care: 'Avoid excessive fear and anxiety. Practice meditation.',
                herbal_formulas: [
                    { name: 'Jin Gui Shen Qi Wan', purpose: 'Warm Kidney Yang', ingredients: ['Rehmannia', 'Cinnamon Bark', 'Aconite'] },
                ],
            },
        },
        'Yin Deficiency': {
            diagnosis: {
                primary_pattern: 'Yin Deficiency',
                secondary_patterns: ['Liver Yin Deficiency', 'Heart Yin Deficiency'],
                affected_organs: ['Liver', 'Heart', 'Kidney'],
            },
            constitution: {
                type: 'Yin Deficiency',
                description: 'Your body tends to run hot with insufficient cooling and nourishing fluids. You may experience restlessness, night sweats, and dryness.',
            },
            analysis: {
                summary: 'Your assessment indicates Yin Deficiency patterns. This means your body\'s cooling, moistening, and calming energy is insufficient.',
                key_findings: {
                    from_inquiry: 'Night sweats, restlessness, insomnia, dry throat',
                    from_visual: 'Red tongue with little coating',
                    from_pulse: 'Rapid and thin pulse',
                },
            },
            recommendations: {
                food: ['Pears', 'Watermelon', 'Cucumber', 'Tofu', 'Eggs', 'Duck', 'Black sesame'],
                avoid: ['Spicy foods', 'Alcohol', 'Coffee', 'Deep-fried foods', 'Lamb'],
                lifestyle: ['Avoid staying up late', 'Practice calming activities', 'Stay hydrated', 'Avoid excessive sweating'],
                acupoints: ['KI6 (Zhaohai) - Inner ankle', 'SP6 (Sanyinjiao) - Lower leg', 'HT7 (Shenmen) - Wrist'],
                exercise: ['Swimming', 'Yin yoga', 'Meditation', 'Slow walks'],
                sleep_guidance: 'Keep bedroom cool and quiet, avoid screens before bed',
                emotional_care: 'Practice mindfulness, avoid overwork and stress.',
                herbal_formulas: [
                    { name: 'Liu Wei Di Huang Wan', purpose: 'Nourish Kidney Yin', ingredients: ['Rehmannia', 'Cornus', 'Dioscorea'] },
                ],
            },
        },
        'Spleen Qi Deficiency': {
            diagnosis: {
                primary_pattern: 'Spleen Qi Deficiency',
                secondary_patterns: ['Dampness Accumulation'],
                affected_organs: ['Spleen', 'Stomach'],
            },
            constitution: {
                type: 'Spleen Qi Deficiency',
                description: 'Your digestive system needs strengthening. You may experience bloating, fatigue after eating, and loose stools.',
            },
            analysis: {
                summary: 'Your symptoms indicate Spleen Qi Deficiency, which affects digestion and energy production.',
                key_findings: {
                    from_inquiry: 'Poor appetite, bloating, loose stools, fatigue',
                    from_visual: 'Pale tongue with teeth marks',
                    from_pulse: 'Weak and soft pulse',
                },
            },
            recommendations: {
                food: ['Ginger', 'Rice porridge', 'Sweet potato', 'Pumpkin', 'Dates', 'Chicken'],
                avoid: ['Dairy', 'Greasy foods', 'Cold foods', 'Raw vegetables', 'Excessive sugar'],
                lifestyle: ['Eat regular meals', 'Chew food thoroughly', 'Avoid eating when stressed', 'Rest after meals'],
                acupoints: ['ST36 (Zusanli) - Below knee', 'SP3 (Taibai) - Inner foot', 'CV12 (Zhongwan) - Upper abdomen'],
                exercise: ['Walking after meals', 'Gentle stretching', 'Abdominal massage'],
                sleep_guidance: 'Avoid eating late at night, sleep on a slightly elevated pillow',
                emotional_care: 'Avoid excessive worry and overthinking.',
                herbal_formulas: [
                    { name: 'Si Jun Zi Tang', purpose: 'Strengthen Spleen Qi', ingredients: ['Ginseng', 'Atractylodes', 'Poria', 'Licorice'] },
                ],
            },
        },
        'Balanced': {
            diagnosis: {
                primary_pattern: 'Generally Balanced Constitution',
                secondary_patterns: [],
                affected_organs: [],
            },
            constitution: {
                type: 'Balanced',
                description: 'Your constitution appears generally balanced. Continue maintaining healthy habits.',
            },
            analysis: {
                summary: 'Your assessment shows a relatively balanced constitution. Focus on preventive care and maintaining your current health.',
                key_findings: {
                    from_inquiry: 'No significant complaints',
                    from_visual: 'Normal tongue appearance',
                    from_pulse: 'Moderate and even pulse',
                },
            },
            recommendations: {
                food: ['Seasonal fruits', 'Vegetables', 'Whole grains', 'Lean proteins', 'Nuts and seeds'],
                avoid: ['Excessive processed foods', 'Too much sugar', 'Late night eating'],
                lifestyle: ['Maintain regular sleep schedule', 'Exercise regularly', 'Stay hydrated', 'Manage stress'],
                acupoints: ['LI4 (Hegu) - Hand', 'ST36 (Zusanli) - Leg', 'LR3 (Taichong) - Foot'],
                exercise: ['30 minutes daily activity', 'Mix cardio and strength', 'Include flexibility work'],
                sleep_guidance: 'Aim for 7-8 hours of quality sleep',
                emotional_care: 'Maintain work-life balance and social connections.',
                herbal_formulas: [],
            },
        },
    };

    return reports[constitution.type] || reports['Balanced'];
}

/**
 * Determine constitution type from symptoms
 * @param {string[]} symptoms - Array of symptom identifiers
 * @returns {Object} Constitution type and description
 */
export function getConstitutionFromSymptoms(symptoms = []) {
    if (symptoms.includes('cold_hands') || symptoms.includes('fatigue')) {
        return { type: 'Yang Deficiency', description: 'Your body tends to feel cold and lacks energy.' };
    }
    if (symptoms.includes('stress') || symptoms.includes('insomnia')) {
        return { type: 'Yin Deficiency', description: 'You may experience restlessness and heat sensations.' };
    }
    if (symptoms.includes('digestion')) {
        return { type: 'Spleen Qi Deficiency', description: 'Your digestive system needs strengthening.' };
    }
    return { type: 'Balanced', description: 'Your constitution appears generally balanced.' };
}
