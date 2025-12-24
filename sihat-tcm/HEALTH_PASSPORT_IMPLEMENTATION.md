# My Health Passport - Implementation Summary

## Overview
"My Health Passport" is a premium dashboard feature that allows logged-in patients to:
- **Auto-save** every diagnosis session
- **View** their complete TCM medical history
- **Track** health trends over time (vitality scores, diagnosis patterns)
- **Manage** personal notes for each session
- **Visualize** their wellness journey

## Architecture

### 1. Database Layer

#### New Table: `diagnosis_sessions`
Located: `supabase/migrations/20251224_diagnosis_sessions.sql`

**Schema:**
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- primary_diagnosis (text) - e.g., "Yin Deficiency"
- constitution (text) - TCM constitution type
- overall_score (int 0-100) - Derived vitality score
- full_report (jsonb) - Complete AI diagnosis report
- notes (text) - User's private observations
- created_at, updated_at (timestamptz)
```

**Security:**
- RLS enabled
- Users can only view/modify their own sessions
- Doctors can view all sessions (for clinical oversight)
- Automatic `updated_at` trigger

### 2. Server Actions Layer

Located: `src/lib/actions.ts`

**Functions:**
- `saveDiagnosis(reportData)` - Save new session
- `getPatientHistory(limit?, offset?)` - Fetch paginated history
- `getSessionById(sessionId)` - Get single session
- `updateSessionNotes(sessionId, notes)` - Update user notes
- `deleteSession(sessionId)` - Delete a session
- `getHealthTrends(days?)` - Calculate trend statistics

All actions:
- ✅ Authenticate user via Supabase auth
- ✅ Return success/error objects
- ✅ Respect RLS policies
- ✅ Provide meaningful error messages

### 3. Frontend Components

#### Dashboard (`/patient/dashboard`)
**Location:** `src/app/patient/dashboard/page.tsx`

**Features:**
- Trend widget showing vitality stats
- Grid of history cards (with glassmorphism)
- Empty state for new users
- Loading states
- Redirect to login if not authenticated

**Components Used:**
- `TrendWidget` - Health statistics visualization
- `HistoryCard` - Individual session card

#### History Viewer (`/patient/history/[id]`)
**Location:** `src/app/patient/history/[id]/page.tsx`

**Features:**
- Full read-only diagnosis report
- Editable personal notes section
- Delete session with confirmation modal
- Score badge and date display
- Back to dashboard navigation

#### UI Components

**`HistoryCard`** (`src/components/patient/HistoryCard.tsx`)
- Displays diagnosis summary
- Shows vitality score with color coding
- Emoji icons for diagnosis types
- Hover effects and animations
- Preview of user notes

**`TrendWidget`** (`src/components/patient/TrendWidget.tsx`)
- Total sessions count
- Average vitality score
- Progress indicator (improvement over time)
- Most common diagnosis pattern
- Glassmorphism design

**`SaveToDashboardBanner`** (`src/components/patient/SaveToDashboardBanner.tsx`)
- Guest users: CTA to sign in and save
- Logged-in users: Success message + dashboard link
- Dismissible
- Animated entrance/exit

### 4. Integration Points

#### Automatic Saving
**Location:** `src/hooks/useDiagnosisWizard.ts` (lines 266-310)

When a diagnosis completes:
1. Save to legacy `inquiries` table (backward compatibility)
2. Save to new `diagnosis_sessions` table via `saveDiagnosis()` action
3. Calculate `overall_score` using heuristic algorithm
4. Extract `primary_diagnosis` and `constitution` from AI response
5. Store complete report as `full_report` JSONB

**Score Calculation:**
- Base score: 70
- Adjusted by severity keywords
- Reduced by number of affected organs
- Increased by balanced constitution
- Clamped to 0-100 range

#### Report Display
**Location:** `src/components/diagnosis/DiagnosisReport.tsx`

Added `SaveToDashboardBanner` component that:
- Shows sign-in CTA for guests (with blurred trend preview concept)
- Shows "Saved!" confirmation for logged-in users
- Provides direct link to dashboard

## User Flow

### Guest User Flow
1. Complete diagnosis wizard
2. See blurred "Health Trend" preview banner
3. Click "Sign In to Save This Report"
4. After login → auto-redirected to dashboard
5. Report appears in history

### Logged-In User Flow
1. Complete diagnosis wizard
2. Report auto-saves in background
3. See "Report Saved!" banner with dashboard link
4. Click "View Dashboard" → see all sessions
5. Click any session → view full report + add notes
6. Track progress over time via trend widget

## Design Patterns

### Glassmorphism Theme
- Semi-transparent cards with backdrop blur
- Gradient overlays (emerald → teal → cyan)
- Subtle shadows and borders
- Smooth hover transitions

### Animations
- Framer Motion for entrance/exit
- Staggered card animations (index * 0.05 delay)
- Smooth page transitions
- Loading spinners with backdrop blur

### Accessibility
- Semantic HTML
- Color-coded scores with text labels
- Keyboard navigation support
- ARIA labels where needed

## Testing Checklist

### Database
- ✅ RLS policies prevent cross-user access
- ✅ Doctors can view all sessions
- ✅ Cascade delete when user deleted
- ✅ Timestamps auto-update

### API Actions
- ✅ Authenticated user required
- ✅ Error handling for missing sessions
- ✅ Pagination works correctly
- ✅ Notes update persists

### Frontend
- ✅ Redirect to login if not authenticated
- ✅ Loading states display correctly
- ✅ Empty state shows for new users
- ✅ Trend calculations accurate
- ✅ Delete confirmation modal prevents accidents
- ✅ Banner dismissible and doesn't re-appear

### Auto-Save
- ✅ Saves on diagnosis completion
- ✅ Works for all doctor tiers
- ✅ Score calculation reasonable
- ✅ Full report data preserved
- ✅ Doesn't break for guests (fails gracefully)

## Future Enhancements

### Phase 2 Ideas
1. **Advanced Visualizations:**
   - Line chart of vitality scores over time
   - Diagnosis pattern distribution pie chart
   - Body heat map for affected organs

2. **Comparison Mode:**
   - Side-by-side report comparison
   - Highlight what changed between sessions

3. **Export Options:**
   - Export full history as PDF
   - Share reports with doctors via secure link

4. **Notifications:**
   - Email reminder for follow-up diagnosis
   - Weekly health summary

5. **Goals & Milestones:**
   - Set wellness goals
   - Track milestones (e.g., "3 consecutive improved scores")

6. **AI Insights:**
   - "Your Qi Deficiency is improving by 15% since last month"
   - Personalized recovery tips based on trends

## Migration Guide

### For Existing Users
The system maintains backward compatibility:
- Old `inquiries` table still saves data
- New users automatically use both tables
- Gradual migration can be scripted later

### Running the Migration
```bash
# Apply the migration
psql $DATABASE_URL < supabase/migrations/20251224_diagnosis_sessions.sql

