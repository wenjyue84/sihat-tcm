# Diagnosis Data Recording & Patient Portal Display - Implementation Plan

## Overview

This document outlines how to record **all diagnosis input data** (symptoms, inquiry summary, tongue/face analysis, BPM, health data) and display it in the Patient Portal for both authenticated patients and guests.

---

## Current State Analysis

### ✅ What's Currently Saved

- Primary diagnosis
- Constitution
- Overall score
- Full report (JSON)
- Symptoms (array) - _partially_
- Medicines (array) - _partially_
- Vital signs (if extracted from report)
- Treatment plan (if extracted from report)
- User notes

### ❌ What's Currently NOT Saved

1. **Inquiry Data:**
   - Inquiry summary/text (`wen_inquiry.inquiryText`)
   - Full chat history (`wen_inquiry.chatHistory` or `wen_chat.chat`)
   - Medical report files uploaded
   - Medicine files uploaded

2. **Visual Analysis Data:**
   - Tongue analysis: observation, image URL, analysis tags, TCM indicators, pattern suggestions
   - Face analysis: observation, image URL, analysis tags, TCM indicators
   - Body part analysis: observation, image URL, analysis tags

3. **Audio Analysis:**
   - Audio file URL
   - Audio observation/analysis
   - Potential issues detected

4. **Pulse Data:**
   - BPM (sometimes saved in vital_signs, but not consistently)
   - Pulse quality, rhythm, strength, notes

5. **Guest User Support:**
   - No mechanism to save data for guests
   - No prompt to sign up after diagnosis

---

## Implementation Plan

### Phase 1: Database Schema Enhancement

#### 1.1 Create Migration: Add Input Data Fields

**File:** `sihat-tcm-web/supabase/migrations/[timestamp]_add_diagnosis_input_data.sql`

