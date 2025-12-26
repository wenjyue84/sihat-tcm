/**
 * Medical Data Generators for Property-Based Testing
 * 
 * This module provides fast-check arbitraries for generating realistic
 * medical and TCM-related test data for property-based testing.
 */

import * as fc from 'fast-check'

// Basic demographic data generators
export const arbitraries = {
  // Age ranges for different demographics
  age: {
    child: fc.integer({ min: 1, max: 12 }),
    teen: fc.integer({ min: 13, max: 17 }),
    adult: fc.integer({ min: 18, max: 64 }),
    elderly: fc.integer({ min: 65, max: 100 }),
    any: fc.integer({ min: 1, max: 100 })
  },

  // Gender options
  gender: fc.constantFrom('male', 'female', 'other', 'prefer_not_to_say'),

  // Language codes supported by the system
  language: fc.constantFrom('en', 'zh', 'ms'),

  // Pregnancy status options
  pregnancyStatus: fc.constantFrom('none', 'pregnant', 'breastfeeding', 'trying_to_conceive'),

  // Common medical conditions
  medicalConditions: fc.array(
    fc.constantFrom(
      'diabetes',
      'hypertension',
      'heart_disease',
      'asthma',
      'arthritis',
      'depression',
      'anxiety',
      'migraine',
      'insomnia',
      'digestive_issues',
      'chronic_fatigue',
      'allergic_rhinitis'
    ),
    { minLength: 0, maxLength: 5 }
  ),

  // Common medications
  medications: fc.array(
    fc.constantFrom(
      'warfarin',
      'metformin',
      'lisinopril',
      'amlodipine',
      'atorvastatin',
      'omeprazole',
      'levothyroxine',
      'metoprolol',
      'losartan',
      'hydrochlorothiazide',
      'aspirin',
      'ibuprofen'
    ),
    { minLength: 0, maxLength: 8 }
  ),

  // Common allergies
  allergies: fc.array(
    fc.constantFrom(
      'peanuts',
      'tree_nuts',
      'shellfish',
      'fish',
      'eggs',
      'milk',
      'soy',
      'wheat',
      'penicillin',
      'sulfa_drugs',
      'latex',
      'pollen',
      'dust_mites',
      'pet_dander'
    ),
    { minLength: 0, maxLength: 6 }
  ),

  // TCM Constitution types
  tcmConstitution: fc.constantFrom(
    'balanced',
    'qi_deficiency',
    'yang_deficiency',
    'yin_deficiency',
    'phlegm_dampness',
    'damp_heat',
    'blood_stasis',
    'qi_stagnation',
    'special_diathesis'
  ),

  // TCM Symptoms
  tcmSymptoms: fc.array(
    fc.constantFrom(
      'fatigue',
      'insomnia',
      'headache',
      'dizziness',
      'cold_hands_feet',
      'hot_flashes',
      'night_sweats',
      'digestive_issues',
      'bloating',
      'constipation',
      'diarrhea',
      'irregular_menstruation',
      'mood_swings',
      'anxiety',
      'depression',
      'joint_pain',
      'muscle_tension',
      'dry_skin',
      'oily_skin',
      'frequent_urination',
      'thirst',
      'poor_appetite',
      'food_cravings'
    ),
    { minLength: 1, maxLength: 10 }
  ),

  // Dietary preferences and restrictions
  dietaryRestrictions: fc.array(
    fc.constantFrom(
      'vegetarian',
      'vegan',
      'halal',
      'kosher',
      'gluten_free',
      'dairy_free',
      'nut_free',
      'low_sodium',
      'low_sugar',
      'keto',
      'paleo',
      'mediterranean'
    ),
    { minLength: 0, maxLength: 4 }
  ),

  // Health metrics
  healthMetrics: {
    bmi: fc.float({ min: 15.0, max: 50.0 }),
    bloodPressure: {
      systolic: fc.integer({ min: 80, max: 200 }),
      diastolic: fc.integer({ min: 50, max: 120 })
    },
    heartRate: fc.integer({ min: 40, max: 150 }),
    temperature: fc.float({ min: 35.0, max: 42.0 }),
    oxygenSaturation: fc.integer({ min: 85, max: 100 }),
    bloodSugar: fc.float({ min: 3.0, max: 25.0 })
  },

  // Image quality metrics
  imageQuality: {
    score: fc.integer({ min: 0, max: 100 }),
    brightness: fc.float({ min: 0, max: 255 }),
    contrast: fc.float({ min: 0, max: 2 }),
    sharpness: fc.float({ min: 0, max: 1 }),
    resolution: {
      width: fc.integer({ min: 100, max: 4000 }),
      height: fc.integer({ min: 100, max: 4000 })
    }
  },

  // Diagnosis session data
  diagnosisSession: {
    stepProgress: fc.integer({ min: 0, max: 100 }),
    completedSteps: fc.array(
      fc.constantFrom(
        'basic_info',
        'inquiry',
        'observation_face',
        'observation_tongue',
        'observation_body',
        'audio_analysis',
        'pulse_check',
        'smart_connect',
        'upload_reports',
        'upload_medicine'
      ),
      { minLength: 0, maxLength: 10 }
    ),
    sessionDuration: fc.integer({ min: 60, max: 3600 }) // seconds
  },

  // Treatment recommendations
  treatmentRecommendations: {
    dietary: fc.array(
      fc.constantFrom(
        'green tea',
        'ginger tea',
        'warm water',
        'steamed vegetables',
        'lean protein',
        'whole grains',
        'fresh fruits',
        'nuts and seeds',
        'herbal soup',
        'congee',
        'avoid cold drinks',
        'avoid spicy food',
        'avoid dairy',
        'avoid processed food'
      ),
      { minLength: 1, maxLength: 8 }
    ),
    herbal: fc.array(
      fc.constantFrom(
        'ginseng',
        'goji berries',
        'chrysanthemum',
        'licorice root',
        'astragalus',
        'rehmannia',
        'angelica root',
        'peony root',
        'schisandra',
        'cordyceps',
        'reishi mushroom',
        'turmeric'
      ),
      { minLength: 0, maxLength: 6 }
    ),
    lifestyle: fc.array(
      fc.constantFrom(
        'regular sleep schedule',
        'moderate exercise',
        'stress management',
        'meditation',
        'deep breathing',
        'gentle yoga',
        'tai chi',
        'qigong',
        'adequate rest',
        'avoid overwork',
        'maintain work-life balance'
      ),
      { minLength: 1, maxLength: 6 }
    ),
    acupressure: fc.array(
      fc.constantFrom(
        'yintang point massage',
        'shenmen point pressure',
        'baihui point stimulation',
        'zusanli point massage',
        'taichong point pressure',
        'hegu point stimulation',
        'foot reflexology',
        'hand reflexology',
        'ear massage',
        'scalp massage'
      ),
      { minLength: 0, maxLength: 4 }
    )
  },

  // AI model responses
  aiModelResponse: {
    confidence: fc.float({ min: 0, max: 1 }),
    responseTime: fc.integer({ min: 100, max: 30000 }), // milliseconds
    modelUsed: fc.constantFrom('gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-3-pro-preview'),
    tokenCount: fc.integer({ min: 50, max: 8000 })
  },

  // Device and platform data
  platform: {
    type: fc.constantFrom('web', 'mobile', 'tablet'),
    os: fc.constantFrom('windows', 'macos', 'linux', 'ios', 'android'),
    browser: fc.constantFrom('chrome', 'firefox', 'safari', 'edge'),
    screenSize: {
      width: fc.integer({ min: 320, max: 3840 }),
      height: fc.integer({ min: 568, max: 2160 })
    },
    isOnline: fc.boolean(),
    networkSpeed: fc.constantFrom('slow', 'medium', 'fast')
  }
}

