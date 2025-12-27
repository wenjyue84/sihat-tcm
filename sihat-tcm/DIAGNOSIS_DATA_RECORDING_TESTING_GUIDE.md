# Diagnosis Data Recording - Testing Guide

This guide walks you through testing all three phases of the diagnosis data recording implementation.

## ✅ Quick Test Results

**All Implementation Tests Pass:**

```
✓ Phase 1: Schema tests (35 tests)
✓ Phase 2: Data collection tests (30 tests)
✓ Phase 3: UI component tests (11 tests)

Total: 76 tests passed ✅
```

## 📋 Prerequisites

1. **Database Migration**: Run Phase 1 migration first
2. **Development Server**: Start the Next.js dev server
3. **Test Account**: Have a test user account ready (or create one)

---

## 🗄️ Step 1: Database Setup

### 1.1 Run the Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/20250102000001_add_diagnosis_input_data.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

**Option B: Using Supabase CLI**

```bash
cd sihat-tcm
npx supabase db push
```

**Expected Result:**

- ✅ "Success. No rows returned" message
- ✅ No errors

### 1.2 Verify Schema Changes

Run these queries in Supabase SQL Editor:

```sql
-- Check new columns in diagnosis_sessions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'diagnosis_sessions'
AND column_name IN (
  'inquiry_summary', 'inquiry_chat_history', 'tongue_analysis',
  'face_analysis', 'audio_analysis', 'pulse_data', 'is_guest_session'
);

-- Check guest_diagnosis_sessions table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'guest_diagnosis_sessions';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('diagnosis_sessions', 'guest_diagnosis_sessions')
AND indexname LIKE '%diagnosis%' OR indexname LIKE '%guest%';
```

**Expected Result:**

- ✅ All new columns appear
- ✅ `guest_diagnosis_sessions` table exists
- ✅ Indexes are created

---

## 🧪 Step 2: Run Automated Tests

### 2.1 Run All Phase Tests

```bash
cd sihat-tcm
npm run test
```

**Or run specific phase tests:**

```bash
# Phase 1: Schema tests
npm run test -- src/lib/__tests__/diagnosis-schema.test.ts src/types/__tests__/database-types.test.ts

# Phase 2: Data collection tests
npm run test -- src/lib/__tests__/diagnosis-data-collection.test.ts src/lib/__tests__/guest-session.test.ts

# Phase 3: UI component tests
npm run test -- src/components/patient/__tests__/DiagnosisInputDataViewer.test.tsx
```

**Expected Result:**

```
✓ All test files pass
✓ All tests pass (76 total tests across all phases)
```

---

## 🧑‍💻 Step 3: Manual Testing - Authenticated User Flow

### 3.1 Start Development Server

```bash
cd sihat-tcm
npm run dev
```

The app should be available at `http://localhost:3100`

### 3.2 Complete a Full Diagnosis

1. **Login** as a test user
2. **Navigate** to the diagnosis wizard (home page)
3. **Complete all steps** with real data:
   - Basic Info: Enter name, age, gender, symptoms
   - Inquiry: Have a conversation with AI, upload medical reports/medicine files
   - Tongue Analysis: Upload a tongue image
   - Face Analysis: Upload a face image
   - Body Analysis: Upload a body part image (optional)
   - Audio: Record voice
   - Pulse: Enter BPM and pulse details
4. **Submit** the diagnosis

### 3.3 Verify Data is Saved

**Check Database:**

```sql
-- Get the latest diagnosis session
SELECT
  id,
  primary_diagnosis,
  inquiry_summary,
  inquiry_chat_history,
  tongue_analysis,
  face_analysis,
  audio_analysis,
  pulse_data,
  created_at
FROM diagnosis_sessions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**

- ✅ All input data fields are populated
- ✅ `inquiry_summary` contains text
- ✅ `inquiry_chat_history` is a JSON array
- ✅ `tongue_analysis` contains image URL and observation
- ✅ `pulse_data` contains BPM and other details

### 3.4 Verify Patient Portal Display

1. **Navigate** to `/patient/dashboard`
2. **Check History Card**:
   - ✅ Should show badges for available input data (Inquiry, Tongue, Face, Voice, Pulse)
3. **Click** on a diagnosis session
4. **Verify Input Data Section**:
   - ✅ "Input Data" heading appears
   - ✅ All relevant sections are visible (Inquiry, Tongue, Face, etc.)
   - ✅ Click each section to expand
   - ✅ Verify content displays correctly:
     - Inquiry summary text
     - Chat history messages
     - Images load correctly
     - Audio player works
     - Pulse data shows BPM and details

---

## 👤 Step 4: Manual Testing - Guest User Flow

### 4.1 Complete Diagnosis as Guest

1. **Logout** (or use incognito/private window)
2. **Complete** a diagnosis without logging in
3. **Submit** the diagnosis

### 4.2 Verify Guest Session is Created

**Check Database:**

```sql
-- Get latest guest session
SELECT
  id,
  session_token,
  guest_email,
  guest_name,
  primary_diagnosis,
  inquiry_summary,
  tongue_analysis,
  created_at
