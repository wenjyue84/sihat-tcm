# 🚨 URGENT: Run Database Migration

## Error You're Seeing

```
Could not find the table 'public.guest_diagnosis_sessions' in the schema cache
```

## ✅ Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project

### Step 2: Run SQL Migration

1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open this file: `sihat-tcm/supabase/migrations/20250102000001_add_diagnosis_input_data.sql`
4. **Copy ALL contents** (Ctrl+A, Ctrl+C)
5. **Paste** into SQL Editor
6. Click **Run** (or Ctrl+Enter)

### Step 3: Verify

You should see: **"Success. No rows returned"**

### Step 4: Restart Server

```bash
# Stop server (Ctrl+C if running)
npm run dev
```

---

## ✅ Test It Works

After migration, complete a diagnosis again. The error should be gone!

---

## 📁 Migration File Location

```
sihat-tcm/supabase/migrations/20250102000001_add_diagnosis_input_data.sql
```

This file:

- Creates `guest_diagnosis_sessions` table
- Adds new columns to `diagnosis_sessions` table
- Sets up indexes and security policies

**Safe to run** - uses `IF NOT EXISTS` so it won't break existing data.
