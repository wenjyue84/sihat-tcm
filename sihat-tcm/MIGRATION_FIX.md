# Fix: Missing guest_diagnosis_sessions Table

## 🚨 Error
```
Could not find the table 'public.guest_diagnosis_sessions' in the schema cache
```

## ✅ Solution: Run the Migration

You need to run the database migration to create the `guest_diagnosis_sessions` table and add new columns to `diagnosis_sessions`.

---

## 🚀 Quick Fix (Choose One Method)

### Method 1: Supabase Dashboard (Easiest - Recommended)

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Migration**
   - Open the file: `sihat-tcm/supabase/migrations/20250102000001_add_diagnosis_input_data.sql`
   - Copy **ALL** the contents (Ctrl+A, Ctrl+C)
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - No errors should appear

---

### Method 2: PowerShell Script (Windows)

```powershell
cd "C:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm"
.\run-guest-sessions-migration.ps1
```

Follow the prompts to enter your Supabase project reference and database password.

---

### Method 3: Supabase CLI

```bash
cd sihat-tcm

# If you haven't linked your project yet:
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
npx supabase db push
```

---

## ✅ Verify Migration Success

Run this query in Supabase SQL Editor:

```sql
-- Check if guest_diagnosis_sessions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'guest_diagnosis_sessions'
);

-- Check if new columns exist in diagnosis_sessions
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'diagnosis_sessions' 
AND column_name IN (
  'inquiry_summary', 
  'tongue_analysis', 
  'pulse_data', 
  'is_guest_session'
);
```

**Expected Results:**
- First query should return `true`
- Second query should return 4 rows (one for each column)

---

## 🔄 After Running Migration

1. **Restart your dev server** (if running):
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Test again:**
   - Complete a diagnosis (as guest or authenticated user)
   - The error should be gone
   - Data should save successfully

---

## 📝 What the Migration Does

The migration file (`20250102000001_add_diagnosis_input_data.sql`) will:

1. ✅ Add 12 new columns to `diagnosis_sessions` table
2. ✅ Create `guest_diagnosis_sessions` table
3. ✅ Create indexes for performance
4. ✅ Set up RLS policies
5. ✅ Add triggers for `updated_at`

**This is safe to run multiple times** - it uses `IF NOT EXISTS` clauses.

---

## ❓ Still Having Issues?

If the migration fails:

1. **Check for existing columns:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'diagnosis_sessions';
   ```
   - If some columns already exist, that's okay - the migration uses `IF NOT EXISTS`

2. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for any error messages

3. **Try running parts separately:**
   - The migration is split into parts
   - You can run each part individually if needed

---

## 🎯 Quick Command Reference

```bash
# Check if table exists (should return true after migration)
# Run in Supabase SQL Editor:
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'guest_diagnosis_sessions'
);
```