// Complex medical history generator (without age - will be set by parent)
export const medicalHistoryArbitrary = fc.record({
  current_medications: arbitraries.medications,
  allergies: arbitraries.allergies,
  medical_conditions: arbitraries.medicalConditions,
  pregnancy_status: arbitraries.pregnancyStatus
})

// Patient profile generator with consistent age
export const patientProfileArbitrary = fc.record({
  id: fc.uuid(),
  age: arbitraries.age.any,
  gender: arbitraries.gender,
  tcm_constitution: arbitraries.tcmConstitution,
  dietary_restrictions: arbitraries.dietaryRestrictions,
  language_preference: arbitraries.language,
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  last_consultation: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() }))
}).chain(profile => 
  // Add medical history with consistent age
  medicalHistoryArbitrary.map(medicalHistory => ({
    ...profile,
    medical_history: {
      ...medicalHistory,
      age: profile.age // Ensure age consistency
    }
  }))
)

// Diagnosis session generator
export const diagnosisSessionArbitrary = fc.record({
  id: fc.uuid(),
  patient_id: fc.uuid(),
  progress: arbitraries.diagnosisSession.stepProgress,
  completed_steps: arbitraries.diagnosisSession.completedSteps,
  current_step: fc.constantFrom(
    'basic_info',
    'inquiry',
    'observation',
    'palpation',
    'analysis',
    'results'
  ),
  session_data: fc.record({
    basic_info: fc.option(fc.record({
      age: arbitraries.age.any,
      gender: arbitraries.gender,
      height: fc.integer({ min: 100, max: 220 }),
      weight: fc.integer({ min: 30, max: 200 })
    })),
    symptoms: fc.option(arbitraries.tcmSymptoms),
    images: fc.option(fc.record({
      face: fc.option(fc.webUrl()),
      tongue: fc.option(fc.webUrl()),
      body: fc.option(fc.webUrl())
    }))
  }),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() })
})

