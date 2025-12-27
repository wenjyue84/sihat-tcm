# Five Elements Radar Integration Guide

## Overview

This document explains how to integrate the Five Elements Radar component with real diagnosis data from the Digital Twin system.

## Component Location

- **Component**: `src/components/patient/FiveElementsRadar.tsx`
- **Integrated in**: `src/components/patient/CircleOfHealth.tsx`
- **Translations**: Added to `src/lib/translations/en.ts`, `src/lib/translations/zh.ts`

## Features Implemented

### 1. Interactive Radar Chart

- Pentagon-shaped radar chart with 5 vertices representing the Five Elements
- Liver (Wood) - Green 🌿
- Heart (Fire) - Red 🔥
- Spleen (Earth) - Yellow 🌾
- Lung (Metal) - White/Gray 💨
- Kidney (Water) - Blue 💧

### 2. Health Scoring (0-100)

Each organ is scored based on:

- Constitution type inference
- Recent diagnosis data (when available)
- Symptoms and patterns

### 3. Visual Feedback

- Scores < 60: Highlighted with warning icon ⚠️
- Color-coded for each element
- Interactive tooltips
- Smooth animations

### 4. Detailed Recommendations

Click on any organ to see:

- Current health status
- TCM description of the organ
- Personalized dietary recommendations
- Lifestyle suggestions
- Exercise recommendations

### 5. Historical Trends

- Time slider to view historical data
- Progress visualization
- Timeline navigation

## Data Integration

### Option 1: Using Constitution Type (Current Implementation)

```typescript
<FiveElementsRadar
  constitutionType="qi-deficiency"
/>
```

The component will automatically infer organ scores based on the constitution type:

- Qi Deficiency → Lower scores for Spleen and Lung
- Yang Deficiency → Lower scores for Kidney and Spleen
- Yin Deficiency → Lower scores for Kidney and Liver
- Damp-Heat → Lower scores for Spleen and Lung
- Blood Stasis → Lower scores for Liver and Heart

### Option 2: Using Direct Scores

```typescript
<FiveElementsRadar
  currentScores={{
    liver: 75,
    heart: 80,
    spleen: 65,
    lung: 70,
    kidney: 60
  }}
/>
```

### Option 3: With Historical Data

```typescript
<FiveElementsRadar
  currentScores={{
    liver: 75,
    heart: 80,
    spleen: 65,
    lung: 70,
    kidney: 60
  }}
  historicalScores={[
    {
      liver: 70,
      heart: 75,
      spleen: 60,
      lung: 65,
      kidney: 55,
      timestamp: '2024-01-01'
    },
    {
      liver: 72,
      heart: 78,
      spleen: 63,
      lung: 68,
      kidney: 58,
      timestamp: '2024-01-15'
    },
    {
      liver: 75,
      heart: 80,
      spleen: 65,
      lung: 70,
      kidney: 60,
      timestamp: '2024-02-01'
    }
  ]}
/>
```

## Integration with Digital Twin

### Step 1: Create a Diagnosis Data Extractor

Create `src/lib/fiveElementsScoreCalculator.ts`:

```typescript
import { DiagnosisSession } from "@/types/database";

export interface FiveElementsScore {
  liver: number;
  heart: number;
  spleen: number;
  lung: number;
  kidney: number;
  timestamp?: string;
}

export function calculateFiveElementsScores(diagnosis: DiagnosisSession): FiveElementsScore {
  // Initialize base scores
  const scores: FiveElementsScore = {
    liver: 70,
    heart: 70,
    spleen: 70,
    lung: 70,
    kidney: 70,
    timestamp: diagnosis.created_at,
  };

  // Parse constitution and pattern data
  const constitution = diagnosis.constitution?.toLowerCase() || "";
  const pattern = diagnosis.pattern_differentiation?.toLowerCase() || "";

  // Adjust scores based on constitution
  if (constitution.includes("qi") && constitution.includes("deficiency")) {
    scores.spleen -= 15;
    scores.lung -= 10;
  }
  if (constitution.includes("yang") && constitution.includes("deficiency")) {
    scores.kidney -= 15;
    scores.spleen -= 10;
  }
  if (constitution.includes("yin") && constitution.includes("deficiency")) {
    scores.kidney -= 15;
    scores.liver -= 10;
  }
  if (constitution.includes("damp") || constitution.includes("phlegm")) {
    scores.spleen -= 15;
    scores.lung -= 12;
  }
  if (constitution.includes("heat") || constitution.includes("fire")) {
    scores.heart -= 15;
    scores.liver -= 12;
  }
  if (constitution.includes("blood") && constitution.includes("stasis")) {
    scores.liver -= 15;
    scores.heart -= 12;
  }

  // Adjust based on pattern differentiation
  if (pattern.includes("liver qi stagnation")) {
    scores.liver -= 10;
  }
  if (pattern.includes("heart fire")) {
    scores.heart -= 10;
  }
  if (pattern.includes("spleen qi deficiency")) {
    scores.spleen -= 10;
  }
  if (pattern.includes("lung yin deficiency")) {
    scores.lung -= 10;
  }
  if (pattern.includes("kidney yang deficiency")) {
    scores.kidney -= 10;
  }

  // Clamp scores between 0 and 100
  Object.keys(scores).forEach((key) => {
    if (key !== "timestamp") {
      scores[key as keyof Omit<FiveElementsScore, "timestamp">] = Math.max(
        0,
        Math.min(100, scores[key as keyof Omit<FiveElementsScore, "timestamp">])
      );
    }
  });

  return scores;
}

export function calculateHistoricalScores(
  diagnosisHistory: DiagnosisSession[]
): FiveElementsScore[] {
  return diagnosisHistory
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((diagnosis) => calculateFiveElementsScores(diagnosis));
}
```