```sql
-- Migration: Add comprehensive input data fields to diagnosis_sessions
-- Description: Stores all raw input data collected during diagnosis for complete patient history

-- 1. Add new columns for input data
alter table public.diagnosis_sessions
  -- Inquiry data
  add column if not exists inquiry_summary text,
  add column if not exists inquiry_chat_history jsonb,
  add column if not exists inquiry_report_files jsonb, -- Array of file metadata
  add column if not exists inquiry_medicine_files jsonb, -- Array of file metadata

  -- Visual analysis data
  add column if not exists tongue_analysis jsonb, -- {image_url, observation, analysis_tags, tcm_indicators, pattern_suggestions}
  add column if not exists face_analysis jsonb, -- {image_url, observation, analysis_tags, tcm_indicators}
  add column if not exists body_analysis jsonb, -- {image_url, observation, analysis_tags}

  -- Audio analysis
  add column if not exists audio_analysis jsonb, -- {audio_url, observation, potential_issues}

  -- Pulse data (enhanced)
  add column if not exists pulse_data jsonb, -- {bpm, quality, rhythm, strength, notes}

  -- Guest user support
  add column if not exists is_guest_session boolean default false,
  add column if not exists guest_email text, -- For follow-up signup prompts
  add column if not exists guest_name text;

-- 2. Add comments for documentation
comment on column public.diagnosis_sessions.inquiry_summary is 'Summary text from inquiry step (wen_inquiry.inquiryText)';
comment on column public.diagnosis_sessions.inquiry_chat_history is 'Full chat conversation history from inquiry (array of {role, content, timestamp})';
comment on column public.diagnosis_sessions.inquiry_report_files is 'Metadata for medical report files uploaded during inquiry';
comment on column public.diagnosis_sessions.inquiry_medicine_files is 'Metadata for medicine files uploaded during inquiry';
comment on column public.diagnosis_sessions.tongue_analysis is 'Complete tongue analysis data including image, observation, and AI analysis results';
comment on column public.diagnosis_sessions.face_analysis is 'Complete face analysis data including image, observation, and AI analysis results';
comment on column public.diagnosis_sessions.body_analysis is 'Complete body part analysis data including image, observation, and AI analysis results';
comment on column public.diagnosis_sessions.audio_analysis is 'Complete audio analysis data including audio file, observation, and potential issues';
comment on column public.diagnosis_sessions.pulse_data is 'Complete pulse measurement data including BPM, quality, rhythm, strength, and notes';
comment on column public.diagnosis_sessions.is_guest_session is 'Whether this session was created by a guest user (not authenticated)';
comment on column public.diagnosis_sessions.guest_email is 'Email address provided by guest for signup prompts';
comment on column public.diagnosis_sessions.guest_name is 'Name provided by guest during diagnosis';

-- 3. Create indexes for query performance
create index if not exists diagnosis_sessions_inquiry_summary_idx on public.diagnosis_sessions using gin(to_tsvector('english', inquiry_summary));
create index if not exists diagnosis_sessions_is_guest_idx on public.diagnosis_sessions(is_guest_session);
create index if not exists diagnosis_sessions_guest_email_idx on public.diagnosis_sessions(guest_email) where is_guest_session = true;

-- 4. Update RLS policies to allow guest sessions
-- Note: Guest sessions will have user_id = NULL, so we need to handle this
-- Option 1: Create a temporary guest user account
-- Option 2: Store guest sessions with a special guest user_id
-- Option 3: Use a separate table for guest sessions (recommended for security)

-- For now, we'll use Option 2: Create a system guest user
-- This requires creating a guest user in auth.users first, then referencing it
-- OR we can modify the policy to allow NULL user_id with a guest_token

-- Alternative: Create a guest_sessions table (recommended)
create table if not exists public.guest_diagnosis_sessions (
  id uuid default gen_random_uuid() primary key,
  session_token text unique not null, -- Temporary token for guest access
  guest_email text,
  guest_name text,

  -- Same fields as diagnosis_sessions
  primary_diagnosis text not null,
  constitution text,
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  full_report jsonb not null,
  notes text,

  -- Input data fields (same as above)
  inquiry_summary text,
  inquiry_chat_history jsonb,
  inquiry_report_files jsonb,
  inquiry_medicine_files jsonb,
  tongue_analysis jsonb,
  face_analysis jsonb,
  body_analysis jsonb,
  audio_analysis jsonb,
  pulse_data jsonb,
  symptoms text[],
  medicines text[],
  vital_signs jsonb,
  clinical_notes text,
  treatment_plan text,
  follow_up_date date,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Migration fields (when guest signs up)
  migrated_to_user_id uuid references auth.users(id) on delete set null,
  migrated_at timestamp with time zone
);

-- Indexes for guest sessions
create index if not exists guest_diagnosis_sessions_token_idx on public.guest_diagnosis_sessions(session_token);
create index if not exists guest_diagnosis_sessions_email_idx on public.guest_diagnosis_sessions(guest_email);
create index if not exists guest_diagnosis_sessions_migrated_idx on public.guest_diagnosis_sessions(migrated_to_user_id) where migrated_to_user_id is not null;
create index if not exists guest_diagnosis_sessions_created_at_idx on public.guest_diagnosis_sessions(created_at desc);

-- RLS for guest sessions (no auth required for insert, but token required for select)
alter table public.guest_diagnosis_sessions enable row level security;

-- Policy: Anyone can create a guest session
create policy "Anyone can create guest sessions"
  on public.guest_diagnosis_sessions
  for insert
  with check (true);

-- Policy: Anyone with the session token can view their guest session
create policy "Token holders can view their guest session"
  on public.guest_diagnosis_sessions
  for select
  using (true); -- We'll validate token in application layer for security

-- Policy: Authenticated users can view their migrated sessions
create policy "Users can view their migrated guest sessions"
  on public.guest_diagnosis_sessions
  for select
  using (auth.uid() = migrated_to_user_id);
```

**Recommendation:** Use the `guest_diagnosis_sessions` table approach for better security and data isolation.

---

### Phase 2: Update TypeScript Types

#### 2.1 Update `src/types/database.ts`

Add new fields to `DiagnosisSession` and `SaveDiagnosisInput`:

