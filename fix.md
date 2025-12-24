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

#### 10. Audio Analysis - FileSystem.EncodingType.Base64 Undefined (Mobile)
*   **Problem**: When clicking "Analyze" in the Audio Diagnosis step, the app crashed with:
    ```
    [AudioAnalysis] Error: Cannot read property 'Base64' of undefined
    ```
*   **Root Cause**: Expo SDK 54 has deprecated the old `expo-file-system` API. The new API uses `File` and `Directory` classes instead of `FileSystem.EncodingType`.
*   **Solution**: Import from the legacy API path:
    ```javascript
    // Before (broken)
    import * as FileSystem from 'expo-file-system';
    
    // After (fixed)  
    import * as FileSystem from 'expo-file-system/legacy';
    ```
*   **Additional Fixes Applied**:
    1. **Recording cleanup** - Properly unload existing recording before starting new one to fix "Failed to start recording" on second attempt
    2. **Variable shadowing** - Renamed `recording` to `newRecording` to avoid collision with state variable
    3. **Better error messages** - Added console logging for debugging
*   **Files Changed**:
    - `sihat-tcm-mobile/screens/diagnosis/DiagnosisScreen.js` - Swapped AudioStep → AudioAnalysisStep
    - `sihat-tcm-mobile/screens/diagnosis/AudioAnalysisStep.js` - Fixed FileSystem import + recording cleanup
*   **Lesson Learned**: When using expo-file-system in Expo SDK 54+, use `expo-file-system/legacy` for the classic API or migrate to the new `File`/`Directory` class-based API.
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

#### 11. Diagnosis Report Not Displaying After AI Analysis (Web)
*   **Problem**: After completing the diagnosis wizard, the final report would never display. The loading screen would spin indefinitely even though the API was returning successful responses (200 status, 3-5 second response times).
*   **Root Cause**: The `useCompletion` hook from `@ai-sdk/react` was returning an empty `completion` string (`length: 0`) despite the API successfully streaming data back.
*   **Evidence**:
    - Server logs showed: `POST /api/consult 200 in 3.5s`
    - API was correctly receiving data and calling Gemini
    - Gemini test page worked fine (`/test-gemini`)
    - But frontend's `onFinish` callback logged: `completion.length = 0`
*   **Solution**: Replaced the `useCompletion` hook with manual `fetch()` + `ReadableStream` handling.

    **Before (Broken)**:
    ```tsx
    import { useCompletion } from '@ai-sdk/react'
    
    const { complete, completion, isLoading, error } = useCompletion({
        api: '/api/consult',
        onFinish: (prompt, completion) => {
            console.log('Completion length:', completion?.length) // Always 0!
        }
    })
    
    // Trigger
    complete('', { body: { data } })
    ```

    **After (Working)**:
    ```tsx
    const [completion, setCompletion] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    
    const submitConsultation = async () => {
        setIsLoading(true)
        setError(null)
        setCompletion('')
        
        try {
            const response = await fetch('/api/consult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data })
            })
            
            // Read the streaming response manually
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''
            
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    fullText += decoder.decode(value, { stream: true })
                }
            }
            
            setCompletion(fullText)
        } catch (err: any) {
            setError(err)
        } finally {
            setIsLoading(false)
        }
    }
    ```

*   **API Route**: The API uses `streamText` from Vercel AI SDK:
    ```typescript
    import { google } from '@ai-sdk/google';
    import { streamText } from 'ai';
    
    export async function POST(req: Request) {
        const { data } = await req.json();
        
        const result = streamText({
            model: google('gemini-2.0-flash'),
            system: systemPrompt,
            prompt: diagnosisInfo,
        });
        
        return result.toTextStreamResponse();
    }
    ```

*   **Key Learnings**:
    1. **`useCompletion` may silently fail** - The hook from `@ai-sdk/react` v2 might have compatibility issues. Manual streaming is more reliable.
    2. **Always add logging** - Console logs at each step helped identify that `completion` was empty despite successful API response.
    3. **Test API independently** - Creating `/test-gemini` endpoint confirmed API/Gemini worked, isolating the issue to frontend.
    4. **Debug panel in UI** - Adding a visual 8-step progress indicator helped understand where the flow was stuck.
