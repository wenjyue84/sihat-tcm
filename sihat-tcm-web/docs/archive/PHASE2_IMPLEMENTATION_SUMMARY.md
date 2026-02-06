# Phase 2: Data Collection & Saving - Implementation Summary

## ✅ Completed

### 1. Updated `saveDiagnosis` Function

**File:** `src/lib/actions.ts`

**Changes:**

- ✅ Updated to save all input data fields (inquiry, tongue, face, body, audio, pulse)
- ✅ Added guest session support (saves to `guest_diagnosis_sessions` table)
- ✅ Generates session tokens for guest users
- ✅ Handles both authenticated and guest users seamlessly

**Key Features:**

- Automatically detects guest sessions (no authenticated user)
- Creates guest sessions in separate table with session tokens
- Preserves all input data for both user types

### 2. Updated `useDiagnosisWizard` Hook

**File:** `src/hooks/useDiagnosisWizard.ts`

**Changes:**

- ✅ Collects all input data from diagnosis wizard steps
- ✅ Maps inquiry data (summary, chat history, files)
- ✅ Maps visual analysis data (tongue, face, body)
- ✅ Maps audio analysis data
- ✅ Maps pulse data
- ✅ Handles guest session token generation and storage
- ✅ Passes all collected data to `saveDiagnosis`

**Data Collected:**

- Inquiry summary and chat history
- Uploaded report and medicine files (with metadata)
- Tongue analysis (image, observation, TCM indicators, etc.)
- Face analysis (image, observation, TCM indicators)
- Body analysis (image, observation)
- Audio analysis (audio file, observation, potential issues)
- Pulse data (BPM, quality, rhythm, strength, notes)

### 3. Guest Session Management

**File:** `src/lib/guestSession.ts` (NEW)

**Functions:**

- ✅ `generateGuestSessionToken()` - Creates unique UUID tokens
- ✅ `saveGuestSessionToken(token)` - Saves to sessionStorage
- ✅ `getGuestSessionToken()` - Retrieves from sessionStorage
- ✅ `clearGuestSessionToken()` - Removes from sessionStorage
- ✅ `hasGuestSessionToken()` - Checks if token exists

### 4. Guest Session Migration

**File:** `src/lib/actions.ts`

**New Function:**

- ✅ `migrateGuestSessionToUser(sessionToken, userId)` - Migrates guest sessions to authenticated user accounts

**Features:**

- Fetches guest session by token
- Creates new diagnosis session for user
- Marks guest session as migrated
- Preserves all input data during migration

### 5. Tests

**Files:**

- `src/lib/__tests__/diagnosis-data-collection.test.ts` (13 tests)
- `src/lib/__tests__/guest-session.test.ts` (17 tests)

**Test Results:**

```
✓ src/lib/__tests__/diagnosis-data-collection.test.ts (13 tests) 7ms
✓ src/lib/__tests__/guest-session.test.ts (17 tests) 7ms

Test Files  2 passed (2)
     Tests  30 passed (30)
```

**Test Coverage:**

- ✅ Input data structure validation
- ✅ Data collection logic (mapping from wizard data)
- ✅ File metadata mapping
- ✅ Guest session identification
- ✅ Guest session token management
- ✅ Token generation and storage
- ✅ Data completeness checks

## 📋 Data Flow

### Authenticated User Flow:

1. User completes diagnosis wizard
2. `useDiagnosisWizard` collects all input data
3. `saveDiagnosis` saves to `diagnosis_sessions` table
4. All input data fields are stored in database

### Guest User Flow:

1. Guest completes diagnosis wizard (no login)
2. `useDiagnosisWizard` collects all input data
3. Generates guest session token
4. `saveDiagnosis` saves to `guest_diagnosis_sessions` table
5. Token saved to sessionStorage for later access
6. Guest can sign up later and migrate session

## 🔍 Files Changed

### New Files

- `src/lib/guestSession.ts` - Guest session utilities
- `src/lib/__tests__/diagnosis-data-collection.test.ts` - Data collection tests
- `src/lib/__tests__/guest-session.test.ts` - Guest session tests
- `PHASE2_IMPLEMENTATION_SUMMARY.md` (this file)

### Modified Files

- `src/lib/actions.ts` - Updated `saveDiagnosis` and added `migrateGuestSessionToUser`
- `src/hooks/useDiagnosisWizard.ts` - Updated to collect and save all input data

## 📊 Input Data Mapping

### From Wizard Data → Database Fields

| Wizard Data                             | Database Field           | Type  |
| --------------------------------------- | ------------------------ | ----- |
| `wen_inquiry.inquiryText`               | `inquiry_summary`        | text  |
| `wen_inquiry.chatHistory` or `wen_chat` | `inquiry_chat_history`   | jsonb |
| `wen_inquiry.reportFiles`               | `inquiry_report_files`   | jsonb |
| `wen_inquiry.medicineFiles`             | `inquiry_medicine_files` | jsonb |
| `wang_tongue.*`                         | `tongue_analysis`        | jsonb |
| `wang_face.*`                           | `face_analysis`          | jsonb |
| `wang_part.*`                           | `body_analysis`          | jsonb |
| `wen_audio.*`                           | `audio_analysis`         | jsonb |
| `qie.*`                                 | `pulse_data`             | jsonb |

## ✅ Checklist

- [x] Updated `saveDiagnosis` to handle all input data fields
- [x] Updated `saveDiagnosis` to support guest sessions
- [x] Updated `useDiagnosisWizard` to collect all input data
- [x] Added guest session token management
- [x] Added guest session migration function
- [x] Wrote comprehensive tests
- [x] All tests passing

## 🚀 Ready for Review

Phase 2 is complete and all tests pass. The system now:

- ✅ Collects all diagnosis input data
- ✅ Saves all data to database (authenticated users)
- ✅ Supports guest sessions with token management
- ✅ Provides migration path for guest sessions

**Next:** Phase 3 - Update Patient Portal UI to display all input data.