```typescript
export interface DiagnosisSession {
  id: string;
  user_id: string;
  primary_diagnosis: string;
  constitution?: string | null;
  overall_score?: number | null;
  full_report: DiagnosisReport;
  notes?: string | null;

  // Existing doctor record fields
  symptoms?: string[] | null;
  medicines?: string[] | null;
  vital_signs?: VitalSigns | null;
  clinical_notes?: string | null;
  treatment_plan?: string | null;
  follow_up_date?: string | null;
  family_member_id?: string | null;

  // NEW: Input data fields
  inquiry_summary?: string | null;
  inquiry_chat_history?: ChatMessage[] | null;
  inquiry_report_files?: FileMetadata[] | null;
  inquiry_medicine_files?: FileMetadata[] | null;
  tongue_analysis?: TongueAnalysisData | null;
  face_analysis?: FaceAnalysisData | null;
  body_analysis?: BodyAnalysisData | null;
  audio_analysis?: AudioAnalysisData | null;
  pulse_data?: PulseData | null;

  // Guest session fields
  is_guest_session?: boolean;
  guest_email?: string | null;
  guest_name?: string | null;

  created_at: string;
  updated_at: string;
}

export interface SaveDiagnosisInput {
  primary_diagnosis: string;
  constitution?: string;
  overall_score?: number;
  full_report: DiagnosisReport;
  notes?: string;

  // Existing fields
  symptoms?: string[];
  medicines?: string[];
  vital_signs?: VitalSigns;
  clinical_notes?: string;
  treatment_plan?: string;
  follow_up_date?: string;

  // NEW: Input data fields
  inquiry_summary?: string;
  inquiry_chat_history?: ChatMessage[];
  inquiry_report_files?: FileMetadata[];
  inquiry_medicine_files?: FileMetadata[];
  tongue_analysis?: TongueAnalysisData;
  face_analysis?: FaceAnalysisData;
  body_analysis?: BodyAnalysisData;
  audio_analysis?: AudioAnalysisData;
  pulse_data?: PulseData;

  // Guest session fields
  is_guest_session?: boolean;
  guest_email?: string;
  guest_name?: string;
}

// New supporting types
export interface FileMetadata {
  name: string;
  url: string;
  type: string;
  size?: number;
  extracted_text?: string;
}

export interface TongueAnalysisData {
  image_url?: string;
  observation?: string;
  analysis_tags?: string[];
  tcm_indicators?: string[];
  pattern_suggestions?: string[];
  potential_issues?: string[];
}

export interface FaceAnalysisData {
  image_url?: string;
  observation?: string;
  analysis_tags?: string[];
  tcm_indicators?: string[];
  potential_issues?: string[];
}

export interface BodyAnalysisData {
  image_url?: string;
  observation?: string;
  analysis_tags?: string[];
  potential_issues?: string[];
}

export interface AudioAnalysisData {
  audio_url?: string;
  observation?: string;
  potential_issues?: string[];
}

export interface PulseData {
  bpm?: number;
  quality?: string;
  rhythm?: string;
  strength?: string;
  notes?: string;
}
```

---

### Phase 3: Update Data Collection & Saving

#### 3.1 Update `src/hooks/useDiagnosisWizard.ts`

Modify the `submitConsultation` function to collect and save all input data:

```typescript
// In submitConsultation function, after parsing resultData:

// Collect all input data
const inputData = {
  // Inquiry data
  inquiry_summary: data.wen_inquiry?.inquiryText || data.wen_inquiry?.summary,
  inquiry_chat_history: data.wen_inquiry?.chatHistory || data.wen_chat?.chat || [],
  inquiry_report_files:
    data.wen_inquiry?.reportFiles?.map((f: any) => ({
      name: f.name,
      url: f.url || f.publicUrl,
      type: f.type,
      size: f.size,
      extracted_text: f.extractedText,
    })) || [],
  inquiry_medicine_files:
    data.wen_inquiry?.medicineFiles?.map((f: any) => ({
      name: f.name,
      url: f.url || f.publicUrl,
      type: f.type,
      size: f.size,
      extracted_text: f.extractedText,
    })) || [],

  // Visual analysis
  tongue_analysis: data.wang_tongue
    ? {
        image_url: data.wang_tongue.image,
        observation: data.wang_tongue.observation,
        analysis_tags: data.wang_tongue.analysis_tags,
        tcm_indicators: data.wang_tongue.tcm_indicators,
        pattern_suggestions: data.wang_tongue.pattern_suggestions,
        potential_issues: data.wang_tongue.potential_issues,
      }
    : null,

  face_analysis: data.wang_face
    ? {
        image_url: data.wang_face.image,
        observation: data.wang_face.observation,
        analysis_tags: data.wang_face.analysis_tags,
        tcm_indicators: data.wang_face.tcm_indicators,
        potential_issues: data.wang_face.potential_issues,
      }
    : null,

  body_analysis: data.wang_part
    ? {
        image_url: data.wang_part.image,
        observation: data.wang_part.observation,
        analysis_tags: data.wang_part.analysis_tags,
        potential_issues: data.wang_part.potential_issues,
      }
    : null,

  // Audio analysis
  audio_analysis: data.wen_audio
    ? {
        audio_url: data.wen_audio.audio,
        observation: data.wen_audio.observation,
        potential_issues: data.wen_audio.potential_issues,
      }
    : null,

  // Pulse data
  pulse_data: data.qie
    ? {
        bpm: data.qie.bpm,
        quality: data.qie.quality,
        rhythm: data.qie.rhythm,
        strength: data.qie.strength,
        notes: data.qie.notes,
      }
    : null,
};

// Determine if this is a guest session
const isGuest = !user;
const guestEmail = isGuest ? data.basic_info?.email : undefined;
const guestName = isGuest ? data.basic_info?.name : undefined;

// Save diagnosis with all input data
const saveResult = await saveDiagnosis({
  primary_diagnosis: primaryDiagnosis,
  constitution: constitutionValue,
  overall_score: calculateOverallScore(resultData),
  full_report: reportWithProfile,
  symptoms: symptoms,
  medicines: medicines,
  // Add all input data
  ...inputData,
  // Guest session fields
  is_guest_session: isGuest,
  guest_email: guestEmail,
  guest_name: guestName,
});
```

