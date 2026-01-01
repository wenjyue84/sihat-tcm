---
paths: "**/diagnosis/**/*,**/components/diagnosis/**/*,**/screens/diagnosis/**/*"
---

# Diagnosis System Rules for Sihat TCM

## 4-Examination Model (四诊合参)

The diagnosis flow follows traditional TCM methodology:

1. **Basic Info** - Patient demographics and chief complaint
2. **Inquiry (问 WEN)** - Questioning via chat interface
3. **Visual Analysis (望 WANG)** - Tongue, face, body inspection
4. **Audio Analysis (闻 WEN)** - Voice pattern analysis
5. **Pulse Diagnosis (切 QIE)** - Pulse characteristics
6. **IoT Smart Connect** - Device data integration
7. **AI Analysis** - Comprehensive TCM analysis
8. **Results** - Diagnosis and recommendations

## Critical Import Rules

### DiagnosisWizard

**ALWAYS use default import:**

```typescript
// ✅ Correct
import DiagnosisWizard from "@/components/diagnosis/DiagnosisWizard";

// ❌ Wrong - will cause runtime error
import { DiagnosisWizard } from "@/components/diagnosis/DiagnosisWizard";
```

## State Management

### useInquiryWizardState Hook

Located at: `src/components/diagnosis/inquiry/hooks/useInquiryWizardState.ts`

```typescript
const {
  inquiryData,
  updateInquiry,
  resetInquiry,
  isComplete,
} = useInquiryWizardState(initialData);
```

### DiagnosisWizardData Structure

```typescript
interface DiagnosisWizardData {
  basicInfo: BasicInfo | null;
  inquiryData: InquiryData | null;
  visualAnalysis: VisualAnalysisData | null;
  audioAnalysis: AudioAnalysisData | null;
  pulseData: PulseData | null;
  smartConnectData: SmartConnectData | null;
  currentStep: number;
  isComplete: boolean;
}
```

## IoT Connection Wizard

### Device Types

```typescript
type DeviceType =
  | "pulse"
  | "blood_pressure"
  | "oxygen"
  | "temperature"
  | "hrv"
  | "stress";
```

### Connection Flow

1. User selects device type
2. Validate device configuration
3. Establish connection (or manual input)
4. Verify data integrity
5. Store in SmartConnectData

### Error Handling

```typescript
// Always handle connection failures gracefully
try {
  await connectToDevice(deviceConfig);
} catch (error) {
  // Show user-friendly message
  // Offer manual input fallback
  // Log error for debugging
}
```

## Session Recovery

### PendingResumeState

```typescript
interface PendingResumeState {
  sessionId: string;
  patientId: string;
  currentStep: number;
  completionPercentage: number;
  lastUpdated: Date;
  wizardData: Partial<DiagnosisWizardData>;
}
```

### SessionRecoveryModal Usage

```typescript
<SessionRecoveryModal
  pendingSessions={sessions}
  onResume={(session) => resumeDiagnosis(session)}
  onDelete={(sessionId) => deleteDraft(sessionId)}
  onDismiss={() => setShowRecovery(false)}
/>
```

### Draft Persistence

- Drafts auto-save to Supabase `diagnosis_drafts` table
- Save on step completion and every 30 seconds
- Include all wizard state for full recovery

## Visual Analysis

### Image Types

```typescript
type VisualType = "tongue" | "face" | "body";
```

### TCM Indicators

- Tongue: coating, color, shape, moisture
- Face: complexion, features, expression
- Body: posture, movement, skin

### Image Handling

- Validate image before upload
- Compress if > 2MB
- Support JPEG, PNG, HEIC
- Store analysis results with images

## Audio Analysis

### Voice Observations

```typescript
interface AudioAnalysisData {
  recordingUrl: string;
  duration: number;
  observations: {
    voiceQuality: string;
    breathingPattern: string;
    coughCharacteristics?: string;
    speechPattern: string;
  };
  tcmInterpretation: string;
}
```

## AI Model Selection

### Complexity-Based Routing

```typescript
// ModelRouter selects based on case complexity
const model = selectModel({
  complexity: calculateComplexity(wizardData),
  urgency: determineUrgency(symptoms),
});

// Master (Sonnet) - Complex multi-system cases
// Expert (Haiku) - Standard diagnoses
// Physician (Haiku-mini) - Simple cases
```

## Testing Diagnosis Flows

- Test complete flow end-to-end
- Mock AI responses consistently
- Test session recovery scenarios
- Verify data persistence at each step
- Test IoT connection failures and recovery
