# Enhanced Tongue Analysis Module - Fix Summary

## Date: 2025-12-25

## Objective
Enhance the tongue analysis module to display more detailed, structured results similar to myzencheck.net format, including:
- 3 Analysis Tags with individual confidence levels
- Categories in "[TCM Pattern] · [Treatment Focus]" format
- Descriptions explaining TCM significance
- 2 actionable recommendations per finding

---

## Files Modified

### 1. `src/lib/enhancedTonguePrompt.ts` (NEW FILE)
Created enhanced prompts for tongue analysis:
- `ENHANCED_TONGUE_USER_PROMPT` - Detailed instructions for AI to return analysis_tags
- `ENHANCED_TONGUE_SYSTEM_PROMPT` - System-level instructions with examples
- `AnalysisTag` interface - TypeScript type for analysis tag structure
- `EnhancedTongueAnalysisResult` interface - Full response structure

### 2. `src/app/api/analyze-image/route.ts`
Updated API to use enhanced prompts for tongue analysis:
- Import both `ENHANCED_TONGUE_USER_PROMPT` and `ENHANCED_TONGUE_SYSTEM_PROMPT`
- Use enhanced prompts when `type === 'tongue'` and no custom prompt is set
- Include `analysis_tags`, `tcm_indicators`, `pattern_suggestions`, `notes` in response
- Added debug logging for analysis_tags

### 3. `src/components/diagnosis/AnalysisTagsDisplay.tsx` (NEW FILE)
Created UI components for displaying analysis tags:
- `AnalysisTagsDisplay` - Dark-themed cards for full display
- `AnalysisTagsCompact` - Light-themed cards for inline use
- Animated confidence bars with Framer Motion
- Category tags, descriptions, and recommendation bullets

### 4. `src/components/diagnosis/ObservationResult.tsx`
Updated to accept and display analysis tags:
- Added `AnalysisTag` interface
- Added `analysisTags` prop to component
- Renders `AnalysisTagsCompact` when `type === 'tongue'` and tags are present
- Added debug logging for troubleshooting

### 5. `src/components/diagnosis/wizard/ImageAnalysisStepRenderer.tsx`
Updated to pass analysis_tags from both API results and existing data:
- Added `analysis_tags` to `ImageData` interface
- Updated `analysisTags` prop to check both `analysisResult` and `existingData`

### 6. `src/data/mockTestData.ts`
Updated mock test data to include analysis_tags:
- Added 3 sample analysis tags with proper structure
- Tags: Swollen Tongue, Teeth Marks, Pale Tongue
- Each with confidence, category, description, recommendations

### 7. `src/app/api/admin/settings/route.ts`
Fixed unrelated TypeScript error:
- Added missing `AdminSettings` import

---

## Analysis Tags Structure

```typescript
interface AnalysisTag {
    title: string;         // "Swollen Tongue"
    title_cn: string;      // "胖大舌"
    category: string;      // "Qi Deficiency · Spleen Support"
    confidence: number;    // 94.6 (decimal percentage)
    description: string;   // TCM significance explanation
    recommendations: string[]; // Array of 2 actionable tips
}
```

---

## Example Output

```json
{
  "is_valid_image": true,
  "observation": "Slightly pale tongue with thin white coating...",
  "confidence": 85,
  "analysis_tags": [
    {
      "title": "Swollen Tongue",
      "title_cn": "胖大舌",
      "category": "Qi Deficiency · Spleen Support",
      "confidence": 94.6,
      "description": "Swelling signals spleen qi weakness and damp accumulation.",
      "recommendations": [
        "Limit raw or cold foods and favour lightly cooked meals.",
        "Consider qi-tonifying herbs such as astragalus."
      ]
    },
    {
      "title": "Teeth Marks",
      "title_cn": "齿痕舌",
      "category": "Spleen Qi Deficiency · Strengthening",
      "confidence": 91.3,
      "description": "Teeth marks indicate spleen qi deficiency with fluid issues.",
      "recommendations": [
        "Eat regular, warm meals at consistent times.",
        "Avoid overthinking which depletes spleen qi."
      ]
    },
    {
      "title": "Pale Tongue",
      "title_cn": "淡白舌",
      "category": "Blood Deficiency · Nourishing",
      "confidence": 87.2,
      "description": "Pale tongue indicates insufficient blood or qi.",
      "recommendations": [
        "Include iron-rich foods like spinach and goji berries.",
        "Avoid excessive exertion and ensure adequate rest."
      ]
    }
  ]
}
```

