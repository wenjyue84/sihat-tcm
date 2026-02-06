# Diagnosis Wizard Implementation Guide

> **Generated:** 2026-02-06
> **Source:** UI/UX Pro Max + Healthcare Best Practices
> **Target:** DiagnosisWizard component (7-step flow)

---

## 🎯 Design System Hierarchy

When implementing the Diagnosis Wizard:

1. **Read this file first** → Diagnosis-specific patterns
2. **Check** `pages/diagnosis.md` → Page-level overrides
3. **Fallback to** `MASTER.md` → Global design tokens

---

## 📐 Layout Pattern: Funnel (Progressive Disclosure)

### 7-Step Flow
```
Step 1: Basic Info (problem identification)
Step 2: Inquiry/WEN (symptom collection)
Step 3: Visual Analysis/WANG (image upload)
Step 4: Audio Analysis/WEN (voice recording)
Step 5: Pulse/QIE (pulse data)
Step 6: IoT Smart Connect (device integration)
Step 7: Analysis & Results (diagnosis output)
```

### Visual Structure
```tsx
<WizardContainer>
  <ProgressIndicator current={step} total={7} />
  <StepContent maxWidth="800px">
    {/* Current step form */}
  </StepContent>
  <WizardNavigation>
    <Button variant="outline">Back</Button>
    <Button variant="primary" disabled={!isValid}>
      {step < 7 ? "Next Step" : "Complete Diagnosis"}
    </Button>
  </WizardNavigation>
</WizardContainer>
```

---

## 🎨 Step Color Strategy

**Recommended color progression:**

| Step | Color | Meaning | Tailwind Class |
|------|-------|---------|----------------|
| 1-2 | Orange | Problem identification | `text-orange-600` |
| 3-5 | Blue/Cyan | Data collection | `text-cyan-600` |
| 6 | Teal | Technology integration | `text-teal-600` |
| 7 | Green | Solution/completion | `text-green-600` |

**Progress bar gradient:**
```tsx
<ProgressBar
  className="bg-gradient-to-r from-orange-500 via-cyan-500 to-green-500"
  style={{ width: `${(currentStep / 7) * 100}%` }}
/>
```

---

## ✅ Critical UX Requirements (HIGH Severity)

### 1. Progress Indication (UX Result #1)
**Do:**
```tsx
<div className="mb-8">
  <p className="text-sm text-muted-foreground mb-2">
    Step {currentStep} of 7
  </p>
  <div className="flex gap-2">
    {[1,2,3,4,5,6,7].map(step => (
      <div
        key={step}
        className={cn(
          "h-2 flex-1 rounded-full transition-colors",
          step <= currentStep ? "bg-primary" : "bg-muted"
        )}
      />
    ))}
  </div>
</div>
```

**Don't:**
- No step indicators
- No way to know total steps
- Can't see completed progress

---

### 2. Form Validation (UX Result #2)
**Do:** Validate on blur
```tsx
<Input
  type="email"
  onBlur={(e) => {
    const isValid = validateEmail(e.target.value);
    if (!isValid) {
      setError("Please enter a valid email");
    }
  }}
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <p id="email-error" className="text-sm text-destructive mt-1" role="alert">
    {error}
  </p>
)}
```

**Don't:**
- Wait until final submit to show errors
- Show errors while user is still typing (too aggressive)
- Silent validation failures

---

### 3. Submit Feedback (UX Result #3 - HIGH)
**Do:** Show loading states
```tsx
<Button
  onClick={handleSubmit}
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Analyzing...
    </>
  ) : (
    "Complete Diagnosis"
  )}
</Button>

{/* After submission */}
{status === "success" && (
  <Alert className="mt-4">
    <CheckCircle2 className="h-4 w-4" />
    <AlertTitle>Diagnosis Complete</AlertTitle>
    <AlertDescription>
      Your TCM analysis is ready. View results below.
    </AlertDescription>
  </Alert>
)}
```

**Don't:**
- No feedback after button click
- Keep button enabled during submission
- No success/error confirmation

---

### 4. Form Labels (UX Result #4 - HIGH)
**Do:**
```tsx
<div className="space-y-2">
  <Label htmlFor="pulse-bpm">Pulse Rate (BPM)</Label>
  <Input
    id="pulse-bpm"
    type="number"
    inputMode="numeric"
    placeholder="72"
  />
  <p className="text-sm text-muted-foreground">
    Normal range: 60-100 BPM
  </p>
</div>
```

**Don't:**
- Placeholder-only inputs
- Missing `htmlFor` connection
- No helper text for medical data

---

## 🔄 Session Recovery Pattern

**From your SessionRecoveryModal:**

