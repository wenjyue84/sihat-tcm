# Sihat TCM Mobile - Feature Implementation Prompts

> **Usage:** Copy-paste each prompt into Antigravity IDE when ready to implement that feature.

---

## Prompt 1: Resume Progress Dialog

```
Role: Senior Mobile Architect & QA Specialist (Expo/React Native).
Project: sihat-tcm-mobile (Expo SDK 54, React Native 0.81, JavaScript only).

**FEATURE: Resume Progress Dialog**

Port the web's `ResumeProgressDialog.tsx` functionality to mobile. When a user returns to the diagnosis flow with saved progress in AsyncStorage, show a native modal asking if they want to resume or start fresh.

**Web Reference:**
- `sihat-tcm/src/components/diagnosis/ResumeProgressDialog.tsx`
- `sihat-tcm/src/hooks/useDiagnosisWizard.ts` (persistence logic)

**Requirements:**
1. Create `components/ResumeProgressDialog.js` with:
   - Native Modal with glassmorphism styling (expo-blur)
   - Two options: "Resume Session" and "Start New"
   - Show saved progress summary (step name, timestamp)
   - Haptic feedback (expo-haptics) on button presses

2. Modify `screens/diagnosis/DiagnosisScreen.js` to:
   - Check AsyncStorage for saved diagnosis state on mount
   - Show the dialog BEFORE rendering the first step
   - Handle resume (apply saved state) vs. start new (clear storage)

3. Key AsyncStorage structure:
   ```javascript
   {
     savedStep: 'symptoms',
     savedData: { /* formData object */ },
     savedAt: '2025-12-22T00:00:00Z'
   }
   ```

4. Use `StyleSheet.create()` exclusively. Import colors from `constants/Colors.js`.

**Deliverables:**
- Working ResumeProgressDialog.js component
- Updated DiagnosisScreen.js with persistence hooks
- Translations added to `lib/translations/*.js` (en, zh, ms)

**Definition of Done:**
- User can kill app mid-diagnosis, reopen, and see resume dialog
- "Resume" restores exact formData and step
- "Start New" clears storage and begins fresh
- Haptic feedback on all taps
- No web-isms (no `<div>`, no `onClick`, no `window`)
```

---

## Prompt 2: Thinking Animation

```
Role: Senior Mobile Architect & QA Specialist (Expo/React Native).
Project: sihat-tcm-mobile (Expo SDK 54, React Native 0.81, JavaScript only).

**FEATURE: Thinking Animation (AI Processing Indicator)**

Port the sophisticated `ThinkingAnimation.tsx` from web. This shows during Gemini API calls for image/audio analysis and final diagnosis generation.

**Web Reference:**
- `sihat-tcm/src/components/diagnosis/ThinkingAnimation.tsx`

**Requirements:**
1. Create `components/ThinkingAnimation.js` with:
   - Animated pulsing dots or wave effect (using Animated API)
   - TCM-themed messaging (rotating through: "Analyzing tongue patterns...", "Consulting ancient wisdom...", "Synthesizing diagnosis...")
   - Smooth fade in/out transitions
   - Glassmorphism container with expo-blur

2. Messages should rotate every 2-3 seconds with fade animation

3. Three variants based on context:
   - `type="image"` → Tongue/face analysis messages
   - `type="audio"` → Voice analysis messages  
   - `type="synthesis"` → Final report generation messages

4. Props interface:
   ```javascript
   ThinkingAnimation({ 
     visible, 
     type = 'synthesis', // 'image' | 'audio' | 'synthesis'
     onComplete 
   })
   ```

5. Integrate into:
   - `TongueAnalysisStep.js` (during Gemini API call)
   - `FaceAnalysisStep.js` (during analysis)
   - `AudioAnalysisStep.js` (during voice processing)
   - `AnalysisStep.js` (during final synthesis)

**Deliverables:**
- ThinkingAnimation.js component with smooth React Native animations
- Integration points in all analysis steps
- Translations for all messages (en, zh, ms)

**Definition of Done:**
- Animation is smooth (60fps) with no jank
- Messages cycle with crossfade effect
- Component unmounts cleanly when `visible` becomes false
- No `setInterval` memory leaks
```

---

## Prompt 3: Phase Complete Animation

```
Role: Senior Mobile Architect & QA Specialist (Expo/React Native).
Project: sihat-tcm-mobile (Expo SDK 54, React Native 0.81, JavaScript only).

**FEATURE: Phase Complete Animation**

Port the celebration/transition animation that plays when completing major diagnosis phases (e.g., after Observation → Auscultation → Inquiry).

**Web Reference:**
- `sihat-tcm/src/components/diagnosis/PhaseCompleteAnimation.tsx`

**Requirements:**
1. Create `components/PhaseCompleteAnimation.js` with:
   - Full-screen overlay animation
   - Checkmark with circular progress animation
   - Phase name display with scale-in effect
   - Confetti or particle burst (optional, use reanimated if needed)
   - Auto-dismiss after 1.5-2 seconds

2. Props:
   ```javascript
   PhaseCompleteAnimation({
     visible,
     phaseName, // e.g., "Observation Complete", "问诊完成"
     phaseIcon, // Ionicon name
     onComplete, // Called when animation finishes
   })
   ```

3. Use Animated API (not reanimated unless needed for particles):
   - Sequence: fade in → circle draws → checkmark scales → text appears → pause → fade out
   - Haptic: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`

4. Integrate into `DiagnosisScreen.js`:
   - Trigger when transitioning between major phases:
     - BasicInfo → Observation (tongue/face)
     - Observation → Auscultation (audio)
     - Auscultation → Inquiry (chat)
     - Inquiry → Results

**Deliverables:**
- PhaseCompleteAnimation.js with native animations
- Integration in DiagnosisScreen.js phase transitions
- Translations for phase names

**Definition of Done:**
- Animation is delightful and polished
- Checkmark draws with SVG-like stroke animation (or Lottie)
- Haptic fires at the success moment
- No animation glitches or abrupt cuts
```

---

## Prompt 4: Admin Dashboard

```
Role: Senior Mobile Architect & QA Specialist (Expo/React Native).
Project: sihat-tcm-mobile (Expo SDK 54, React Native 0.81, JavaScript only).

**FEATURE: Admin Dashboard**

Port the Admin Dashboard for managing system prompts and configuration. This is an internal tool for TCM practitioners/developers.

**Web Reference:**
- `sihat-tcm/src/app/admin/page.tsx`

**Requirements:**
1. Create `screens/dashboard/AdminDashboardScreen.js` with:
   - Tab navigation: "Prompts" | "Config" | "Users"
   - Collapsible sections for each prompt type:
     - Chat (问诊), Tongue Analysis, Face Analysis, Body Analysis
     - Listening Analysis, Inquiry Summary, Final Analysis
   - Inline TextInput for editing prompts
   - "Save" and "Reset to Default" buttons per prompt

2. Supabase integration:
   - Fetch prompts from `system_prompts` table
   - Save edited prompts back to Supabase
   - Handle loading/error states

3. Config tab should display:
   - Doctor Model Mapping (read-only display)
   - App version info
   - Cache clear button

4. Access control:
   - Only show Admin tab in DashboardScreen if `user.role === 'admin'`
   - Add admin role check in App.js navigation

5. UI Guidelines:
   - Use FlatList for prompt sections (not ScrollView with .map)
   - TextInput with multiline=true for long prompts
   - Glassmorphism cards for each section

**Deliverables:**
- AdminDashboardScreen.js
- Updated DashboardScreen.js with admin tab (conditional)
- Updated App.js for admin role routing

**Definition of Done:**
- Admin can view and edit all system prompts
- Changes persist to Supabase
- Non-admins cannot access the screen
- Keyboard-avoiding behavior works for multiline inputs
```

---

## Prompt 5: Health Data Import Wizard

```
Role: Senior Mobile Architect & QA Specialist (Expo/React Native).
Project: sihat-tcm-mobile (Expo SDK 54, React Native 0.81, JavaScript only).

**FEATURE: Health Data Import Wizard**

Port the guided wizard for importing health data from Samsung Health, Apple Health, or Google Fit.

**Web Reference:**
- `sihat-tcm/src/components/diagnosis/HealthDataImportWizard.tsx`

**Requirements:**
1. Create `components/HealthDataImportWizard.js` as a full-screen modal wizard:
   - Step 1: Select Provider (Samsung Health, Apple Health, Google Fit)
   - Step 2: Simulated "Connecting..." animation
   - Step 3: Data Preview (steps, sleep, heart rate, calories)
   - Step 4: Confirm Import

2. UI for each step:
   - Provider cards with icons and brand colors
   - Connection animation (spinner + status text)
   - Data preview in clean metric cards
   - Confirm button with summary

3. For now, use MOCK data (real SDK integration is out of scope):
   ```javascript
   const MOCK_HEALTH_DATA = {
     samsung: { steps: 8432, sleepHours: 7.2, heartRate: 72, calories: 2150 },
     apple: { steps: 9120, sleepHours: 6.8, heartRate: 68, calories: 1980 },
     google: { steps: 7650, sleepHours: 7.5, heartRate: 75, calories: 2300 },
   };
   ```

4. Props:
   ```javascript
   HealthDataImportWizard({
     visible,
     onClose,
     onDataImported, // (data) => void
   })
   ```

5. Integrate into `SmartConnectStep.js`:
   - Add "Import from Health App" button
   - Open wizard on tap
   - Receive imported data and display in metrics

**Deliverables:**
- HealthDataImportWizard.js (4-step modal)
- Integration in SmartConnectStep.js
- Haptic feedback throughout

**Definition of Done:**
- Wizard flows smoothly through all 4 steps
- Back navigation works within wizard
- Imported data appears in SmartConnectStep metrics
- Modal dismisses cleanly on close or complete
```

---

## Prompt 6: Full Haptic Feedback Pass

```
Role: Senior Mobile Architect & QA Specialist (Expo/React Native).
Project: sihat-tcm-mobile (Expo SDK 54, React Native 0.81, JavaScript only).

**FEATURE: Full Haptic Feedback Pass**

Systematically add haptic feedback to ALL interactive elements using expo-haptics. This is a polish pass, not a new component.

**Requirements:**

1. **Audit all screens** for interactive elements:
   - TouchableOpacity buttons
   - Switch toggles
   - Tab bar items
   - Form inputs (on focus)
   - Card selections
   - Modal open/close

2. **Haptic Types to Use:**
   ```javascript
   import * as Haptics from 'expo-haptics';
   
   // Light tap - for small buttons, toggles
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   
   // Medium tap - for primary actions
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
   
   // Heavy tap - for destructive or major actions
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
   
   // Success - for completing steps, saving
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   
   // Warning - for validation errors
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
   
   // Error - for failed actions
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   
   // Selection change - for pickers, sliders
   Haptics.selectionAsync();
   ```

3. **Files to update (priority order):**
   - `App.js` - Login buttons, account switcher
   - `screens/diagnosis/DiagnosisScreen.js` - Navigation buttons
   - `screens/diagnosis/BasicInfoStep.js` - All inputs
   - `screens/diagnosis/SymptomsStep.js` - Quick select buttons
   - `screens/diagnosis/TongueAnalysisStep.js` - Capture/retake
   - `screens/diagnosis/ResultsStep.js` - Action buttons
   - `screens/dashboard/DashboardScreen.js` - Tab switching, save profile
   - All modal components - Open/close actions

4. **Create a reusable wrapper (optional but recommended):**
   ```javascript
   // components/ui/HapticButton.js
   export function HapticButton({ onPress, hapticType = 'light', children, ...props }) {
     const handlePress = () => {
       if (hapticType === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
       // ... other types
       onPress?.();
     };
     return <TouchableOpacity onPress={handlePress} {...props}>{children}</TouchableOpacity>;
   }
   ```

**Deliverables:**
- Updated files with haptic feedback
- Optional: HapticButton.js and HapticTouchable.js wrappers
- Consistent haptic patterns across the app

**Definition of Done:**
- Every tappable element provides haptic feedback
- Feedback type matches action importance
- No double-haptics or missing haptics
- Works on both iOS and Android (expo-haptics handles platform differences)
- Test on physical device (haptics don't work in simulator)
```

---

## Quick Reference: Priority Order

| Priority | Feature | Prompt # | Effort |
|----------|---------|----------|--------|
| 🔥 P1 | Resume Progress Dialog | #1 | LOW |
| 🔥 P1 | Full Haptic Feedback Pass | #6 | LOW |
| P2 | Thinking Animation | #2 | MEDIUM |
| P2 | Phase Complete Animation | #3 | MEDIUM |
| P2 | Health Data Import Wizard | #5 | MEDIUM |
| P3 | Admin Dashboard | #4 | HIGH |

---

*Generated: 2025-12-22 | Sihat TCM Mobile Feature Backlog*