FROM guest_diagnosis_sessions
ORDER BY created_at DESC
LIMIT 1;
```

**Check Browser:**

- Open Developer Tools → Application → Session Storage
- ✅ Should see `guest_session_token` key with a UUID value

**Expected Result:**

- ✅ Guest session saved to `guest_diagnosis_sessions` table
- ✅ Session token stored in sessionStorage
- ✅ All input data is saved

### 4.3 Test Guest Session Migration (Optional)

1. **Sign up** or **login** with the email used during guest diagnosis
2. **Check** if guest session migration prompt appears
3. **Verify** guest session is migrated to authenticated account

---

## 🔍 Step 5: Detailed Testing Checklist

### Phase 1: Database Schema ✅

- [ ] Migration runs without errors
- [ ] All new columns exist in `diagnosis_sessions`
- [ ] `guest_diagnosis_sessions` table exists
- [ ] Indexes are created
- [ ] RLS policies work correctly
- [ ] Triggers function properly

### Phase 2: Data Collection & Saving ✅

- [ ] Authenticated user: All input data is collected
- [ ] Authenticated user: Data is saved to `diagnosis_sessions`
- [ ] Guest user: All input data is collected
- [ ] Guest user: Data is saved to `guest_diagnosis_sessions`
- [ ] Guest session token is generated
- [ ] Guest session token is stored in sessionStorage
- [ ] All data types are saved correctly:
  - [ ] Inquiry summary
  - [ ] Chat history
  - [ ] Report files
  - [ ] Medicine files
  - [ ] Tongue analysis
  - [ ] Face analysis
  - [ ] Body analysis
  - [ ] Audio analysis
  - [ ] Pulse data

### Phase 3: Patient Portal UI ✅

- [ ] History card shows input data indicators
- [ ] Input data viewer component renders
- [ ] All sections are collapsible
- [ ] Inquiry section displays:
  - [ ] Summary text
  - [ ] Chat history
  - [ ] Report files with links
  - [ ] Medicine files with links
- [ ] Tongue section displays:
  - [ ] Image
  - [ ] Observation
  - [ ] TCM indicators
  - [ ] Pattern suggestions
- [ ] Face section displays:
  - [ ] Image
  - [ ] Observation
  - [ ] TCM indicators
- [ ] Audio section displays:
  - [ ] Audio player
  - [ ] Observation
- [ ] Pulse section displays:
  - [ ] BPM (highlighted)
  - [ ] Quality, rhythm, strength
  - [ ] Notes
- [ ] Images load correctly
- [ ] Audio player works
- [ ] File links work

---

## 🐛 Troubleshooting

### Issue: Migration fails

**Solution:**

- Check if columns already exist (use `IF NOT EXISTS` in migration)
- Verify database connection
- Check Supabase logs for errors

### Issue: Data not saving

**Check:**

1. Browser console for errors
2. Network tab for failed API calls
3. Supabase logs for database errors
4. Verify user is authenticated (for authenticated flow)

### Issue: Input data not displaying

**Check:**

1. Verify data exists in database
2. Check browser console for errors
3. Verify component is receiving session data
4. Check if sections are collapsed (click to expand)

### Issue: Guest session not created

**Check:**

1. Verify `guest_diagnosis_sessions` table exists
2. Check RLS policies allow inserts
3. Verify session token generation works
4. Check browser sessionStorage

---

## 📊 Test Data Examples

### Sample Diagnosis Session Data

```json
{
  "inquiry_summary": "Patient reported persistent headaches for 2 weeks, fatigue, and difficulty sleeping",
  "inquiry_chat_history": [
    {
      "role": "user",
      "content": "I have been having headaches",
      "timestamp": "2025-01-02T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "How long have you been experiencing this?",
      "timestamp": "2025-01-02T10:00:05Z"
    }
  ],
  "tongue_analysis": {
    "image_url": "https://example.com/tongue.jpg",
    "observation": "Tongue appears pale with thin white coating",
    "tcm_indicators": ["Qi Deficiency", "Blood Deficiency"],
    "pattern_suggestions": ["Spleen Qi Deficiency"]
  },
  "pulse_data": {
    "bpm": 72,
    "quality": "smooth",
    "rhythm": "regular",
    "strength": "moderate"
  }
}
```

---

## ✅ Success Criteria

All tests pass when:

1. ✅ Database migration completes successfully
2. ✅ All automated tests pass (76 tests)
3. ✅ Authenticated user can complete diagnosis and see all input data
4. ✅ Guest user can complete diagnosis and receive session token
5. ✅ Patient Portal displays all input data correctly
6. ✅ History cards show input data indicators
7. ✅ All sections are functional and display correctly

---

## 🚀 Quick Test Command

Run all tests at once:

```bash
cd sihat-tcm
npm run test:run
```

This will run all tests and exit (useful for CI/CD).

---

## 📝 Notes

- **Guest Sessions**: Guest sessions are stored in `sessionStorage`, so they persist only for the browser session
- **Data Migration**: Guest sessions can be migrated to authenticated accounts when user signs up
- **Performance**: Large chat histories or many files may affect load time - consider pagination for future improvements
