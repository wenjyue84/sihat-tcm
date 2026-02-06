# Symptom Tracking Implementation Guide

## Overview

This guide documents the implementation plan for the patient symptom tracking feature. The feature allows patients to quickly log symptoms with severity ratings, enabling trend analysis and wellness monitoring.

## Current Status

| Component | Status | Location |
|-----------|--------|----------|
| UI Component | ✅ READY | `src/components/patient/QuickSymptomTracker.tsx` |
| Type Definitions | ✅ READY | `src/types/database.ts` |
| Server Actions | ⏳ PLACEHOLDER | `src/lib/actions/symptom-logs.ts` |
| Database Table | ❌ NOT CREATED | Migration file ready |
| Migration File | ✅ READY | `docs/database/migrations/20260206_create_symptom_logs.sql` |

**Current Behavior:** QuickSymptomTracker logs to console only. Save button does not persist data.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     QuickSymptomTracker                          │
│                     (Client Component)                           │
│                                                                  │
│  - Floating action button (fixed bottom-right)                  │
│  - Symptom dropdown (5 common symptoms)                         │
│  - Severity slider (1-10)                                       │
│  - Optional notes field (future enhancement)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ saveSymptomLog({ symptom, severity })
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              symptom-logs.ts (Server Actions)                    │
│                                                                  │
│  - saveSymptomLog()       → Create new log                      │
│  - getSymptomLogs()       → Fetch user's logs                   │
│  - getSymptomTrends()     → Aggregate for charts                │
│  - updateSymptomLog()     → Edit existing log                   │
│  - deleteSymptomLog()     → Remove log                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Supabase Client (RLS enforced)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   symptom_logs Table                             │
│                                                                  │
│  - id (uuid, PK)                                                │
│  - user_id (uuid, FK → auth.users)                             │
│  - diagnosis_session_id (uuid, FK → diagnosis_sessions)         │
│  - symptom (text, NOT NULL)                                     │
│  - severity (int, 1-10, NOT NULL)                               │
│  - notes (text, optional)                                       │
│  - metadata (jsonb)                                             │
│  - logged_at (timestamptz, when symptom occurred)               │
│  - created_at, updated_at                                       │
│                                                                  │
│  Indexes: user_id, logged_at, symptom, metadata (GIN)           │
│  RLS: Users can CRUD their own logs; Doctors can view all       │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Database Migration

Run the migration to create the `symptom_logs` table:

```bash
# Copy migration to Supabase migrations directory
cp docs/database/migrations/20260206_create_symptom_logs.sql \
   sihat-tcm-web/supabase/migrations/

# Apply migration
cd sihat-tcm-web
npx supabase db reset  # For development
# OR
npx supabase db push   # For production
```

**Verify migration:**
```sql
-- Check table exists
SELECT * FROM information_schema.tables WHERE table_name = 'symptom_logs';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'symptom_logs';

-- Check policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'symptom_logs';
```

### 2. Type Definitions

Already added to `src/types/database.ts`:

```typescript
export interface SymptomLog {
  id: string;
  user_id?: string | null;
  diagnosis_session_id?: string | null;
  symptom: string;
  severity: number; // 1-10
  notes?: string | null;
  metadata?: Record<string, any> | null;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface SaveSymptomLogInput {
  symptom: string;
  severity: number;
  notes?: string;
  metadata?: Record<string, any>;
  logged_at?: string;
  diagnosis_session_id?: string;
}
```

## Implementation Steps

### Step 1: Implement saveSymptomLog()

**File:** `src/lib/actions/symptom-logs.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { ActionResult, SymptomLog, SaveSymptomLogInput } from "@/types/database";

export async function saveSymptomLog(
  input: SaveSymptomLogInput
): Promise<ActionResult<SymptomLog>> {
  try {
    // 1. Initialize Supabase client
    const supabase = await createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // 3. Validate input
    if (!input.symptom || input.symptom.trim().length === 0) {
      return { success: false, error: "Symptom name is required" };
    }

    if (input.severity < 1 || input.severity > 10) {
      return { success: false, error: "Severity must be between 1 and 10" };
    }

    // 4. Prepare data
    const logData = {
      user_id: user.id,
      symptom: input.symptom.trim(),
      severity: input.severity,
      notes: input.notes?.trim() || null,
      metadata: input.metadata || {},
      logged_at: input.logged_at || new Date().toISOString(),
      diagnosis_session_id: input.diagnosis_session_id || null,
    };

    // 5. Insert into database
    const { data, error } = await supabase
      .from("symptom_logs")
      .insert(logData)
      .select()
      .single();

    if (error) {
      console.error("Error saving symptom log:", error);
      return { success: false, error: "Failed to save symptom log" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error in saveSymptomLog:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

### Step 2: Update QuickSymptomTracker Component

**File:** `src/components/patient/QuickSymptomTracker.tsx`

```typescript
"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { saveSymptomLog } from "@/lib/actions/symptom-logs";

const SYMPTOMS = ["Headache", "Fatigue", "Insomnia", "Digestive Issues", "Joint Pain"];