#### 3.2 Update `src/lib/actions.ts`

Modify `saveDiagnosis` to handle all new fields and guest sessions:

```typescript
export async function saveDiagnosis(
  reportData: SaveDiagnosisInput
): Promise<ActionResult<DiagnosisSession>> {
  try {
    const supabase = await createClient();

    // Get current user (may be null for guests)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // For guest sessions, use guest_diagnosis_sessions table
    if (reportData.is_guest_session || (!user && !authError)) {
      // Generate a session token for guest
      const sessionToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from("guest_diagnosis_sessions")
        .insert({
          session_token: sessionToken,
          guest_email: reportData.guest_email,
          guest_name: reportData.guest_name,
          primary_diagnosis: reportData.primary_diagnosis,
          constitution: reportData.constitution,
          overall_score: reportData.overall_score,
          full_report: reportData.full_report,
          notes: reportData.notes,
          symptoms: reportData.symptoms,
          medicines: reportData.medicines,
          vital_signs: reportData.vital_signs,
          clinical_notes: reportData.clinical_notes,
          treatment_plan: reportData.treatment_plan,
          follow_up_date: reportData.follow_up_date,
          // Input data fields
          inquiry_summary: reportData.inquiry_summary,
          inquiry_chat_history: reportData.inquiry_chat_history,
          inquiry_report_files: reportData.inquiry_report_files,
          inquiry_medicine_files: reportData.inquiry_medicine_files,
          tongue_analysis: reportData.tongue_analysis,
          face_analysis: reportData.face_analysis,
          body_analysis: reportData.body_analysis,
          audio_analysis: reportData.audio_analysis,
          pulse_data: reportData.pulse_data,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Return with session token for guest access
      return {
        success: true,
        data: { ...data, session_token: sessionToken } as any,
      };
    }

    // For authenticated users, use diagnosis_sessions table
    if (authError || !user) {
      return {
        success: false,
        error: "Not authenticated. Please log in to save your diagnosis.",
      };
    }

    // Insert diagnosis session with all input data
    const { data, error } = await supabase
      .from("diagnosis_sessions")
      .insert({
        user_id: user.id,
        primary_diagnosis: reportData.primary_diagnosis,
        constitution: reportData.constitution,
        overall_score: reportData.overall_score,
        full_report: reportData.full_report,
        notes: reportData.notes,
        symptoms: reportData.symptoms,
        medicines: reportData.medicines,
        vital_signs: reportData.vital_signs,
        clinical_notes: reportData.clinical_notes,
        treatment_plan: reportData.treatment_plan,
        follow_up_date: reportData.follow_up_date,
        // NEW: Input data fields
        inquiry_summary: reportData.inquiry_summary,
        inquiry_chat_history: reportData.inquiry_chat_history,
        inquiry_report_files: reportData.inquiry_report_files,
        inquiry_medicine_files: reportData.inquiry_medicine_files,
        tongue_analysis: reportData.tongue_analysis,
        face_analysis: reportData.face_analysis,
        body_analysis: reportData.body_analysis,
        audio_analysis: reportData.audio_analysis,
        pulse_data: reportData.pulse_data,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as DiagnosisSession,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to save diagnosis";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
```

---

### Phase 4: Update Patient Portal UI

#### 4.1 Create New Component: `DiagnosisInputDataViewer.tsx`

