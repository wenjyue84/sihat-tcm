# 🚀 Quick Migration Guide: Guest Diagnosis Sessions

## The Problem

The `guest_diagnosis_sessions` table doesn't exist in your database, causing the error:

```
Could not find the table 'public.guest_diagnosis_sessions' in the schema cache
```

## ✅ Solution: Run Migration via Supabase Dashboard

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project (jvokcruuowmvpthubjqh)

### Step 2: Open SQL Editor

1. Click **SQL Editor** in the left sidebar
2. Click **New Query**

### Step 3: Copy and Run Migration

1. Open the file: `sihat-tcm-web/supabase/migrations/20250102000001_add_diagnosis_input_data.sql`
2. **Copy the ENTIRE contents** of the file
3. **Paste** into the SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 4: Verify Success

Run this query to verify the table was created:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'guest_diagnosis_sessions'
);
```

Expected result: `true`

---

## 📋 What This Migration Does

This migration:

- ✅ Creates `guest_diagnosis_sessions` table for unauthenticated users
- ✅ Adds input data columns to `diagnosis_sessions` table
- ✅ Creates indexes for performance
- ✅ Sets up RLS (Row Level Security) policies
- ✅ Creates triggers for automatic timestamp updates

---

## 🔧 Alternative: PowerShell Script

If you prefer using a script:

```powershell
cd "sihat-tcm"
.\run-guest-sessions-migration.ps1
```

You'll be prompted for:

- Supabase Project Reference: `jvokcruuowmvpthubjqh`
- Database Password (found in Supabase Dashboard > Project Settings > Database)

---

## ✅ After Migration

Once the migration completes:

1. The error will be resolved
2. Guest users can save diagnosis sessions
3. The app will work correctly for both authenticated and guest users

---

## 🆘 Troubleshooting

**If you get an error about existing columns:**

- The migration uses `IF NOT EXISTS`, so it's safe to run multiple times
- Some columns might already exist - that's okay!

**If the migration fails:**

- Check the error message in the SQL Editor
- Common issues: missing permissions, syntax errors
- Contact support if needed

