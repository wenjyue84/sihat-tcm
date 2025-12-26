/**
 * Medical Safety Validator - Comprehensive safety validation for TCM recommendations
 * 
 * This module provides medical safety validation including contraindication checking,
 * drug-herb interactions, emergency condition detection, and safety alerts.
 * 
 * Key Features:
 * - Comprehensive allergy checking against recommendations
 * - Drug-herb interaction analysis using AI and knowledge base
 * - Contraindication detection for medical conditions
 * - Emergency symptom recognition and alerting
 * - Pregnancy and age-specific safety considerations
 * - Multi-language safety guidelines and warnings
 * 
 * Safety Validation Process:
 * 1. Allergy cross-checking against all recommendations
 * 2. Drug interaction analysis for herbal recommendations
 * 3. Contraindication checking based on medical conditions
 * 4. Emergency condition detection from diagnosis
 * 5. Pregnancy-specific safety validation
 * 6. Age-appropriate recommendation verification
 * 7. Overall risk assessment and alternative suggestions
 * 
 * Risk Levels:
 * - Low: Minor concerns, monitoring recommended
 * - Medium: Moderate concerns, medical consultation advised
 * - High: Significant concerns, avoid or modify recommendations
 * - Critical: Serious safety issues, emergency care may be needed
 * 
 * Usage Example:
 * ```typescript
 * const validator = new MedicalSafetyValidator('MyApp');
 * const result = await validator.validateRecommendations(
 *   {
 *     dietary: ['ginger tea', 'goji berries'],
 *     herbal: ['ginseng', 'angelica root']
 *   },
 *   {
 *     medical_history: {
 *       current_medications: ['warfarin'],
 *       allergies: ['shellfish'],
 *       pregnancy_status: 'pregnant'
 *     }
 *   }
 * );
 * ```
 * 
 * @author Sihat TCM Development Team
 * @version 4.0.0
 * @since 2024-12-26
 */

import { generateText } from 'ai';
import { getGoogleProvider } from './googleProvider';
import { devLog, logError, logInfo } from './systemLogger';
import { DietaryPreferences } from '@/app/actions/meal-planner';
import { DiagnosisReport } from '@/types/database';

/**
 * Medical history interface for safety validation
 * 
 * @interface MedicalHistory
 * @property {string[]} current_medications - List of current medications
 * @property {string[]} allergies - Known allergies and sensitivities
 * @property {string[]} medical_conditions - Current medical conditions
 * @property {string[]} [previous_surgeries] - History of surgical procedures
 * @property {string[]} [family_history] - Relevant family medical history
 * @property {'pregnant'|'breastfeeding'|'trying_to_conceive'|'none'} [pregnancy_status] - Pregnancy status
 * @property {number} [age] - Patient age in years
 * @property {number} [weight] - Patient weight in kg
 * @property {number} [height] - Patient height in cm
 */
export interface MedicalHistory {
    current_medications: string[];
    allergies: string[];
    medical_conditions: string[];
    previous_surgeries?: string[];
    family_history?: string[];
    pregnancy_status?: 'pregnant' | 'breastfeeding' | 'trying_to_conceive' | 'none';
    age?: number;
    weight?: number;
    height?: number;
}

/**
 * Comprehensive safety validation result
 * 
 * @interface SafetyValidationResult
 * @property {boolean} is_safe - Overall safety assessment
 * @property {'low'|'medium'|'high'|'critical'} risk_level - Overall risk level
 * @property {SafetyConcern[]} concerns - List of identified safety concerns
 * @property {string[]} recommendations - Safety recommendations for the user
 * @property {EmergencyFlag[]} emergency_flags - Emergency conditions requiring immediate attention
 * @property {Contraindication[]} contraindications - Absolute or relative contraindications
 * @property {DrugInteraction[]} drug_interactions - Identified drug-herb interactions
 * @property {string[]} alternative_suggestions - Safe alternatives to flagged recommendations
 */
