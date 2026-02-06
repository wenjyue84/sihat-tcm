# Updated Doctor Dashboard to Use Real Data

## Summary of Changes

### 1. Dashboard Data Source Updated

The Doctor Dashboard (`/doctor/page.tsx`) now fetches **real diagnosis data** from the `diagnosis_sessions` table instead of using mock data from the old `inquiries` table.

**Key Changes:**

- **Table**: Changed from `inquiries` → `diagnosis_sessions`
- **Query**: Now fetches `primary_diagnosis`, `full_report`, and `symptoms` (array)
- **Join**: Uses `profiles:user_id` to get patient information and flag status
- **Transformation**: Converts `symptoms` array to comma-separated string for display
- **Limit**: Fetches the 50 most recent diagnosis sessions for performance
- **Fallback**: Only shows mock data if no real data exists in the database

### 2. Added SQL Seed Script

Created `seed_100_diagnosis_sessions.sql` to populate your database with 100 realistic diagnosis records.

**Features:**

- ✅ 20 different realistic TCM symptoms
- ✅ 20 TCM diagnosis patterns (both English and Chinese)
- ✅ 9 constitution types
- ✅ 20 tongue observations
- ✅ 20 pulse observations
- ✅ Scores ranging from 50-89
- ✅ Sessions distributed over past 6 months
- ✅ Randomly distributed across all existing patient users
- ✅ Complete diagnosis reports with recommendations

## How to Run the SQL Script

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `seed_100_diagnosis_sessions.sql`
5. Click **Run** (or press `Ctrl+Enter`)
6. Check the results - you should see confirmation messages

### Option 2: Command Line (psql)

```bash
# From your project directory
psql -h <your-supabase-host> -U postgres -d postgres -f seed_100_diagnosis_sessions.sql
```

### Option 3: Using Supabase CLI

```bash
# From your project directory
supabase db execute < seed_100_diagnosis_sessions.sql
```

## What the Script Does

1. **Checks for patients**: Ensures at least one patient user exists
2. **Creates variety**: Uses arrays of realistic TCM data for diversity
3. **Random distribution**: Assigns sessions to random patients
4. **Time-based**: Creates sessions spread over the past 180 days
5. **Complete reports**: Generates full JSONB diagnosis reports matching your schema
6. **Verification**: Returns statistics on created sessions

## Expected Output

After running the script, you should see:

```
NOTICE: Starting to seed 100 diagnosis sessions...
NOTICE: Found X patient users
NOTICE: Seeded 20 diagnosis sessions...
NOTICE: Seeded 40 diagnosis sessions...
NOTICE: Seeded 60 diagnosis sessions...
NOTICE: Seeded 80 diagnosis sessions...
NOTICE: Seeded 100 diagnosis sessions...
NOTICE: Successfully seeded 100 diagnosis sessions!
NOTICE: Diagnosis sessions are distributed across X patient users

 total_sessions | unique_patients | oldest_session | newest_session
----------------+-----------------+----------------+----------------
            100 |               X | 2024-XX-XX     | 2025-XX-XX
```

## Verifying the Data

After seeding, you can verify in several ways:

### 1. Check in Supabase Dashboard

Go to **Table Editor** → `diagnosis_sessions` and browse the records

### 2. SQL Query

```sql
SELECT
    ds.id,
    ds.created_at,
    ds.primary_diagnosis,
    p.full_name as patient_name,
    p.flag
FROM diagnosis_sessions ds
LEFT JOIN profiles p ON ds.user_id = p.id
ORDER BY ds.created_at DESC
LIMIT 20;
```

### 3. Doctor Portal Dashboard

Simply navigate to `/doctor` in your application and you should see:

- ✅ Real patient names instead of mock data
- ✅ Actual diagnosis records
- ✅ Working flag updates
- ✅ Complete diagnosis reports
- ✅ No "Demo Mode" banner

## Database Schema Reference

The `diagnosis_sessions` table structure:

```sql
- id (uuid) - Primary key
- user_id (uuid) - References profiles.id
- primary_diagnosis (text) - Main TCM diagnosis
- constitution (text) - Patient constitution type
- overall_score (int) - Health score 0-100
- full_report (jsonb) - Complete diagnosis data
- symptoms (text[]) - Array of symptoms (added via migration)
- medicines (text[]) - Current medications (added via migration)
- vital_signs (jsonb) - Vital signs data (added via migration)
- clinical_notes (text) - Doctor's notes (added via migration)
- treatment_plan (text) - Treatment summary (added via migration)
- follow_up_date (date) - Next visit date (added via migration)
- family_member_id (uuid) - Optional family member link
- is_guest_session (boolean) - Guest session flag
- is_hidden (boolean) - Hidden from history
- flag (patient_flag) - Patient priority flag
- created_at (timestamp) - Record creation time
- updated_at (timestamp) - Last modified time
```

## Troubleshooting

### No patients found

**Error**: `NOTICE: No patient users found. Please create at least one patient user first.`

**Solution**: Create at least one user with role='patient' in the profiles table:

```sql
-- Check existing patients
SELECT id, full_name, role FROM profiles WHERE role = 'patient';

-- If none exist, you need to register a patient through your app
-- Or manually create one (not recommended for production)
```

### Permission errors

If you get permission errors, make sure:

1. You're running as a superuser or database owner
2. RLS policies allow the operation
3. You're connected to the correct database

### Data not showing in dashboard

1. Check browser console for errors
2. Verify the fetch query completed successfully
3. Ensure profiles have the `flag` column (should be added via migration)
4. Refresh the page (Ctrl+F5)

## Need More Data?

To generate additional sessions, simply:

1. Change the loop limit in the SQL script: `FOR i IN 1..100` → `FOR i IN 1..200`
2. Run the script again
3. It will add the new records to existing ones

## Cleaning Up Test Data

If you want to remove the seeded data later:

```sql
-- BE CAREFUL - This deletes data!
-- Only do this if you're sure you want to remove all diagnosis sessions

DELETE FROM diagnosis_sessions
WHERE created_at >= NOW() - INTERVAL '180 days';
```

---

**Created**: December 28, 2025  
**Script Location**: `sihat-tcm-web/seed_100_diagnosis_sessions.sql`
