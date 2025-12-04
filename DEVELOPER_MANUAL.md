# Sihat TCM - Developer Manual

> **AI-Powered Traditional Chinese Medicine Diagnosis System**
> 
> This document provides a comprehensive guide for developers to understand the system architecture, file responsibilities, and data flow.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture](#core-architecture)
5. [Key Files Reference](#key-files-reference)
6. [Data Flow](#data-flow)
7. [API Reference](#api-reference)
8. [Component Hierarchy](#component-hierarchy)
9. [TCM Diagnosis Flow](#tcm-diagnosis-flow)
10. [Environment Setup](#environment-setup)

---

## Project Overview

**Sihat TCM** is an AI-powered Traditional Chinese Medicine (TCM) diagnosis application that guides users through the **"Four Examinations" (四诊 Sì Zhěn)** diagnostic method:

| Examination | Chinese | Method | Implementation |
|-------------|---------|--------|----------------|
| **Wang (望)** | Observation | Visual inspection of tongue, face | Camera capture/upload |
| **Wen (闻/问)** | Listening & Inquiry | Voice analysis, patient interview | Audio recording, AI chat |
| **Qie (切)** | Palpation | Pulse diagnosis | Manual BPM tap measurement |

The system uses **Google Gemini AI** to analyze all inputs and generate a comprehensive TCM diagnosis with dietary and lifestyle recommendations.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript / React 19 |
| **AI SDK** | Vercel AI SDK (`@ai-sdk/google`, `@ai-sdk/react`) |
| **Styling** | Tailwind CSS 4 |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **Database** | Supabase (optional) |
| **UI Components** | Custom + Radix UI primitives |

---

## Project Structure

```
sihat-tcm/
├── src/
│   ├── app/                    # Next.js App Router pages & API
│   │   ├── api/
│   │   │   ├── chat/           # AI chat endpoint (inquiry phase)
│   │   │   └── consult/        # Final diagnosis generation
│   │   ├── page.tsx            # Home page (main entry)
│   │   ├── layout.tsx          # Root layout with fonts
│   │   └── globals.css         # Global styles & design tokens
│   │
│   ├── components/
│   │   ├── diagnosis/          # Core diagnosis workflow components
│   │   │   ├── DiagnosisWizard.tsx      # ⭐ Main orchestrator
│   │   │   ├── BasicInfoForm.tsx        # Patient info collection
│   │   │   ├── InquiryStep.tsx          # AI chat-based inquiry
│   │   │   ├── CameraCapture.tsx        # Tongue/face photo capture
│   │   │   ├── AudioRecorder.tsx        # Voice recording
│   │   │   ├── PulseCheck.tsx           # BPM measurement
│   │   │   ├── DiagnosisReport.tsx      # Final results display
│   │   │   ├── AnalysisLoadingScreen.tsx # Loading animation
│   │   │   ├── ProgressStepper.tsx      # Visual progress tracker
│   │   │   └── AdaptiveChat.tsx         # Reusable chat component
│   │   │
│   │   ├── ui/                 # Reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   └── textarea.tsx
│   │   │
│   │   └── Footer.tsx          # Page footer
│   │
│   └── lib/
│       ├── utils.ts            # Utility functions (cn helper)
│       └── supabase.ts         # Supabase client initialization
│
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── package.json                # Dependencies & scripts
├── schema.sql                  # Database schema (if using Supabase)
└── next.config.ts              # Next.js configuration
```

---

## Core Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          page.tsx (Home)                            │
│                               │                                      │
│                               ▼                                      │
│                      DiagnosisWizard.tsx                            │
│         ┌─────────────────────┼─────────────────────┐               │
│         │                     │                     │               │
│         ▼                     ▼                     ▼               │
│   BasicInfoForm         CameraCapture         AudioRecorder         │
│         │               InquiryStep            PulseCheck          │
│         │                     │                     │               │
│         └──────────── Collect Data ─────────────────┘               │
│                               │                                      │
│                               ▼                                      │
│                    API: /api/consult                                │
│                   (Gemini AI Analysis)                              │
│                               │                                      │
│                               ▼                                      │
│                    DiagnosisReport.tsx                              │
└─────────────────────────────────────────────────────────────────────┘
```

### State Management

The `DiagnosisWizard` component is the **central state manager** that:
- Tracks the current step in the diagnosis flow
- Collects and stores data from each step
- Orchestrates navigation between steps
- Submits all data to the AI for final analysis

---

## Key Files Reference

### 📁 Entry Points

#### `src/app/page.tsx`
**Purpose**: Home page - renders the main application shell

**Key Responsibilities**:
- Displays the hero header with branding
- Renders the `DiagnosisWizard` component
- Provides a "Test" button (dev mode only) to auto-fill form data

```tsx
// Dispatches event for test data population
window.dispatchEvent(new CustomEvent('fill-test-data'))
```

---

#### `src/app/layout.tsx`
**Purpose**: Root layout for all pages

**Key Responsibilities**:
- Sets up Google fonts (Geist Sans/Mono)
- Imports global CSS
- Renders the Footer component

---

### 📁 Diagnosis Components

#### `src/components/diagnosis/DiagnosisWizard.tsx` ⭐ **CRITICAL**
**Purpose**: Main orchestrator of the entire diagnosis flow

**Key State**:
```typescript
type DiagnosisStep = 
  | 'basic_info'   // Step 1: Patient information
  | 'wen_inquiry'  // Step 2: AI-powered chat inquiry
  | 'wang_tongue'  // Step 3: Tongue photo
  | 'wang_face'    // Step 4: Face photo
  | 'wen_audio'    // Step 5: Voice recording
  | 'qie'          // Step 6: Pulse measurement
  | 'analyzing'    // Loading state
  | 'result'       // Final report

// Main data store
const [diagnosisData, setDiagnosisData] = useState<{
  basic_info: BasicInfoData | null,
  wen_inquiry: { inquiryText: string, chatHistory: any[], files: any[] } | null,
  wang_tongue: { image: string | null } | null,
  wang_face: { image: string | null } | null,
  wen_audio: { audio: string | null } | null,
  qie: { bpm: number } | null
}>({...})
```

**Key Functions**:
- `nextStep(current)`: Determines the next step in the flow
- `prevStep(current)`: Handles back navigation
- `submitConsultation()`: Sends all data to `/api/consult` for AI analysis

**Data Flow**:
1. Each child component receives an `onComplete` callback
2. When a step completes, it calls `onComplete(data)`
3. The wizard updates `diagnosisData` state and advances to the next step

---

#### `src/components/diagnosis/BasicInfoForm.tsx`
**Purpose**: Collects initial patient information

**Data Structure**:
```typescript
interface BasicInfoData {
  name: string
  age: string
  gender: string
  weight: string      // in kg
  height: string      // in cm
  symptoms: string    // Main complaints
  symptomDuration: string
}
```

**Features**:
- Age, weight, height selection via dropdowns OR manual input
- Common symptom tags for quick selection
- Symptom duration selection
- "Quick Fill" test data button (dev mode)

---

#### `src/components/diagnosis/InquiryStep.tsx`
**Purpose**: AI-powered chat for detailed symptom inquiry

**Key Features**:
- Uses `useChat` from `@ai-sdk/react` to communicate with `/api/chat`
- Displays patient info summary at the top (BMI calculation included)
- Supports file uploads (medical reports)
- Shows chat history between user and AI doctor
- Collects detailed symptom information through conversation

**Integration**:
```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
    body: { basicInfo },  // Passes patient context to AI
    initialMessages: [...]
})
```

---

#### `src/components/diagnosis/CameraCapture.tsx`
**Purpose**: Captures or uploads photos (tongue/face)

**Features**:
- Live camera preview with WebRTC
- Photo capture button
- File upload fallback for devices without camera
- Retake/confirm workflow
- Skip option (configurable via `required` prop)

**Props**:
```typescript
interface CameraCaptureProps {
  onComplete: (data: { image: string | null }) => void
  title?: string         // e.g., "Tongue Inspection"
  instruction?: string   // Guidance text
  required?: boolean     // If false, allows skip
}
```

---

#### `src/components/diagnosis/AudioRecorder.tsx`
**Purpose**: Records patient voice (for "Wen - Listening" examination)

**Features**:
- WebRTC audio capture
- Real-time audio visualization (frequency bars)
- Converts audio to Base64 for API transmission
- Visual recording indicator

---

#### `src/components/diagnosis/PulseCheck.tsx`
**Purpose**: Manual pulse/BPM measurement via tap rhythm

**Mechanism**:
1. User places fingers on wrist to feel pulse
2. Taps button in sync with heartbeat
3. System calculates BPM from tap intervals

```typescript
// BPM calculation from tap intervals
const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
setBpm(Math.round(60000 / avgInterval))
```

---

#### `src/components/diagnosis/DiagnosisReport.tsx`
**Purpose**: Displays the final AI-generated diagnosis

**Data Structure Expected**:
```typescript
interface DiagnosisReportProps {
  data: {
    diagnosis: string        // Primary TCM pattern
    constitution: string     // Body constitution type
    analysis: string         // Detailed explanation
    recommendations: {
      food: string[]        // Recommended foods
      avoid: string[]       // Foods to avoid
      lifestyle: string[]   // Lifestyle advice
    }
  }
  onRestart: () => void
}
```

---

#### `src/components/diagnosis/AnalysisLoadingScreen.tsx`
**Purpose**: Engaging loading experience during AI analysis

**Features**:
- Displays patient info summary
- Rotating TCM educational facts
- Elapsed time counter
- Animated visual elements

---

#### `src/components/diagnosis/ProgressStepper.tsx`
**Purpose**: Visual step indicator at top of wizard

**Props**:
```typescript
interface ProgressStepperProps {
  currentStep: string
  steps: { id: string; label: string }[]
}
```

---

### 📁 API Routes

#### `/api/chat/route.ts`
**Purpose**: Powers the AI-driven inquiry chat

**Model**: `gemini-2.0-flash-exp`

**System Prompt Highlights**:
- Role: Experienced 老中医 (TCM practitioner)
- Methodology: Traditional 十问歌 (Ten Questions) of TCM
- Rules: Ask ONE question at a time, be empathetic
- Safety: Advise emergency care for serious symptoms

**Input**:
```typescript
{
  messages: ChatMessage[],  // Conversation history
  basicInfo?: BasicInfoData // Patient context
}
```

**Output**: Streamed text response

---

#### `/api/consult/route.ts`
**Purpose**: Generates final TCM diagnosis from all collected data

**Model**: `gemini-2.0-flash`

**Input Processing**:
1. Receives all diagnosis data (text, images, audio)
2. Builds multimodal content array for Gemini
3. Includes images as Base64 inline data

**System Prompt Requirements**:
- Apply Eight Principles (Ba Gang) diagnosis
- Identify Zang Fu disharmonies
- Assess Qi, Blood, Yin, Yang status
- Return structured JSON response

**Expected Output Format**:
```json
{
  "diagnosis": "Spleen Qi Deficiency with Dampness",
  "constitution": "Phlegm-Dampness Type",
  "analysis": "## Detailed analysis...",
  "recommendations": {
    "food": ["Warm congee", "Ginger tea"],
    "avoid": ["Cold foods", "Dairy"],
    "lifestyle": ["Sleep before 11pm", "Practice Tai Chi"]
  }
}
```

---

### 📁 Utility Files

#### `src/lib/utils.ts`
**Purpose**: Shared utility functions

```typescript
// Tailwind class name merger (handles conflicts)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

#### `src/lib/supabase.ts`
**Purpose**: Supabase client initialization (if database is used)

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Data Flow

### Complete Diagnosis Journey

```
1. BasicInfoForm
   └─► { name, age, gender, weight, height, symptoms, symptomDuration }

2. InquiryStep
   └─► { inquiryText, chatHistory, files[] }

3. CameraCapture (Tongue)
   └─► { image: base64String | null }

4. CameraCapture (Face)
   └─► { image: base64String | null }

5. AudioRecorder
   └─► { audio: base64String | null }

6. PulseCheck
   └─► { bpm: number }

            ┌─────────────────────────────────┐
            │     All data combined in        │
            │     DiagnosisWizard state       │
            └───────────────┬─────────────────┘
                            │
                            ▼
            ┌─────────────────────────────────┐
            │      POST /api/consult          │
            │   (Gemini AI processes all)     │
            └───────────────┬─────────────────┘
                            │
                            ▼
            ┌─────────────────────────────────┐
            │      DiagnosisReport            │
            │  (Displays results to user)     │
            └─────────────────────────────────┘
```

---

## Component Hierarchy

```
page.tsx
└── DiagnosisWizard
    ├── ProgressStepper (always visible)
    │
    ├── [Step: basic_info]
    │   └── BasicInfoForm
    │
    ├── [Step: wen_inquiry]
    │   └── InquiryStep
    │       └── useChat → /api/chat
    │
    ├── [Step: wang_tongue]
    │   └── CameraCapture (title="Tongue Inspection")
    │
    ├── [Step: wang_face]
    │   └── CameraCapture (title="Face Inspection")
    │
    ├── [Step: wen_audio]
    │   └── AudioRecorder
    │
    ├── [Step: qie]
    │   └── PulseCheck
    │
    ├── [Step: analyzing]
    │   └── AnalysisLoadingScreen
    │
    └── [Step: result]
        └── DiagnosisReport
```

---

## TCM Diagnosis Flow

The system implements the **Four Examinations of TCM (四诊)**:

### 1. 望 (Wàng) - Observation
- **Implementation**: `CameraCapture` component
- **Examines**: Tongue coating/color, facial complexion
- **AI Analysis**: Gemini analyzes images for signs like:
  - Pale tongue → Qi/Blood deficiency
  - Red tongue → Heat pattern
  - Thick coating → Dampness

### 2. 闻 (Wén) - Listening
- **Implementation**: `AudioRecorder` component
- **Examines**: Voice quality, breathing sounds
- **AI Analysis**: Voice patterns for:
  - Weak voice → Qi deficiency
  - Hoarse voice → Yin deficiency

### 3. 问 (Wèn) - Inquiry
- **Implementation**: `InquiryStep` + `/api/chat`
- **Examines**: Symptoms, medical history, lifestyle
- **Methodology**: Based on 十问歌 (Ten Questions):
  1. Temperature sensations
  2. Perspiration patterns
  3. Head and body symptoms
  4. Bowel movements
  5. Diet and appetite
  6. Chest and abdomen
  7. Hearing and vision
  8. Thirst patterns
  9. Medical history
  10. Reproductive health

### 4. 切 (Qiè) - Palpation
- **Implementation**: `PulseCheck` component
- **Examines**: Pulse rate (BPM)
- **AI Analysis**: Correlates with:
  - Slow pulse → Cold pattern
  - Rapid pulse → Heat pattern

---

## Environment Setup

### Required Environment Variables

Create `.env.local` in project root:

```env
# Google AI (Required)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Supabase (Optional - for database features)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Application

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm start
```

### Browser Requirements
- **Camera access**: Required for tongue/face photos
- **Microphone access**: Required for audio recording
- **Modern browser**: Chrome, Firefox, Edge recommended

---

## Development Tips

### 1. Testing Without Hardware
- Skip buttons are available in development mode
- Use file upload as fallback for camera
- Click "Test" button to auto-fill basic info form

### 2. Debugging AI Responses
- Check console logs in `/api/consult/route.ts`
- AI response is streamed - issues may be in parsing

### 3. Styling
- Uses Tailwind CSS with custom CSS variables
- Color scheme: Emerald (primary), Stone (neutral)
- Dark mode variables defined but not fully implemented

### 4. Adding New Steps
1. Add new step ID to `DiagnosisStep` type
2. Add to `STEPS` array
3. Update `nextStep()` and `prevStep()` functions
4. Create new component with `onComplete` prop
5. Add rendering logic in wizard

---

## Future Considerations

- [ ] Implement user authentication (Login/Signup button exists)
- [ ] Save diagnosis history to Supabase
- [ ] Add multi-language support (Chinese/English)
- [ ] Implement true audio analysis in AI
- [ ] Add detailed pulse analysis (not just BPM)
- [ ] Mobile app version with native camera access

---

*Last Updated: December 2024*
