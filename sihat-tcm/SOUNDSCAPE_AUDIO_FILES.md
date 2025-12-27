# Five Elements Soundscape - Audio Files Setup Guide

This document describes the required audio file structure for the Five Elements Soundscape Generator feature.

## Directory Structure

All audio files should be placed in the `public/audio/` directory with the following structure:

```
public/
  audio/
    five-elements/
      wood.mp3          # Wood element sounds (bells, chimes)
      fire.mp3          # Fire element sounds (warm tones)
      earth.mp3         # Earth element sounds (steady drums)
      metal.mp3         # Metal element sounds (metallic tones)
      water.mp3         # Water element sounds (flowing sounds)
    ambient/
      rain.mp3          # Rain sounds (white noise)
      wind.mp3          # Wind sounds
      water.mp3         # Water ambient sounds
    guqin/
      meditation.mp3    # Guqin (古琴) melody for meditation
    meditation/
      body-scan-en.mp3  # Body scan meditation guidance (English)
      body-scan-zh.mp3  # Body scan meditation guidance (Chinese)
      body-scan-ms.mp3  # Body scan meditation guidance (Malay)
```

## File Requirements

### Five Elements Audio Files

Each element audio file should be:
- **Format**: MP3 (recommended) or other browser-supported formats (OGG, WAV)
- **Duration**: 2-5 minutes (will loop automatically)
- **Volume**: Normalized to prevent clipping
- **Loop**: Should be seamless (no gaps at start/end)

#### Element Characteristics:

1. **Wood (木) - `wood.mp3`**
   - Sounds: Bells, chimes, wooden instruments
   - Purpose: For Liver (肝) support
   - Frequency: Mid-range, clear tones

2. **Fire (火) - `fire.mp3`**
   - Sounds: Warm tones, gentle strings
   - Purpose: For Heart (心) support
   - Frequency: Warm, uplifting

3. **Earth (土) - `earth.mp3`**
   - Sounds: Steady drums, grounding rhythms
   - Purpose: For Spleen (脾) support
   - Frequency: Low to mid-range, steady beat

4. **Metal (金) - `metal.mp3`**
   - Sounds: Metallic tones, bells, gongs
   - Purpose: For Lung (肺) support
   - Frequency: Clear, metallic resonance

5. **Water (水) - `water.mp3`**
   - Sounds: Flowing sounds, gentle streams
   - Purpose: For Kidney (肾) support
   - Frequency: Smooth, flowing

### Ambient Sounds

Ambient sounds provide background atmosphere:

1. **Rain (`rain.mp3`)**
   - White noise rain sounds
   - Duration: 5-10 minutes (loops)
   - Volume: Should be subtle, not overpowering

2. **Wind (`wind.mp3`)**
   - Gentle wind sounds
   - Duration: 5-10 minutes (loops)
   - Volume: Subtle background

3. **Water (`water.mp3`)**
   - Flowing water, streams
   - Duration: 5-10 minutes (loops)
   - Volume: Calming background

### Guqin Melody

- **File**: `guqin/meditation.mp3`
- **Description**: Traditional Chinese Guqin (古琴) meditation music
- **Duration**: 5-10 minutes (loops)
- **Purpose**: Provides traditional TCM musical therapy element

### Meditation Guidance

Body scan meditation audio files in three languages:

1. **English**: `meditation/body-scan-en.mp3`
2. **Chinese**: `meditation/body-scan-zh.mp3`
3. **Malay**: `meditation/body-scan-ms.mp3`

**Requirements**:
- **Duration**: 10-20 minutes (does not loop)
- **Content**: Guided body scan meditation
- **Voice**: Calm, soothing voice
- **Pacing**: Slow, mindful instructions

## Audio File Sources

### Recommended Sources (Free/Open Source):

1. **Freesound.org** - Creative Commons licensed sounds
2. **Zapsplat.com** - Free sound effects (with attribution)
3. **Incompetech.com** - Royalty-free music
4. **YouTube Audio Library** - Free music and sound effects

### TCM-Specific Resources:

- Traditional Chinese music libraries
- Guqin recordings from cultural institutions
- TCM meditation guidance recordings

## Testing

After adding audio files:

1. Test each file loads correctly in the browser
2. Verify looping works smoothly (no gaps)
3. Check volume levels are balanced
4. Test on different browsers (Chrome, Firefox, Safari, Edge)
5. Test on mobile devices

## Fallback Behavior

If audio files are missing:
- The component will display an error message
- Users will see: "Failed to load audio files. Please ensure audio files are available."
- The component remains functional but audio won't play

## File Size Recommendations

- **Element sounds**: 2-5 MB each (compressed MP3)
- **Ambient sounds**: 3-8 MB each
- **Guqin melody**: 5-10 MB
- **Meditation guidance**: 5-15 MB each

**Total estimated size**: ~50-100 MB for all files

## Compression Tips

1. Use MP3 format with 128-192 kbps bitrate
2. For ambient sounds, mono is acceptable (saves space)
3. For music (Guqin, elements), stereo recommended
4. Use audio editing software to normalize volumes
5. Ensure seamless loops for repeating sounds

## Implementation Notes

The soundscape generator:
- Mixes multiple audio layers simultaneously
- Allows individual volume control for each layer
- Automatically determines which sounds to play based on TCM diagnosis
- Supports all three languages (en/zh/ms) for meditation guidance

## Example TCM Profile → Soundscape Mapping

- **Damp Heat**: Water (primary) + Metal (secondary) + Rain (ambient)
- **Liver Qi Stagnation**: Metal (primary) + Water (secondary) + Rain (ambient)
- **Spleen Qi Deficiency**: Earth (primary) + Fire (secondary) + No ambient
- **Heart Fire**: Water (primary) + Metal (secondary) + Rain (ambient)
- **Kidney Deficiency**: Earth (primary) + Metal (secondary) + Water (ambient)

See `src/lib/soundscapeUtils.ts` for the complete mapping logic.