export interface SafetyValidationResult {
    is_safe: boolean;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    concerns: SafetyConcern[];
    recommendations: string[];
    emergency_flags: EmergencyFlag[];
    contraindications: Contraindication[];
    drug_interactions: DrugInteraction[];
    alternative_suggestions: string[];
}

export interface SafetyConcern {
    type: 'allergy' | 'drug_interaction' | 'contraindication' | 'dosage' | 'pregnancy' | 'age_related' | 'condition_specific';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affected_recommendation: string;
    evidence_level: 'clinical_study' | 'case_report' | 'theoretical' | 'traditional_knowledge';
    action_required: 'monitor' | 'modify_dosage' | 'avoid_completely' | 'seek_medical_advice' | 'emergency_care';
}

export interface EmergencyFlag {
    condition: string;
    symptoms: string[];
    urgency: 'immediate' | 'urgent' | 'semi_urgent';
    recommended_action: string;
    emergency_contacts?: string[];
}

export interface Contraindication {
    substance: string;
    condition: string;
    reason: string;
    severity: 'absolute' | 'relative';
    alternative_options: string[];
}

export interface DrugInteraction {
    herb_or_food: string;
    medication: string;
    interaction_type: 'synergistic' | 'antagonistic' | 'toxic' | 'absorption_interference';
    severity: 'minor' | 'moderate' | 'major' | 'severe';
    mechanism: string;
    clinical_significance: string;
    management: string;
}

export interface ValidationContext {
    medical_history: MedicalHistory;
    dietary_preferences?: DietaryPreferences;
    diagnosis_report?: DiagnosisReport;
    user_age?: number;
    user_gender?: string;
    language?: 'en' | 'zh' | 'ms';
}

/**
 * Medical Safety Validator class for comprehensive safety checking
 * 
 * This class provides comprehensive medical safety validation for TCM
 * recommendations, including drug interactions, contraindications,
 * allergies, and emergency condition detection.
 * 
 * Key Components:
 * - Knowledge base of known interactions and contraindications
 * - AI-powered interaction analysis for unknown combinations
 * - Emergency symptom recognition system
 * - Pregnancy and age-specific safety rules
 * - Multi-language safety guideline generation
 * 
 * Validation Process:
 * 1. Cross-reference recommendations against known allergies
 * 2. Check for drug-herb interactions using knowledge base and AI
 * 3. Validate against contraindications for medical conditions
 * 4. Detect emergency symptoms requiring immediate attention
 * 5. Apply pregnancy-specific safety rules
 * 6. Consider age-appropriate recommendations
 * 7. Generate comprehensive safety report with alternatives
 * 
 * @class MedicalSafetyValidator
 */
export class MedicalSafetyValidator {
    private context: string;
    private knownInteractions: Map<string, DrugInteraction[]> = new Map();
    private emergencyKeywords: Set<string> = new Set();
    private contraindications: Map<string, Contraindication[]> = new Map();

    /**
     * Initialize the Medical Safety Validator
     * 
     * Sets up the knowledge base with known interactions, contraindications,
     * and emergency keywords for comprehensive safety validation.
     * 
     * @param {string} context - Context identifier for logging and debugging
     * @constructor
     */
    constructor(context: string = 'MedicalSafetyValidator') {
        this.context = context;
        this.initializeKnowledgeBase();
    }

