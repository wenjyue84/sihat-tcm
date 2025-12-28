/**
 * Shared Types for Sihat TCM Mobile Application
 * 
 * Centralized type definitions to improve type safety and reduce duplication
 * Enhanced with strict typing and elimination of 'any' types
 */

// Import shared constants for type safety
import { 
    TCM_CONSTITUTIONS, 
    LANGUAGES, 
    NOTIFICATION_CATEGORIES, 
    PRIORITY_LEVELS, 
    DIAGNOSIS_TYPES, 
    SESSION_STATUS,
    ERROR_CODES 
} from '../constants';

// Theme Types with strict structure
export interface Theme {
    background: {
        primary: string;
        secondary: string;
    };
    surface: {
        elevated: string;
        default: string;
    };
    text: {
        primary: string;
        secondary: string;
        tertiary: string;
    };
    accent: {
        primary: string;
        secondary: string;
    };
    border: {
        default: string;
        subtle: string;
    };
    semantic: {
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    gradients: {
        primary: string[];
        secondary: string[];
    };
}

// Notification Types with enhanced type safety
export interface NotificationPreferences {
    enabled: boolean;
    healthReminders: boolean;
    medicationAlerts: boolean;
    appointmentReminders: boolean;
    exerciseReminders: boolean;
    sleepReminders: boolean;
    quietHours: {
        enabled: boolean;
        start: string; // Format: "HH:MM"
        end: string;   // Format: "HH:MM"
    };
    frequency: {
        daily: boolean;
        weekly: boolean;
        monthly: boolean;
    };
    categories: Record<keyof typeof NOTIFICATION_CATEGORIES, boolean>;
}

export interface NotificationStats {
    totalScheduled: number;
    totalReceived: number;
    pushToken?: string;
    preferences: NotificationPreferences;
    isInitialized: boolean;
    lastSyncTime?: number;
    errorCount?: number;
}

// Health Device Types with comprehensive structure
export type HealthDeviceType = 'fitness_tracker' | 'smartwatch' | 'health_monitor' | 'blood_pressure' | 'glucose_meter' | 'scale';
export type HealthDeviceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface HealthDevice {
    id: string;
    name: string;
    type: HealthDeviceType;
    manufacturer: string;
    model?: string;
    firmwareVersion?: string;
    services: string[];
    rssi?: number;
    isConnectable: boolean;
    status: HealthDeviceStatus;
    connectedAt?: number;
    lastDataSync?: number;
    dataStreams: HealthDataType[];
    batteryLevel?: number;
    dataInterval?: NodeJS.Timeout;
}

export type HealthDataType = 'heart_rate' | 'steps' | 'sleep' | 'weight' | 'blood_pressure' | 'temperature' | 'blood_glucose' | 'oxygen_saturation';
export type HealthDataQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface HealthData {
    id: string;
    deviceId?: string;
    type: HealthDataType;
    value: number;
    unit: string;
    timestamp: number;
    quality: HealthDataQuality;
    metadata?: Record<string, unknown>;
    userId?: string;
    sessionId?: string;
}

export interface DeviceCapabilities {
    platform: 'ios' | 'android';
    deviceType: number;
    hasHealthApp: boolean;
    hasBluetooth: boolean;
    hasNFC: boolean;
    sensors: {
        accelerometer: boolean;
        gyroscope: boolean;
        magnetometer: boolean;
        barometer: boolean;
        heartRate: boolean;
        stepCounter: boolean;
    };
    permissions: Record<string, 'granted' | 'denied' | 'undetermined'>;
    apiLevel?: number; // Android
    systemVersion: string;
}

// Translation Types with strict structure
export interface TranslationKeys {
    [key: string]: string | TranslationKeys;
}

export interface Translations {
    [namespace: string]: TranslationKeys;
}

// Component Props Types with enhanced type safety
export interface BaseComponentProps {
    theme: Theme;
    translations?: Translations;
    testID?: string;
}

export interface ModalComponentProps extends BaseComponentProps {
    visible: boolean;
    onClose: () => void;
    onShow?: () => void;
    animationType?: 'none' | 'slide' | 'fade';
}

// API Response Types with generic support
export interface ApiResponse<TData = unknown> {
    success: boolean;
    data?: TData;
    error?: string;
    message?: string;
    timestamp?: number;
    requestId?: string;
}

export interface PaginatedResponse<TData = unknown> extends ApiResponse<TData[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

// TCM Specific Types with enhanced structure
export type TCMConstitutionType = keyof typeof TCM_CONSTITUTIONS;
export type LanguageCode = keyof typeof LANGUAGES;
export type PriorityLevel = keyof typeof PRIORITY_LEVELS;
export type DiagnosisType = keyof typeof DIAGNOSIS_TYPES;
export type SessionStatus = keyof typeof SESSION_STATUS;

export interface TCMConstitution {
    type: TCMConstitutionType;
    score: number;
    confidence: number;
    characteristics: string[];
    recommendations: TCMRecommendation[];
    lastAssessed?: number;
}

export interface TCMRecommendation {
    id: string;
    type: 'dietary' | 'lifestyle' | 'exercise' | 'herbal' | 'acupressure';
    title: string;
    description: string;
    priority: PriorityLevel;
    duration?: string;
    frequency?: string;
    contraindications?: string[];
    benefits?: string[];
}

export interface DiagnosisSession {
    id: string;
    userId: string;
    sessionType: DiagnosisType;
    status: SessionStatus;
    data: {
        messages: ChatMessage[];
        images: DiagnosisImage[];
        audioRecordings: AudioRecording[];
        vitalSigns: VitalSign[];
        symptoms: Symptom[];
    };
    results?: {
        constitution: TCMConstitution;
        recommendations: TCMRecommendation[];
        confidence: number;
        aiModelUsed: string;
        processingTime: number;
    };
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        modelUsed?: string;
        confidence?: number;
        processingTime?: number;
    };
}

export interface DiagnosisImage {
    id: string;
    type: 'tongue' | 'face' | 'body' | 'other';
    uri: string;
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
    timestamp: number;
    quality?: HealthDataQuality;
    analysisResults?: ImageAnalysisResult[];
}

export interface ImageAnalysisResult {
    feature: string;
    value: string | number;
    confidence: number;
    description?: string;
}

export interface AudioRecording {
    id: string;
    uri: string;
    duration: number;
    fileSize: number;
    mimeType: string;
    timestamp: number;
    quality?: HealthDataQuality;
    transcription?: string;
    analysisResults?: AudioAnalysisResult[];
}

export interface AudioAnalysisResult {
    feature: string;
    value: string | number;
    confidence: number;
    description?: string;
}

export interface VitalSign {
    id: string;
    type: 'pulse' | 'blood_pressure' | 'temperature' | 'respiratory_rate';
    value: number | { systolic: number; diastolic: number }; // For blood pressure
    unit: string;
    timestamp: number;
    deviceId?: string;
    quality?: HealthDataQuality;
}

export interface Symptom {
    id: string;
    name: string;
    severity: 1 | 2 | 3 | 4 | 5; // 1 = mild, 5 = severe
    duration: string;
    frequency: string;
    description?: string;
    location?: string;
    triggers?: string[];
    relievingFactors?: string[];
}

// Error Types with enhanced structure
export interface AppError {
    code: keyof typeof ERROR_CODES;
    message: string;
    details?: Record<string, unknown>;
    timestamp: number;
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    stack?: string;
}

// User and Profile Types
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    language: LanguageCode;
    timezone: string;
    constitution?: TCMConstitution;
    medicalHistory?: MedicalHistory;
    preferences: UserPreferences;
    createdAt: number;
    updatedAt: number;
}