*   **Files Modified**:
    - `src/components/diagnosis/DiagnosisWizard.tsx` - Replaced useCompletion with manual fetch
    - `src/app/api/consult/route.ts` - Added logging, using `gemini-2.0-flash`
    - `src/components/diagnosis/AnalysisLoadingScreen.tsx` - Added debug step panel
*   **Date**: December 4, 2024
*   **Status**: ✅ Fixed

#### 12. AI Chat Not Working in Inquiry Step (Wen 问诊) (Web)
*   **Problem**: The AI doctor chat in the Inquiry step was not displaying any messages. The chat area remained empty even though the component rendered correctly with patient information.
*   **Root Cause**: Same issue as the diagnosis report - the `useChat` hook from `@ai-sdk/react` was silently failing to capture streamed responses.
*   **Evidence**:
    - Server logs showed API errors: `GenerateContentRequest.contents: contents is not specified`
    - The `useChat` hook wasn't properly sending messages to the API
    - Messages array was incorrectly formatted with system messages
*   **Solution**: Applied the same fix pattern: replaced `useChat` hook with manual `fetch()` + `ReadableStream` handling.

    **Before (Broken)**:
    ```tsx
    import { useChat } from '@ai-sdk/react'
    
    const { messages, sendMessage, isLoading } = useChat({
        api: '/api/chat',
        initialMessages: [{ id: '1', role: 'system', content: systemMessage }],
        onError: (err) => console.error("useChat error:", err),
    })
    
    // Trigger
    sendMessage({ role: 'user', content: prompt })
    ```

    **After (Working)**:
    ```tsx
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    
    const sendMessage = useCallback(async (userMessage: string, isInitialPrompt = false) => {
        setIsLoading(true)
        
        // Add user message to state
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userMessage }
        if (!isInitialPrompt) {
            setMessages(prev => [...prev, userMsg])
        }
    
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: currentMessages, basicInfo })
            })
    
            // Read streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''
            
            // Create placeholder for assistant message
            const assistantMsgId = (Date.now() + 1).toString()
            setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])
    
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    fullText += decoder.decode(value, { stream: true })
                    
                    // Update assistant message in real-time (streaming effect!)
                    setMessages(prev => prev.map(m => 
                        m.id === assistantMsgId ? { ...m, content: fullText } : m
                    ))
                }
            }
        } catch (err) {
            console.error('[InquiryStep] Error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [messages, basicInfo])
    ```

*   **API Route Fixes** (`/api/chat/route.ts`):
    ```typescript
    // Filter out system messages (we use our own system prompt)
    const filteredMessages = messages?.filter((m: any) => m.role !== 'system') || [];
    
    // If no messages, create a default initial message
    if (filteredMessages.length === 0) {
        filteredMessages.push({
            role: 'user',
            content: 'Please start the consultation by asking me about my symptoms.'
        });
    }
    
    const result = streamText({
        model: google('gemini-2.0-flash'),  // Changed from gemini-2.0-flash-exp
        system: systemPrompt,
        messages: filteredMessages,
    });
    
    return result.toTextStreamResponse();
    ```

*   **Key Learnings**:
    1. **Same pattern applies to `useChat`** - Both `useCompletion` and `useChat` from `@ai-sdk/react` have similar streaming issues.
    2. **Filter system messages** - The API expects user/assistant messages only. System prompt should be passed separately via the `system` parameter.
    3. **Real-time streaming UX** - Updating the UI on each chunk creates a nice "typing" effect that shows the AI is responding.
    4. **Add fallback messages** - If the messages array is empty, provide a default prompt to prevent API errors.
    5. **Use stable model names** - Changed from `gemini-2.0-flash-exp` to `gemini-2.0-flash` for more reliable responses.
*   **Files Modified**:
    - `src/components/diagnosis/InquiryStep.tsx` - Replaced useChat with manual fetch + streaming
    - `src/app/api/chat/route.ts` - Added message filtering, error handling, fallback logic
*   **Result**: The AI doctor now interactively asks follow-up questions based on TCM's traditional "Ten Questions" (十问歌) methodology, collecting detailed patient information for accurate diagnosis.
*   **Date**: December 4, 2024
*   **Status**: ✅ Fixed

