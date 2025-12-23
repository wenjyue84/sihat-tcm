# Fix: Audio Analysis - FileSystem.EncodingType.Base64 Undefined

## Problem
When clicking "Analyze" in the Audio Diagnosis step, the app crashed with:
```
[AudioAnalysis] Error: Cannot read property 'Base64' of undefined
```

## Root Cause
Expo SDK 54 has deprecated the old `expo-file-system` API. The new API uses `File` and `Directory` classes instead of `FileSystem.EncodingType`.

## Solution
Import from the legacy API path:
```javascript
// Before (broken)
import * as FileSystem from 'expo-file-system';

// After (fixed)  
import * as FileSystem from 'expo-file-system/legacy';
```

## Additional Fixes Applied
1. **Recording cleanup** - Properly unload existing recording before starting new one to fix "Failed to start recording" on second attempt
2. **Variable shadowing** - Renamed `recording` to `newRecording` to avoid collision with state variable
3. **Better error messages** - Added console logging for debugging

## Files Changed
- `sihat-tcm-mobile/screens/diagnosis/DiagnosisScreen.js` - Swapped AudioStep → AudioAnalysisStep
- `sihat-tcm-mobile/screens/diagnosis/AudioAnalysisStep.js` - Fixed FileSystem import + recording cleanup

## Lesson Learned
When using expo-file-system in Expo SDK 54+, use `expo-file-system/legacy` for the classic API or migrate to the new `File`/`Directory` class-based API.