```tsx
<Modal open={hasDraft} onOpenChange={setOpen}>
  <ModalContent>
    <ModalHeader>
      <AlertCircle className="h-5 w-5 text-primary" />
      <ModalTitle>Resume Incomplete Diagnosis?</ModalTitle>
    </ModalHeader>
    <ModalDescription>
      You have an incomplete diagnosis session from {formatDate(draft.timestamp)}.
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span className="font-medium">{draft.completionPercentage}%</span>
        </div>
        <Progress value={draft.completionPercentage} />
      </div>
    </ModalDescription>
    <ModalFooter>
      <Button variant="outline" onClick={handleDelete}>
        Start Fresh
      </Button>
      <Button onClick={handleResume}>
        Resume Session
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

**Key features:**
- Show completion percentage
- Visual progress bar
- Clear choice: resume vs. restart
- Non-blocking (can dismiss)

---

## 📱 Mobile Keyboard Optimization

**For different input types:**

```tsx
// Numeric inputs (pulse, age, etc.)
<Input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
/>

// Email
<Input
  type="email"
  inputMode="email"
/>

// URL (device connection)
<Input
  type="url"
  inputMode="url"
/>

// Phone number
<Input
  type="tel"
  inputMode="tel"
/>
```

---

## 🚨 Error Recovery

**Always provide recovery actions:**

```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>IoT Connection Failed</AlertTitle>
    <AlertDescription>
      Unable to connect to pulse sensor.
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={retry}>
          Try Again
        </Button>
        <Button size="sm" variant="outline" onClick={skipToManual}>
          Enter Manually
        </Button>
        <Button size="sm" variant="link" onClick={openHelp}>
          Get Help
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}
```

**Never:**
- Show error without recovery path
- Dead-end error states
- Technical jargon without explanation

---

## 🎯 CTA Strategy

**Each step has a mini-CTA:**

```tsx
// Step navigation
<div className="flex justify-between mt-8">
  {step > 1 && (
    <Button variant="outline" onClick={goBack}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Previous
    </Button>
  )}
  <Button
    onClick={goNext}
    disabled={!isStepValid}
    className="ml-auto"
  >
    {step === 7 ? "Complete Diagnosis" : "Continue"}
    <ArrowRight className="ml-2 h-4 w-4" />
  </Button>
</div>
```

---

## 📊 Auto-Save Pattern

**Save draft every 30 seconds:**

```tsx
useEffect(() => {
  const timer = setInterval(() => {
    if (hasUnsavedChanges) {
      saveDraft(wizardData);
      setLastSaved(new Date());
    }
  }, 30000); // 30 seconds

  return () => clearInterval(timer);
}, [wizardData, hasUnsavedChanges]);

// Show save indicator
<p className="text-xs text-muted-foreground">
  {isSaving ? (
    <>Saving...</>
  ) : lastSaved ? (
    <>Last saved: {formatRelativeTime(lastSaved)}</>
  ) : null}
</p>
```

---

## ✅ Pre-Delivery Checklist (Diagnosis Specific)

Before deploying the Diagnosis Wizard:

- [ ] Progress indicator shows "Step X of 7"
- [ ] Visual progress bar updates on step change
- [ ] All inputs have associated `<Label>` elements
- [ ] Validation shows on `onBlur`, not while typing
- [ ] Error messages appear near problematic field
- [ ] Submit button shows loading state during API call
- [ ] Success/error feedback after submission
- [ ] Session recovery modal shows on return if draft exists
- [ ] Auto-save runs every 30 seconds
- [ ] Back button preserves entered data
- [ ] All form fields have appropriate `inputMode` for mobile
- [ ] Touch targets ≥ 44x44px (especially on mobile)
- [ ] Keyboard navigation works (Tab order logical)
- [ ] Focus states visible on all interactive elements
- [ ] No horizontal scroll on 375px viewport
- [ ] Tested with screen reader (aria-labels present)

---

## 🎨 Color Tokens (Diagnosis Specific)

Use these TCM healthcare colors from Master:

```tsx
// Step indicators
className="bg-health-cyan"     // Steps 1-2 (data collection)
className="bg-tcm-jade"         // Steps 3-5 (analysis)
className="bg-health-green"     // Steps 6-7 (completion)

// Error states
className="bg-destructive"

// Success states
className="bg-health-green"

// Device connection
className="bg-tcm-earth"        // Connected devices

// Loading states
className="bg-muted animate-pulse"
```

---

## 📚 Related Files

- Global design: `design-system/sihat-tcm/MASTER.md`
- Page overrides: `design-system/sihat-tcm/pages/diagnosis.md`
- Component code: `sihat-tcm-web/src/components/diagnosis/DiagnosisWizard.tsx`
- Types: `sihat-tcm-web/src/types/diagnosis.ts`
