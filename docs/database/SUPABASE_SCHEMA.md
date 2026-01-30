# Sihat TCM - Supabase Schema Documentation

> **Last Updated**: 2025-12-29  
> **Purpose**: Document all Supabase tables, relationships, and query patterns to prevent common issues and improve vibe coding efficiency.

---

## 📊 Database Tables Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CORE USER TABLES                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  auth.users (Supabase Auth)  ◄──────┐                                        │
│       │                              │                                        │
│       ▼                              │                                        │
│  profiles ────────────────────────────┘                                       │
│       │                                                                       │
│       ├──► diagnosis_sessions                                                 │
│       ├──► medical_reports                                                    │
│       ├──► patient_medicines                                                  │
│       ├──► family_members                                                     │
│       └──► inquiries                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                           PATIENT MANAGEMENT                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  patients (Managed by doctors)                                               │
│       │                                                                       │
│       └──► diagnosis_sessions (via patient_id)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                           SYSTEM TABLES                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  system_prompts, system_logs, admin_settings, tcm_practitioners              │
│  notification_history, scheduled_notifications, appointments                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Table Definitions

### 1. `profiles` (Extends auth.users)
Primary user profile table, automatically linked to Supabase Auth.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | → `auth.users.id` |
| `role` | text | 'patient' \| 'doctor' \| 'admin' \| 'developer' | - |
| `full_name` | text | User's display name | - |
| `age` | int | User's age | - |
| `gender` | text | Gender | - |
| `height` | float | Height in cm | - |
| `weight` | float | Weight in kg | - |
| `bmi` | float | Calculated BMI | - |
| `medical_history` | text | Medical history notes | - |
| `flag` | text | ⚠️ **Optional**: 'Critical' \| 'High Priority' \| 'Watch' \| 'Normal' | - |
| `updated_at` | timestamptz | Last update time | - |

**⚠️ Known Issue**: The `flag` column may not exist in all environments. Always handle gracefully:
```typescript
// ✅ CORRECT: Handle missing flag column
const { data, error } = await supabase
  .from("profiles")
  .select("id, full_name, age, gender, flag")
  .in("id", userIds);

if (error?.code === "42703") {
  // Retry without flag column
  const { data: retryData } = await supabase
    .from("profiles")
    .select("id, full_name, age, gender")
    .in("id", userIds);
}
```

---

### 2. `diagnosis_sessions` (Main Diagnosis Table)
Stores all diagnosis sessions for both registered users and managed patients.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | - |
| `user_id` | uuid | For registered users | → `profiles.id` |
| `patient_id` | uuid | For managed patients | → `patients.id` |
| `primary_diagnosis` | text | Main diagnosis | - |
| `constitution` | text | TCM constitution type | - |
| `overall_score` | number | Health score 0-100 | - |
| `full_report` | jsonb | Complete diagnosis report | - |
| `notes` | text | ⚠️ **Optional**: Doctor notes | - |
| `symptoms` | text[] | Array of symptoms | - |
| `medicines` | text[] | Array of medicines | - |
| `vital_signs` | jsonb | BMI, BP, HR, etc. | - |
| `clinical_notes` | text | Doctor's clinical notes | - |
| `treatment_plan` | text | Treatment recommendations | - |
| `follow_up_date` | date | Next follow-up | - |
| `inquiry_summary` | text | AI inquiry summary | - |
| `inquiry_chat_history` | jsonb | Chat messages array | - |
| `tongue_analysis` | jsonb | Tongue observation data | - |
| `face_analysis` | jsonb | Face observation data | - |
| `pulse_data` | jsonb | Pulse reading data | - |
| `flag` | text | ⚠️ **Optional**: Priority flag | - |
| `is_hidden` | boolean | Soft delete flag | - |
| `created_at` | timestamptz | Creation time | - |
| `updated_at` | timestamptz | Last update | - |

---

### 3. `patients` (Managed Patients Table)
Patients created by doctors (not self-registered).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `ic_no` | text | IC number |
| `email` | text | Contact email |
| `phone` | text | Contact phone |
| `birth_date` | date | Date of birth |
| `gender` | text | Gender |
| `status` | text | 'active' \| 'archived' \| 'pending_invite' |
| `type` | text | 'managed' \| 'registered' \| 'guest' |
| `user_id` | uuid | Link to auth user if registered |
| `created_by` | uuid | Doctor who created the record |
| `clinical_summary` | jsonb | AI-generated summary |
| `flag` | text | Priority flag |

---

