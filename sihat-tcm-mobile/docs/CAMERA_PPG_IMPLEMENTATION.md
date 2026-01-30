# Camera PPG Implementation Guide

## Current Status: Demo/Prototype Mode

The current implementation uses a **simulated PPG signal** for demonstration and testing purposes. The signal processing algorithms (FFT, bandpass filtering, BPM calculation) are production-ready and tested.

## Why Demo Mode?

React Native / Expo doesn't provide direct access to raw camera pixel data. The `expo-camera` package gives us camera preview and control (including torch), but not frame-by-frame pixel access needed for PPG analysis.

## Production Implementation Options

### Option 1: expo-gl + Shader-based Pixel Reading (Recommended for Expo)

```javascript
// Install: npx expo install expo-gl
import { GLView } from 'expo-gl';
import { Camera } from 'expo-camera';

// Create a GL context that receives camera frames
// Use WebGL readPixels() to extract RGB values
// Process the green/red channel for PPG signal
```

**Pros:**
- Works within Expo ecosystem
- No native code required
- Cross-platform

**Cons:**
- Slightly higher latency
- More complex setup

### Option 2: Native Module with CameraX (Android) / AVFoundation (iOS)

Create a custom native module that:
1. Accesses raw YUV/RGB camera frames
2. Extracts the average red/green channel value
3. Sends values to JavaScript via bridge

**Android (Kotlin):**
```kotlin
// Using CameraX ImageAnalysis
imageAnalysis.setAnalyzer(executor) { imageProxy ->
    val buffer = imageProxy.planes[0].buffer
    // Extract average pixel value from center region
    // Send to React Native via event emitter
}
```

**iOS (Swift):**
```swift
// Using AVCaptureVideoDataOutput
func captureOutput(_ output: AVCaptureOutput, 
                   didOutput sampleBuffer: CMSampleBuffer, 
                   from connection: AVCaptureConnection) {
    // Extract pixel buffer and calculate average
    // Send to React Native via event emitter
}
```

**Pros:**
- Best performance
- Full control over frame rate
- Most accurate results

**Cons:**
- Requires native development
- Separate implementations for iOS/Android
- Requires `expo prebuild` or bare workflow

### Option 3: Periodic Frame Capture (Simplest)

```javascript
// Use takePictureAsync at regular intervals
const captureFrame = async () => {
    const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.1, // Low quality for speed
        skipProcessing: true,
    });
    
    // Decode base64 and extract pixel values
    // Process for PPG signal
};

// Run at ~10 FPS
setInterval(captureFrame, 100);
```

**Pros:**
- Works with current expo-camera
- No native code

**Cons:**
- Low frame rate (~10 FPS vs 30 FPS)
- Higher battery usage
- Less accurate BPM detection

## Signal Processing Pipeline

The signal processing code in `CameraPulseSensor.js` is ready for production:

```
Raw Pixel Values (R or G channel)
        ↓
   Detrending (remove baseline drift)
        ↓
   Bandpass Filter (0.7-4.0 Hz)
        ↓
   FFT (Fast Fourier Transform)
        ↓
   Peak Detection (find dominant frequency)
        ↓
   BPM Calculation (frequency × 60)
        ↓
   Stability Check (3 consistent readings)
```

## Recommended Approach

For a **quick production deployment**, use **Option 3** (periodic capture) with these modifications:

1. Reduce capture resolution to minimum
2. Only capture center 50x50 pixels
3. Use 10 FPS capture rate
4. Extend buffer time to compensate for lower frame rate

For **best accuracy**, implement **Option 2** (native module) which gives:
- 30 FPS frame rate
- Direct pixel access
- Lower latency
- Better battery efficiency

## Testing the Demo Mode

1. Enable "Demo Mode" toggle in the Camera Pulse Sensor
2. The component will simulate a realistic heart rate signal
3. BPM detection typically stabilizes in 3-5 seconds
4. Use this to test the UI and flow without native implementation

## Resources

- [expo-gl documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [React Native Turbo Modules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [CameraX ImageAnalysis](https://developer.android.com/training/camerax/analyze)
- [AVFoundation Camera](https://developer.apple.com/documentation/avfoundation/capture_setup)