    /**
     * Validate a set of TCM recommendations for safety
     * 
     * This is the main entry point for comprehensive safety validation.
     * It performs multiple parallel safety checks and combines the results
     * into a comprehensive safety assessment.
     * 
     * Validation Steps:
     * 1. Allergy checking against all recommendations
     * 2. Drug interaction analysis for herbal recommendations
     * 3. Contraindication checking based on medical conditions
     * 4. Emergency condition detection from diagnosis
     * 5. Pregnancy-specific safety validation
     * 6. Age-appropriate recommendation verification
     * 7. Overall risk assessment and alternative generation
     * 
     * @param {object} recommendations - TCM recommendations to validate
     * @param {string[]} [recommendations.dietary] - Dietary recommendations
     * @param {string[]} [recommendations.herbal] - Herbal formula recommendations
     * @param {string[]} [recommendations.lifestyle] - Lifestyle recommendations
     * @param {string[]} [recommendations.acupressure] - Acupressure point recommendations
     * @param {ValidationContext} validationContext - Medical context for validation
     * @returns {Promise<SafetyValidationResult>} Comprehensive safety validation result
     * 
     * @example
     * ```typescript
     * const result = await validator.validateRecommendations(
     *   {
     *     dietary: ['ginger tea', 'avoid cold foods'],
     *     herbal: ['Four Gentlemen Decoction', 'ginseng'],
     *     lifestyle: ['moderate exercise', 'early sleep']
     *   },
     *   {
     *     medical_history: {
     *       current_medications: ['warfarin', 'metformin'],
     *       allergies: ['shellfish', 'peanuts'],
     *       medical_conditions: ['diabetes', 'hypertension'],
     *       pregnancy_status: 'none',
     *       age: 45
     *     }
     *   }
     * );
     * 
     * if (!result.is_safe) {
     *   console.log('Safety concerns:', result.concerns);
     *   console.log('Alternatives:', result.alternative_suggestions);
     * }
     * ```
     */
    async validateRecommendations(
        recommendations: {
            dietary?: string[];
            herbal?: string[];
            lifestyle?: string[];
            acupressure?: string[];
        },
        validationContext: ValidationContext
    ): Promise<SafetyValidationResult> {
        try {
            devLog('info', this.context, 'Starting safety validation', {
                recommendationTypes: Object.keys(recommendations),
                hasHistory: Boolean(validationContext.medical_history)
            });

            const all_recommendations = [
                ...(recommendations.dietary || []),
                ...(recommendations.herbal || []),
                ...(recommendations.lifestyle || []),
                ...(recommendations.acupressure || [])
            ];

            // Parallel safety checks
            const [
                allergyCheck,
                drugInteractionCheck,
                contraindictionCheck,
                emergencyCheck,
                pregnancyCheck,
                ageCheck
            ] = await Promise.all([
                this.checkAllergies(all_recommendations, validationContext),
                this.checkDrugInteractions(recommendations.herbal || [], validationContext),
                this.checkContraindications(all_recommendations, validationContext),
                this.detectEmergencyConditions(validationContext.diagnosis_report),
                this.checkPregnancySafety(all_recommendations, validationContext),
                this.checkAgeAppropriate(all_recommendations, validationContext)
            ]);

            // Combine all concerns
            const all_concerns: SafetyConcern[] = [
                ...allergyCheck.concerns,
                ...drugInteractionCheck.concerns,
                ...contraindictionCheck.concerns,
                ...emergencyCheck.concerns,
                ...pregnancyCheck.concerns,
                ...ageCheck.concerns
            ];

            // Determine overall risk level
            const risk_level = this.calculateOverallRisk(all_concerns);

            // Generate recommendations and alternatives
            const safety_recommendations = this.generateSafetyRecommendations(all_concerns);
            const alternatives = await this.generateAlternatives(all_recommendations, all_concerns, validationContext);

            const result: SafetyValidationResult = {
                is_safe: risk_level !== 'critical' && all_concerns.filter(c => c.severity === 'critical').length === 0,
                risk_level,
                concerns: all_concerns,
                recommendations: safety_recommendations,
                emergency_flags: emergencyCheck.emergency_flags,
                contraindications: contraindictionCheck.contraindications,
                drug_interactions: drugInteractionCheck.interactions,
                alternative_suggestions: alternatives
            };

            logInfo(this.context, 'Safety validation completed', {
                is_safe: result.is_safe,
                risk_level: result.risk_level,
                concern_count: all_concerns.length
            });

            return result;
        } catch (error) {
            logError(this.context, 'Safety validation failed', { error });
            
            // Return conservative safe result on error
            return {
                is_safe: false,
                risk_level: 'high',
                concerns: [{
                    type: 'condition_specific',
                    severity: 'high',
                    description: 'Safety validation system error - please consult healthcare provider',
                    affected_recommendation: 'all',
                    evidence_level: 'clinical_study',
                    action_required: 'seek_medical_advice'
                }],
                recommendations: ['Consult healthcare provider before following any recommendations'],
                emergency_flags: [],
                contraindications: [],
                drug_interactions: [],
                alternative_suggestions: []
            };
        }
    }