**File:** `sihat-tcm-web/src/components/patient/DiagnosisInputDataViewer.tsx`

This component displays all input data in an organized, collapsible format:

```typescript
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  MessageSquare,
  Camera,
  Mic,
  Heart,
  FileText,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react'
import { DiagnosisSession } from '@/types/database'

interface DiagnosisInputDataViewerProps {
  session: DiagnosisSession
}

export function DiagnosisInputDataViewer({ session }: DiagnosisInputDataViewerProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    inquiry: false,
    tongue: false,
    face: false,
    body: false,
    audio: false,
    pulse: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-4">
      {/* Inquiry Data */}
      {session.inquiry_summary || session.inquiry_chat_history?.length ? (
        <Card className="p-4">
          <Collapsible open={openSections.inquiry} onOpenChange={() => toggleSection('inquiry')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Inquiry & Conversation</h3>
              </div>
              {openSections.inquiry ? <ChevronDown /> : <ChevronRight />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {session.inquiry_summary && (
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded">
                    {session.inquiry_summary}
                  </p>
                </div>
              )}

              {session.inquiry_chat_history && session.inquiry_chat_history.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Chat History</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {session.inquiry_chat_history.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded ${
                        msg.role === 'user' ? 'bg-blue-50' : 'bg-slate-50'
                      }`}>
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          {msg.role === 'user' ? 'You' : 'AI Doctor'}
                        </div>
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.inquiry_report_files && session.inquiry_report_files.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Medical Reports</h4>
                  <div className="space-y-2">
                    {session.inquiry_report_files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                        {file.url && (
                          <a href={file.url} target="_blank" className="text-blue-600 text-xs">
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ) : null}

      {/* Tongue Analysis */}
      {session.tongue_analysis && (
        <Card className="p-4">
          <Collapsible open={openSections.tongue} onOpenChange={() => toggleSection('tongue')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold">Tongue Analysis</h3>
              </div>
              {openSections.tongue ? <ChevronDown /> : <ChevronRight />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {session.tongue_analysis.image_url && (
                <div>
                  <img
                    src={session.tongue_analysis.image_url}
                    alt="Tongue image"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
              {session.tongue_analysis.observation && (
                <div>
                  <h4 className="font-medium mb-2">Observation</h4>
                  <p className="text-sm text-slate-600">{session.tongue_analysis.observation}</p>
                </div>
              )}
              {session.tongue_analysis.tcm_indicators && session.tongue_analysis.tcm_indicators.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">TCM Indicators</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.tongue_analysis.tcm_indicators.map((indicator, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Face Analysis */}
      {session.face_analysis && (
        <Card className="p-4">
          <Collapsible open={openSections.face} onOpenChange={() => toggleSection('face')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Face Analysis</h3>
              </div>
              {openSections.face ? <ChevronDown /> : <ChevronRight />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {session.face_analysis.image_url && (
                <div>
                  <img
                    src={session.face_analysis.image_url}
                    alt="Face image"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
              {session.face_analysis.observation && (
                <div>
                  <h4 className="font-medium mb-2">Observation</h4>
                  <p className="text-sm text-slate-600">{session.face_analysis.observation}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Audio Analysis */}
      {session.audio_analysis && (
        <Card className="p-4">
          <Collapsible open={openSections.audio} onOpenChange={() => toggleSection('audio')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Voice Analysis</h3>
              </div>
              {openSections.audio ? <ChevronDown /> : <ChevronRight />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {session.audio_analysis.audio_url && (
                <div>
                  <audio controls src={session.audio_analysis.audio_url} className="w-full" />
                </div>
              )}
              {session.audio_analysis.observation && (
                <div>
                  <h4 className="font-medium mb-2">Observation</h4>
                  <p className="text-sm text-slate-600">{session.audio_analysis.observation}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Pulse Data */}
      {session.pulse_data && (
        <Card className="p-4">
          <Collapsible open={openSections.pulse} onOpenChange={() => toggleSection('pulse')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold">Pulse Measurement</h3>
              </div>
              {openSections.pulse ? <ChevronDown /> : <ChevronRight />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-2">
              {session.pulse_data.bpm && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">BPM:</span>
                  <span className="text-lg font-semibold text-red-600">{session.pulse_data.bpm}</span>
                </div>
              )}
              {session.pulse_data.quality && (
                <div>
                  <span className="font-medium">Quality:</span> {session.pulse_data.quality}
                </div>
              )}
              {session.pulse_data.rhythm && (
                <div>
                  <span className="font-medium">Rhythm:</span> {session.pulse_data.rhythm}
                </div>
              )}
              {session.pulse_data.strength && (
                <div>
                  <span className="font-medium">Strength:</span> {session.pulse_data.strength}
                </div>
              )}
              {session.pulse_data.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-slate-600">{session.pulse_data.notes}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  )
}
```

#### 4.2 Update History Viewer Page

**File:** `sihat-tcm-web/src/app/patient/history/[id]/page.tsx`

Add the new component to display input data:

```typescript
import { DiagnosisInputDataViewer } from '@/components/patient/DiagnosisInputDataViewer'

// In the render section, add before or after the DiagnosisReport:
<DiagnosisInputDataViewer session={session} />
```

#### 4.3 Update Unified Dashboard

**File:** `sihat-tcm-web/src/components/patient/UnifiedDashboard.tsx`

Add a section in the history view to show input data summary in the table/card view.

---

### Phase 5: Guest User Support

#### 5.1 Create Guest Session Handler

**File:** `sihat-tcm-web/src/lib/guestSession.ts`

```typescript
export function generateGuestSessionToken(): string {
  return crypto.randomUUID();
}

export function saveGuestSessionToken(token: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("guest_session_token", token);
  }
}

export function getGuestSessionToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("guest_session_token");
  }
  return null;
}

export function clearGuestSessionToken() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("guest_session_token");
  }
}
```

#### 5.2 Create Signup Prompt Component

**File:** `sihat-tcm-web/src/components/patient/GuestSignupPrompt.tsx`

Display after guest completes diagnosis, prompting them to sign up to save their data permanently.

#### 5.3 Create Migration Function

**File:** `sihat-tcm-web/src/lib/actions.ts`

Add function to migrate guest sessions to authenticated user:

```typescript
export async function migrateGuestSessionToUser(
  sessionToken: string,
  userId: string
): Promise<ActionResult<DiagnosisSession>> {
  // Fetch guest session
  // Create new diagnosis_session with user_id
  // Mark guest session as migrated
  // Return new session
}
```

---

## Implementation Checklist

- [ ] Phase 1: Database Schema
  - [ ] Create migration file
  - [ ] Run migration
  - [ ] Test schema changes

- [ ] Phase 2: TypeScript Types
  - [ ] Update `DiagnosisSession` interface
  - [ ] Update `SaveDiagnosisInput` interface
  - [ ] Add supporting types

- [ ] Phase 3: Data Collection & Saving
  - [ ] Update `useDiagnosisWizard.ts` to collect all data
  - [ ] Update `saveDiagnosis` function
  - [ ] Test data saving

- [ ] Phase 4: Patient Portal UI
  - [ ] Create `DiagnosisInputDataViewer` component
  - [ ] Update history viewer page
  - [ ] Update unified dashboard
  - [ ] Test UI display

- [ ] Phase 5: Guest User Support
  - [ ] Create guest session handler
  - [ ] Create signup prompt component
  - [ ] Create migration function
  - [ ] Test guest flow

---

## Testing Plan

1. **Test Authenticated User Flow:**
   - Complete full diagnosis with all steps
   - Verify all data is saved
   - Check Patient Portal displays all data

2. **Test Guest User Flow:**
   - Complete diagnosis as guest
   - Verify guest session is created
   - Test signup prompt
   - Test migration after signup

3. **Test Data Display:**
   - Verify all sections render correctly
   - Test collapsible sections
   - Test image/audio display
   - Test missing data handling

---

## Security Considerations

1. **Guest Sessions:**
   - Use secure session tokens
   - Implement token expiration (optional)
   - Validate tokens server-side

2. **RLS Policies:**
   - Ensure guest sessions are properly isolated
   - Verify user can only access their own sessions

3. **Data Privacy:**
   - Don't expose guest emails in public queries
   - Encrypt sensitive health data if required

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database Schema)
3. Implement incrementally, testing after each phase
4. Deploy to staging for user testing
5. Gather feedback and iterate

---

## Questions to Consider

1. **Guest Session Retention:** How long should guest sessions be kept? (Recommendation: 30 days)
2. **Token Storage:** Should guest tokens be stored in localStorage (persistent) or sessionStorage (temporary)?
3. **Migration Prompt:** When should we prompt guests to sign up? (Immediately after diagnosis? After viewing report?)
4. **Data Export:** Should users be able to export their complete diagnosis data?

