/**
 * Store Interfaces
 * 
 * Shared type definitions for the modular store system
 * in the Sihat TCM application.
 */

import { User, Session } from "@supabase/supabase-js";
import { AccessibilityPreferences } from "@/lib/accessibilityManager";
import { DoctorLevel } from "@/lib/doctorLevels";
import { Language } from "@/lib/translations";

// ============================================================================
// SHARED TYPES
// ============================================================================

export type Role = "admin" | "doctor" | "patient" | "developer";

export interface UIPreferences {
  language?: "en" | "zh" | "ms";
  isDeveloperMode?: boolean;
  activeTab?: string;
  viewType?: "table" | "list" | "gallery";
  sortField?: string;
  sortDirection?: "asc" | "desc";
  [key: string]: any;
}

export interface Profile {
  id: string;
  role: Role;
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  medical_history?: string;
  preferred_language?: "en" | "zh" | "ms";
  constitution?: string;
  preferences?: UIPreferences;
}

// ============================================================================
// AUTH STORE INTERFACE
// ============================================================================

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authLoading: boolean;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string, initialData?: Profile) => Promise<void>;
  updatePreferences: (prefs: Partial<UIPreferences>) => Promise<void>;
  initializeAuth: () => () => void;
}

export interface AuthStore extends AuthState, AuthActions {}

// ============================================================================
// LANGUAGE STORE INTERFACE
// ============================================================================

export interface LanguageState {
  language: Language;
  languageLoaded: boolean;
}

export interface LanguageActions {
  setLanguage: (lang: Language) => void;
  syncLanguageFromProfile: (lang: Language) => void;
  setLanguageLoaded: (loaded: boolean) => void;
  initializeLanguage: () => void;
}

export interface LanguageStore extends LanguageState, LanguageActions {}

// ============================================================================
// DOCTOR LEVEL STORE INTERFACE
// ============================================================================

export interface DoctorLevelState {
  doctorLevel: DoctorLevel;
  doctorLevelLoading: boolean;
}

export interface DoctorLevelActions {
  setDoctorLevel: (level: DoctorLevel) => void;
  setDoctorLevelLoading: (loading: boolean) => void;
  getModel: () => string;
  getDoctorInfo: () => any;
  initializeDoctorLevel: () => void;
}

export interface DoctorLevelStore extends DoctorLevelState, DoctorLevelActions {}

// ============================================================================
// DIAGNOSIS PROGRESS STORE INTERFACE
// ============================================================================

export interface NavigationState {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  showNext?: boolean;
  showBack?: boolean;
  showSkip?: boolean;
  canNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  hideBottomNav?: boolean;
}

export interface DiagnosisProgressState {
  diagnosisProgress: number;
  diagnosisStepIndex: number;
  diagnosisFormProgress: { [stepId: string]: number };
  diagnosisNavigationState: NavigationState;
}

export interface DiagnosisProgressActions {
  setDiagnosisProgress: (value: number) => void;
  incrementDiagnosisProgress: (delta: number) => void;
  setDiagnosisStepIndex: (index: number) => void;
  updateDiagnosisFormProgress: (
    stepId: string,
    completedFields: number,
    totalFields: number
  ) => void;
  resetDiagnosisProgress: () => void;
  setDiagnosisNavigationState: (state: NavigationState) => void;
}

export interface DiagnosisProgressStore extends DiagnosisProgressState, DiagnosisProgressActions {}

// ============================================================================
// ACCESSIBILITY STORE INTERFACE
// ============================================================================

export interface AccessibilityState {
  accessibilityManager: any | null;
  accessibilityPreferences: AccessibilityPreferences;
}

export interface AccessibilityActions {
  updateAccessibilityPreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  announce: (message: string, priority?: "polite" | "assertive", delay?: number) => void;
  initializeAccessibility: () => void;
}

export interface AccessibilityStore extends AccessibilityState, AccessibilityActions {}

// ============================================================================
// ONBOARDING STORE INTERFACE
// ============================================================================

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  onboardingLoading: boolean;
}

export interface OnboardingActions {
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  initializeOnboarding: () => void;
}