#### 13. Maximum Update Depth Exceeded in Diagnosis Wizard (Web)
*   **Problem**: The application crashed with "Maximum update depth exceeded" error (React Error 185) when users navigated to the Summary step of the diagnosis wizard. The error stack trace pointed to `DiagnosisSummary` and `DiagnosisWizard`.
*   **Root Cause**: An infinite re-render loop was triggered by unstable object references being passed to a Context Provider.
    1. **Unstable Dependency**: `DiagnosisSummary.tsx` defined the `steps` array locally inside the component body. This created a new array reference on every render.
    2. **Cascading Effect**:
       - `steps` was a dependency of `handleNext`.
       - `handleNext` was a dependency of `useEffect`.
       - `useEffect` called `setNavigationState` (context update).
    3. **The Loop**:
       - `setNavigationState` updated `DiagnosisProgressContext`.
       - `DiagnosisWizard` (Parent) consumed this context, so it re-rendered.
       - `DiagnosisSummary` (Child) re-rendered.
       - `steps` was recreated -> `handleNext` changed -> `useEffect` ran -> Context updated -> Loop.
*   **Solution**:
    1. **Memoization**: Wrapped the `steps` array in `useMemo` to ensure stable references across renders.
    2. **Navigation Cleanup**: Removed `'summary'` from `customNavigationSteps` in `DiagnosisWizard.tsx` to prevent conflicting state updates (Parent hiding nav vs Child showing nav).

    **Before (Broken)**:
    ```tsx
    const steps = [
        { id: 'observations', ... },
        { id: 'inquiry', ... },
        { id: 'options', ... }
    ]
    // steps is new every render -> causes infinite loop via useEffect
    ```

    **After (Working)**:
    ```tsx
    // FIX: Memoize steps to prevent infinite re-render loop
    const steps = useMemo(() => [
        { id: 'observations', ... },
        { id: 'inquiry', ... },
        { id: 'options', ... }
    ], [t])
    ```

*   **Key Learnings**:
    1. **Memoize Context Values**: Always use `useMemo` or `useCallback` for objects/functions passed to Context Providers or used in effects that update Context.
    2. **Watch for Loops**: If a child component updates a parent's state (via Context), ensure the update is conditional or based on stable references.
    3. **React Render Cycle**: Remember that objects defined in the component body are recreated on every render.
*   **Files Modified**:
    - `src/components/diagnosis/DiagnosisSummary.tsx`
    - `src/components/diagnosis/DiagnosisWizard.tsx`
*   **Date**: December 14, 2025
*   **Status**: ✅ Fixed

#### 14. Mobile Layout Optimization - Excessive Margins on TCM Report (Web)
*   **Problem**: On mobile view of "Comprehensive TCM Report", there was too much margin on left and right sides, limiting text display per row. The layout was wasting horizontal space unnecessarily.
*   **Root Causes**:
    1. **Container Padding**: Main report container used `px-5` (20px) on mobile, which was too generous.
    2. **Text Width Constraint**: Text content used `w-[90%]` even on mobile, further reducing usable width.
    3. **Internal Padding**: CollapsibleSection components used `p-4` (16px) on mobile, adding extra horizontal padding.
*   **Solution**: Applied three-layer optimization strategy:
    1. **Reduced Container Padding**: Changed from `px-5` to `px-4` (20px → 16px) on mobile in `DiagnosisReport.tsx`.
    2. **Removed Mobile Text Constraint**: Changed text content from `w-[90%] max-w-[680px]` to `w-full md:w-[90%] md:max-w-[680px]` in `ReportDiagnosisSection.tsx`, allowing full width on mobile while maintaining optimal reading width on desktop.
    3. **Reduced Internal Padding**: Changed CollapsibleSection from `p-4` to `p-3` (16px → 12px) on mobile.

    **Before (Wasteful)**:
    ```tsx
    // Container
    className="w-full px-5 md:px-6 md:max-w-4xl md:mx-auto"
    
    // Text content
    <div className="w-[90%] max-w-[680px] mx-auto">
    
    // CollapsibleSection
    <div className="p-4 md:p-5 pt-0">
    ```

    **After (Optimized)**:
    ```tsx
    // Container - reduced mobile padding
    className="w-full px-4 md:px-6 md:max-w-4xl md:mx-auto"
    
    // Text content - full width on mobile, constrained on desktop
    <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto">
    
    // CollapsibleSection - reduced mobile padding
    <div className="p-3 md:p-5 pt-0">
    ```

