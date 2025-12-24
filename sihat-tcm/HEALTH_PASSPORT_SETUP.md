# Health Passport - Quick Setup Guide

## 🚀 Getting Started

### Step 1: Run Database Migration

You need to create the new `diagnosis_sessions` table in your Supabase database.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251224_diagnosis_sessions.sql`
4. Paste and run the SQL
5. Verify the table appears in **Table Editor**

**Option B: Using Supabase CLI**
```bash
cd sihat-tcm
supabase db push
```

**Option C: Using psql**
```bash
psql $DATABASE_URL < supabase/migrations/20251224_diagnosis_sessions.sql
```

### Step 2: Verify Installation

1. **Check the table exists:**
   ```sql
   SELECT * FROM diagnosis_sessions LIMIT 1;
   ```

2. **Verify RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'diagnosis_sessions';
   -- rowsecurity should be 't' (true)
   ```

3. **Test the policies:**
   - Log in as a test patient
   - Complete a diagnosis
   - Check if data appears in the table:
   ```sql
   SELECT id, primary_diagnosis, overall_score, created_at 
   FROM diagnosis_sessions 
   WHERE user_id = 'YOUR_TEST_USER_ID';
   ```

### Step 3: Test the Feature

#### For Developers:
1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Test as a guest:**
   - Complete a diagnosis without logging in
   - You should see the "Sign In to Save" banner
   - Sign in and verify redirect works

3. **Test as a logged-in user:**
   - Log in first
   - Complete a diagnosis
   - Verify "Report Saved!" banner appears
   - Click "View Dashboard"
   - Verify session appears in dashboard

4. **Test the dashboard:**
   - Navigate to `/patient/dashboard`
   - Check trend widget displays correctly
   - Click on a history card
   - Verify full report loads
   - Add/edit notes
   - Test delete functionality

### Step 4: Configure (Optional)

#### Adjust Score Calculation
Edit `src/hooks/useDiagnosisWizard.ts` function `calculateOverallScore()` to tune the scoring algorithm:

```typescript
// Current defaults:
// - Base score: 70
// - Severe conditions: -15
// - Mild conditions: +10
// - Per affected organ: -5 (max -20)
// - Balanced constitution: +15
// - Deficient constitution: -10
```

#### Customize Trend Period
In `src/app/patient/dashboard/page.tsx`:
```typescript
// Change from 30 days to 60 days:
getHealthTrends(60)  // Currently: 30
```

#### Pagination Size
In `src/app/patient/dashboard/page.tsx`:
```typescript
// Change from 50 to 100 sessions:
getPatientHistory(100, 0)  // Currently: 50
```

## 🧪 Testing Checklist

### Database Tests
- [ ] Table created successfully
- [ ] RLS policies active
- [ ] Users can only see own sessions
- [ ] Doctors can see all sessions
- [ ] Triggers work (updated_at auto-updates)

### Backend Tests
- [ ] `saveDiagnosis()` saves correctly
- [ ] `getPatientHistory()` returns user's sessions only
- [ ] `getSessionById()` respects RLS
- [ ] `updateSessionNotes()` persists changes
- [ ] `deleteSession()` removes record
- [ ] `getHealthTrends()` calculates correctly

### Frontend Tests
- [ ] Dashboard redirects if not logged in
- [ ] Empty state shows for new users
- [ ] History cards display correctly
- [ ] Trend widget shows accurate stats
- [ ] Clicking card navigates to detail page
- [ ] Notes editing works
- [ ] Delete confirmation prevents accidents
- [ ] Banner appears for guests
- [ ] Banner shows success for logged-in users

### Integration Tests
- [ ] Diagnosis auto-saves after completion
- [ ] Score calculation reasonable (0-100)
- [ ] Full report data preserved
- [ ] Both old and new tables updated
- [ ] Guest flow works (banner, no save)
- [ ] Logged-in flow works (banner, saves)

## 🐛 Common Issues

### Issue: "Table does not exist"
**Solution:** Run the migration SQL script in your database.

### Issue: "Permission denied for table diagnosis_sessions"
**Solution:** Check that RLS is enabled and policies are created. Re-run the migration.

### Issue: "Cannot read properties of null (reading 'id')"
**Solution:** User not authenticated. Check `useAuth()` hook is working.

### Issue: Sessions not appearing in dashboard
**Solution:**
1. Check browser console for errors
2. Verify session saved: `SELECT * FROM diagnosis_sessions WHERE user_id = 'USER_ID'`
3. Check RLS policies allow SELECT

### Issue: "saveDiagnosis is not a function"
**Solution:** Ensure `src/lib/actions.ts` has `'use server'` at the top and exports are correct.

### Issue: Score always showing 70
**Solution:** The `calculateOverallScore()` function might not be parsing diagnosis data correctly. Check the AI response structure.

## 📊 Monitoring

### Check Usage
```sql
-- Total sessions
SELECT COUNT(*) FROM diagnosis_sessions;

-- Sessions per user
SELECT user_id, COUNT(*) as session_count
FROM diagnosis_sessions
GROUP BY user_id
ORDER BY session_count DESC;

-- Average scores
SELECT AVG(overall_score) as avg_score,
       MIN(overall_score) as min_score,
       MAX(overall_score) as max_score
FROM diagnosis_sessions
WHERE overall_score IS NOT NULL;

-- Most common diagnoses
SELECT primary_diagnosis, COUNT(*) as count
FROM diagnosis_sessions
GROUP BY primary_diagnosis
ORDER BY count DESC
LIMIT 10;
```

### Performance Check
```sql
-- Ensure indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'diagnosis_sessions';
```

## 🚢 Deployment

### Pre-Deployment Checklist
- [ ] Migration file committed to repo
- [ ] Environment variables set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Build passes: `npm run build`
- [ ] No console errors in production build
- [ ] RLS policies tested in production DB (staging first!)

### Post-Deployment Verification
1. Test guest user flow on production
2. Test logged-in user flow on production
3. Verify data saving correctly
4. Check dashboard loads
5. Monitor error logs for issues

## 📚 Next Steps

1. **Read the full documentation:** `HEALTH_PASSPORT_IMPLEMENTATION.md`
2. **Customize the UI:** Tweak colors, animations, or card designs
3. **Add analytics:** Track dashboard visits, most viewed sessions
4. **Extend features:** See "Phase 2 Ideas" in the implementation doc

## 🆘 Need Help?

- Check the implementation doc: `HEALTH_PASSPORT_IMPLEMENTATION.md`
- Review the code comments in `src/lib/actions.ts`
- Inspect browser console for client errors
- Check Supabase logs for server errors
- Verify RLS policies in Supabase dashboard

---

**Happy coding!** 🎉

