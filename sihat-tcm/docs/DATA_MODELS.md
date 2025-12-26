# Sihat TCM Data Models Documentation

**Version**: 3.0  
**Last Updated**: December 2024

## Table of Contents

1. [Core Entities](#core-entities)
2. [User Management](#user-management)
3. [Diagnosis Models](#diagnosis-models)
4. [Medical Records](#medical-records)
5. [AI Analysis Models](#ai-analysis-models)
6. [Patient Portal Models](#patient-portal-models)
7. [System Models](#system-models)
8. [Database Schema](#database-schema)

## Core Entities

### User Profile
```typescript
interface User {
  id: string; // UUID
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  lastLoginAt?: string;
  isActive: boolean;
  preferences: UserPreferences;
}

interface UserPreferences {
  language: 'en' | 'zh' | 'ms';
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  accessibility: AccessibilitySettings;
}
```

### Patient Profile
```typescript
interface Patient {
  id: string; // References User.id
  name: string;
  dateOfBirth: string; // ISO date
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  medicalHistory?: string;
  allergies: string[];
  currentMedications: string[];
  emergencyContact?: EmergencyContact;
  constitution?: ConstitutionType;
  createdAt: string;
  updatedAt: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}
```

### Practitioner Profile
```typescript
interface Practitioner {
  id: string; // References User.id
  name: string;
  licenseNumber: string;
  specialization: string[];
  level: 'physician' | 'expert' | 'master';
  yearsOfExperience: number;
  qualifications: string[];
  languages: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## User Management

### Authentication
```typescript
interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  deviceInfo: DeviceInfo;
}

interface DeviceInfo {
  platform: 'web' | 'ios' | 'android';
  deviceId: string;
  userAgent?: string;
  ipAddress: string;
}
```

### Family Management
```typescript
interface FamilyMember {
  id: string;
  primaryUserId: string; // The account holder
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  medicalHistory?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Diagnosis Models

### Diagnosis Session
```typescript
interface DiagnosisSession {
  id: string;
  patientId: string;
  practitionerId?: string;
  familyMemberId?: string; // If diagnosis is for family member
  status: 'in_progress' | 'completed' | 'cancelled' | 'expired';
  data: DiagnosisData;
  overallScore?: number; // 0-100
  confidence?: number; // 0-1
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt: string; // Auto-cleanup incomplete sessions
}

interface DiagnosisData {
  patientInfo: PatientBasicInfo;
  inquiryData?: InquiryData;
  tongueAnalysis?: ImageAnalysisResult;
  faceAnalysis?: ImageAnalysisResult;
  bodyAnalysis?: ImageAnalysisResult;
  audioAnalysis?: AudioAnalysisResult;
  pulseData?: PulseData;
  smartConnectData?: HealthMetrics;
  reportOptions: ReportOptions;
}
```

### Patient Basic Info
```typescript
interface PatientBasicInfo {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  bmi?: number; // Calculated
  mainConcern: string;
  symptoms: string[];
  symptomDuration: string;
  medicalHistory?: string;
  currentMedications?: string[];
  allergies?: string[];
}
```

### Inquiry Data
```typescript
interface InquiryData {
  chatHistory: ChatMessage[];
  summary: string;
  keyFindings: string[];
  completionStatus: 'incomplete' | 'complete';
  duration: number; // seconds
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    confidence?: number;
  };
}
```

### Image Analysis
```typescript
interface ImageAnalysisResult {
  imageUrl: string;
  imageMetadata: ImageMetadata;
  analysis: TongueAnalysis | FaceAnalysis | BodyAnalysis;
  tcmInterpretation: string;
  tags: string[];
  confidence: number; // 0-1
  processingTime: number; // milliseconds
  modelUsed: string;
}

interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  format: string;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  lighting: 'poor' | 'fair' | 'good' | 'excellent';
}

interface TongueAnalysis {
  tongueBody: {
    color: 'pale' | 'red' | 'dark_red' | 'purple' | 'blue';
    shape: 'thin' | 'normal' | 'swollen' | 'stiff';
    size: 'small' | 'normal' | 'enlarged';
    moisture: 'dry' | 'normal' | 'wet';
    cracks: boolean;
    teethMarks: boolean;
  };
  tongueCoating: {
    color: 'white' | 'yellow' | 'gray' | 'black' | 'none';
    thickness: 'none' | 'thin' | 'thick';
    distribution: 'even' | 'uneven' | 'patchy' | 'peeled';
    texture: 'smooth' | 'rough' | 'greasy' | 'dry';
  };
}
```
interface FaceAnalysis {
  complexion: {
    color: 'pale' | 'red' | 'yellow' | 'dark' | 'normal';
    luster: 'dull' | 'normal' | 'bright';
    texture: 'rough' | 'smooth' | 'oily' | 'dry';
  };
  facialZones: {
    forehead: ZoneAnalysis; // Heart
    leftCheek: ZoneAnalysis; // Liver
    rightCheek: ZoneAnalysis; // Lung
    nose: ZoneAnalysis; // Spleen
    chin: ZoneAnalysis; // Kidney
  };
  eyes: {
    color: string;
    brightness: 'dull' | 'normal' | 'bright';
    puffiness: boolean;
    darkCircles: boolean;
  };
  lips: {
    color: 'pale' | 'red' | 'dark' | 'purple';
    moisture: 'dry' | 'normal' | 'moist';
  };
}

interface ZoneAnalysis {
  color: string;
  condition: 'poor' | 'fair' | 'good';
  issues: string[];
}

interface BodyAnalysis {
  bodyPart: string;
  condition: string;
  abnormalities: string[];
  tcmCorrelation: string;
}
```

### Audio Analysis
```typescript
interface AudioAnalysisResult {
  audioUrl: string;
  audioMetadata: AudioMetadata;
  analysis: VoiceAnalysis;
  tcmInterpretation: string;
  confidence: number;
  processingTime: number;
  modelUsed: string;
}

interface AudioMetadata {
  duration: number; // seconds
  sampleRate: number;
  bitRate: number;
  format: string;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface VoiceAnalysis {
  voiceStrength: 'weak' | 'normal' | 'strong';
  toneQuality: 'hoarse' | 'clear' | 'breathy' | 'rough';
  pitch: 'low' | 'normal' | 'high';
  breathingPattern: 'shallow' | 'normal' | 'deep' | 'irregular';
  speechRate: 'slow' | 'normal' | 'fast';
  clarity: 'unclear' | 'fair' | 'clear';
  emotionalTone: 'sad' | 'neutral' | 'happy' | 'anxious';
}
```

### Pulse Data
```typescript
interface PulseData {
  bpm: number;
  method: 'tap' | 'manual' | 'camera' | 'device';
  quality?: PulseQuality;
  rhythm: 'regular' | 'irregular';
  strength: 'weak' | 'normal' | 'strong';
  measurementDuration: number; // seconds
  confidence: number;
  timestamp: string;
}

type PulseQuality = 
  | 'floating' // 浮
  | 'deep' // 沉
  | 'slow' // 迟
  | 'rapid' // 数
  | 'slippery' // 滑
  | 'rough' // 涩
  | 'wiry' // 弦
  | 'tight' // 紧
  | 'thready' // 细
  | 'weak' // 弱
  | 'normal'; // 平
```

### Health Metrics (Smart Connect)
```typescript
interface HealthMetrics {
  steps?: number;
  heartRate?: {
    average: number;
    resting: number;
    maximum: number;
  };
  sleepData?: {
    duration: number; // hours
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    deepSleep: number; // hours
    remSleep: number; // hours
  };
  calories?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodOxygen?: number; // SpO2 percentage
  bodyTemperature?: number; // Celsius
  weight?: number; // kg
  dataSource: string; // 'apple_health' | 'google_fit' | 'samsung_health' | 'manual'
  syncedAt: string;
}
```

## Medical Records

### Medical Report
```typescript
interface MedicalReport {
  id: string;
  diagnosisId: string;
  patientId: string;
  practitionerId?: string;
  content: ReportContent;
  pdfUrl?: string;
  infographicUrl?: string;
  status: 'draft' | 'final' | 'reviewed';
  version: number;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface ReportContent {
  patientSummary: PatientSummary;
  tcmDiagnosis: TCMDiagnosis;
  pathomechanism: string;
  analysisSummary: AnalysisSummary;
  recommendations: TreatmentRecommendations;
  followUpPlan?: FollowUpPlan;
  disclaimers: string[];
}

interface PatientSummary {
  demographics: PatientBasicInfo;
  chiefComplaint: string;
  presentIllness: string;
  medicalHistory: string;
  vitalSigns: VitalSigns;
}

interface VitalSigns {
  heartRate: number;
  bloodPressure?: string;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bmi: number;
}
```

### TCM Diagnosis
```typescript
interface TCMDiagnosis {
  primaryPattern: string;
  constitutionType: ConstitutionType;
  secondaryPatterns: string[];
  affectedOrgans: OrganSystem[];
  severity: 'mild' | 'moderate' | 'severe';
  prognosis: 'excellent' | 'good' | 'fair' | 'guarded';
  confidence: number; // 0-1
  differentialDiagnosis?: string[];
}

type ConstitutionType = 
  | 'balanced' // 平和质
  | 'qi_deficiency' // 气虚质
  | 'yang_deficiency' // 阳虚质
  | 'yin_deficiency' // 阴虚质
  | 'phlegm_dampness' // 痰湿质
  | 'damp_heat' // 湿热质
  | 'blood_stasis' // 血瘀质
  | 'qi_stagnation' // 气郁质
  | 'special_diathesis'; // 特禀质

type OrganSystem = 
  | 'heart' // 心
  | 'liver' // 肝
  | 'spleen' // 脾
  | 'lung' // 肺
  | 'kidney' // 肾
  | 'gallbladder' // 胆
  | 'stomach' // 胃
  | 'small_intestine' // 小肠
  | 'large_intestine' // 大肠
  | 'bladder' // 膀胱
  | 'triple_burner' // 三焦
  | 'pericardium'; // 心包
```

### Treatment Recommendations
```typescript
interface TreatmentRecommendations {
  dietary: DietaryRecommendations;
  herbalFormulas: HerbalFormula[];
  lifestyle: LifestyleRecommendations;
  acupressure: AcupressurePoint[];
  exercises: ExerciseRecommendation[];
  followUp: FollowUpRecommendations;
}

interface DietaryRecommendations {
  foodsToEat: FoodRecommendation[];
  foodsToAvoid: FoodRecommendation[];
  cookingMethods: string[];
  mealTiming: MealTimingAdvice;
  hydration: HydrationAdvice;
  supplements?: SupplementRecommendation[];
}

interface FoodRecommendation {
  name: string;
  tcmProperties: {
    thermalNature: 'hot' | 'warm' | 'neutral' | 'cool' | 'cold';
    flavors: ('sweet' | 'sour' | 'bitter' | 'pungent' | 'salty')[];
    organAffinity: OrganSystem[];
  };
  benefits: string[];
  preparation?: string[];
  frequency: 'daily' | 'weekly' | 'occasionally' | 'avoid';
}

interface HerbalFormula {
  name: string;
  chineseName?: string;
  ingredients: HerbIngredient[];
  preparation: string;
  dosage: string;
  duration: string;
  contraindications: string[];
  sideEffects?: string[];
  interactions?: string[];
  cost?: number;
  availability: 'common' | 'specialty' | 'rare';
}

interface HerbIngredient {
  name: string;
  chineseName?: string;
  amount: string;
  role: 'chief' | 'deputy' | 'assistant' | 'envoy';
  properties: {
    nature: string;
    flavor: string;
    meridians: string[];
  };
}
```

## AI Analysis Models

### Snore Analysis
```typescript
interface SnoreAnalysis {
  id: string;
  userId: string;
  audioUrl: string;
  analysis: SnoreAnalysisResult;
  tcmCorrelation: SnoreTCMCorrelation;
  recommendations: SnoreRecommendations;
  createdAt: string;
}

interface SnoreAnalysisResult {
  duration: number; // total recording duration in seconds
  snoreDetected: boolean;
  snoreFrequency: number; // snores per hour
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  patterns: SnorePattern[];
  sleepApneaRisk: 'low' | 'medium' | 'high';
  oxygenDesaturationEvents: number;
  averageSnoreDuration: number; // seconds
  loudestSnoreDecibel: number;
}

interface SnorePattern {
  startTime: number; // seconds from start
  duration: number; // seconds
  intensity: 'light' | 'moderate' | 'heavy';
  frequency: number; // Hz
}

interface SnoreTCMCorrelation {
  constitution: ConstitutionType;
  patterns: string[];
  organInvolvement: OrganSystem[];
  pathomechanism: string;
  severity: 'mild' | 'moderate' | 'severe';
}
```

### Meal Planning
```typescript
interface MealPlan {
  id: string;
  userId: string;
  constitution: ConstitutionType;
  weeklyPlan: WeeklyMealPlan;
  shoppingList: ShoppingList;
  preferences: DietaryPreferences;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface WeeklyMealPlan {
  [day: string]: DayMealPlan; // 'monday', 'tuesday', etc.
}

interface DayMealPlan {
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snacks: MealItem[];
  totalCalories: number;
  tcmBalance: TCMNutritionalBalance;
}

interface MealItem {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  calories: number;
  tcmProperties: FoodTCMProperties;
  nutritionalInfo: NutritionalInfo;
  imageUrl?: string;
}

interface DietaryPreferences {
  allergies: string[];
  dietaryType: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'kosher';
  dislikedFoods: string[];
  servingSize: number; // number of people
  calorieTarget?: number;
  restrictions: string[];
}
```

## Patient Portal Models

### Gamification (Qi Garden)
```typescript
interface QiGarden {
  userId: string;
  level: number;
  totalEssence: number;
  totalWaterDroplets: number;
  danTianFilling: number; // 0-100
  currentStreak: number;
  longestStreak: number;
  herbs: VirtualHerb[];
  achievements: Achievement[];
  lastActivityAt: string;
  createdAt: string;
}

interface VirtualHerb {
  id: string;
  type: 'ginseng' | 'reishi' | 'goji_berry' | 'chrysanthemum' | 'ginger';
  name: string;
  stage: 'seed' | 'sprout' | 'growing' | 'mature' | 'flowering';
  health: number; // 0-100
  waterLevel: number; // 0-100
  lastWatered: string;
  plantedAt: string;
  harvestableAt?: string;
}

interface Achievement {
  id: string;
  type: 'streak' | 'exercise' | 'meal_log' | 'diagnosis' | 'special';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
  progress?: number; // for progressive achievements
  maxProgress?: number;
}
```

### Community (Circle of Health)
```typescript
interface CommunityPost {
  id: string;
  circleId: string;
  authorId: string; // Anonymous hash
  type: 'text' | 'image' | 'recipe' | 'progress' | 'question';
  content: string;
  images?: string[];
  tags: string[];
  likes: number;
  comments: CommunityComment[];
  isAnonymous: boolean;
  constitution?: ConstitutionType;
  createdAt: string;
  updatedAt: string;
}

interface CommunityComment {
  id: string;
  postId: string;
  authorId: string; // Anonymous hash
  content: string;
  likes: number;
  createdAt: string;
}

interface HealthCircle {
  id: string;
  name: string;
  description: string;
  constitution: ConstitutionType;
  memberCount: number;
  postCount: number;
  isActive: boolean;
  moderators: string[];
  rules: string[];
  createdAt: string;
}
```

### Vitality Rhythm
```typescript
interface VitalityRhythm {
  userId: string;
  currentOrganClock: OrganClockInfo;
  solarTerm: SolarTermInfo;
  constitutionHistory: ConstitutionHistoryEntry[];
  seasonalRecommendations: SeasonalRecommendation[];
  updatedAt: string;
}

interface OrganClockInfo {
  currentOrgan: OrganSystem;
  timeSlot: string; // "23:00-01:00"
  activity: string;
  recommendations: string[];
  nextOrgan: OrganSystem;
  nextTimeSlot: string;
}

interface SolarTermInfo {
  current: SolarTerm;
  next: SolarTerm;
  daysUntilNext: number;
  seasonalAdvice: string[];
}

interface SolarTerm {
  name: string;
  chineseName: string;
  startDate: string;
  endDate: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  characteristics: string[];
  healthFocus: string[];
}
```

## System Models

### Notifications
```typescript
interface NotificationPreferences {
  reminders: boolean;
  healthTips: boolean;
  communityUpdates: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "08:00"
  };
}

interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'health_tip' | 'community' | 'system' | 'marketing';
  title: string;
  message: string;
  data?: object; // Additional payload
  channels: ('push' | 'email' | 'sms')[];
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}
```

### System Logs
```typescript
interface SystemLog {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context: {
    userId?: string;
    sessionId?: string;
    endpoint?: string;
    userAgent?: string;
    ipAddress?: string;
  };
  metadata?: object;
  timestamp: string;
}

interface APIUsage {
  id: string;
  userId?: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  statusCode: number;
  responseTime: number; // milliseconds
  requestSize: number; // bytes
  responseSize: number; // bytes
  userAgent?: string;
  ipAddress: string;
  timestamp: string;
}
```

### Admin Settings
```typescript
interface AdminSettings {
  id: string;
  defaultModel: string;
  systemPrompts: {
    [key: string]: string;
  };
  featureFlags: {
    [feature: string]: boolean;
  };
  apiLimits: {
    [endpoint: string]: {
      requestsPerHour: number;
      requestsPerDay: number;
    };
  };
  maintenanceMode: boolean;
  updatedBy: string;
  updatedAt: string;
}
```

## Database Schema

### Supabase Tables

```sql
-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Patients table
CREATE TABLE public.patients (
  id UUID REFERENCES public.users PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height INTEGER, -- cm
  weight DECIMAL(5,2), -- kg
  medical_history TEXT,
  allergies TEXT[],
  current_medications TEXT[],
  emergency_contact JSONB,
  constitution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practitioners table
CREATE TABLE public.practitioners (
  id UUID REFERENCES public.users PRIMARY KEY,
  name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  specialization TEXT[],
  level TEXT CHECK (level IN ('physician', 'expert', 'master')),
  years_of_experience INTEGER,
  qualifications TEXT[],
  languages TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagnosis sessions table
CREATE TABLE public.diagnosis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients,
  practitioner_id UUID REFERENCES public.practitioners,
  family_member_id UUID,
  status TEXT NOT NULL DEFAULT 'in_progress' 
    CHECK (status IN ('in_progress', 'completed', 'cancelled', 'expired')),
  data JSONB NOT NULL DEFAULT '{}',
  overall_score DECIMAL(5,2),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Medical reports table
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID REFERENCES public.diagnosis_sessions,
  patient_id UUID REFERENCES public.patients,
  practitioner_id UUID REFERENCES public.practitioners,
  content JSONB NOT NULL,
  pdf_url TEXT,
  infographic_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'reviewed')),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.practitioners
);

-- Additional tables for enhanced features...
```

### Indexes and Performance

```sql
-- Performance indexes
CREATE INDEX idx_diagnosis_sessions_patient_id ON public.diagnosis_sessions(patient_id);
CREATE INDEX idx_diagnosis_sessions_status ON public.diagnosis_sessions(status);
CREATE INDEX idx_diagnosis_sessions_created_at ON public.diagnosis_sessions(created_at DESC);
CREATE INDEX idx_medical_reports_patient_id ON public.medical_reports(patient_id);
CREATE INDEX idx_medical_reports_diagnosis_id ON public.medical_reports(diagnosis_id);

-- Full-text search indexes
CREATE INDEX idx_patients_name_fts ON public.patients USING gin(to_tsvector('english', name));
CREATE INDEX idx_medical_reports_content_fts ON public.medical_reports USING gin(to_tsvector('english', content::text));
```

---

**This documentation covers the core data models used throughout the Sihat TCM system. For implementation details and API usage, refer to the [API Documentation](./API_DOCUMENTATION.md) and [Developer Manual](../DEVELOPER_MANUAL.md).**