### 4. `guest_diagnosis_sessions`
For users who complete diagnosis without registering.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `session_token` | text | Unique session identifier |
| `guest_email` | text | Optional email |
| `guest_name` | text | Optional name |
| `migrated_to_user_id` | uuid | If converted to registered user |
| `migrated_at` | timestamptz | Migration timestamp |
| *(Same data fields as diagnosis_sessions)* | | |

---

### 5. `inquiries`
Legacy table for patient inquiries/messages to doctors.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | - |
| `user_id` | uuid | User who sent inquiry | → `profiles.id` |
| `symptoms` | text | Symptom description | - |
| `diagnosis_report` | jsonb | AI diagnosis if generated | - |
| `notes` | text | ⚠️ **Optional**: Notes field | - |
| `created_at` | timestamptz | Creation time | - |

---

### 6. `medical_reports`
Uploaded medical documents.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | - |
| `user_id` | uuid | Owner | → `profiles.id` |
| `name` | text | File name | - |
| `date` | date | Report date | - |
| `size` | text | File size | - |
| `type` | text | File type | - |
| `file_url` | text | Storage URL | - |
| `extracted_text` | text | OCR text | - |

---

### 7. `patient_medicines`
Medicine tracking.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | - |
| `user_id` | uuid | Patient | → `profiles.id` |
| `name` | text | Medicine name | - |
| `dosage` | text | Dosage info | - |
| `frequency` | text | How often | - |
| `is_active` | boolean | Currently taking | - |
| `start_date` | date | Started | - |
| `stop_date` | date | Stopped | - |
| `chinese_name` | text | 中文名 | - |

---

### 8. `family_members`
Family care tracking.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | - |
| `user_id` | uuid | Primary account | → `profiles.id` |
| `name` | text | Member name | - |
| `relationship` | text | 'self' \| 'mother' \| 'father' \| 'spouse' \| 'child' \| 'sibling' \| 'other' | - |
| `gender` | text | Gender | - |
| `date_of_birth` | date | DOB | - |

---

### 9. `system_prompts`
AI system prompts configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `role` | text | Unique role identifier |
| `prompt_text` | text | The prompt content |
| `config` | jsonb | Additional configuration |
| `updated_at` | timestamptz | Last update |

---

### 10. `tcm_practitioners`
TCM practitioner directory.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Practitioner name |
| `specialty` | text | Specialty area |
| `location` | text | Practice location |
| `rating` | float | Average rating |
| `available` | boolean | Accepting patients |

---

### 11. `appointments`
Appointment scheduling.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | - |
| `doctor_id` | uuid | Doctor | → `profiles.id` |
| `patient_id` | uuid | Patient | → `patients.id` |
| `patient_name` | text | Display name | - |
| `start_time` | timestamptz | Start | - |
| `end_time` | timestamptz | End | - |
| `status` | text | 'scheduled' \| 'completed' \| 'cancelled' \| 'no_show' | - |
| `type` | text | 'consultation' \| 'treatment' \| 'follow_up' | - |
| `notes` | text | Appointment notes | - |

---

### 12. `system_errors`
System error logs for monitoring dashboard.

| Column | Type | Description | FK |
|--------|------|-------------|-----|
| `id` | uuid | Primary key | - |
| `timestamp` | timestamptz | When error occurred | - |
| `error_type` | text | Error category | - |
| `message` | text | Error message | - |
| `stack_trace` | text | Stack trace | - |
| `component` | text | Source component | - |
| `user_id` | uuid | Affected user | → `auth.users.id` |
| `session_id` | text | Session identifier | - |
| `url` | text | Page URL | - |
| `user_agent` | text | Browser info | - |
| `severity` | text | 'low' \| 'medium' \| 'high' \| 'critical' | - |
| `resolved` | boolean | Resolution status | - |
| `resolved_at` | timestamptz | When resolved | - |
| `resolved_by` | uuid | Admin who resolved | → `auth.users.id` |
| `metadata` | jsonb | Extra context | - |

---

## ⚠️ Common Relationship Issues & Solutions

### Issue 1: "Could not find relationship between tables"

**❌ WRONG** - Direct relationship joins that don't exist in schema:
```typescript
// This will fail!
const { data } = await supabase
  .from("diagnosis_sessions")
  .select("*, profiles!user_id(*)");  // ❌ Schema cache error
```