---

## UI Appearance

Each analysis tag card displays:
- **Header**: Title (English + Chinese) + Confidence percentage
- **Category Tag**: Green italicized text (e.g., "Qi Deficiency · Spleen Support")
- **Confidence Bar**: Animated progress bar showing confidence level
- **Description**: 1-2 sentence TCM explanation
- **Recommendations**: 2 bullet points with actionable advice

---

## Testing

1. Click "Test" button to fill mock data
2. Navigate to Tongue Analysis step
3. View the 3 analysis tag cards below "Potential Indications"
4. Or take a real tongue photo to test live AI analysis

---

## Key Fixes

1. **Mock data now includes analysis_tags** - Test button shows enhanced format
2. **API uses enhanced prompts** - Both system and user prompts updated
3. **UI component created** - AnalysisTagsCompact renders the cards
4. **Data flow fixed** - existingData.analysis_tags now passed to component

---
---

# Camera Component Video Rendering Fix

## Date: 2025-12-25

## Problem Description

The `CameraCapture.tsx` component had a critical rendering issue where the camera stream connected successfully (console showed "Got stream"), but the video element remained hidden/white until user interaction occurred.

### Symptoms

1. **The "F12 Fix"**: Video feed was invisible (white screen) initially. Opening Chrome DevTools (F12) or resizing the window made the video instantly appear — indicating a browser repaint/reflow issue.

2. **Infinite Loading**: UI got stuck on "Starting camera..." spinner even though console logs showed the stream was acquired.

3. **Race Condition**: Using `key={stream.id}` prop on `<video>` elements caused React to unmount/remount videos when stream changed, leaving the new video element without the stream attached.

---

## Root Causes Identified

### 1. Race Condition with `key={stream.id}`
The video element had `key={stream ? stream.id : 'novideo'}` which caused React to unmount and remount the element when stream state changed. The `useEffect` was attaching `srcObject` to the old video element just before it got destroyed.

### 2. Dual Video Ref Conflict
Both desktop and mobile layouts had separate `<video>` elements but shared a single `videoRef`. Since React assigns refs sequentially, the mobile video (rendered later in JSX) always got the ref — breaking desktop entirely.

### 3. Chrome Repaint Bug
Chrome sometimes doesn't repaint after `srcObject` is set on a video element, leaving it invisible until something forces a reflow (like opening DevTools).

---

## Solution

### Files Modified

#### `src/components/diagnosis/CameraCapture.tsx`

### Fix 1: Removed Problematic `key` Prop
```diff
- <video
-     key={stream ? stream.id : 'novideo'}
-     ref={videoRef}
-     ...
- />
+ <video
+     ref={desktopVideoRef}  // or mobileVideoRef
+     ...
+ />
```

### Fix 2: Separate Refs for Desktop/Mobile
```typescript
// Use separate refs for desktop and mobile video elements to avoid ref conflicts
const desktopVideoRef = useRef<HTMLVideoElement>(null)
const mobileVideoRef = useRef<HTMLVideoElement>(null)

/**
 * Gets the currently visible/active video element.
 * On desktop (md+), returns desktopVideoRef; on mobile, returns mobileVideoRef.
 */
const getActiveVideo = useCallback((): HTMLVideoElement | null => {
    const desktopVideo = desktopVideoRef.current
    const mobileVideo = mobileVideoRef.current
    
    // Check which video element is actually visible (not display:none)
    if (desktopVideo && desktopVideo.offsetParent !== null) {
        return desktopVideo
    }
    if (mobileVideo && mobileVideo.offsetParent !== null) {
        return mobileVideo
    }
    
    // Fallback: return whichever exists
    return desktopVideo || mobileVideo
}, [])
```