# Or via Supabase CLI
supabase db push
```

## Security Considerations

1. **Row Level Security (RLS):**
   - Prevents unauthorized access at DB level
   - No API endpoint can bypass RLS

2. **Personal Health Information (PHI):**
   - Full reports stored as JSONB (encrypted at rest by Supabase)
   - Notes contain user-added observations (also encrypted)
   - No PII in logs or error messages

3. **Authentication:**
   - Server actions verify user via `supabase.auth.getUser()`
   - Client-side checks for UX only
   - All data operations server-side validated

## Performance Considerations

- **Pagination:** Default 50 sessions per load
- **Indexes:** Added on `user_id`, `created_at`, `primary_diagnosis`
- **JSONB Queries:** Full report stored efficiently
- **Caching:** Trend data could be cached (future enhancement)

## Troubleshooting

### "Session not found" error
- Check RLS policies applied correctly
- Verify user is authenticated
- Ensure session ID is valid UUID

### Auto-save not working
- Check console for errors in `useDiagnosisWizard.ts`
- Verify `saveDiagnosis` import successful
- Check user is logged in during diagnosis

### Trend widget shows no data
- Ensure at least 1 session exists
- Check `overall_score` is not null
- Verify date range includes sessions

## Related Files

**Database:**
- `supabase/migrations/20251224_diagnosis_sessions.sql`

**Backend:**
- `src/lib/actions.ts`

**Frontend Pages:**
- `src/app/patient/dashboard/page.tsx`
- `src/app/patient/history/[id]/page.tsx`

**Components:**
- `src/components/patient/HistoryCard.tsx`
- `src/components/patient/TrendWidget.tsx`
- `src/components/patient/SaveToDashboardBanner.tsx`

**Integration:**
- `src/hooks/useDiagnosisWizard.ts` (auto-save logic)
- `src/components/diagnosis/DiagnosisReport.tsx` (banner)

## Credits
Implemented following the project spec: "My Health Passport (Patient History)"
- Claude 3.5 Sonnet (AI Assistant)
- Sihat TCM Development Team
- Date: December 24, 2024