export interface MedicalHistory {
    conditions: MedicalCondition[];
    medications: Medication[];
    allergies: Allergy[];
    surgeries: Surgery[];
    familyHistory: FamilyHistoryItem[];
}

export interface MedicalCondition {
    id: string;
    name: string;
    diagnosedDate?: string;
    status: 'active' | 'resolved' | 'chronic';
    severity?: 'mild' | 'moderate' | 'severe';
    notes?: string;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescribedBy?: string;
    purpose?: string;
    sideEffects?: string[];
}

export interface Allergy {
    id: string;
    allergen: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    notes?: string;
}

export interface Surgery {
    id: string;
    procedure: string;
    date: string;
    hospital?: string;
    surgeon?: string;
    complications?: string;
    notes?: string;
}

export interface FamilyHistoryItem {
    id: string;
    relationship: string;
    condition: string;
    ageOfOnset?: number;
    notes?: string;
}

export interface UserPreferences {
    notifications: NotificationPreferences;
    privacy: {
        shareDataForResearch: boolean;
        allowAnalytics: boolean;
        shareWithHealthProviders: boolean;
    };
    accessibility: {
        fontSize: 'small' | 'medium' | 'large' | 'extra_large';
        highContrast: boolean;
        reduceMotion: boolean;
        screenReader: boolean;
    };
    regional: {
        units: 'metric' | 'imperial';
        dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
        timeFormat: '12h' | '24h';
    };
}

// Utility Types for better type safety
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonEmptyArray<T> = [T, ...T[]];

export type Timestamp = number; // Unix timestamp in milliseconds

export type UUID = string; // UUID v4 format

// Form and Validation Types
export interface FormField<T = string> {
    value: T;
    error?: string;
    touched: boolean;
    required: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export interface FormState<T extends Record<string, unknown>> {
    fields: { [K in keyof T]: FormField<T[K]> };
    isSubmitting: boolean;
    isValid: boolean;
    errors: Record<string, string>;
}

// Navigation Types (for React Navigation)
export interface NavigationParams {
    [key: string]: unknown;
}

export interface ScreenProps<T extends NavigationParams = NavigationParams> {
    navigation: {
        navigate: (screen: string, params?: T) => void;
        goBack: () => void;
        replace: (screen: string, params?: T) => void;
        reset: (state: unknown) => void;
    };
    route: {
        params?: T;
        name: string;
    };
}

// Animation and Gesture Types
export interface AnimationConfig {
    duration: number;
    easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
    delay?: number;
}

export interface GestureConfig {
    enabled: boolean;
    threshold?: number;
    direction?: 'horizontal' | 'vertical' | 'both';
}

// Storage and Cache Types
export interface CacheItem<T = unknown> {
    data: T;
    timestamp: number;
    ttl: number;
    key: string;
}

export interface StorageOptions {
    encrypt?: boolean;
    compress?: boolean;
    ttl?: number;
}

// Network and Sync Types
export interface NetworkState {
    isConnected: boolean;
    type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    isInternetReachable: boolean;
}

export interface SyncState {
    lastSync: number;
    pendingChanges: number;
    isSyncing: boolean;
    conflicts: SyncConflict[];
}

export interface SyncConflict {
    id: string;
    type: string;
    localData: unknown;
    remoteData: unknown;
    timestamp: number;
}

// Export type aliases for commonly used types
export type { TCMConstitutionType as Constitution };
export type { LanguageCode as Language };
export type { PriorityLevel as Priority };
export type { DiagnosisType as Diagnosis };
export type { SessionStatus as Status };