// Treatment recommendation generator
export const treatmentRecommendationArbitrary = fc.record({
  id: fc.uuid(),
  patient_id: fc.uuid(),
  session_id: fc.uuid(),
  recommendations: fc.record(arbitraries.treatmentRecommendations),
  confidence_score: arbitraries.aiModelResponse.confidence,
  ai_model_used: arbitraries.aiModelResponse.modelUsed,
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  practitioner_reviewed: fc.boolean(),
  patient_feedback: fc.option(fc.record({
    rating: fc.integer({ min: 1, max: 5 }),
    comments: fc.option(fc.lorem({ maxCount: 50 }))
  }))
})

// Health time series data generator
export const healthTimeSeriesArbitrary = fc.record({
  patient_id: fc.uuid(),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  data_type: fc.constantFrom(
    'heart_rate',
    'blood_pressure',
    'temperature',
    'weight',
    'sleep_hours',
    'steps',
    'mood_score',
    'energy_level',
    'stress_level'
  ),
  value: fc.oneof(
    fc.float({ min: 0, max: 1000 }),
    fc.integer({ min: 0, max: 1000 }),
    fc.string()
  ),
  source: fc.constantFrom('manual', 'wearable', 'iot', 'ai_derived'),
  confidence: arbitraries.aiModelResponse.confidence,
  metadata: fc.record({
    device_id: fc.option(fc.uuid()),
    measurement_context: fc.option(fc.constantFrom('rest', 'exercise', 'sleep', 'stress')),
    notes: fc.option(fc.lorem({ maxCount: 20 }))
  })
})

// Validation context generator for medical safety testing
export const validationContextArbitrary = fc.record({
  medical_history: medicalHistoryArbitrary,
  user_age: arbitraries.age.any,
  user_gender: arbitraries.gender,
  language: arbitraries.language
})

// Image quality assessment data generator
export const imageQualityDataArbitrary = fc.record({
  overall: fc.constantFrom('excellent', 'good', 'fair', 'poor'),
  score: arbitraries.imageQuality.score,
  issues: fc.array(
    fc.record({
      type: fc.constantFrom('lighting', 'blur', 'composition', 'resolution', 'color'),
      severity: fc.constantFrom('low', 'medium', 'high'),
      description: fc.lorem({ maxCount: 10 })
    }),
    { minLength: 0, maxLength: 5 }
  ),
  suggestions: fc.array(fc.lorem({ maxCount: 15 }), { minLength: 0, maxLength: 3 })
})

// Cross-platform sync data generator
export const syncDataArbitrary = fc.record({
  user_id: fc.uuid(),
  device_id: fc.uuid(),
  platform: arbitraries.platform.type,
  last_sync: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  data_version: fc.integer({ min: 1, max: 1000 }),
  sync_status: fc.constantFrom('pending', 'in_progress', 'completed', 'failed'),
  conflicts: fc.array(
    fc.record({
      field: fc.string(),
      local_value: fc.anything(),
      remote_value: fc.anything(),
      resolution: fc.constantFrom('local', 'remote', 'merge', 'manual')
    }),
    { minLength: 0, maxLength: 3 }
  )
})