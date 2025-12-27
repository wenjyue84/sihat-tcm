# Populating Patient Data for Yeak Kiew Ai (yeak@gmail.com)

## Overview
This guide explains how to populate comprehensive health data for patient Yeak Kiew Ai into the Sihat TCM database.

## Data Populated

### Profile Information
- **Full Name**: Yeak Kiew Ai (叶巧爱)
- **Age**: 78 years old
- **Gender**: Female  
- **Height**: 155 cm
- **Weight**: 64 kg (increased from 48-54kg range)
- **Role**: Patient

### Medical Conditions
1. **Chronic Kidney Disease Stage 4** (CRITICAL)
   - eGFR: 27 mL/min/1.73m²
   - Creatinine: 167 µmol/L
   - At risk of dialysis

2. **Cardiovascular**
   - Hypertension (managed)
   - Heart condition requiring surgery

3. **Gastrointestinal**
   - Hiatal hernia
   - Gastritis
   - Dysmotility

4. **Musculoskeletal**
   - Hip avascular necrosis
   - Bilateral knee arthritis
   - Osteopenia
   - Lower back pain

5. **Metabolic**
   - Pre-diabetes (HbA1c 6.0%)
   - Dyslipidemia

6. **Other**
   - Fatty liver (mild)
   - Sciatica
   - Anxiety & insomnia
   - Hearing loss (45%)

### Current Medications
- Valsartan/Amlodipine (BP)
- Atenolol (BP)
- Rabeprazole (acid reflux)
- Duloxetine (nerve pain)
- Mirtazapine (anxiety/sleep)
- Lexoton/Bromazepam (anxiety)
- Joint supplements
- Paracetamol only (NO NSAIDs due to CKD)

### Recent Progress (December 10-11, 2025)
**Successful interventions by Jay (primary caregiver):**
- ✅ Stopped problematic medication
- ✅ Implemented strict diet (thin porridge + steamed egg)
- ✅ Stopped prolonged AC exposure

**Results:**
- ✅ Hand tremors RESOLVED
- ✅ Stomach bloating reducing
- ✅ Mood significantly improved
- ✅ Able to shower independently
- ✅ Expressed desire to go out

### Family Care Team
- **Jay**: Primary caregiver, medical coordinator
- **Niko**: Medical support, monitoring at shop
- **Bin**: Daily meal preparation, backup support

---

## Option 1: Manual Execution (RECOMMENDED - No network issues)

### Step 1: Get User ID from Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `kixqmquwqzvcvdvfnfar`
3. Go to **Authentication** → **Users**
4. Find the user with email: `yeak@gmail.com`
5. Copy the **UUID** (looks like: `123e4567-e89b-12d3-a456-426614174000`)

### Step 2: Update the SQL File

1. Open: `supabase/seed_yeak_simple.sql`
2. Find line 12: `\set user_id 'YOUR_USER_ID_HERE'`
3. Replace `YOUR_USER_ID_HERE` with the UUID you copied
4. Save the file

### Step 3: Execute in Supabase Dashboard

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New query**
3. Copy and paste the entire contents of `supabase/seed_yeak_simple.sql`
4. Click **Run** button
5. You should see: "Data import complete for Yeak Kiew Ai!"

---

## Option 2: Command Line Execution (If you have psql installed)

```powershell
# Set connection string
$env:DATABASE_URL = "postgresql://postgres.kixqmquwqzvcvdvfnfar:Jackjack1!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Execute the comprehensive seed script
psql $env:DATABASE_URL -f "supabase\seed_yeak_patient_data.sql"
```

**Note**: This requires PostgreSQL client (`psql`) to be installed on your system.

---

## Option 3: Node.js Script (Network-dependent)

If you have working internet connectivity to Supabase:

```powershell
node seed-yeak-data.mjs
```

**Note**: This method failed earlier due to network connectivity issues (DNS resolution failure).

---

## Files Created

### 1. `supabase/seed_yeak_patient_data.sql`
- **Full comprehensive SQL script** with all medical history
- Uses PL/pgSQL `DO` block
- Automatically finds user by email
- ~450 lines of detailed medical data

### 2. `supabase/seed_yeak_simple.sql`
- **Simplified version** for manual execution
- Requires manual user_id replacement
- Suitable for Supabase SQL Editor
- ~200 lines, more concise

### 3. `seed-yeak-data.mjs`
- Node.js script using Supabase client
- Uses service role key
- Has fallback method
- Requires network connectivity

---

## Verification

After execution, you can verify the data was populated:

### Check Profile:
```sql
SELECT full_name, age, gender, weight, medical_history 
FROM profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'yeak@gmail.com'
);
```

### Check Diagnosis Session:
```sql
SELECT 
    primary_diagnosis, 
    constitution, 
    overall_score,
    array_length(symptoms, 1) as symptom_count,
    array_length(medicines, 1) as medicine_count,
    created_at
FROM diagnosis_sessions 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'yeak@gmail.com'
);
```

---

## Critical Information Captured

### ⚠️ Medical Safety Alerts
- **NO NSAIDs** allowed (will worsen kidney function)
- **Soft foods ONLY** (hiatal hernia risk)
- **Avoid high-potassium foods** (sweet potato, etc.) - dangerous for CKD
- **Avoid prolonged AC** (causes hand tremors)

### ✅ Proven Effective Diet (Dec 10-11, 2025)
- Very thin rice porridge (mostly water) ~300ml
- Steamed egg
- Keep environment warm

### 📅 Follow-ups
- Nephrology: December 4, 2025 @ Regency Specialist Hospital
- Monitor daily: swelling, energy, pain, appetite

---

## Troubleshooting

### If "User not found" error:
1. Verify the user `yeak@gmail.com` exists in Supabase Auth
2. If not, create the user first in **Authentication** → **Add user**
3. Then run the SQL script again

### If network errors:
- Use **Option 1 (Manual Execution)** via Supabase Dashboard
- This bypasses all network/connectivity issues

### If permission errors:
- Ensure you're logged in with admin/service role credentials
- Check that RLS policies allow the operation

---

## Next Steps

After successfully populating the data:

1. ✅ Login as `yeak@gmail.com` in the web app
2. ✅ Navigate to **My Health Passport**
3. ✅ You should see the comprehensive diagnosis record
4. ✅ Verify all symptoms, medications, and notes are displayed correctly

---

## Summary

**Recommended Method**: Use Option 1 (Manual Execution via Supabase Dashboard SQL Editor)

1. Get user UUID from Supabase Dashboard
2. Update `supabase/seed_yeak_simple.sql` with the UUID
3. Copy-paste into SQL Editor and run
4. Verify the data was inserted

This approach is the most reliable and doesn't depend on network connectivity or installed tools.