export interface OnboardingStore extends OnboardingState, OnboardingActions {}

// ============================================================================
// DEVELOPER STORE INTERFACE
// ============================================================================

export interface DeveloperState {
  isDeveloperMode: boolean;
}

export interface DeveloperActions {
  toggleDeveloperMode: () => void;
  initializeDeveloper: () => void;
}

export interface DeveloperStore extends DeveloperState, DeveloperActions {}

// ============================================================================
// STORE ORCHESTRATOR INTERFACES
// ============================================================================

export interface CrossStoreEvent {
  id: string;
  type: string;
  storeName?: string;
  timestamp: number;
  data: any;
}

export interface StoreSubscription {
  id: string;
  eventType: string;
  callback: (event: CrossStoreEvent) => void;
  storeName?: string;
  createdAt: number;
  unsubscribe?: () => void;
}

export interface StoreMetrics {
  totalStores: number;
  activeSubscriptions: number;
  eventsProcessed: number;
  lastEventTime: number;
  averageEventProcessingTime: number;
  errorCount: number;
}

export interface StoreConfig {
  enableCrossStoreSync: boolean;
  enableMetrics: boolean;
  enableEventHistory: boolean;
  maxEventHistory: number;
  enableDebugLogging: boolean;
}

export interface StoreOrchestrator {
  registerStore<T>(name: string, store: T, dependencies?: string[]): void;
  unregisterStore(name: string): void;
  getStore<T>(name: string): T | null;
  subscribe(eventType: string, callback: (event: CrossStoreEvent) => void, storeName?: string): () => void;
  emitEvent(event: Omit<CrossStoreEvent, "id">): void;
  getMetrics(): StoreMetrics;
  getEventHistory(limit?: number): CrossStoreEvent[];
  clearEventHistory(): void;
  getStoreNames(): string[];
  hasStore(name: string): boolean;
  resetAllStores(): void;
  cleanup(): void;
}

// ============================================================================
// STORE FACTORY INTERFACES
// ============================================================================

export type StoreType = 
  | 'auth'
  | 'language'
  | 'diagnosisProgress'
  | 'accessibility'
  | 'onboarding'
  | 'developer';

export type StoreInstance = 
  | AuthStore
  | LanguageStore
  | DiagnosisProgressStore
  | AccessibilityStore
  | OnboardingStore
  | DeveloperStore;

export interface StoreValidation {
  required?: string[];
  types?: Record<string, string | string[]>;
  constraints?: Record<string, any>;
}

export interface StoreLifecycle {
  onInit?: string;
  onDestroy?: string;
  onStateChange?: string;
}

export interface StoreFactoryConfig {
  name: string;
  dependencies: string[];
  initialState: any;
  validation?: StoreValidation;
  lifecycle?: StoreLifecycle;
}

// ============================================================================
// STORE STATE AND ACTIONS BASE INTERFACES
// ============================================================================

export interface StoreState {
  [key: string]: any;
}

export interface StoreActions {
  [key: string]: (...args: any[]) => any;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  language: "sihat-tcm-language",
  onboarding: "sihat-tcm-onboarding-completed",
  developer: "isDeveloperMode",
  accessibility: "sihat-tcm-accessibility-preferences",
} as const;

// ============================================================================
// DIAGNOSIS CONSTANTS
// ============================================================================

export const STEP_WEIGHTS = {
  basic_info: 14,
  wen_inquiry: 14,
  wang_tongue: 14,
  wang_face: 14,
  wen_audio: 14,
  qie: 14,
  smart_connect: 16,
} as const;

export const STEP_BASE_PROGRESS: { [key: string]: number } = {
  basic_info: 0,
  wen_inquiry: 14,
  wang_tongue: 28,
  wang_face: 42,
  wen_audio: 56,
  qie: 70,
  smart_connect: 84,
} as const;

// ============================================================================
// DOCTOR LEVEL CONSTANTS
// ============================================================================

export const ADMIN_LEVEL_MAPPING: Record<string, DoctorLevel> = {
  Master: "master",
  Expert: "expert",
  Doctor: "physician",
} as const;