*   **Impact**:
    - **Before**: ~271px usable text width on 375px device
    - **After**: ~319px usable text width on 375px device
    - **Improvement**: +48px (+17.7% more text per row)
*   **Additional Changes**:
    - Fixed `DiagnosisWizard.tsx` main container: `max-w-4xl` → `w-full px-5 md:px-6 md:max-w-4xl md:mx-auto`
    - Fixed `InquiryChatStep.tsx` form: `max-w-4xl` → `w-full md:max-w-4xl md:mx-auto`
    - Created unit tests for responsive layout verification
    - Created `/test-mobile-layout` page for visual verification
*   **Key Learnings**:
    1. **Mobile-First Padding**: Use minimal padding on mobile (px-4 = 16px), increase on desktop (px-6 = 24px).
    2. **Text Width Strategy**: Full width on mobile for maximum space, constrained width on desktop for optimal reading (45-75 characters per line).
    3. **Layered Optimization**: Container padding + internal padding + text constraints all contribute to wasted space - optimize all layers.
*   **Files Modified**:
    - `src/components/diagnosis/DiagnosisReport.tsx` - Reduced container padding
    - `src/components/diagnosis/DiagnosisWizard.tsx` - Removed max-width constraint on mobile
    - `src/components/diagnosis/InquiryChatStep.tsx` - Removed max-width constraint on mobile
    - `src/components/diagnosis/report/ReportDiagnosisSection.tsx` - Full width text on mobile
    - `src/components/ui/CollapsibleSection.tsx` - Reduced internal padding on mobile
*   **Files Created**:
    - `src/components/diagnosis/DiagnosisWizard.test.tsx` - Responsive layout tests
    - `src/components/diagnosis/InquiryChatStep.test.tsx` - Responsive layout tests
    - `src/app/test-mobile-layout/page.tsx` - Visual verification page
*   **Date**: January 2025
*   **Status**: ✅ Fixed

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

---

### 🛠️ Development Tools

#### 15. Supabase CLI Installation (2025-12-24)
*   **Problem**: Cannot install Supabase CLI globally via npm. Running `npm install -g supabase` fails with error:
    ```
    Installing Supabase CLI as a global module is not supported.
    Please use one of the supported package managers: https://github.com/supabase/cli#install-the-cli
    ```
*   **Root Cause**: Supabase CLI v2.70.4+ does not support global npm installation. The recommended installation methods are:
    - **Windows**: Scoop or Chocolatey (both require admin privileges)
    - **macOS**: Homebrew
    - **Linux**: Package managers or direct binary download
*   **Solution**: Use `npx` to run Supabase CLI without installation (recommended for Windows without admin access):
    ```bash
    # No installation needed! Just use npx
    npx supabase --version
    
    # Login to Supabase
    npx supabase login
    
    # Link to remote project
    npx supabase link --project-ref <your-project-ref>
    
    # Start local Supabase (requires Docker)
    npx supabase start
    
    # Generate TypeScript types
    npx supabase gen types typescript --local > src/types/supabase.ts
    
    # Push migrations
    npx supabase db push
    ```
*   **Advantages of npx method**:
    - ✅ No installation required
    - ✅ No admin privileges needed
    - ✅ Always uses latest version
    - ✅ Works on all platforms (Windows, macOS, Linux)
    - ✅ First run downloads and caches the package, subsequent runs are fast
*   **Alternative Methods** (if you prefer permanent installation):
    - **Chocolatey** (Windows, requires admin): `choco install supabase -y`
    - **Scoop** (Windows): 
      ```bash
      scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
      scoop install supabase
      ```
    - **Homebrew** (macOS): `brew install supabase/tap/supabase`
*   **Files Updated**:
    - `sihat-tcm/DEVELOPER_MANUAL.md` - Added Supabase CLI documentation
    - `fix.md` - Documented this issue and solution
*   **Status**: ✅ Fixed

---

## Summary

This document consolidates all fixes from:
- Root `fix.md` (general fixes)
- `sihat-tcm/fix.md` (web-specific fixes)
- `sihat-tcm-mobile/fix.md` (mobile-specific fixes)

All fixes are organized by category (Mobile UI, Web UI, Connectivity) and numbered sequentially for easy reference.
