# Fix Log - Sihat TCM

## Known Issues & Fixes

### 📱 Mobile UI

#### 1. Results Dock Overlap & Unclickable Buttons (Mobile)
*   **Problem**: The floating action dock on the Results screen was a single row, causing buttons to squash and text to overlap on small screens. Additionally, buttons were unclickable due to z-indexing.
*   **Solution**:
    *   Refactored `ResultsStep.js` to use a **3-row grid layout** (Primary Actions, Utilities, Navigation).
    *   Added `zIndex: 999` and `elevation: 100` to `floatingDockContainer` to force it above scroll content.
    *   Increased `paddingBottom` of the ScrollView to `340` to prevent content from being hidden behind the taller dock.
*   **Status**: ✅ Fixed (Verified on Simulator & Device)

#### 7. Mobile Color Standardization
*   **Problem**: Color imports were split between deprecated `constants/colors.js` and the proper `constants/themes.js`, causing inconsistency and potential dark mode issues.
*   **Solution**:
    *   Updated all 14 affected files to import `COLORS` from `constants/themes.js`.
    *   Deleted redundant `constants/colors.js`.
    *   Fixed a pre-existing syntax bug in `FaceAnalysisStep.js` (duplicated if condition, improper function closure).
*   **Status**: ✅ Fixed

### 💻 Web UI

#### 2. Glassmorphic Result Cards (Web)
*   **Problem**: The Web App lacked the "Emerald Glass" aesthetic found in the mobile app, using standard solid cards instead.
*   **Solution**:
    *   Created `GlassCard.tsx` component using Tailwind `backdrop-blur` and transparency utilities.
    *   Refactored the "Patient Information" section in `DiagnosisReport.tsx` to use `GlassCard`.
    *   Extended `GlassCard` usage to Smart Connect, Diagnosis, and Analysis sections for consistency.
*   **Status**: ✅ Implemented

#### 3. Responsive Chat Interface (Web)
*   **Problem**: The Chat interface on mobile web had poor keyboard handling (input hidden behind keyboard) and jerky scrolling.
*   **Solution**:
    *   Updated `InquiryChatStep.tsx` input positioning to use `safe-area-inset-bottom` relative logic.
    *   Implemented `smooth` scrolling using a dedicated `messagesEndRef`.
    *   Refactored maximizing logic to prevent UI overlapping.
*   **Status**: ✅ Implemented

#### 4. Animated Language Switcher (Web)
*   **Problem**: The language selector was a static button group, lacking the fluid "premium" feel of the mobile app.
*   **Solution**:
    *   Refactored `LanguageSelector.tsx` (variant="buttons") to use Framer Motion.
    *   Implemented `layoutId` driven sliding pill background for active state.
    *   Updated styling to use full pill/rounded design.
*   **Status**: ✅ Implemented

#### 5. Diagnosis State Persistence (Web)
*   **Problem**: Refreshing the page during a diagnosis wiped all progress, leading to poor UX.
*   **Solution**:
    *   Implemented `useDiagnosisPersistence` hook using `localStorage`.
    *   Integrated hook into `DiagnosisWizard.tsx` to auto-save and auto-restore state.
*   **Status**: ✅ Implemented

#### 6. Web Theme Parity (Emerald Branding)
*   **Problem**: Web App used default grayscale Shadcn theme, while Mobile App uses vibrant Emerald branding.
*   **Solution**:
    *   Updated `globals.css` to use OKLCH Emerald color values for `--primary`, `--ring`, `--accent`, and sidebar variables.
    *   Light Mode: Primary is Emerald 700 (#047857).
    *   Dark Mode: Primary is Emerald 400 for visibility.
    *   All UI elements (buttons, borders, charts) now share the cohesive Emerald palette.
*   **Status**: ✅ Implemented

---

### 🔌 Connectivity Issues

#### 8. Next.js Dev Server Not Accessible (2025-12-21)
*   **Problem**: Cannot access `192.168.0.5:3000` from phone or PC browser.
*   **Cause**: Dev server was not running.
*   **Solution**:
    ```bash
    cd sihat-tcm
    npm run dev -- -H 0.0.0.0
    ```
*   **Status**: ✅ Fixed

#### 9. Expo Dev Server Not Accessible (2025-12-21)
*   **Problem**: Cannot connect to `exp://192.168.0.5:8081` from phone.
*   **Cause**: Expo server was not running.
*   **Solution**:
    ```bash
    cd sihat-tcm-mobile
    npx expo start --clear
    ```
*   **Status**: ✅ Fixed
