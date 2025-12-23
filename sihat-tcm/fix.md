# Fix: Diagnosis Report Not Displaying After AI Analysis

## Problem
After completing the diagnosis wizard, the final report would never display. The loading screen would spin indefinitely even though the API was returning successful responses (200 status, 3-5 second response times).

## Root Cause
The `useCompletion` hook from `@ai-sdk/react` was returning an empty `completion` string (`length: 0`) despite the API successfully streaming data back.

### Evidence
- Server logs showed: `POST /api/consult 200 in 3.5s`
- API was correctly receiving data and calling Gemini
- Gemini test page worked fine (`/test-gemini`)
- But frontend's `onFinish` callback logged: `completion.length = 0`

## Solution
Replaced the `useCompletion` hook with manual `fetch()` + `ReadableStream` handling.

### Before (Broken)
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

### After (Working)
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

## API Route
The API uses `streamText` from Vercel AI SDK:

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

## Key Learnings

1. **`useCompletion` may silently fail** - The hook from `@ai-sdk/react` v2 might have compatibility issues. Manual streaming is more reliable.

2. **Always add logging** - Console logs at each step helped identify that `completion` was empty despite successful API response.

3. **Test API independently** - Creating `/test-gemini` endpoint confirmed API/Gemini worked, isolating the issue to frontend.

4. **Debug panel in UI** - Adding a visual 8-step progress indicator helped understand where the flow was stuck.

## Files Modified
- `src/components/diagnosis/DiagnosisWizard.tsx` - Replaced useCompletion with manual fetch
- `src/app/api/consult/route.ts` - Added logging, using `gemini-2.0-flash`
- `src/components/diagnosis/AnalysisLoadingScreen.tsx` - Added debug step panel

## Date
December 4, 2024

---

# Fix: AI Chat Not Working in Inquiry Step (Wen 问诊)

## Problem
The AI doctor chat in the Inquiry step was not displaying any messages. The chat area remained empty even though the component rendered correctly with patient information.

## Root Cause
Same issue as the diagnosis report - the `useChat` hook from `@ai-sdk/react` was silently failing to capture streamed responses.

### Evidence
- Server logs showed API errors: `GenerateContentRequest.contents: contents is not specified`
- The `useChat` hook wasn't properly sending messages to the API
- Messages array was incorrectly formatted with system messages

## Solution
Applied the same fix pattern: replaced `useChat` hook with manual `fetch()` + `ReadableStream` handling.

### Before (Broken)
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

### After (Working)
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

## API Route Fixes (`/api/chat/route.ts`)

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

## Key Learnings

1. **Same pattern applies to `useChat`** - Both `useCompletion` and `useChat` from `@ai-sdk/react` have similar streaming issues.

2. **Filter system messages** - The API expects user/assistant messages only. System prompt should be passed separately via the `system` parameter.

3. **Real-time streaming UX** - Updating the UI on each chunk creates a nice "typing" effect that shows the AI is responding.

4. **Add fallback messages** - If the messages array is empty, provide a default prompt to prevent API errors.

5. **Use stable model names** - Changed from `gemini-2.0-flash-exp` to `gemini-2.0-flash` for more reliable responses.

## Files Modified
- `src/components/diagnosis/InquiryStep.tsx` - Replaced useChat with manual fetch + streaming
- `src/app/api/chat/route.ts` - Added message filtering, error handling, fallback logic

## Result
The AI doctor now interactively asks follow-up questions based on TCM's traditional "Ten Questions" (十问歌) methodology, collecting detailed patient information for accurate diagnosis.

## Date
December 4, 2024

---

# Fix: Maximum Update Depth Exceeded in Diagnosis Wizard

## Problem
The application crashed with "Maximum update depth exceeded" error (React Error 185) when users navigated to the Summary step of the diagnosis wizard. The error stack trace pointed to `DiagnosisSummary` and `DiagnosisWizard`.

## Root Cause
An infinite re-render loop was triggered by unstable object references being passed to a Context Provider.

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

## Solution
1. **Memoization**: Wrapped the `steps` array in `useMemo` to ensure stable references across renders.
2. **Navigation Cleanup**: Removed `'summary'` from `customNavigationSteps` in `DiagnosisWizard.tsx` to prevent conflicting state updates (Parent hiding nav vs Child showing nav).

### Before (Broken)
```tsx
const steps = [
    { id: 'observations', ... },
    { id: 'inquiry', ... },
    { id: 'options', ... }
]
// steps is new every render -> causes infinite loop via useEffect
```

### After (Working)
```tsx
// FIX: Memoize steps to prevent infinite re-render loop
const steps = useMemo(() => [
    { id: 'observations', ... },
    { id: 'inquiry', ... },
    { id: 'options', ... }
], [t])
```

## Key Learnings
1. **Memoize Context Values**: Always use `useMemo` or `useCallback` for objects/functions passed to Context Providers or used in effects that update Context.
2. **Watch for Loops**: If a child component updates a parent's state (via Context), ensure the update is conditional or based on stable references.
3. **React Render Cycle**: Remember that objects defined in the component body are recreated on every render.

## Files Modified
- `src/components/diagnosis/DiagnosisSummary.tsx`
- `src/components/diagnosis/DiagnosisWizard.tsx`

## Date
December 14, 2025