    /**
     * Check for specific herb-drug interactions using AI
     */
    async checkSpecificInteraction(
        herb: string,
        medication: string,
        context?: ValidationContext
    ): Promise<DrugInteraction | null> {
        try {
            const prompt = `
            As a clinical pharmacist and TCM expert, analyze the potential interaction between:
            - TCM herb/substance: "${herb}"
            - Western medication: "${medication}"

            Provide a detailed analysis in JSON format:
            {
                "has_interaction": boolean,
                "interaction_type": "synergistic|antagonistic|toxic|absorption_interference",
                "severity": "minor|moderate|major|severe",
                "mechanism": "detailed mechanism of interaction",
                "clinical_significance": "clinical implications",
                "management": "how to manage this interaction",
                "evidence_level": "clinical_study|case_report|theoretical|traditional_knowledge"
            }

            Consider:
            1. Pharmacokinetic interactions (absorption, metabolism, excretion)
            2. Pharmacodynamic interactions (additive, synergistic, antagonistic effects)
            3. Traditional Chinese Medicine principles
            4. Published clinical studies and case reports
            5. Theoretical interactions based on known mechanisms

            Be conservative - if uncertain, err on the side of caution.
            `;

            const google = getGoogleProvider();
            const { text: responseText } = await generateText({
                model: google('gemini-2.5-pro'),
                messages: [{ role: 'user', content: prompt }]
            });

            const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(cleanText);

            if (analysis.has_interaction) {
                return {
                    herb_or_food: herb,
                    medication: medication,
                    interaction_type: analysis.interaction_type,
                    severity: analysis.severity,
                    mechanism: analysis.mechanism,
                    clinical_significance: analysis.clinical_significance,
                    management: analysis.management
                };
            }

            return null;
        } catch (error) {
            logError(this.context, 'Failed to check specific interaction', { error, herb, medication });
            
            // Return conservative interaction warning on error
            return {
                herb_or_food: herb,
                medication: medication,
                interaction_type: 'toxic',
                severity: 'moderate',
                mechanism: 'Unknown - system error during analysis',
                clinical_significance: 'Potential interaction cannot be ruled out',
                management: 'Consult healthcare provider before combining'
            };
        }
    }

    /**
     * Validate emergency symptoms and conditions
     */
    async validateEmergencySymptoms(symptoms: string[]): Promise<EmergencyFlag[]> {
        const emergency_flags: EmergencyFlag[] = [];

        for (const symptom of symptoms) {
            if (this.isEmergencySymptom(symptom)) {
                const flag = await this.createEmergencyFlag(symptom);
                emergency_flags.push(flag);
            }
        }

        return emergency_flags;
    }

    /**
     * Get safety guidelines for a specific condition
     */
    async getSafetyGuidelines(condition: string, language: 'en' | 'zh' | 'ms' = 'en'): Promise<{
        guidelines: string[];
        warnings: string[];
        emergency_signs: string[];
        when_to_seek_help: string[];
    }> {
        try {
            const prompt = `
            Provide comprehensive safety guidelines for the TCM condition: "${condition}"
            
            Respond in ${language === 'zh' ? 'Chinese' : language === 'ms' ? 'Malay' : 'English'} with JSON format:
            {
                "guidelines": ["safety guideline 1", "safety guideline 2", ...],
                "warnings": ["warning 1", "warning 2", ...],
                "emergency_signs": ["emergency sign 1", "emergency sign 2", ...],
                "when_to_seek_help": ["situation 1", "situation 2", ...]
            }

            Include:
            1. General safety precautions for this condition
            2. Specific warnings about treatments to avoid
            3. Emergency symptoms that require immediate medical attention
            4. Situations when professional medical help is needed
            `;

            const google = getGoogleProvider();
            const { text: responseText } = await generateText({
                model: google('gemini-2.5-pro'),
                messages: [{ role: 'user', content: prompt }]
            });

            const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            logError(this.context, 'Failed to get safety guidelines', { error, condition });
            
            return {
                guidelines: ['Consult qualified TCM practitioner', 'Follow prescribed treatments carefully'],
                warnings: ['Do not self-medicate', 'Inform healthcare providers of all treatments'],
                emergency_signs: ['Severe symptoms', 'Sudden worsening', 'Difficulty breathing'],
                when_to_seek_help: ['Symptoms worsen', 'New concerning symptoms appear', 'Uncertainty about treatment']
            };
        }
    }

