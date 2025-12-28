/**
 * AI Model Router Constants
 */

// AI Model identifiers
export const AI_MODELS = {
  GEMINI_2_FLASH: "gemini-2.0-flash-exp",
  GEMINI_2_5_PRO: "gemini-1.5-pro-002", 
  GEMINI_3_PRO_PREVIEW: "gemini-2.0-flash-thinking-exp-1219"
} as const;

// Model capabilities configuration
export const MODEL_CAPABILITIES = {
  [AI_MODELS.GEMINI_2_FLASH]: {
    maxTokens: 1048576,
    supportsVision: true,
    supportsStreaming: true,
    averageLatency: 800,
    costPerToken: 0.000001,
    qualityScore: 85,
    medicalAccuracy: 82,
    complexityRating: ["simple", "moderate", "complex"] as const
  },
  [AI_MODELS.GEMINI_2_5_PRO]: {
    maxTokens: 2097152,
    supportsVision: true,
    supportsStreaming: true,
    averageLatency: 1200,
    costPerToken: 0.000003,
    qualityScore: 92,
    medicalAccuracy: 89,
    complexityRating: ["moderate", "complex", "advanced"] as const
  },
  [AI_MODELS.GEMINI_3_PRO_PREVIEW]: {
    maxTokens: 1048576,
    supportsVision: true,
    supportsStreaming: true,
    averageLatency: 1500,
    costPerToken: 0.000005,
    qualityScore: 95,
    medicalAccuracy: 93,
    complexityRating: ["complex", "advanced"] as const
  }
} as const;

// Complexity scoring configuration
export const COMPLEXITY_SCORING = {
  BASE_MESSAGE_WEIGHT: 1,
  IMAGE_WEIGHT: 10,
  FILE_SIZE_WEIGHT: 2,
  IMAGE_BONUS: 25,
  MULTIPLE_FILES_BONUS: 20,
  LONG_HISTORY_BONUS: 15,
  ANALYSIS_BONUS: 25,
  PERSONALIZATION_BONUS: 15,
  
  MEDICAL_COMPLEXITY: {
    LOW: 5,
    MEDIUM: 15,
    HIGH: 25
  },
  
  URGENCY_LEVELS: {
    LOW: 0,
    NORMAL: 5,
    HIGH: 15,
    URGENT: 25
  },
  
  THRESHOLDS: {
    MODERATE: 25,
    COMPLEX: 50,
    ADVANCED: 75
  },
  
  MAX_SCORE: 100
} as const;

// Priority levels for request handling
export const PRIORITY_LEVELS = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4,
  CRITICAL: 5
} as const;

// Performance tracking constants
export const AI_PERFORMANCE = {
  MAX_RESPONSE_TIME: 30000, // 30 seconds
  WARNING_RESPONSE_TIME: 10000, // 10 seconds
  OPTIMAL_RESPONSE_TIME: 3000, // 3 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  PERFORMANCE_HISTORY_SIZE: 1000
} as const;