**✅ CORRECT** - Manual client-side joins:
```typescript
// Step 1: Fetch sessions
const { data: sessions } = await supabase
  .from("diagnosis_sessions")
  .select("id, user_id, patient_id, primary_diagnosis, full_report")
  .order("created_at", { ascending: false });

// Step 2: Extract unique IDs
const userIds = sessions?.map(s => s.user_id).filter(Boolean) ?? [];
const patientIds = sessions?.map(s => s.patient_id).filter(Boolean) ?? [];

// Step 3: Fetch related data
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, full_name, age, gender")
  .in("id", userIds);

const { data: patients } = await supabase
  .from("patients")
  .select("id, first_name, last_name, birth_date, gender")
  .in("id", patientIds);

// Step 4: Create maps and join
const profilesMap = new Map(profiles?.map(p => [p.id, p]));
const patientsMap = new Map(patients?.map(p => [p.id, p]));

const enrichedData = sessions?.map(session => ({
  ...session,
  profile: session.user_id ? profilesMap.get(session.user_id) : null,
  patient: session.patient_id ? patientsMap.get(session.patient_id) : null
}));
```

---

### Issue 2: Missing Column Errors (42703)

**Pattern**: Some columns like `flag`, `notes` may not exist in all environments.

**✅ CORRECT** - Graceful fallback:
```typescript
const fetchWithFallback = async (table: string, columns: string[], ids: string[]) => {
  const { data, error } = await supabase
    .from(table)
    .select(columns.join(", "))
    .in("id", ids);
  
  if (error?.code === "42703") {
    // Column doesn't exist, retry without optional columns
    const requiredColumns = columns.filter(c => !["flag", "notes"].includes(c));
    return supabase.from(table).select(requiredColumns.join(", ")).in("id", ids);
  }
  
  return { data, error };
};
```

---

## 🔧 Supabase Client Setup

### Web App (Next.js)

```typescript
// CLIENT COMPONENTS: @/lib/supabase/client
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// SERVER ACTIONS/API ROUTES: @/lib/supabase/server
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: ... } }
  );
}
```

### Mobile App (Expo)

```javascript
// lib/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // Important for React Native
  },
});
```

---

## 📝 Query Patterns Cheat Sheet

### Basic CRUD Operations

```typescript
// SELECT with filters
const { data } = await supabase
  .from("diagnosis_sessions")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(10);

// INSERT
const { data, error } = await supabase
  .from("diagnosis_sessions")
  .insert({ user_id, primary_diagnosis, full_report })
  .select()
  .single();

// UPDATE
const { error } = await supabase
  .from("profiles")
  .update({ flag: "Critical" })
  .eq("id", profileId);

// DELETE (soft delete preferred)
const { error } = await supabase
  .from("diagnosis_sessions")
  .update({ is_hidden: true })
  .eq("id", sessionId);

// UPSERT
const { error } = await supabase
  .from("profiles")
  .upsert({ id: userId, full_name, age });
```

### Aggregation & Counting

```typescript
// Count records
const { count } = await supabase
  .from("diagnosis_sessions")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId);

// Date filtering
const { data } = await supabase
  .from("diagnosis_sessions")
  .select("*")
  .gte("created_at", startDate.toISOString())
  .lte("created_at", endDate.toISOString());
```

### JSONB Queries

```typescript
// Query nested JSONB field
const { data } = await supabase
  .from("diagnosis_sessions")
  .select("*, full_report->diagnosis as diagnosis")
  .not("full_report", "is", null);
```

---

## 🔐 Row Level Security (RLS) Policies

### Current Policies:

1. **profiles**: Users can read all, insert/update only own record
2. **diagnosis_sessions**: Users can CRUD own records, doctors can view all
3. **inquiries**: Users can CRUD own, doctors can view all
4. **system_prompts**: Admins can manage all, doctors can view doctor prompts

### Example Policy Pattern:
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own sessions"
ON diagnosis_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Doctors can view all patient data
CREATE POLICY "Doctors can view all sessions"
ON diagnosis_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'doctor'
  )
);
```

---

## 📋 Type Definitions Location

All TypeScript types are defined in:
```
sihat-tcm-web/src/types/database.ts
```

Key types:
- `DiagnosisSession`
- `GuestDiagnosisSession`
- `Patient`
- `MedicalReport`
- `PatientMedicine`
- `FamilyMember`
- `Appointment`
- `PatientFlag`

---

## 🚨 Troubleshooting Checklist

- [ ] **42703 Error**: Column doesn't exist - add fallback query
- [ ] **Relationship Error**: Don't use `!foreign_key` syntax - use manual joins
- [ ] **RLS Error**: Check if user is authenticated and has correct role
- [ ] **Empty Results**: Verify RLS policies allow the query
- [ ] **CORS Error**: Mobile requests may need API route headers

---

## 📚 Related Files

- `sihat-tcm-web/sql/supabase_setup.sql` - Initial schema
- `sihat-tcm-web/src/types/database.ts` - TypeScript types
- `sihat-tcm-web/src/lib/supabase/` - Client setup
- `sihat-tcm-mobile/lib/supabase.js` - Mobile client