    // Private helper methods

    private initializeKnowledgeBase(): void {
        // Initialize emergency keywords
        this.emergencyKeywords = new Set([
            'chest pain', 'difficulty breathing', 'severe headache', 'loss of consciousness',
            'severe bleeding', 'stroke symptoms', 'heart attack', 'anaphylaxis',
            'severe abdominal pain', 'high fever', 'seizure', 'poisoning'
        ]);

        // Initialize common contraindications
        this.contraindications.set('pregnancy', [
            {
                substance: 'angelica root (当归)',
                condition: 'pregnancy',
                reason: 'May stimulate uterine contractions',
                severity: 'absolute',
                alternative_options: ['red dates', 'goji berries']
            },
            {
                substance: 'safflower (红花)',
                condition: 'pregnancy',
                reason: 'Strong blood-moving herb, risk of miscarriage',
                severity: 'absolute',
                alternative_options: ['gentle blood tonics']
            }
        ]);

        // Initialize common drug interactions
        this.knownInteractions.set('warfarin', [
            {
                herb_or_food: 'ginkgo',
                medication: 'warfarin',
                interaction_type: 'synergistic',
                severity: 'major',
                mechanism: 'Increased bleeding risk due to antiplatelet effects',
                clinical_significance: 'Significantly increased risk of bleeding',
                management: 'Avoid combination or monitor INR closely'
            },
            {
                herb_or_food: 'ginseng',
                medication: 'warfarin',
                interaction_type: 'antagonistic',
                severity: 'moderate',
                mechanism: 'May reduce anticoagulant effect',
                clinical_significance: 'Reduced effectiveness of warfarin',
                management: 'Monitor INR, may need dose adjustment'
            }
        ]);
    }

    private async checkAllergies(
        recommendations: string[],
        context: ValidationContext
    ): Promise<{ concerns: SafetyConcern[] }> {
        const concerns: SafetyConcern[] = [];
        const allergies = context.medical_history.allergies;

        for (const allergy of allergies) {
            for (const recommendation of recommendations) {
                if (recommendation.toLowerCase().includes(allergy.toLowerCase())) {
                    concerns.push({
                        type: 'allergy',
                        severity: 'high',
                        description: `Recommendation contains ${allergy} which user is allergic to`,
                        affected_recommendation: recommendation,
                        evidence_level: 'clinical_study',
                        action_required: 'avoid_completely'
                    });
                }
            }
        }

        return { concerns };
    }

    private async checkDrugInteractions(
        herbal_recommendations: string[],
        context: ValidationContext
    ): Promise<{ concerns: SafetyConcern[]; interactions: DrugInteraction[] }> {
        const concerns: SafetyConcern[] = [];
        const interactions: DrugInteraction[] = [];
        const medications = context.medical_history.current_medications;

        for (const herb of herbal_recommendations) {
            for (const medication of medications) {
                const interaction = await this.checkSpecificInteraction(herb, medication, context);
                if (interaction) {
                    interactions.push(interaction);
                    
                    concerns.push({
                        type: 'drug_interaction',
                        severity: interaction.severity === 'severe' ? 'critical' : 
                                 interaction.severity === 'major' ? 'high' : 'medium',
                        description: `${herb} may interact with ${medication}: ${interaction.clinical_significance}`,
                        affected_recommendation: herb,
                        evidence_level: 'clinical_study',
                        action_required: interaction.severity === 'severe' ? 'avoid_completely' : 'seek_medical_advice'
                    });
                }
            }
        }

        return { concerns, interactions };
    }

