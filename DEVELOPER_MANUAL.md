# Sihat TCM — Comprehensive Developer Manual

> **AI-Powered Traditional Chinese Medicine Diagnosis System**
> 
> Version 2.0 | Last Updated: December 2024

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture & Design Patterns](#4-architecture--design-patterns)
5. [Core Components](#5-core-components)
6. [API Reference](#6-api-reference)
7. [State Management & Context Providers](#7-state-management--context-providers)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [AI Integration & System Prompts](#9-ai-integration--system-prompts)
10. [Database Schema](#10-database-schema)
11. [Developer Mode & Testing](#11-developer-mode--testing)
12. [Deployment & Environment](#12-deployment--environment)
13. [Troubleshooting](#13-troubleshooting)
14. [Contributing Guidelines](#14-contributing-guidelines)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Project Overview

### 1.1 What is Sihat TCM?

**Sihat TCM** is a sophisticated AI-powered Traditional Chinese Medicine (TCM) diagnosis application that implements the classical **"Four Examinations" (四诊 Sì Zhěn)** diagnostic methodology:

| Examination | Chinese | Method | Implementation |
|-------------|---------|--------|----------------|
| **望 (Wàng)** | Observation | Visual inspection of tongue, face, body parts | Camera capture/file upload with AI analysis |
| **闻 (Wén)** | Listening | Voice quality, breathing sounds | Audio recording with AI analysis |
| **问 (Wèn)** | Inquiry | Patient interview, symptom collection | AI-driven conversational chat |
| **切 (Qiè)** | Palpation | Pulse diagnosis | Manual BPM tap + TCM pulse quality selection |

The system synthesizes all collected data using **Google Gemini AI** to generate comprehensive TCM diagnoses with personalized dietary, lifestyle, and herbal medicine recommendations.

### 1.2 Key Features

- 🌐 **Multi-language Support**: English, Chinese (Simplified), Malay (Bahasa Malaysia)
- 🤖 **Multi-tier AI Models**: Master/Expert/Physician levels with different Gemini models
- 📱 **Responsive Design**: Mobile-first approach with adaptive layouts
- 📄 **PDF Export**: Generate downloadable diagnosis reports
- 🖼️ **Infographics Generation**: Visual health summaries
- 💬 **Interactive Report Chat**: Ask follow-up questions about the diagnosis
- 🔌 **Smart Connect**: IoT device integration and health app data import
- 👨‍⚕️ **Role-based Access**: Admin, Doctor, and Patient dashboards
- 🧪 **Developer Mode**: Comprehensive testing tools and mock data

---

## 2. Technology Stack

### 2.1 Framework & Runtime

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js (App Router) | 16.0.7 |
| **Language** | TypeScript | 5.x |
| **React** | React | 19.2.0 |
| **Package Manager** | npm | Latest |

### 2.2 AI & Backend

| Category | Technology | Purpose |
|----------|------------|---------|
| **AI Provider** | Google Gemini | All AI analysis and chat |
| **AI SDK** | Vercel AI SDK (`@ai-sdk/google`, `ai`) | 5.x |
| **Database** | Supabase (PostgreSQL) | User auth, profiles, settings |
| **Authentication** | Supabase Auth | User authentication |

### 2.3 Frontend Libraries

| Category | Technology | Purpose |
|----------|------------|---------|
| **Styling** | Tailwind CSS | 4.x (CSS-first approach) |
| **Animation** | Framer Motion | 12.x |
| **Icons** | Lucide React | Icon library |
| **UI Primitives** | Radix UI | Accessible components |
| **PDF Generation** | jsPDF | Report PDF export |
| **Screenshot** | html2canvas | Infographics generation |
| **Date Handling** | date-fns | Date formatting |

### 2.4 AI Models by Doctor Level

| Doctor Level | Chinese Name | Model ID | Use Case |
|--------------|--------------|----------|----------|
| **Master** | 名医大师 | `gemini-2.5-pro` | Most advanced, comprehensive analysis |
| **Expert** | 专家医师 | `gemini-2.5-flash` | Fast and capable analysis |
| **Physician** | 医师 | `gemini-2.0-flash` | Standard practitioner level |

---

## 3. Project Structure

```
sihat-tcm/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Backend API Routes
│   │   │   ├── chat/                 # Interactive inquiry chat
│   │   │   ├── consult/              # Final diagnosis generation
│   │   │   ├── report-chat/          # Report Q&A chat
│   │   │   ├── analyze-image/        # Tongue/face/body analysis
│   │   │   ├── analyze-audio/        # Voice analysis
│   │   │   ├── extract-text/         # Document text extraction
│   │   │   ├── summarize-inquiry/    # Chat summary generation
│   │   │   ├── generate-infographic/ # Infographic generation
│   │   │   └── validate-medicine/    # Medicine name validation
│   │   │
│   │   ├── page.tsx                  # Home page (main entry)
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── providers.tsx             # Context providers wrapper
│   │   ├── globals.css               # Global styles & design tokens
│   │   │
│   │   ├── login/                    # Authentication page
│   │   ├── admin/                    # Admin dashboard
│   │   ├── doctor/                   # Doctor dashboard
│   │   ├── patient/                  # Patient dashboard
│   │   │
│   │   └── test-*/                   # Various test pages
│   │       ├── test-runner/          # Automated test suite
│   │       ├── test-chat/            # Chat testing
│   │       ├── test-report/          # Report testing
│   │       └── ...
│   │
│   ├── components/
│   │   ├── diagnosis/                # Core diagnosis components (30+)
│   │   │   ├── DiagnosisWizard.tsx   # ⭐ Main orchestrator
│   │   │   ├── BasicInfoForm.tsx     # Patient info (Step 1)
│   │   │   ├── InquiryWizard.tsx     # Inquiry sub-wizard
│   │   │   ├── CameraCapture.tsx     # Photo capture
│   │   │   ├── AudioRecorder.tsx     # Voice recording
│   │   │   ├── PulseCheck.tsx        # Pulse measurement
│   │   │   ├── SmartConnectStep.tsx  # IoT & health apps
│   │   │   ├── DiagnosisReport.tsx   # Final report display
│   │   │   └── ...
│   │   │
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── ...
│   │   │
│   │   └── Footer.tsx
│   │
│   ├── contexts/                     # React Context Providers
│   │   ├── AuthContext.tsx           # Authentication state
│   │   ├── DoctorContext.tsx         # Doctor level selection
│   │   ├── LanguageContext.tsx       # i18n language state
│   │   └── DeveloperContext.tsx      # Developer mode toggle
│   │
│   └── lib/
│       ├── utils.ts                  # Utility functions (cn helper)
│       ├── supabase.ts               # Supabase client
│       ├── doctorLevels.ts           # Doctor tier configuration
│       ├── systemPrompts.ts          # All AI system prompts
│       └── translations/             # i18n translations
│           ├── index.ts              # Export & utilities
│           ├── en.ts                 # English translations
│           ├── zh.ts                 # Chinese translations
│           └── ms.ts                 # Malay translations
│
├── public/                           # Static assets
│   └── logo.png                      # App logo
│
├── .env.local                        # Environment variables
├── package.json                      # Dependencies
├── supabase_setup.sql                # Database schema
├── next.config.ts                    # Next.js config
└── tsconfig.json                     # TypeScript config
```

---

## 4. Architecture & Design Patterns

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────────────────────────────────────────┐   │
│   │   page.tsx  │────│              DiagnosisWizard.tsx                │   │
│   │   (Home)    │    │         (Main State Orchestrator)               │   │
│   └─────────────┘    └─────────────────────────────────────────────────┘   │
│                                        │                                    │
│         ┌──────────────────────────────┼──────────────────────────────┐    │
│         │                              │                              │    │
│         ▼                              ▼                              ▼    │
│   ┌───────────┐               ┌───────────────┐              ┌──────────┐  │
│   │BasicInfo  │               │InquiryWizard  │              │Camera/   │  │
│   │Form       │               │(Sub-wizard)   │              │Audio/    │  │
│   │           │               │               │              │Pulse     │  │
│   └───────────┘               └───────────────┘              │Steps     │  │
│        │                             │                        └──────────┘  │
│        │                    ┌────────┼────────┐                    │       │
│        │                    │        │        │                    │       │
│        ▼                    ▼        ▼        ▼                    ▼       │
│   ┌─────────┐         ┌──────┐  ┌──────┐  ┌──────┐          ┌──────────┐  │
│   │Patient  │         │Upload│  │Chat  │  │Summary│          │Smart     │  │
│   │Data     │         │Files │  │Step  │  │Step  │          │Connect   │  │
│   └─────────┘         └──────┘  └──────┘  └──────┘          └──────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              API ROUTES (Next.js)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│   │/api/chat   │ │/api/consult │ │/api/analyze-│ │/api/report- │         │
│   │            │ │             │ │image        │ │chat         │         │
│   └──────┬─────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘         │
│          │              │               │               │                  │
│          └──────────────┴───────────────┴───────────────┘                  │
│                                    │                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                    │                                        │
│          ┌─────────────────────────┼─────────────────────────┐             │
│          ▼                         ▼                         ▼             │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐         │
│   │Google Gemini│         │ Supabase    │         │ Supabase    │         │
│   │AI API       │         │ Database    │         │ Auth        │         │
│   └─────────────┘         └─────────────┘         └─────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Design Patterns Used

#### **Wizard Pattern** (Composite)
The diagnosis flow uses a nested wizard pattern:
- **DiagnosisWizard** - Main orchestrator with 7 steps
- **InquiryWizard** - Sub-wizard for inquiry phase (4 sub-steps)
- **BasicInfoForm** - Internal multi-step form (5 steps)

#### **Observer Pattern** (Event-Driven)
- Custom events for test data population (`fill-test-data`)
- Context providers for cross-component state sharing

#### **Strategy Pattern** (AI Models)
- Different Gemini models selected based on doctor level
- Fallback model cascade for error resilience

#### **Compound Component Pattern**
- UI components like `Card`, `Dialog` use this pattern
- `CardHeader`, `CardContent`, `CardTitle` compose together

### 4.3 State Flow

```
1. BasicInfoForm
   └── { name, age, gender, weight, height, symptoms, symptomDuration }

2. InquiryWizard
   ├── ChooseDoctorStep → sets doctorLevel context
   ├── UploadReportsStep → { reportFiles[] }
   ├── UploadMedicineStep → { medicineFiles[] }
   ├── InquiryChatStep → { chatHistory[] }
   └── InquirySummaryStep → { summary }
   
   Combined output: { inquiryText, chatHistory[], reportFiles[], medicineFiles[] }

3. CameraCapture (Tongue)
   └── { observation, potential_issues[], image }

4. CameraCapture (Face)
   └── { observation, potential_issues[], image }

5. CameraCapture (Body Part)
   └── { observation, potential_issues[], image }

6. AudioRecorder
   └── { observation, voice_characteristics, potential_issues[], audio }

7. PulseCheck
   └── { bpm, pulseQualities[] }

8. SmartConnectStep
   └── { pulseRate, bloodPressure, bloodOxygen, bodyTemp, hrv, stressLevel, healthData }

                    ┌─────────────────────────────────────┐
                    │     All data merged in              │
                    │     DiagnosisWizard state           │
                    └───────────────┬─────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │        POST /api/consult            │
                    │   (Gemini AI Final Analysis)        │
                    └───────────────┬─────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │       DiagnosisReport               │
                    │   (Display + PDF + Infographics)    │
                    └─────────────────────────────────────┘
```

---

## 5. Core Components

### 5.1 DiagnosisWizard.tsx ⭐ CRITICAL

**Location**: `src/components/diagnosis/DiagnosisWizard.tsx`

**Purpose**: The central orchestrator that manages the entire diagnosis flow.

**Responsibilities**:
- Tracks current step in the diagnosis journey
- Maintains all collected data in state
- Handles step navigation (next/prev)
- Submits all data to `/api/consult` for final analysis
- Manages developer mode features (mock data, step jumping)

**Step Types**:
```typescript
type DiagnosisStep = 
  | 'basic_info'       // Step 1: Patient information
  | 'wen_inquiry'      // Step 2: AI chat inquiry + file uploads
  | 'wang_tongue'      // Step 3: Tongue photo
  | 'wang_face'        // Step 4: Face photo
  | 'wang_part'        // Step 5: Body part photo
  | 'wen_audio'        // Step 6: Voice recording
  | 'qie'              // Step 7: Pulse measurement
  | 'smart_connect'    // Step 8: IoT & health app data
  | 'processing'       // Loading/analysis state
  | 'result'           // Final report display
```

**Key Exports**:
```typescript
export const MOCK_PROFILES     // Pre-defined test patient profiles
export function repairJSON()   // Repairs malformed AI JSON responses
export function generateMockReport() // Generates mock diagnosis data
```

---

### 5.2 BasicInfoForm.tsx

**Purpose**: Multi-step form for collecting patient information.

**Internal Steps** (5 total):
1. **Personal Info**: Name, gender
2. **Physical Stats**: Age, height, weight with BMI calculation
3. **Chief Complaint**: Main symptoms with quick-select tags
4. **Duration**: How long symptoms have persisted
5. **Doctor Selection**: Choose AI doctor level

**Key Features**:
- Mobile-optimized numeric inputs with sliders
- BMI explanation modal
- Symptom tag quick-selection
- Developer mode test data filling

**Data Structure**:
```typescript
interface BasicInfoData {
  name: string
  age: string
  gender: string
  weight: string
  height: string
  symptoms: string
  symptomDuration: string
}
```

---

### 5.3 InquiryWizard.tsx

**Purpose**: Sub-wizard managing the inquiry phase (Step 2).

**Internal Steps**:
1. **ChooseDoctorStep**: Select AI doctor level
2. **UploadReportsStep**: Upload medical reports/lab results
3. **UploadMedicineStep**: Upload medicine photos or enter manually
4. **InquiryChatStep**: Interactive AI conversation
5. **InquirySummaryStep**: Review and verify AI-generated summary

**Data Flow**:
```typescript
interface InquiryResult {
  inquiryText: string      // Verified summary text
  chatHistory: Message[]   // Full conversation history
  files: FileData[]        // Combined files (legacy)
  reportFiles?: FileData[] // Medical reports
  medicineFiles?: FileData[] // Medicine photos
}
```

---

### 5.4 InquiryChatStep.tsx

**Purpose**: AI-powered conversational inquiry interface.

**Key Features**:
- Uses Vercel AI SDK's `useChat` hook
- Displays patient info summary header (with BMI)
- Shows uploaded file previews
- Streaming AI responses with thinking animation
- "Show Prompt" button for debugging

**API Integration**:
```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { 
    basicInfo,
    model: doctorLevel.model,
    language: currentLanguage
  }
})
```

---

### 5.5 CameraCapture.tsx

**Purpose**: Photo capture for visual diagnosis (tongue, face, body parts).

**Features**:
- WebRTC camera access with front/back toggle
- File upload fallback
- Retake/confirm workflow
- Optional skip for non-required steps

**Props**:
```typescript
interface CameraCaptureProps {
  onComplete: (data: { observation?: string; potential_issues?: string[]; image?: string }) => void
  title?: string
  instruction?: string
  required?: boolean
  onBack?: () => void
}
```

---

### 5.6 AudioRecorder.tsx

**Purpose**: Voice recording for listening diagnosis (闻诊).

**Features**:
- WebRTC audio capture
- Real-time waveform visualization
- Playback before confirmation
- Auto-analysis with AI after recording

**Output**:
```typescript
{
  audio: string,              // Base64 audio data
  observation: string,        // AI-generated analysis
  voice_characteristics: any, // Detailed voice qualities
  potential_issues: string[]  // Detected patterns
}
```

---

### 5.7 PulseCheck.tsx

**Purpose**: Pulse measurement and TCM pulse quality selection.

**Two-Phase Flow**:
1. **BPM Measurement**: Tap button in sync with heartbeat
2. **Pulse Quality Selection**: Choose TCM pulse characteristics

**TCM Pulse Qualities**:
| ID | Chinese | English | Indication |
|----|---------|---------|------------|
| hua | 滑脉 | Slippery | Phlegm, pregnancy |
| xi | 细脉 | Thin/Thready | Blood deficiency |
| xian | 弦脉 | Wiry | Liver issues, pain |
| chen | 沉脉 | Deep | Internal patterns |
| fu | 浮脉 | Floating | Exterior patterns |
| ruo | 弱脉 | Weak | Qi deficiency |
| chi | 迟脉 | Slow | Cold patterns |
| shuo | 数脉 | Rapid | Heat patterns |
| normal | 平脉 | Normal | Balanced |

---

### 5.8 SmartConnectStep.tsx

**Purpose**: Integration with IoT devices and health apps.

**Supported Metrics**:
- Pulse Rate (BPM)
- Blood Pressure (mmHg)
- Blood Oxygen (SpO2)
- Body Temperature
- Heart Rate Variability (HRV)
- Stress Level

**Health App Integration**:
- Apple Health
- Google Fit
- Samsung Health
- Xiaomi Health

**Data Structure**:
```typescript
interface SmartConnectData {
  pulseRate?: number | string
  bloodPressure?: string
  bloodOxygen?: number | string
  bodyTemp?: number | string
  hrv?: number | string
  stressLevel?: number | string
  healthData?: ImportedHealthData
}
```

---

### 5.9 DiagnosisReport.tsx

**Purpose**: Displays the final AI-generated diagnosis report.

**Key Features**:
- Comprehensive TCM diagnosis display
- PDF generation and download
- Interactive section clicks (trigger chat)
- Infographics generation
- "Ask About Report" chat integration

**Report Sections**:
1. Patient Information Summary
2. Smart Health Metrics (if available)
3. Primary TCM Diagnosis & Constitution
4. Dietary Recommendations (with recipes)
5. Foods to Avoid
6. Lifestyle Recommendations
7. Herbal Medicine Formulas
8. Acupressure Points
9. Exercise Recommendations

---

### 5.10 ReportChatWindow.tsx

**Purpose**: Interactive Q&A chat about the diagnosis report.

**Features**:
- Expandable/collapsible window
- Suggestion chips for quick questions
- Context-aware responses based on full report
- Multi-language support

---

## 6. API Reference

### 6.1 POST /api/chat

**Purpose**: Powers the interactive inquiry conversation.

**Request**:
```typescript
{
  messages: Message[],
  basicInfo?: BasicInfoData,
  model?: string,       // Default: 'gemini-1.5-pro'
  language?: Language   // 'en' | 'zh' | 'ms'
}
```

**Response**: Text stream (SSE)

**System Prompt Source**: `INTERACTIVE_CHAT_PROMPT` in `systemPrompts.ts`

**Fallback**: If primary model fails, falls back to `gemini-1.5-flash`

---

### 6.2 POST /api/consult

**Purpose**: Generates the final comprehensive TCM diagnosis.

**Request**:
```typescript
{
  basicInfo: BasicInfoData,
  verifiedSummaries: {          // Verified text summaries
    wen_inquiry?: string,
    wang_tongue?: string,
    wang_face?: string,
    wang_part?: string,
    wen_audio?: string,
    qie?: string
  },
  chatHistory: Message[],
  reportFiles: FileData[],
  medicineFiles: FileData[],
  images: {
    tongue?: string,            // Base64
    face?: string,
    bodyPart?: string
  },
  audio?: string,               // Base64
  pulseData: {
    bpm: number,
    pulseQualities: PulseQuality[]
  },
  smartConnectData?: SmartConnectData,
  reportOptions: string[],      // Sections to include
  doctorLevel: DoctorLevel,
  language: Language
}
```

**Response**:
```typescript
{
  diagnosis: {
    primary_pattern: string,
    secondary_patterns: string[],
    affected_organs: string[],
    pathomechanism: string
  },
  constitution: string,
  analysis: string,             // Markdown formatted
  recommendations: {
    food: { name: string, benefit: string, recipe?: string }[],
    avoid: { name: string, reason: string }[],
    lifestyle: { category: string, advice: string }[],
    acupressure: { point: string, location: string, benefit: string }[],
    exercise: { type: string, instruction: string }[],
    herbal?: { formula: string, ingredients: string[], usage: string }[]
  },
  health_insights?: any         // Smart health data analysis
}
```

---

### 6.3 POST /api/analyze-image

**Purpose**: AI analysis of tongue, face, or body part images.

**Request**:
```typescript
{
  image: string,   // Base64 image data
  type: 'tongue' | 'face' | 'other'
}
```

**Response**:
```typescript
{
  observation: string,
  potential_issues: string[],
  modelUsed: number,           // Which model in fallback chain
  status: string,
  confidence?: number,
  is_valid_image?: boolean,
  image_description?: string
}
```

**Model Fallback Order**:
1. `gemini-3-pro-preview`
2. `gemini-2.5-pro`
3. `gemini-2.0-flash`

---

### 6.4 POST /api/analyze-audio

**Purpose**: AI analysis of voice recordings.

**Request**:
```typescript
{
  audio: string,       // Base64 audio data
  language?: Language
}
```

**Response**:
```typescript
{
  observation: string,
  voice_characteristics: {
    volume: string,
    tone: string,
    clarity: string,
    breathing: string
  },
  potential_issues: string[],
  modelUsed: number,
  status: string
}
```

---

### 6.5 POST /api/report-chat

**Purpose**: Answers questions about the diagnosis report.

**Request**:
```typescript
{
  messages: Message[],
  reportData: DiagnosisReportData,
  patientInfo?: BasicInfoData,
  model?: string,
  language?: Language
}
```

**Response**: Text stream (SSE)

**Fallback Chain**:
1. Primary model (from doctor level)
2. `gemini-2.5-flash`
3. `gemini-2.0-flash-exp`
4. `gemini-2.0-flash`

---

### 6.6 POST /api/summarize-inquiry

**Purpose**: Generates an AI summary of the inquiry chat.

**Request**:
```typescript
{
  chatHistory: Message[],
  reportFiles?: FileData[],
  medicineFiles?: FileData[],
  basicInfo?: BasicInfoData,
  language?: Language,
  model?: string
}
```

**Response**:
```typescript
{
  summary: string,
  timing: {
    total: number,
    generation: number
  }
}
```

---

### 6.7 POST /api/extract-text

**Purpose**: Extracts text from uploaded documents/images.

**Request**:
```typescript
{
  file: string,          // Base64 file data
  fileName: string,
  fileType: string,      // MIME type
  mode: 'general' | 'medicine',
  language?: Language
}
```

**Response**:
```typescript
{
  text: string,
  warning?: string,
  is_valid?: boolean     // For medicine mode
}
```

---

### 6.8 POST /api/generate-infographic

**Purpose**: Generates visual health summary infographics.

**Request**:
```typescript
{
  reportData: DiagnosisReportData,
  patientInfo?: BasicInfoData,
  style: string
}
```

**Response**:
```typescript
{
  html: string,           // HTML content
  dataUrl: string        // SVG placeholder
}
```

---

### 6.9 POST /api/validate-medicine

**Purpose**: Validates if input text is medicine-related.

**Request**:
```typescript
{
  text: string,
  language?: Language
}
```

**Response**:
```typescript
{
  isValid: boolean,
  message: string
}
```

---

## 7. State Management & Context Providers

### 7.1 AuthContext

**Location**: `src/contexts/AuthContext.tsx`

**Purpose**: Manages authentication state and user profiles.

**Provided Values**:
```typescript
interface AuthContextType {
  user: User | null                // Supabase user object
  session: Session | null          // Supabase session
  profile: Profile | null          // User profile (role, name, etc.)
  loading: boolean                 // Auth loading state
  signOut: () => Promise<void>
  refreshProfile: (userId?: string, initialData?: Profile) => Promise<void>
}
```

**User Roles**:
- `admin` - Full system access, prompt management
- `doctor` - View patient records
- `patient` - Standard user

**Usage**:
```typescript
const { user, profile, loading, signOut } = useAuth()
```

---

### 7.2 DoctorContext

**Location**: `src/contexts/DoctorContext.tsx`

**Purpose**: Manages the selected doctor/AI level.

**Provided Values**:
```typescript
interface DoctorContextType {
  doctorLevel: DoctorLevel         // 'master' | 'expert' | 'physician'
  setDoctorLevel: (level: DoctorLevel) => void
  getModel: () => string           // Returns appropriate Gemini model
  getDoctorInfo: () => DoctorLevelInfo
  isLoadingDefault: boolean
}
```

**Model Mapping**:
```typescript
const DOCTOR_LEVELS = {
  master: { model: 'gemini-2.5-pro', ... },
  expert: { model: 'gemini-2.5-flash', ... },
  physician: { model: 'gemini-2.0-flash', ... }
}
```

**Usage**:
```typescript
const { doctorLevel, getModel } = useDoctorLevel()
```

---

### 7.3 LanguageContext

**Location**: `src/contexts/LanguageContext.tsx`

**Purpose**: Manages internationalization (i18n) state.

**Provided Values**:
```typescript
interface LanguageContextType {
  language: Language               // 'en' | 'zh' | 'ms'
  setLanguage: (lang: Language) => void
  t: TranslationKeys               // Translation object
  languageNames: typeof languageNames
  isLoaded: boolean
}
```

**Persistence**: Uses `localStorage` with key `sihat-tcm-language`

**Usage**:
```typescript
const { language, setLanguage, t } = useLanguage()

// Access translations
<h1>{t.common.appName}</h1>
<button>{t.nav.login}</button>
```

---

### 7.4 DeveloperContext

**Location**: `src/contexts/DeveloperContext.tsx`

**Purpose**: Manages developer mode toggle.

**Provided Values**:
```typescript
interface DeveloperContextType {
  isDeveloperMode: boolean
  toggleDeveloperMode: () => void
}
```

**Persistence**: Uses `localStorage` with key `isDeveloperMode`

**Usage**:
```typescript
const { isDeveloperMode, toggleDeveloperMode } = useDeveloper()

{isDeveloperMode && (
  <DevTools />
)}
```

---

## 8. Internationalization (i18n)

### 8.1 Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `zh` | Chinese (Simplified) | 中文 |
| `ms` | Malay | Bahasa Malaysia |

### 8.2 Translation Structure

**Location**: `src/lib/translations/`

```
translations/
├── index.ts      # Exports, types, utilities
├── en.ts         # English translations (~36KB)
├── zh.ts         # Chinese translations (~30KB)
└── ms.ts         # Malay translations (~33KB)
```

### 8.3 Translation Categories

```typescript
interface TranslationKeys {
  common: { ... }           // App name, taglines, general
  nav: { ... }              // Navigation labels
  basicInfo: { ... }        // Patient info form
  inquiry: { ... }          // Inquiry phase
  camera: { ... }           // Camera capture
  audio: { ... }            // Audio recording
  pulse: { ... }            // Pulse check
  analysis: { ... }         // Analysis/loading
  report: { ... }           // Diagnosis report
  infographic: { ... }      // Infographic generation
  smartConnect: { ... }     // IoT integration
  symptoms: { ... }         // Symptom tags
  durations: { ... }        // Duration options
  doctorLevels: { ... }     // AI doctor levels
  errors: { ... }           // Error messages
}
```

### 8.4 Adding Translations

1. Add keys to `en.ts` first (source of truth)
2. Copy structure to `zh.ts` and `ms.ts`
3. Translate values

```typescript
// en.ts
export const en = {
  mySection: {
    newKey: 'English translation'
  }
}

// zh.ts
export const zh: TranslationKeys = {
  mySection: {
    newKey: '中文翻译'
  }
}
```

---

## 9. AI Integration & System Prompts

### 9.1 System Prompts Location

**File**: `src/lib/systemPrompts.ts` (~65KB)

### 9.2 Prompt Categories

| Constant | Purpose | API Route |
|----------|---------|-----------|
| `INTERACTIVE_CHAT_PROMPT` | Inquiry conversation | `/api/chat` |
| `TONGUE_ANALYSIS_PROMPT` | Tongue photo analysis | `/api/analyze-image` |
| `FACE_ANALYSIS_PROMPT` | Face photo analysis | `/api/analyze-image` |
| `BODY_ANALYSIS_PROMPT` | Body part analysis | `/api/analyze-image` |
| `LISTENING_ANALYSIS_PROMPT` | Voice analysis | `/api/analyze-audio` |
| `INQUIRY_SUMMARY_PROMPT` | Chat summary generation | `/api/summarize-inquiry` |
| `FINAL_ANALYSIS_PROMPT` | Final diagnosis report | `/api/consult` |

### 9.3 COStar Framework

All prompts follow the **COStar** methodology:

```
C - Context: Background information
O - Objective: What the AI should accomplish
S - Style: Writing/response style
T - Tone: Emotional approach
A - Audience: Who the response is for
R - Response: Output format specifications
```

### 9.4 TCM Knowledge Base

The prompts include comprehensive TCM diagnostic knowledge:

**Eight Principles (八纲)**:
- Yin/Yang (阴阳)
- Interior/Exterior (里表)
- Cold/Heat (寒热)
- Deficiency/Excess (虚实)

**Organ Patterns (脏腑辨证)**:
- Heart, Liver, Spleen, Lung, Kidney patterns

**Tongue Diagnosis (舌诊)**:
- Tongue body colors and meanings
- Coating types and indications
- Shape abnormalities

**Face Diagnosis (面诊)**:
- Five colors and organ correlations
- Regional face mapping

### 9.5 Admin Prompt Customization

Admins can customize prompts via the Admin Dashboard:

1. Navigate to `/admin`
2. Select prompt type
3. Edit the prompt text
4. Save changes

Prompts are stored in the `system_prompts` table in Supabase.

---

## 10. Database Schema

### 10.1 Tables Overview

```sql
-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  role TEXT CHECK (role IN ('patient', 'doctor', 'admin')),
  full_name TEXT,
  age INT,
  gender TEXT,
  height FLOAT,
  weight FLOAT,
  medical_history TEXT,
  updated_at TIMESTAMPTZ
);

-- Customizable system prompts
CREATE TABLE system_prompts (
  id BIGINT PRIMARY KEY,
  role TEXT UNIQUE NOT NULL,        -- 'doctor', 'doctor_chat', etc.
  prompt_text TEXT,
  config JSONB,                     -- Additional config like default_level
  updated_at TIMESTAMPTZ
);

-- Patient diagnosis records
CREATE TABLE inquiries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  symptoms TEXT,
  diagnosis_report JSONB,
  created_at TIMESTAMPTZ
);

-- Health reports
CREATE TABLE health_reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  raw_ai_analysis JSONB,
  created_at TIMESTAMPTZ
);
```

### 10.2 Row Level Security (RLS)

All tables have RLS enabled:

- **profiles**: Users can only read/update their own profile
- **system_prompts**: Only admins can modify; authenticated users can read
- **inquiries**: Users see their own; doctors see all
- **health_reports**: Users see/create their own

### 10.3 Supabase Setup

Run `supabase_setup.sql` to initialize the database:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard SQL Editor
# Paste contents of supabase_setup.sql
```

---

## 11. Developer Mode & Testing

### 11.1 Enabling Developer Mode

**Via UI**:
1. Click the gear icon in the header (when logged in as admin)
2. Toggle "Developer Mode"

**Via Console**:
```javascript
localStorage.setItem('isDeveloperMode', 'true')
location.reload()
```

### 11.2 Developer Mode Features

When enabled, the DiagnosisWizard shows:

1. **Step Jumper**: Dropdown to jump to any step
2. **Fill Data Button**: Populates mock data for current step
3. **Profile Selector**: Choose pre-defined test patient profiles
4. **View Mock Report**: Jump directly to report with mock data
5. **Show Prompt Buttons**: View AI prompts being used

### 11.3 Mock Patient Profiles

Three pre-defined profiles in `MOCK_PROFILES`:

| Profile | Description | Key Conditions |
|---------|-------------|----------------|
| Profile 1 | Elderly Woman (72yo) | Chronic kidney disease, edema |
| Profile 2 | Woman 30+ (34yo) | Stomach issues, stress, bloating |
| Profile 3 | Elderly Man (68yo) | Stroke history, hypertension |

### 11.4 Test Runner

**Location**: `/test-runner`

**Features**:
- Automated test suite for all API endpoints
- Category filtering (API, Components, Utils)
- Pass/fail status with timing
- "Give me prompt" - generates debugging prompts

**Test Categories**:
- API Tests: Chat, Consult, Image Analysis, Audio Analysis
- Component Tests: Mock profiles, JSON repair
- Utility Tests: Helper functions

### 11.5 Test Pages

| Route | Purpose |
|-------|---------|
| `/test-runner` | Automated test suite |
| `/test-chat` | Interactive chat testing |
| `/test-report` | Report display testing |
| `/test-report-chat` | Report chat testing |
| `/test-gemini` | Gemini API testing |
| `/test-image` | Image analysis testing |
| `/test-prompts` | Prompt testing |
| `/test-pdf` | PDF generation testing |

---

## 12. Deployment & Environment

### 12.1 Environment Variables

Create `.env.local` in project root:

```env
# Required: Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Required: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 12.2 Running Locally

```bash
# Install dependencies
npm install

# Start development server (always on port 3000!)
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

> ⚠️ **IMPORTANT**: Always use `localhost:3000`. Port 5000 is reserved for other applications.

### 12.3 Deployment (Vercel)

1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

The app is configured for Vercel with:
- `maxDuration: 60` for long AI requests
- `dynamic: 'force-dynamic'` for streaming routes

### 12.4 Browser Requirements

| Requirement | Purpose |
|-------------|---------|
| Camera access | Tongue/face/body photos |
| Microphone access | Voice recording |
| Modern browser | Chrome, Firefox, Edge, Safari 15+ |
| JavaScript enabled | React SPA |

---

## 13. Troubleshooting

### 13.1 Common Issues

#### AI Response Empty or Failing

**Symptoms**: Chat returns empty, analysis hangs

**Solutions**:
1. Check `GOOGLE_GENERATIVE_AI_API_KEY` is set
2. Verify API quota in Google Cloud Console
3. Check browser console for error details
4. Try fallback model manually

```javascript
// Debug in browser console
fetch('/api/test-gemini', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

#### Supabase Connection Errors

**Symptoms**: "Error connecting to database"

**Solutions**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check Supabase project status
3. Ensure RLS policies allow access

#### Camera/Microphone Not Working

**Solutions**:
1. Check browser permissions
2. Use HTTPS (required for media access)
3. Ensure device has camera/microphone

#### JSON Parsing Errors

**Symptoms**: "Failed to parse AI response"

The `repairJSON` function handles common issues:
```typescript
import { repairJSON } from '@/components/diagnosis/DiagnosisWizard'

const fixed = repairJSON(malformedJSON)
```

### 13.2 Debug Logging

API routes include console logging:

```typescript
console.log('[API /api/chat] Request received:', { ... })
console.log('[API /api/chat] Stream finished.')
console.error('[API /api/chat] Error:', error)
```

View in terminal running `npm run dev`.

### 13.3 Reporting Bugs

1. Enable Developer Mode
2. Use Test Runner to isolate the issue
3. Capture browser console logs
4. Note the step and action that caused the issue
5. File issue with reproduction steps

---

## 14. Contributing Guidelines

### 14.1 Code Style

- TypeScript strict mode
- ESLint with Next.js config
- Tailwind CSS for styling
- Functional components with hooks

### 14.2 File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- API routes: `route.ts` in directory
- Tests: `*.test.ts`

### 14.3 Component Guidelines

1. Use TypeScript interfaces for props
2. Include JSDoc comments for complex functions
3. Export named functions (not default when possible)
4. Use `useLanguage()` for all user-facing text

```typescript
interface MyComponentProps {
  title: string
  onComplete: (data: any) => void
}

/**
 * My component does X.
 * @param title - Display title
 * @param onComplete - Callback when done
 */
export function MyComponent({ title, onComplete }: MyComponentProps) {
  const { t } = useLanguage()
  // ...
}
```

### 14.4 Adding New Steps

1. Add step ID to `DiagnosisStep` type
2. Add to `STEPS` array in DiagnosisWizard
3. Update `nextStep()` and `prevStep()` functions
4. Create component with `onComplete` + `onBack` props
5. Add translations to all language files
6. Add rendering logic in wizard

---

## 15. Future Roadmap

### Planned Features

- [ ] Save diagnosis history to database
- [ ] Multi-turn report conversation history
- [ ] Enhanced pulse analysis with smartwatch integration
- [ ] Herbal medicine database integration
- [ ] Practitioner verification system
- [ ] Appointment booking integration
- [ ] Mobile app (React Native)

### Technical Improvements

- [ ] Unit test coverage
- [ ] E2E testing with Playwright
- [ ] Performance optimization
- [ ] Offline capability (PWA)
- [ ] Real-time collaboration for practitioners

---

## Appendix A: Quick Reference

### Key Files

| Purpose | File |
|---------|------|
| Main wizard | `src/components/diagnosis/DiagnosisWizard.tsx` |
| Doctor levels | `src/lib/doctorLevels.ts` |
| AI prompts | `src/lib/systemPrompts.ts` |
| Translations | `src/lib/translations/*.ts` |
| Database config | `src/lib/supabase.ts` |

### Key Commands

```bash
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run lint    # Run linter
```

### Key URLs

| Route | Purpose |
|-------|---------|
| `/` | Main diagnosis app |
| `/login` | Authentication |
| `/admin` | Admin dashboard |
| `/test-runner` | Automated tests |

---

*This manual is maintained by the Sihat TCM development team. For questions or updates, please submit a pull request or issue.*
