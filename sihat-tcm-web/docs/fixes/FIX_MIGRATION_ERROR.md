# 🔧 Fix: "Could not find table 'guest_diagnosis_sessions'" Error

## Problem

The error occurs because the database migration hasn't been run yet. The `guest_diagnosis_sessions` table doesn't exist.

## ✅ Solution: Run the Migration

### **Easiest Method: Supabase Dashboard**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in left sidebar
   - Click **New Query** button

3. **Copy Migration SQL**
   - Open file: `sihat-tcm-web/supabase/migrations/20250102000001_add_diagnosis_input_data.sql`
   - Select all (Ctrl+A) and copy (Ctrl+C)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click **Run** button (or press Ctrl+Enter)

5. **Verify Success**
   - Should see: "Success. No rows returned"
   - No errors

6. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

---

## ✅ Verify Migration Worked

Run this in Supabase SQL Editor:

```sql
-- Should return: true
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'guest_diagnosis_sessions'
);
```

If it returns `true`, the migration worked! ✅

---

## 🔄 Alternative: PowerShell Script

If you prefer using the script:

```powershell
cd "C:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm-web"
.\run-guest-sessions-migration.ps1
```

Enter your Supabase project reference and database password when prompted.

---

## ⚠️ Temporary Workaround (If Migration Fails)

If you can't run the migration right now, I can add a temporary fallback that saves guest sessions to `diagnosis_sessions` table instead. However, **running the migration is the proper solution**.

---

## 📋 What Gets Created

The migration creates:

- ✅ `guest_diagnosis_sessions` table
- ✅ 12 new columns in `diagnosis_sessions` table
- ✅ Indexes for performance
- ✅ RLS policies for security

**Safe to run multiple times** - uses `IF NOT EXISTS` clauses.

---

## 🎯 After Migration

1. Restart your dev server
2. Try completing a diagnosis again
3. Error should be gone ✅

