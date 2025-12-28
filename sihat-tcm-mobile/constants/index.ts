/**
 * Shared Constants for Sihat TCM Mobile Application
 * 
 * Centralized constants for better maintainability and consistency
 * Synchronized with web application constants where applicable
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3100',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// AI Model Configuration (synchronized with web)
export const AI_MODELS = {
  GEMINI_2_FLASH: 'gemini-2.0-flash-exp',
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_3_PRO_PREVIEW: 'gemini-3-pro-preview',
} as const;

// TCM Constitution Types (synchronized with web)
export const TCM_CONSTITUTIONS = {
  BALANCED: 'balanced',
  QI_DEFICIENCY: 'qi_deficiency',
  YANG_DEFICIENCY: 'yang_deficiency',
  YIN_DEFICIENCY: 'yin_deficiency',
  PHLEGM_DAMPNESS: 'phlegm_dampness',
  DAMP_HEAT: 'damp_heat',
  BLOOD_STASIS: 'blood_stasis',
  QI_STAGNATION: 'qi_stagnation',
  SPECIAL_DIATHESIS: 'special_diathesis',
} as const;

// Supported Languages (synchronized with web)
export const LANGUAGES = {
  ENGLISH: 'en',
  CHINESE: 'zh',
  MALAY: 'ms',
} as const;

// Notification Configuration Constants
export const NOTIFICATION_CONFIG = {
  MAX_HISTORY_SIZE: 100,
  MAX_CACHE_SIZE: 1000,
  SYNC_INTERVAL_MINUTES: 15,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  DEFAULT_TIMEOUT: 30000,
  QUIET_HOURS_DEFAULT: {
    START: '22:00',
    END: '07:00',
  },
} as const;

// Notification Categories (synchronized with web)
export const NOTIFICATION_CATEGORIES = {
  HEALTH: 'health',
  MEDICATION: 'medication',
  EXERCISE: 'exercise',
  DIET: 'diet',
  SLEEP: 'sleep',
  APPOINTMENTS: 'appointments',
} as const;

// Notification Templates
export const NOTIFICATION_TEMPLATES = {
  SEASONAL_ADVICE: 'seasonalAdvice',
  CONSTITUTION_TIPS: 'constitutionTips',
  MEDICATION_REMINDER: 'medicationReminder',
  EXERCISE_REMINDER: 'exerciseReminder',
  DIETARY_ADVICE: 'dietaryAdvice',
  SLEEP_HYGIENE: 'sleepHygiene',
  APPOINTMENT_REMINDER: 'appointmentReminder',
  HEALTH_ALERT: 'healthAlert',
} as const;

// Priority Levels (synchronized with web)
export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Diagnosis Session Types (synchronized with web)
export const DIAGNOSIS_TYPES = {
  INQUIRY: 'inquiry',
  OBSERVATION: 'observation',
  LISTENING: 'listening',
  PALPATION: 'palpation',
  COMPREHENSIVE: 'comprehensive',
} as const;

// Session Status (synchronized with web)
export const SESSION_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_AUDIO_TYPES: ['audio/wav', 'audio/mp3', 'audio/m4a'],
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  LONG_TTL: 60 * 60 * 1000, // 1 hour
  SHORT_TTL: 30 * 1000, // 30 seconds
} as const;

// Validation Rules (synchronized with web)
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_MESSAGE_LENGTH: 2000,
  MIN_AGE: 1,
  MAX_AGE: 120,
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  HAPTIC_FEEDBACK: {
    LIGHT: 'light',
    MEDIUM: 'medium',
    HEAVY: 'heavy',
  },
} as const;

// Error Codes (synchronized with web)
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AI_MODEL_ERROR: 'AI_MODEL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NOTIFICATION_ERROR: 'NOTIFICATION_ERROR',
  DEVICE_ERROR: 'DEVICE_ERROR',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SETTINGS_SAVED: 'Settings saved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  DIAGNOSIS_COMPLETED: 'Diagnosis completed successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
  DEVICE_CONNECTED: 'Device connected successfully',
  SYNC_COMPLETED: 'Sync completed successfully',
} as const;

// Default Values
export const DEFAULTS = {
  PAGINATION_LIMIT: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
  HAPTIC_FEEDBACK_ENABLED: true,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_VOICE_COMMANDS: process.env.EXPO_PUBLIC_ENABLE_VOICE_COMMANDS === 'true',
  ENABLE_OFFLINE_MODE: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_PUSH_NOTIFICATIONS: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
  ENABLE_HEALTH_INTEGRATION: process.env.EXPO_PUBLIC_ENABLE_HEALTH_INTEGRATION === 'true',
  ENABLE_BLUETOOTH_DEVICES: process.env.EXPO_PUBLIC_ENABLE_BLUETOOTH_DEVICES === 'true',
} as const;

// Health Device Configuration
export const HEALTH_DEVICE_CONFIG = {
  SCAN_TIMEOUT: 10000, // 10 seconds
  CONNECTION_TIMEOUT: 15000, // 15 seconds
  DATA_SYNC_INTERVAL: 60000, // 1 minute
  MAX_RETRY_ATTEMPTS: 3,
  SUPPORTED_SERVICES: {
    HEART_RATE: '180d',
    BATTERY: '180f',
    DEVICE_INFO: '180a',
    FITNESS_MACHINE: '1826',
  },
} as const;

// Notification Channels (Android)
export const NOTIFICATION_CHANNELS = {
  HEALTH: {
    id: 'health',
    name: 'Health Notifications',
    importance: 'DEFAULT',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#10b981',
  },
  MEDICATION: {
    id: 'medication',
    name: 'Medication Reminders',
    importance: 'HIGH',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#ef4444',
  },
  EXERCISE: {
    id: 'exercise',
    name: 'Exercise Reminders',
    importance: 'DEFAULT',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3b82f6',
  },
  APPOINTMENTS: {
    id: 'appointments',
    name: 'Appointment Reminders',
    importance: 'HIGH',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#f59e0b',
  },
  URGENT: {
    id: 'urgent',
    name: 'Urgent Alerts',
    importance: 'MAX',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#dc2626',
  },
} as const;

// Type exports for better type safety
export type Language = typeof LANGUAGES[keyof typeof LANGUAGES];
export type TCMConstitution = typeof TCM_CONSTITUTIONS[keyof typeof TCM_CONSTITUTIONS];
export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];
export type DiagnosisType = typeof DIAGNOSIS_TYPES[keyof typeof DIAGNOSIS_TYPES];
export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type NotificationTemplate = typeof NOTIFICATION_TEMPLATES[keyof typeof NOTIFICATION_TEMPLATES];