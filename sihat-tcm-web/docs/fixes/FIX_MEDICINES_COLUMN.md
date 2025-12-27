# 🚨 Quick Fix: Missing 'medicines' Column Error

## Error You're Seeing

```
Could not find the 'medicines' column of 'diagnosis_sessions' in the schema cache
```

## ✅ Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project

### Step 2: Run SQL Migration

1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open this file: `sihat-tcm-web/fix_medicines_column.sql`
4. **Copy ALL contents** (Ctrl+A, Ctrl+C)
5. **Paste** into SQL Editor
6. Click **Run** (or Ctrl+Enter)

### Step 3: Verify

You should see:

- **"Success. No rows returned"**
- A results table showing the columns that were added (medicines, symptoms, etc.)

### Step 4: Restart Server

```bash
# Stop server (Ctrl+C if running)
npm run dev
```

---

## ✅ Test It Works

After migration, complete a diagnosis again. The error should be gone!

---

## 📁 Migration Files

### Quick Fix (Recommended)

```
sihat-tcm-web/fix_medicines_column.sql
```

- Adds only the missing `medicines` column and related doctor record fields
- Safe to run - uses `IF NOT EXISTS` so it won't break existing data

### Full Migration (Alternative)

```
sihat-tcm-web/supabase/migrations/20251226000001_add_doctor_record_fields.sql
```

- Complete migration that adds all doctor record fields
- Same content as quick fix, but part of the official migration history

---

## 🔍 What This Migration Does

Adds the following columns to `diagnosis_sessions` table:

- `medicines` (text[]) - Array of prescribed or current medications
- `symptoms` (text[]) - Array of reported symptoms
- `vital_signs` (jsonb) - Vital signs recorded during diagnosis
- `clinical_notes` (text) - Additional clinical observations
- `treatment_plan` (text) - Treatment plan summary
- `follow_up_date` (date) - Recommended follow-up date

Also creates indexes for better query performance.

---

## ❓ Why Did This Happen?

The `medicines` column was added in a later migration (`20251226000001_add_doctor_record_fields.sql`) but hasn't been applied to your database yet. The code expects this column to exist when saving diagnosis data.

---

## 🛡️ Safe to Run

This migration uses `IF NOT EXISTS` clauses, so:

- ✅ Won't break existing data
- ✅ Won't duplicate columns if already exists
- ✅ Can be run multiple times safely
- ✅ Only adds missing columns

