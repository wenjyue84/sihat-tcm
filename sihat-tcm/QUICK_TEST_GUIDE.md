# Quick Testing Guide - Diagnosis Data Recording

## 🚀 Quick Start

### 1. Run Automated Tests (30 seconds)

```bash
cd sihat-tcm
npm run test:run -- src/lib/__tests__/diagnosis-schema.test.ts src/types/__tests__/database-types.test.ts src/lib/__tests__/diagnosis-data-collection.test.ts src/lib/__tests__/guest-session.test.ts src/components/patient/__tests__/DiagnosisInputDataViewer.test.tsx
```

**Expected:** ✅ 76 tests passed

---

### 2. Run Database Migration (2 minutes)

**Using Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20250102000001_add_diagnosis_input_data.sql`
3. Copy and paste into SQL Editor
4. Click **Run**

**Verify:**
```sql
-- Check new columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'diagnosis_sessions' 
AND column_name IN ('inquiry_summary', 'tongue_analysis', 'pulse_data');

-- Check guest table exists
SELECT * FROM guest_diagnosis_sessions LIMIT 1;
```

---

### 3. Manual Testing (5 minutes)

#### Test Authenticated User Flow:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Login** and complete a diagnosis:
   - Fill in basic info
   - Have a conversation (inquiry step)
   - Upload tongue image
   - Upload face image
   - Record audio
   - Enter pulse BPM
   - Submit diagnosis

3. **Check Patient Portal:**
   - Go to `/patient/dashboard`
   - ✅ History card shows badges (Inquiry, Tongue, Face, Voice, Pulse)
   - Click on the diagnosis
   - ✅ "Input Data" section appears
   - ✅ Expand each section to see:
     - Inquiry summary and chat history
     - Tongue image and analysis
     - Face image and analysis
     - Audio player
     - Pulse BPM and details

#### Test Guest User Flow:

1. **Logout** (or use incognito)
2. **Complete** a diagnosis without login
3. **Check browser:**
   - Open DevTools → Application → Session Storage
   - ✅ `guest_session_token` exists
4. **Check database:**
   ```sql
   SELECT * FROM guest_diagnosis_sessions 
   ORDER BY created_at DESC LIMIT 1;
   ```
   - ✅ Guest session is saved

---

## ✅ Verification Checklist

### Database ✅
- [ ] Migration runs successfully
- [ ] New columns exist in `diagnosis_sessions`
- [ ] `guest_diagnosis_sessions` table exists

### Data Collection ✅
- [ ] All input data is collected during diagnosis
- [ ] Data is saved to database (authenticated)
- [ ] Guest sessions are created (unauthenticated)
- [ ] Session tokens are stored

### Patient Portal ✅
- [ ] History cards show input data indicators
- [ ] Input data viewer displays all sections
- [ ] Images load correctly
- [ ] Audio player works
- [ ] Chat history displays
- [ ] Pulse data shows BPM

---

## 🐛 Common Issues

**Issue:** "Column does not exist"
- **Fix:** Run the migration SQL file

**Issue:** Input data not showing
- **Fix:** Check browser console for errors
- **Fix:** Verify data exists in database
- **Fix:** Make sure sections are expanded (click to open)

**Issue:** Guest session not saving
- **Fix:** Check RLS policies allow inserts
- **Fix:** Verify `guest_diagnosis_sessions` table exists

---

## 📊 Test Commands Summary

```bash
# Run all implementation tests
npm run test:run -- src/lib/__tests__/diagnosis-schema.test.ts src/types/__tests__/database-types.test.ts src/lib/__tests__/diagnosis-data-collection.test.ts src/lib/__tests__/guest-session.test.ts src/components/patient/__tests__/DiagnosisInputDataViewer.test.tsx

# Run Phase 1 tests only
npm run test:run -- src/lib/__tests__/diagnosis-schema.test.ts src/types/__tests__/database-types.test.ts

# Run Phase 2 tests only
npm run test:run -- src/lib/__tests__/diagnosis-data-collection.test.ts src/lib/__tests__/guest-session.test.ts

# Run Phase 3 tests only
npm run test:run -- src/components/patient/__tests__/DiagnosisInputDataViewer.test.tsx
```

---

## 🎯 Success Criteria

✅ All 76 automated tests pass  
✅ Database migration completes  
✅ Authenticated users can see all input data  
✅ Guest users can complete diagnosis  
✅ Patient Portal displays all data correctly  

**If all above pass, the implementation is working correctly!** 🎉