### Fix 3: Force Repaint Function
```typescript
/**
 * Forces a browser repaint on an element.
 * This fixes the Chrome bug where video elements don't render after srcObject is set.
 */
function forceRepaint(element: HTMLElement): void {
    // 1. Access offsetHeight to force a synchronous reflow
    void element.offsetHeight
    
    // 2. Toggle a harmless style property
    const originalTransform = element.style.transform
    element.style.transform = 'translateZ(0)'
    
    // 3. Use requestAnimationFrame to schedule another reflow after paint
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            element.style.transform = originalTransform
        })
    })
}
```

### Fix 4: Robust Stream Attachment Effect
```typescript
useEffect(() => {
    if (!stream) return

    const currentVersion = ++videoMountVersion.current
    let hasSetReady = false
    const cleanupFns: (() => void)[] = []
    
    const handleVideoReady = (video: HTMLVideoElement) => {
        if (videoMountVersion.current !== currentVersion || hasSetReady) return
        
        hasSetReady = true
        setVideoPlaying(true)
        setIsLoading(false)
        isStartingRef.current = false
        forceRepaint(video)
    }
    
    const attachStreamToVideo = (video: HTMLVideoElement | null, label: string) => {
        if (!video) return
        video.srcObject = stream
        
        // Add event listeners for playing, loadeddata, canplay, loadedmetadata
        // Call video.play() with proper error handling
        // Store cleanup functions
    }
    
    // Retry until video elements are mounted (up to 30 frames)
    const tryAttach = () => {
        const desktopVideo = desktopVideoRef.current
        const mobileVideo = mobileVideoRef.current
        
        if (!desktopVideo && !mobileVideo) {
            requestAnimationFrame(tryAttach) // Retry
            return
        }
        
        // Attach to BOTH so whichever is visible will work
        attachStreamToVideo(desktopVideo, 'desktop')
        attachStreamToVideo(mobileVideo, 'mobile')
    }
    
    tryAttach()
    
    // 2-second fallback timeout
    const fallbackTimeout = setTimeout(() => {
        if (hasSetReady) return
        const activeVideo = getActiveVideo()
        if (activeVideo?.srcObject === stream) {
            forceRepaint(activeVideo)
            handleVideoReady(activeVideo)
        }
    }, 2000)

    return () => {
        clearTimeout(fallbackTimeout)
        cleanupFns.forEach(fn => fn())
    }
}, [stream, getActiveVideo])
```

### Fix 5: Better Autoplay Error Handling
```typescript
video.play()
    .then(() => {
        forceRepaint(video)
        handleVideoReady(video)
    })
    .catch(e => {
        if (e.name === 'AbortError') {
            // Normal during transitions - silently ignore
        } else if (e.name === 'NotAllowedError') {
            // Autoplay blocked - still show controls
            handleVideoReady(video)
        } else {
            // Other errors - gracefully recover
            handleVideoReady(video)
        }
    })
```

---

## Key Learnings

1. **Don't use `key` to force video re-renders** — It causes race conditions with stream attachment.

2. **Separate refs for responsive layouts** — When using CSS media queries with `hidden md:flex`, both elements exist in DOM. Using one ref means it always points to the last element.

3. **Force repaints for video elements** — Chrome has a known issue where video elements don't immediately render after `srcObject` is set. Force reflow with `offsetHeight` access and CSS transform toggling.

4. **Use version counters for async callbacks** — Track mount versions to prevent stale callbacks from affecting state after component changes.

5. **Fallback timeouts are essential** — Video events may not fire reliably; 2-second fallback ensures UI doesn't get stuck.

---

## Testing Checklist

- [ ] Camera starts immediately on button click (no white screen)
- [ ] Video appears without opening DevTools
- [ ] Works on desktop (md+ breakpoint)
- [ ] Works on mobile (< md breakpoint)
- [ ] Switching between front/back camera works
- [ ] Tab visibility change resumes video
- [ ] Capture button correctly captures from visible video
