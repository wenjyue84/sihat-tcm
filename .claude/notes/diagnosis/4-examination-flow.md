# 4-Examination Flow (四诊合参)

> **Last updated:** 2026-02-06 (Initial creation)
> **Status:** Active
> **Tags:** #diagnosis #wizard #tcm #state-management

## What This Is

Traditional Chinese Medicine diagnosis flow implemented as a multi-step wizard. Follows the classical 4-Examination Model (望闻问切) with modern IoT device integration.

## Wizard Steps

1. **Basic Info** - Patient demographics and chief complaint
2. **Inquiry (问 WEN)** - Chat-based symptom gathering
3. **Visual Analysis (望 WANG)** - Image upload and TCM analysis
4. **Audio (闻 WEN)** - Voice recording and pattern analysis
5. **Pulse (切 QIE)** - Manual or device-based pulse diagnosis
6. **IoT Smart Connect** - Device data integration (optional)
7. **Analysis** - AI-powered TCM analysis
8. **Results** - Diagnosis and recommendations

## Common Mistakes & Fixes

### 1. Step Navigation State Desync

**Problem:**
- User clicks "Next" but wizard doesn't advance
- Step counter shows wrong step number
- Back button skips steps

**Root Cause:**
- `currentStep` state not updated correctly
- Multiple state updates in same render
- Missing validation before step change

**Fix:**
```typescript
const handleNext = async () => {
  // 1. Validate current step data
  if (!isCurrentStepValid()) {
    showValidationError();
    return;
  }

  // 2. Save current step data
  await saveStepData(currentStep, stepData);

  // 3. Update step counter (single state update)
  setCurrentStep(prev => prev + 1);
};
```

**Prevention:**
- Validate before advancing
- Use single state update for step change
- Add logging for step transitions
- Test back/forward navigation thoroughly

---

### 2. Lost Data When Navigating Back

**Problem:**
- User goes back to previous step
- Previously entered data disappears
- Have to re-enter information

**Root Cause:**
- Step data not persisted when navigating
- State cleared on step change
- Draft save not triggered on navigation

**Fix:**
```typescript
// Save data before navigating (forward OR backward)
const handleStepChange = async (direction: "next" | "back") => {
  // Save current step data first
  await saveStepData(currentStep, stepData);

  // Then navigate
  const newStep = direction === "next"
    ? currentStep + 1
    : currentStep - 1;

  setCurrentStep(newStep);
};
```

**Prevention:**
- Save on every navigation (not just forward)
- Load saved data when returning to step
- Use session recovery as backup

---

### 3. Conditional Steps Cause Navigation Issues

**Problem:**
- IoT step skipped when no devices available
- Step counter doesn't match visible steps
- Progress bar calculation wrong

**Root Cause:**
- Hardcoded step numbers
- Not accounting for optional steps
- Missing skip logic

**Fix:**
```typescript
// Define step configuration
const STEPS = [
  { id: "basic", required: true },
  { id: "inquiry", required: true },
  { id: "visual", required: true },
  { id: "audio", required: true },
  { id: "pulse", required: true },
  { id: "iot", required: false }, // Optional
  { id: "analysis", required: true },
  { id: "results", required: true }
];

// Calculate active steps dynamically
const activeSteps = STEPS.filter(step =>
  step.required || (step.id === "iot" && hasIoTDevices)
);

// Use array index for navigation
const currentStepIndex = activeSteps.findIndex(s => s.id === currentStepId);
```

**Prevention:**
- Use step IDs instead of hardcoded numbers
- Calculate progress based on active steps
- Test with IoT enabled/disabled

---

## Decisions Made

| Date | Decision | Rationale | PR |
|------|----------|-----------|-----|
| 2026-01-10 | IoT step optional | Not all practitioners have devices | #65 |
| 2026-01-15 | Auto-save on navigation | Prevent data loss when going back | #73 |
| 2026-01-25 | Progress bar based on completed steps | Better user feedback | #91 |

## Related Files

- `sihat-tcm-web/src/components/diagnosis/DiagnosisWizard.tsx` - Main wizard component
- `sihat-tcm-web/src/components/diagnosis/inquiry/hooks/useInquiryWizardState.ts` - State hook
- `sihat-tcm-web/src/types/diagnosis.ts` - `DiagnosisWizardData` type

## Related Notes

- [IoT Connection Wizard](./iot-connection-wizard.md) - Optional IoT step
- [Session Recovery](./session-recovery.md) - Saving wizard state
- [Error Handling](../patterns/error-handling.md) - Wizard error boundaries

## State Structure

```typescript
interface DiagnosisWizardData {
  basicInfo: BasicInfo | null;
  inquiryData: InquiryData | null;
  visualAnalysis: VisualAnalysisData | null;
  audioAnalysis: AudioAnalysisData | null;
  pulseData: PulseData | null;
  smartConnectData: SmartConnectData | null; // Optional
  currentStep: number;
  isComplete: boolean;
}
```

## Progress Calculation

```typescript
function calculateProgress(data: DiagnosisWizardData): number {
  const requiredSteps = [
    data.basicInfo,
    data.inquiryData,
    data.visualAnalysis,
    data.audioAnalysis,
    data.pulseData
  ];

  const completedRequired = requiredSteps.filter(Boolean).length;
  const totalRequired = requiredSteps.length;

  return Math.round((completedRequired / totalRequired) * 100);
}
```

## Testing Checklist

- [ ] Forward navigation works for all steps
- [ ] Backward navigation preserves data
- [ ] Progress bar updates correctly
- [ ] Validation blocks invalid step transitions
- [ ] IoT step skipped when no devices
- [ ] Session recovery restores correct step
- [ ] Data persists across step changes

## Update History

| Date | PR | Change | Author |
|------|----|--------|--------|
| 2026-02-06 | N/A | Initial creation | Claude |