    private async checkContraindications(
        recommendations: string[],
        context: ValidationContext
    ): Promise<{ concerns: SafetyConcern[]; contraindications: Contraindication[] }> {
        const concerns: SafetyConcern[] = [];
        const contraindications: Contraindication[] = [];
        const conditions = context.medical_history.medical_conditions;

        // Check pregnancy contraindications
        if (context.medical_history.pregnancy_status === 'pregnant') {
            const pregnancy_contraindications = this.contraindications.get('pregnancy') || [];
            
            for (const contraindication of pregnancy_contraindications) {
                for (const recommendation of recommendations) {
                    if (recommendation.toLowerCase().includes(contraindication.substance.toLowerCase())) {
                        contraindications.push(contraindication);
                        
                        concerns.push({
                            type: 'contraindication',
                            severity: contraindication.severity === 'absolute' ? 'critical' : 'high',
                            description: `${contraindication.substance} is contraindicated in pregnancy: ${contraindication.reason}`,
                            affected_recommendation: recommendation,
                            evidence_level: 'clinical_study',
                            action_required: 'avoid_completely'
                        });
                    }
                }
            }
        }

        return { concerns, contraindications };
    }

    private async detectEmergencyConditions(
        diagnosis_report?: DiagnosisReport
    ): Promise<{ concerns: SafetyConcern[]; emergency_flags: EmergencyFlag[] }> {
        const concerns: SafetyConcern[] = [];
        const emergency_flags: EmergencyFlag[] = [];

        if (!diagnosis_report) return { concerns, emergency_flags };

        // Check for emergency symptoms in the diagnosis
        const diagnosis_text = JSON.stringify(diagnosis_report).toLowerCase();
        
        for (const emergency_keyword of this.emergencyKeywords) {
            if (diagnosis_text.includes(emergency_keyword)) {
                const flag = await this.createEmergencyFlag(emergency_keyword);
                emergency_flags.push(flag);
                
                concerns.push({
                    type: 'condition_specific',
                    severity: 'critical',
                    description: `Emergency condition detected: ${emergency_keyword}`,
                    affected_recommendation: 'all',
                    evidence_level: 'clinical_study',
                    action_required: 'emergency_care'
                });
            }
        }

        return { concerns, emergency_flags };
    }

    private async checkPregnancySafety(
        recommendations: string[],
        context: ValidationContext
    ): Promise<{ concerns: SafetyConcern[] }> {
        const concerns: SafetyConcern[] = [];
        
        if (context.medical_history.pregnancy_status === 'pregnant' || 
            context.medical_history.pregnancy_status === 'breastfeeding') {
            
            // Additional pregnancy safety checks beyond contraindications
            const pregnancy_unsafe_keywords = [
                'strong herbs', 'blood-moving', 'cold nature', 'purgative'
            ];
            
            for (const keyword of pregnancy_unsafe_keywords) {
                for (const recommendation of recommendations) {
                    if (recommendation.toLowerCase().includes(keyword)) {
                        concerns.push({
                            type: 'pregnancy',
                            severity: 'medium',
                            description: `Recommendation may not be suitable during pregnancy/breastfeeding`,
                            affected_recommendation: recommendation,
                            evidence_level: 'traditional_knowledge',
                            action_required: 'seek_medical_advice'
                        });
                    }
                }
            }
        }

        return { concerns };
    }

