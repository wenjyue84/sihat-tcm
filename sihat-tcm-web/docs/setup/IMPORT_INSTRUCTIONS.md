# 🏥 How to Import Patient Data for Yeak Kiew Ai

I have prepared a comprehensive SQL script that will populate **all** of Yeak Kiew Ai's medical data into the system, including:

- **Profile**: Age, weight, height, medical history summary.
- **Detailed Diagnosis**: CKD stats, lab results, medications, and specific care protocols.
- **Recent Progress**: The success of the diet/environment changes from Dec 10-11, 2025.

## 🚀 Step 1: Get User ID

1. Go to your **Supabase Dashboard**.
2. Click on **Authentication** (on the left sidebar).
3. Find the user `yeak@gmail.com`.
4. Copy the **User UID** (it looks like `a1b2c3d4-...`).

## 🚀 Step 2: Run the Script

1. Open the file `supabase/seed_yeak_final.sql` in VS Code.
2. Replace `PASTE_YOUR_UUID_HERE` (on line 12) with the UUID you copied.
3. Copy the **entire content** of the file.
4. Go to **Supabase Dashboard** > **SQL Editor**.
5. Click **New Query**.
6. Paste the code and click **RUN**.

## ✅ Verification

After running the script, log in as `yeak@gmail.com` in your app and go to **My Health Passport**. You should see a complete, detailed medical record awaiting you.
