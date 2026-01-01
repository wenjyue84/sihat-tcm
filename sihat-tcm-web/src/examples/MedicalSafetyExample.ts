/**
 * Medical Safety System Example
 * 
 * Demonstrates how to use the new modular medical safety validation system.
 * Shows various validation scenarios and best practices.
 */

import {
  SafetyValidator,
  validateMedicalSafety,
  checkEmergencySymptoms,
  checkDrugHerbInteraction,
  getSafetyGuidelines,
  type ValidationContext,
  type RecommendationsToValidate,
  type SafetyValidationResult
} from '../lib/medical-safety';

/**
 * Example 1: Basic Safety Validation
 */
export async function basicSafetyValidationExample(): Promise<void> {
  console.log('=== Basic Safety Validation Example ===');

  const recommendations: RecommendationsToValidate = {
    dietary: ['ginger tea', 'avoid cold foods', 'warm soups'],
    herbal: ['Four Gentlemen Decoction', 'ginseng', 'licorice root'],
    lifestyle: ['moderate exercise', 'early sleep', 'stress reduction'],
    acupressure: ['Yintang point', 'Shenmen point']
  };

  const validationContext: ValidationContext = {
    medical_history: {
      current_medications: ['warfarin', 'metformin'],
      allergies: ['shellfish', 'peanuts'],
      medical_conditions: ['diabetes', 'hypertension'],
      pregnancy_status: 'none',
      age: 45
    },
    user_age: 45,
    language: 'en'
  };

  try {
    const result = await validateMedicalSafety(recommendations, validationContext);
    
    console.log('Safety Assessment:', {
      is_safe: result.is_safe,
      risk_level: result.risk_level,
      concern_count: result.concerns.length
    });

    if (!result.is_safe) {
      console.log('Safety Concerns:');
      result.concerns.forEach((concern, index) => {
        console.log(`  ${index + 1}. ${concern.description} (${concern.severity})`);
      });

      console.log('Recommendations:');
      result.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  } catch (error) {
    console.error('Safety validation failed:', error);
  }
}

/**
 * Example 2: Pregnancy Safety Validation
 */
export async function pregnancySafetyExample(): Promise<void> {
  console.log('\n=== Pregnancy Safety Validation Example ===');

  const recommendations: RecommendationsToValidate = {
    dietary: ['ginger tea for nausea', 'red dates', 'avoid raw foods'],
    herbal: ['angelica root', 'safflower', 'gentle tonics'],
    lifestyle: ['prenatal yoga', 'adequate rest']
  };

  const pregnancyContext: ValidationContext = {
    medical_history: {
      current_medications: ['prenatal vitamins'],
      allergies: [],
      medical_conditions: [],
      pregnancy_status: 'pregnant',
      age: 28
    },
    language: 'en'
  };

  const result = await validateMedicalSafety(recommendations, pregnancyContext);
  
  console.log('Pregnancy Safety Assessment:', {
    is_safe: result.is_safe,
    risk_level: result.risk_level,
    contraindications: result.contraindications.length
  });

  if (result.contraindications.length > 0) {
    console.log('Pregnancy Contraindications:');
    result.contraindications.forEach((contra, index) => {
      console.log(`  ${index + 1}. ${contra.substance}: ${contra.reason}`);
      console.log(`     Alternatives: ${contra.alternative_options.join(', ')}`);
    });
  }
}

/**
 * Example 3: Drug Interaction Analysis
 */
export async function drugInteractionExample(): Promise<void> {
  console.log('\n=== Drug Interaction Analysis Example ===');

  // Check specific interactions
  const interactions = [
    { herb: 'ginkgo', medication: 'warfarin' },
    { herb: 'ginseng', medication: 'warfarin' },
    { herb: 'licorice', medication: 'digoxin' },
    { herb: 'bitter melon', medication: 'metformin' }
  ];

  for (const { herb, medication } of interactions) {
    const interaction = await checkDrugHerbInteraction(herb, medication);
    
    if (interaction) {
      console.log(`Interaction Found: ${herb} + ${medication}`);
      console.log(`  Type: ${interaction.interaction_type}`);
      console.log(`  Severity: ${interaction.severity}`);
      console.log(`  Management: ${interaction.management}`);
    } else {
      console.log(`No significant interaction: ${herb} + ${medication}`);
    }
  }
}

/**
 * Example 4: Emergency Symptom Detection
 */
export async function emergencyDetectionExample(): Promise<void> {
  console.log('\n=== Emergency Symptom Detection Example ===');

  const symptoms = [
    'chest pain',
    'difficulty breathing',
    'severe headache',
    'mild fatigue',
    'loss of consciousness'
  ];

  const emergencyFlags = await checkEmergencySymptoms(symptoms);
  
  if (emergencyFlags.length > 0) {
    console.log('Emergency Conditions Detected:');
    emergencyFlags.forEach((flag, index) => {
      console.log(`  ${index + 1}. ${flag.condition} (${flag.urgency})`);
      console.log(`     Action: ${flag.recommended_action}`);
    });
  } else {
    console.log('No emergency conditions detected');
  }
}

/**
 * Example 5: Safety Guidelines
 */
export async function safetyGuidelinesExample(): Promise<void> {
  console.log('\n=== Safety Guidelines Example ===');

  const conditions = ['hypertension', 'diabetes', 'pregnancy'];
  
  for (const condition of conditions) {
    const guidelines = await getSafetyGuidelines(condition, 'en');
    
    console.log(`\nSafety Guidelines for ${condition}:`);
    console.log('Guidelines:', guidelines.guidelines.slice(0, 2));
    console.log('Warnings:', guidelines.warnings.slice(0, 2));
    console.log('Emergency Signs:', guidelines.emergency_signs.slice(0, 2));
  }
}

/**
 * Example 6: Advanced Safety Validator Usage
 */
export async function advancedValidatorExample(): Promise<void> {
  console.log('\n=== Advanced Safety Validator Example ===');

  // Create custom validator instance
  const validator = new SafetyValidator('CustomValidator');

  const complexRecommendations: RecommendationsToValidate = {
    dietary: ['goji berries', 'green tea', 'avoid dairy'],
    herbal: ['reishi mushroom', 'astragalus', 'schisandra'],
    lifestyle: ['qigong practice', 'meditation', 'cold exposure therapy'],
    acupressure: ['Baihui point', 'Kidney 3 point']
  };

  const elderlyContext: ValidationContext = {
    medical_history: {
      current_medications: ['lisinopril', 'atorvastatin', 'aspirin'],
      allergies: ['latex'],
      medical_conditions: ['heart disease', 'high cholesterol'],
      age: 72
    },
    user_age: 72,
    language: 'en'
  };

  const result = await validator.validateRecommendations(
    complexRecommendations,
    elderlyContext
  );

  console.log('Advanced Validation Results:');
  console.log(`  Overall Safety: ${result.is_safe}`);
  console.log(`  Risk Level: ${result.risk_level}`);
  console.log(`  Total Concerns: ${result.concerns.length}`);
  console.log(`  Drug Interactions: ${result.drug_interactions.length}`);
  console.log(`  Alternative Suggestions: ${result.alternative_suggestions.length}`);

  // Get validation statistics
  const stats = validator.getValidationStats();
  console.log('\nValidator Statistics:', {
    drugInteractions: stats.drugInteraction.totalInteractions,
    contraindications: stats.contraindication.totalContraindications,
    emergencyKeywords: stats.emergency.totalKeywords
  });
}

/**
 * Example 7: Multi-language Safety Guidelines
 */
export async function multiLanguageExample(): Promise<void> {
  console.log('\n=== Multi-language Safety Guidelines Example ===');

  const condition = 'hypertension';
  const languages: Array<'en' | 'zh' | 'ms'> = ['en', 'zh', 'ms'];

  for (const language of languages) {
    try {
      const guidelines = await getSafetyGuidelines(condition, language);
      console.log(`\n${condition} guidelines in ${language}:`);
      console.log('First guideline:', guidelines.guidelines[0]);
      console.log('First warning:', guidelines.warnings[0]);
    } catch (error) {
      console.error(`Failed to get guidelines in ${language}:`, error);
    }
  }
}

/**
 * Run all examples
 */
export async function runAllMedicalSafetyExamples(): Promise<void> {
  console.log('🏥 Medical Safety System Examples\n');

  try {
    await basicSafetyValidationExample();
    await pregnancySafetyExample();
    await drugInteractionExample();
    await emergencyDetectionExample();
    await safetyGuidelinesExample();
    await advancedValidatorExample();
    await multiLanguageExample();
    
    console.log('\n✅ All medical safety examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running medical safety examples:', error);
  }
}

// Export for use in other files
export const medicalSafetyExamples = {
  basicSafetyValidationExample,
  pregnancySafetyExample,
  drugInteractionExample,
  emergencyDetectionExample,
  safetyGuidelinesExample,
  advancedValidatorExample,
  multiLanguageExample,
  runAllMedicalSafetyExamples
};