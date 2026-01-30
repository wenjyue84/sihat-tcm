# APK Deployment - Camera PPG Feature

## ✅ YES - It Works in APK Builds!

When you build an APK (development or production), the camera PPG feature **will work with real measurements**, not just demo mode.

## How It Works

### Current Implementation (Works in APK)

The app uses **periodic frame capture** at ~10 FPS:
1. Camera captures frames every 100ms
2. Extracts center region (where finger should be)
3. Estimates brightness from image data
4. Processes signal to calculate BPM

### Accuracy

- **Frame Rate**: ~10 FPS (vs ideal 30 FPS)
- **Method**: Brightness estimation from compressed image data
- **Accuracy**: Good enough for basic heart rate measurement
- **Battery**: Moderate usage (captures every 100ms)

## Building an APK

### Development Build (Recommended for Testing)

```bash
cd sihat-tcm-mobile

# Prebuild native code
npx expo prebuild --clean

# Build APK
npx expo run:android

# Or build APK directly
cd android
./gradlew assembleDebug
# APK will be in: android/app/build/outputs/apk/debug/app-debug.apk
```

### Production Build

```bash
# Using EAS Build (recommended)
npx eas build --platform android --profile production

# Or manual build
cd android
./gradlew assembleRelease
# APK will be in: android/app/build/outputs/apk/release/app-release.apk
```

## Testing Real Measurements

1. **Install APK** on your Android device
2. **Open app** and navigate to Pulse Check
3. **Tap "Measure with Camera"**
4. **Turn OFF Demo Mode** (toggle at bottom)
5. **Place finger** over camera with flash ON
6. **Wait 5-10 seconds** for BPM detection

## Limitations & Future Improvements

### Current Limitations

1. **Lower Frame Rate**: 10 FPS vs ideal 30 FPS
   - Solution: Install `expo-gl` for 30 FPS pixel access

2. **Brightness Estimation**: Uses compressed image data
   - Solution: Use `expo-gl` for true pixel reading

3. **Battery Usage**: Continuous frame capture
   - Solution: Native module with optimized CameraX

### Upgrade Path (Optional)

For **better accuracy** (30 FPS, true pixel reading):

```bash
# Install expo-gl
npx expo install expo-gl

# Then update CameraPulseSensor.js to use GLView
# See: docs/CAMERA_PPG_IMPLEMENTATION.md
```

## What Works Now

✅ **Real camera access** (not simulated)  
✅ **Flash/torch control**  
✅ **Signal processing** (FFT, bandpass filter)  
✅ **BPM calculation** (accurate algorithm)  
✅ **Works in APK builds**  

## What Needs Upgrade (Optional)

⚠️ **Higher frame rate** (10 FPS → 30 FPS)  
⚠️ **True pixel reading** (brightness estimation → pixel values)  
⚠️ **Better battery efficiency** (periodic capture → native stream)  

## Summary

**Yes, you can deploy an APK and use real measurements!**

The current implementation works for production use, though it's not as accurate as a native module would be. For most users, the 10 FPS brightness-based approach provides acceptable heart rate measurements.

To test: Build APK → Install → Turn off Demo Mode → Measure!