### Step 2: Modify CircleOfHealth.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { FiveElementsRadar } from './FiveElementsRadar'
import { calculateFiveElementsScores, calculateHistoricalScores } from '@/lib/fiveElementsScoreCalculator'
import { getDiagnosisHistory } from '@/lib/actions'

export function CircleOfHealth({ userConstitution = 'dampHeat' }: CircleOfHealthProps) {
  const [currentScores, setCurrentScores] = useState<FiveElementsScore | undefined>()
  const [historicalScores, setHistoricalScores] = useState<FiveElementsScore[]>([])

  useEffect(() => {
    async function loadDiagnosisData() {
      const history = await getDiagnosisHistory()
      if (history && history.length > 0) {
        // Get current scores from latest diagnosis
        setCurrentScores(calculateFiveElementsScores(history[0]))
        // Get historical scores (limit to last 10 for performance)
        setHistoricalScores(calculateHistoricalScores(history.slice(0, 10)))
      }
    }

    loadDiagnosisData()
  }, [])

  return (
    <div className="space-y-8">
      {/* ... other components ... */}

      <FiveElementsRadar
        currentScores={currentScores}
        historicalScores={historicalScores}
        constitutionType={userConstitution}
      />

      {/* ... other components ... */}
    </div>
  )
}
```

### Step 3: Advanced Integration with AI Analysis

For more accurate scoring, you can integrate with the AI diagnostic engine:

```typescript
// In your API route or server action
export async function generateFiveElementsScores(diagnosisId: string) {
  const diagnosis = await getDiagnosisById(diagnosisId);

  // Use AI to analyze and score each organ
  const prompt = `
Based on the following TCM diagnosis data, provide health scores (0-100) for each of the five organs:

Constitution: ${diagnosis.constitution}
Pattern: ${diagnosis.pattern_differentiation}
Symptoms: ${diagnosis.symptoms}
Tongue: ${diagnosis.tongue_observation}
Pulse: ${diagnosis.pulse_observation}

Provide scores for:
- Liver (wood)
- Heart (fire)
- Spleen (earth)
- Lung (metal)
- Kidney (water)

Return as JSON: { "liver": 75, "heart": 80, "spleen": 65, "lung": 70, "kidney": 60 }
`;

  const result = await generateObject({
    model: google("gemini-2.0-flash"),
    prompt,
    schema: z.object({
      liver: z.number().min(0).max(100),
      heart: z.number().min(0).max(100),
      spleen: z.number().min(0).max(100),
      lung: z.number().min(0).max(100),
      kidney: z.number().min(0).max(100),
    }),
  });

  return result.object;
}
```

## Customization

### Colors

Update `ELEMENT_COLORS` in `FiveElementsRadar.tsx`:

```typescript
const ELEMENT_COLORS = {
  liver: "#10b981", // Green
  heart: "#ef4444", // Red
  spleen: "#eab308", // Yellow
  lung: "#e5e7eb", // Gray
  kidney: "#3b82f6", // Blue
};
```

### Recommendations

Modify the recommendation logic in `getElementRecommendations()` function.

### Thresholds

Change the warning threshold (currently 60):

```typescript
const weakElements = chartData.filter((item) => item.score < 60); // Change 60 to your threshold
```

## Multilingual Support

The component fully supports:

- English ✓
- Chinese (中文) ✓
- Malay (add translations to `src/lib/translations/ms.ts`)

## Next Steps

1. **Database Schema**: Add a `five_elements_scores` table to store historical scores
2. **AI Enhancement**: Use Gemini to generate more accurate scores based on diagnosis
3. **Notifications**: Alert users when organ scores drop below threshold
4. **Recommendations Engine**: Create personalized action plans based on weak elements
5. **Mobile App**: Sync this feature with the React Native mobile app

## Testing

To test the component:

1. Navigate to Patient Portal → Health Journey
2. The Five Elements Radar will appear after the welcome banner
3. Click on any organ to see details
4. Use the time slider (when historical data is available)

## Support

For questions or issues, refer to:

- Component code: `src/components/patient/FiveElementsRadar.tsx`
- Integration example: `src/components/patient/CircleOfHealth.tsx`
- Translations: `src/lib/translations/`
