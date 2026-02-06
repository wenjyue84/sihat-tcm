# Session Recovery

> **Last updated:** 2026-02-06 (Initial creation)
> **Status:** Active
> **Tags:** #diagnosis #session-recovery #drafts

## What This Is

Session recovery system for `DiagnosisWizard` using Supabase drafts. Allows users to resume incomplete diagnosis sessions from where they left off.

## Common Mistakes & Fixes

### 1. Draft Not Showing Up

**Problem:**
- User expects to see pending session but modal doesn't appear
- Session data exists in database but not retrieved

**Root Cause:**
- Draft query filtering by wrong user ID
- Missing `pending` status filter
- Draft expired (TTL exceeded)

**Fix:**
```typescript
// Ensure correct user ID and status filtering
const { data: drafts } = await supabase
  .from("diagnosis_drafts")
  .select("*")
  .eq("user_id", currentUser.id)
  .eq("status", "pending")
  .gte("expires_at", new Date().toISOString())
  .order("updated_at", { ascending: false });
```

**Prevention:**
- Test session recovery with multiple users
- Verify TTL configuration (default: 7 days)
- Add logging for draft retrieval

---

### 2. Incomplete State on Resume

**Problem:**
- Resumed session missing data from certain steps
- Wizard state incomplete after recovery

**Root Cause:**
- Draft not saving all wizard state
- Partial state update instead of full snapshot
- Missing fields in `wizardData` schema

**Fix:**
```typescript
// Save complete wizard state
const draftData = {
  session_id: sessionId,
  user_id: userId,
  wizard_data: {
    basicInfo,
    inquiryData,
    visualAnalysis,
    audioAnalysis,
    pulseData,
    smartConnectData,
    currentStep,
    isComplete
  },
  completion_percentage: calculateCompletion(wizardData),
  status: "pending"
};

await saveDraft(draftData);
```

**Prevention:**
- Validate draft data structure before save
- Test recovery at each wizard step
- Add schema validation for `wizard_data` field

---

### 3. Stale Drafts Not Cleaned Up

**Problem:**
- Old drafts accumulate in database
- User sees irrelevant sessions in recovery modal

**Root Cause:**
- No automatic cleanup of expired drafts
- TTL not enforced at query time

**Fix:**
- Add `expires_at` filter in queries (see Fix #1)
- Implement periodic cleanup job (cron or database trigger)

```sql
-- Database cleanup trigger (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM diagnosis_drafts
  WHERE expires_at < NOW()
  AND status = 'pending';
END;
$$ LANGUAGE plpgsql;
```

**Prevention:**
- Set reasonable TTL (7 days recommended)
- Add database index on `expires_at`
- Monitor draft table size

---

## Decisions Made

| Date | Decision | Rationale | PR |
|------|----------|-----------|-----|
| 2026-01-18 | 7-day TTL for drafts | Balance between convenience and data hygiene | #85 |
| 2026-01-22 | Auto-save every 30 seconds | Prevent data loss without excessive DB writes | #88 |
| 2026-02-01 | Show completion % in modal | Help user decide which session to resume | #97 |

## Related Files

- `sihat-tcm-web/src/components/diagnosis/SessionRecoveryModal.tsx` - Recovery UI
- `sihat-tcm-web/src/lib/supabase/drafts.ts` - Draft CRUD operations
- `sihat-tcm-web/src/types/diagnosis.ts` - `PendingResumeState` type

## Related Notes

- [IoT Connection Wizard](./iot-connection-wizard.md) - IoT data in drafts
- [4-Examination Flow](./4-examination-flow.md) - Wizard state management
- [Error Handling](../patterns/error-handling.md) - Draft save error handling

## Draft Schema

```typescript
interface DiagnosisDraft {
  id: string;
  session_id: string;
  user_id: string;
  wizard_data: Partial<DiagnosisWizardData>;
  completion_percentage: number;
  status: "pending" | "completed" | "abandoned";
  expires_at: string; // ISO timestamp
  created_at: string;
  updated_at: string;
}
```

## Testing Checklist

- [ ] Draft saves on each step completion
- [ ] Draft saves every 30 seconds during active editing
- [ ] Recovery modal shows only valid (non-expired) drafts
- [ ] Resumed state matches saved state exactly
- [ ] Delete draft removes from database
- [ ] Expired drafts don't appear in modal
- [ ] Multiple drafts handled correctly (show most recent first)

## Auto-Save Logic

```typescript
useEffect(() => {
  // Auto-save every 30 seconds if wizard data changed
  const interval = setInterval(() => {
    if (hasUnsavedChanges) {
      saveDraft(wizardData);
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [wizardData, hasUnsavedChanges]);

// Also save on step completion
const handleStepComplete = async () => {
  await saveDraft(wizardData);
  goToNextStep();
};
```

## Update History

| Date | PR | Change | Author |
|------|----|--------|--------|
| 2026-02-06 | N/A | Initial creation | Claude |