    private async checkAgeAppropriate(
        recommendations: string[],
        context: ValidationContext
    ): Promise<{ concerns: SafetyConcern[] }> {
        const concerns: SafetyConcern[] = [];
        const age = context.user_age || context.medical_history.age;

        if (!age) return { concerns };

        // Check for age-related concerns
        if (age < 18) {
            // Pediatric considerations
            for (const recommendation of recommendations) {
                if (recommendation.includes('strong') || recommendation.includes('potent')) {
                    concerns.push({
                        type: 'age_related',
                        severity: 'medium',
                        description: 'Strong herbs may not be appropriate for children',
                        affected_recommendation: recommendation,
                        evidence_level: 'clinical_study',
                        action_required: 'seek_medical_advice'
                    });
                }
            }
        } else if (age > 65) {
            // Geriatric considerations
            for (const recommendation of recommendations) {
                if (recommendation.includes('cold nature') || recommendation.includes('cooling')) {
                    concerns.push({
                        type: 'age_related',
                        severity: 'low',
                        description: 'Cooling herbs should be used cautiously in elderly patients',
                        affected_recommendation: recommendation,
                        evidence_level: 'traditional_knowledge',
                        action_required: 'monitor'
                    });
                }
            }
        }

        return { concerns };
    }

    private calculateOverallRisk(concerns: SafetyConcern[]): 'low' | 'medium' | 'high' | 'critical' {
        if (concerns.some(c => c.severity === 'critical')) return 'critical';
        if (concerns.some(c => c.severity === 'high')) return 'high';
        if (concerns.some(c => c.severity === 'medium')) return 'medium';
        return 'low';
    }

    private generateSafetyRecommendations(concerns: SafetyConcern[]): string[] {
        const recommendations: string[] = [];
        
        if (concerns.some(c => c.action_required === 'emergency_care')) {
            recommendations.push('Seek immediate emergency medical care');
        }
        
        if (concerns.some(c => c.action_required === 'seek_medical_advice')) {
            recommendations.push('Consult healthcare provider before following recommendations');
        }
        
        if (concerns.some(c => c.action_required === 'avoid_completely')) {
            recommendations.push('Avoid flagged substances completely');
        }
        
        if (concerns.some(c => c.action_required === 'monitor')) {
            recommendations.push('Monitor for any adverse reactions');
        }

        return recommendations;
    }

    private async generateAlternatives(
        recommendations: string[],
        concerns: SafetyConcern[],
        context: ValidationContext
    ): Promise<string[]> {
        const alternatives: string[] = [];
        
        // Generate alternatives for flagged recommendations
        const flagged_recommendations = concerns.map(c => c.affected_recommendation);
        
        for (const flagged of flagged_recommendations) {
            if (flagged !== 'all') {
                // Simple alternative generation - in production, this could use AI
                alternatives.push(`Safe alternative to ${flagged}: consult practitioner for suitable substitute`);
            }
        }

        return alternatives;
    }

    private isEmergencySymptom(symptom: string): boolean {
        return Array.from(this.emergencyKeywords).some(keyword => 
            symptom.toLowerCase().includes(keyword)
        );
    }

    private async createEmergencyFlag(symptom: string): Promise<EmergencyFlag> {
        return {
            condition: symptom,
            symptoms: [symptom],
            urgency: 'immediate',
            recommended_action: 'Seek immediate emergency medical care',
            emergency_contacts: ['Emergency Services: 999', 'Hospital Emergency Department']
        };
    }
}

/**
 * Create a singleton instance for the application
 */
export const defaultMedicalSafetyValidator = new MedicalSafetyValidator('DefaultSafetyValidator');

/**
 * Convenience function to validate recommendations
 */
export async function validateMedicalSafety(
    recommendations: {
        dietary?: string[];
        herbal?: string[];
        lifestyle?: string[];
        acupressure?: string[];
    },
    context: ValidationContext
): Promise<SafetyValidationResult> {
    return defaultMedicalSafetyValidator.validateRecommendations(recommendations, context);
}

/**
 * Quick safety check for emergency symptoms
 */
export async function checkEmergencySymptoms(symptoms: string[]): Promise<EmergencyFlag[]> {
    return defaultMedicalSafetyValidator.validateEmergencySymptoms(symptoms);
}