export function QuickSymptomTracker() {
  const [open, setOpen] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState([5]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await saveSymptomLog({
        symptom,
        severity: severity[0],
        logged_at: new Date().toISOString(),
      });

      if (result.success) {
        toast({
          title: "Symptom logged",
          description: `${symptom} (severity: ${severity[0]}/10) has been recorded.`,
        });

        // Reset form
        setSymptom("");
        setSeverity([5]);
        setOpen(false);
      } else {
        toast({
          title: "Failed to log symptom",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 rounded-full shadow-lg z-50">
          <Activity className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Log Symptom</h4>
          <Select value={symptom} onValueChange={setSymptom}>
            <SelectTrigger>
              <SelectValue placeholder="Select symptom" />
            </SelectTrigger>
            <SelectContent>
              {SYMPTOMS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <label className="text-sm text-muted-foreground">Severity: {severity[0]}/10</label>
            <Slider value={severity} onValueChange={setSeverity} max={10} step={1} />
          </div>
          <Button onClick={handleSave} disabled={!symptom || isSaving} className="w-full">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Step 3: Implement Read Operations (Optional)

For symptom history display:

```typescript
export async function getSymptomLogs(options?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  symptom?: string;
}): Promise<ActionResult<SymptomLog[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    let query = supabase
      .from("symptom_logs")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false });

    if (options?.symptom) {
      query = query.eq("symptom", options.symptom);
    }

    if (options?.startDate) {
      query = query.gte("logged_at", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("logged_at", options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: "Failed to fetch symptom logs" };
    }

    return { success: true, data: data || [], total: count || 0 };
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

### Step 4: Add Trend Visualization (Future Enhancement)

Use ConstitutionTrendChart component to display symptom trends:

```typescript
import { ConstitutionTrendChart } from "@/components/patient/ConstitutionTrendChart";

// Transform symptom logs into chart data
const chartData = symptomLogs.map(log => ({
  date: new Date(log.logged_at).toLocaleDateString(),
  score: log.severity * 10, // Scale to 0-100 for consistency
  label: log.symptom,
}));

<ConstitutionTrendChart data={chartData} />;
```

## Testing Checklist

### Database Tests

- [ ] Table created successfully
- [ ] Indexes exist (check with `\d symptom_logs` in psql)
- [ ] RLS enabled
- [ ] Policies allow users to CRUD their own logs
- [ ] Policies allow doctors to view all logs
- [ ] Trigger updates `updated_at` on modification

### Server Action Tests

- [ ] `saveSymptomLog()` creates record
- [ ] Validates severity range (1-10)
- [ ] Requires authentication
- [ ] Sets `user_id` from auth session
- [ ] Defaults `logged_at` to current time
- [ ] Returns created record with ID

### Component Tests

- [ ] Floating button appears in bottom-right
- [ ] Popover opens on click
- [ ] Symptom dropdown shows 5 options
- [ ] Severity slider ranges 1-10
- [ ] Save button disabled when no symptom selected
- [ ] Shows loading state during save
- [ ] Shows success toast on save
- [ ] Shows error toast on failure
- [ ] Form resets after successful save

### Integration Tests

- [ ] Symptom logs appear in patient dashboard
- [ ] Logs are user-scoped (users can't see others' logs)
- [ ] Logs persist across sessions
- [ ] Logs can be filtered by date range
- [ ] Logs can be filtered by symptom type

## Security Considerations

1. **Row Level Security (RLS):**
   - Users can only access their own symptom logs
   - Doctors/admins can view all logs (for patient care)
   - No public access

2. **Input Validation:**
   - Symptom name: 1-200 characters, non-empty
   - Severity: Integer 1-10 inclusive
   - Notes: Optional, max 1000 characters
   - Metadata: Valid JSON structure

3. **Rate Limiting:**
   - Consider implementing rate limit for rapid logging
   - Prevent abuse of symptom tracker

4. **Data Privacy:**
   - Symptom data is sensitive health information
   - Comply with HIPAA/GDPR if applicable
   - Consider encryption at rest for notes field

## Future Enhancements

### Phase 1: Basic Logging (Current)
- ✅ Quick symptom tracking with severity
- ✅ Predefined symptom list

### Phase 2: Enhanced Tracking
- [ ] Add notes field to QuickSymptomTracker
- [ ] Custom symptom entry (not just dropdown)
- [ ] Location/body part selection
- [ ] Trigger identification (food, weather, activity)
- [ ] Relieving factors

### Phase 3: Trend Analysis
- [ ] Symptom history view
- [ ] Trend charts (frequency, severity over time)
- [ ] Pattern recognition (time of day, weather correlation)
- [ ] Integration with constitution analysis

### Phase 4: Smart Recommendations
- [ ] AI-powered symptom analysis
- [ ] Correlation with diagnosis sessions
- [ ] Personalized wellness tips based on patterns
- [ ] Alert system for concerning patterns

### Phase 5: Doctor Integration
- [ ] Doctor dashboard for patient symptom monitoring
- [ ] Symptom summary in diagnosis context
- [ ] Automated follow-up triggers
- [ ] Treatment effectiveness tracking

## Related Files

```
sihat-tcm-web/
├── src/
│   ├── components/patient/
│   │   ├── QuickSymptomTracker.tsx        ← UI Component
│   │   └── ConstitutionTrendChart.tsx     ← Trend visualization
│   ├── lib/actions/
│   │   └── symptom-logs.ts                ← Server actions
│   └── types/
│       └── database.ts                     ← Type definitions
├── supabase/migrations/
│   └── 20260206_create_symptom_logs.sql   ← Migration
└── docs/
    ├── database/migrations/
    │   └── 20260206_create_symptom_logs.sql
    └── guides/
        └── SYMPTOM_TRACKING_IMPLEMENTATION.md (this file)
```

## Troubleshooting

### "Table does not exist" Error
**Solution:** Run the database migration first.

### RLS Policy Errors
**Solution:** Verify user is authenticated and policies are created correctly.

### Save Not Working
**Solution:** Check browser console for errors, verify Supabase client is initialized.

### Data Not Showing
**Solution:** Verify RLS policies allow user to read their own logs.

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
