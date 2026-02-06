// Execute SQL seed script for Yeak patient data
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const supabaseUrl = "https://kixqmquwqzvcvdvfnfar.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeHFtcXV3cXp2Y3ZkdmZuZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI2MDU1NywiZXhwIjoyMDQ5ODM2NTU3fQ.Jdnp7KTlQa2KVGmNkLRBEhtJPQ5jvQPxGxKaBZM0bSw";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL() {
  try {
    console.log("🔄 Reading SQL file...");
    const sqlContent = readFileSync(
      join(__dirname, "supabase", "seed_yeak_patient_data.sql"),
      "utf-8"
    );

    console.log("🔄 Executing SQL script...");

    // Execute the SQL using the REST API
    const { data, error } = await supabase.rpc("exec_sql", { sql: sqlContent });

    if (error) {
      console.error("❌ Error executing SQL:", error);

      // Fallback: Try direct approach
      console.log("🔄 Trying alternative method...");
      await alternativeExecution();
    } else {
      console.log("✅ SQL executed successfully!");
      console.log(data);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.log("🔄 Trying alternative method...");
    await alternativeExecution();
  }
}

async function alternativeExecution() {
  try {
    console.log("🔄 Checking if user exists...");

    // Get user ID
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("❌ Error fetching users:", userError);
      return;
    }

    const user = users.users.find((u) => u.email === "yeak@gmail.com");

    if (!user) {
      console.error("❌ User yeak@gmail.com not found!");
      console.log("📝 Please create this user account first in Supabase Auth.");
      return;
    }

    console.log("✅ Found user:", user.email, "ID:", user.id);

    // Update profile
    console.log("🔄 Updating profile...");
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      role: "patient",
      full_name: "Yeak Kiew Ai",
      age: 78,
      gender: "female",
      height: 155,
      weight: 64,
      medical_history:
        "Chronic Kidney Disease Stage 4, Hypertension, Cardiovascular disease, Hiatal hernia, Gastritis, Fatty liver, Pre-diabetes, Osteopenia, Avascular necrosis, Sciatica, Anxiety and insomnia, Hearing loss (45%)",
      preferred_language: "en",
    });

    if (profileError) {
      console.error("❌ Error updating profile:", profileError);
    } else {
      console.log("✅ Profile updated successfully!");
    }

    // Insert diagnosis session
    console.log("🔄 Creating diagnosis session...");
    const { error: diagnosisError } = await supabase.from("diagnosis_sessions").insert({
      user_id: user.id,
      primary_diagnosis:
        "Multiple Chronic Conditions - CKD Stage 4, Cardiovascular, Gastrointestinal",
      constitution: "Kidney Yin Deficiency with Damp-Heat accumulation",
      overall_score: 45,
      symptoms: [
        "Chronic kidney disease symptoms",
        "Fluid retention",
        "Elevated creatinine",
        "Decreased eGFR",
        "Stomach bloating",
        "Food blockage sensation",
        "Gastritis symptoms",
        "Hiatal hernia",
        "Difficulty swallowing solid foods",
        "Right hip pain",
        "Bilateral knee arthritis (left worse)",
        "Lower back pain",
        "Osteopenia",
        "Hypertension",
        "Heart condition requiring surgery",
        "Sciatica",
        "Neuropathic pain",
        "Hand tremors (resolved after environmental adjustment)",
        "Pre-diabetes (HbA1c 6.0%)",
        "High triglycerides",
        "Low HDL cholesterol",
        "Anxiety",
        "Insomnia",
        "Hearing loss 45%",
        "Previous bacterial heart infection",
        "Previous dental infection",
      ],
      medicines: [
        "Valsartan/Amlodipine combination",
        "Atenolol",
        "Rabeprazole (acid reflux)",
        "Previously: Nexium",
        "Duloxetine (neuropathic pain)",
        "Strain relief patches (lower back)",
        "Mirtazapine (anxiety, sleep)",
        "Lexoton/Bromazepam (anxiety)",
        "Joint supplements (started December 2025, 1 month trial)",
        "Paracetamol/acetaminophen (approved pain relief only)",
      ],
      vital_signs: {
        weight_kg: 64,
        weight_trend: "increased from 48-54kg range - possible fluid retention",
        blood_pressure_status: "managed with medication",
        kidney_function: {
          eGFR: "27 mL/min/1.73m²",
          creatinine: "167 µmol/L",
          bun: "8.1 mmol/L",
          date: "2025-08-01",
        },
        metabolic_panel: {
          hba1c: "6.0%",
          triglycerides: "2.97 mmol/L",
          hdl: "1.12 mmol/L",
          status: "pre-diabetes",
        },
        bone_density: {
          left_hip: "osteopenia",
          fracture_risk_10yr_major: "5.9%",
          fracture_risk_10yr_hip: "1.4%",
        },
        hearing: {
          percentage: "45%",
          eligible_for: "PeKa B40 government-subsidized hearing aid",
        },
      },
      clinical_notes: `# Comprehensive Medical History - Yeak Kiew Ai

## Critical Conditions Requiring Active Management

### 1. Chronic Kidney Disease (CKD) - Stage 4
- eGFR: 27 mL/min/1.73m² (August 2025) - CRITICAL LOW
- At risk of progression to Stage 5 (dialysis)
- **STRICTLY AVOID NSAIDs** (ibuprofen, diclofenac, aspirin)
- Next nephrology follow-up: December 4, 2025 at Regency Specialist Hospital

### 2. Gastrointestinal Issues
- Hiatal hernia (confirmed gastroscopy September 12, 2025)
- Mild atrophic and erosive gastritis
- Esophageal/gastric dysmotility causing food blockage sensation
- **Dietary requirement**: Soft foods ONLY, avoid hard/solid foods

### 3. Cardiovascular
- Hypertension (managed with Valsartan/Amlodipine and Atenolol)
- Heart surgery required but delayed due to bacterial infection (July 2025)

### 4. Metabolic
- Pre-diabetes: HbA1c 6.0% (threshold for diabetes is 6.5%)
- Dyslipidemia: High triglycerides (2.97 mmol/L), low HDL (1.12 mmol/L)

### 5. Musculoskeletal (December 2025 Update)
- Right hip: X-ray shows deterioration but not rapid; surgery not recommended unless severe pain
- Bilateral knee arthritis (left worse than right)
- Lower back pain (managed with strain relief patches)
- Avascular necrosis of right hip
- Osteopenia in left hip

## Recent Progress (December 10-11, 2025)

### Successful Interventions by Jay (Primary Caregiver):
1. **Stopped problematic new medication** - causing adverse effects
2. **Strict dietary control**: Very thin rice porridge (~300ml, mostly water) + steamed egg
3. **Environmental adjustment**: Stopped prolonged AC exposure - hand tremors RESOLVED

### Immediate Improvements:
✅ Stomach bloating reducing
✅ Hand tremors resolved
✅ Able to shower independently
✅ Mood significantly improved
✅ Expressed desire to go out`,
      treatment_plan: `-- Current Dietary Protocol (PROVEN EFFECTIVE Dec 10-11, 2025) --

ALLOWED FOODS:
✅ Very thin rice porridge (水为主 - mostly water, minimal rice) ~300ml
✅ Steamed egg (easy to digest, good protein)
✅ Other soft, easily-digestible foods

STRICTLY AVOID:
❌ Sweet potato (番薯) - HIGH POTASSIUM (dangerous for CKD Stage 4)
❌ Bread (面包) - high sodium and phosphorus additives
❌ Cauliflower (野菜花) - moderate potassium, causes gas/bloating
❌ Any hard or solid foods (hiatal hernia risk)

ENVIRONMENTAL:
- Keep room warm, avoid prolonged AC exposure (hand tremors resolved after stopping AC)

MEDICATION SAFETY:
⚠️ CRITICAL: NO NSAIDs (ibuprofen, diclofenac, aspirin) - will worsen kidney function
✅ Paracetamol/acetaminophen ONLY for pain relief`,
      follow_up_date: "2025-12-11",
      full_report: {
        patient_info: {
          name: "Yeak Kiew Ai (叶巧爱)",
          age: 78,
          gender: "female",
          weight_kg: 64,
          summary_date: "2025-12-07",
        },
        current_status: "STABLE & IMPROVING",
        positive_factors: [
          "No cancer detected",
          "No H. pylori infection",
          "No GI bleeding (no anemia)",
          "Liver stable (fatty liver without cirrhosis)",
          "Strong family support",
          "Good healthcare access",
          "Eligible for PeKa B40 government healthcare subsidies",
        ],
        family_care_team: [
          {
            name: "Jay",
            role: "Primary caregiver",
            responsibilities:
              "Coordinates medical appointments, implemented successful care protocol",
          },
          {
            name: "Niko",
            role: "Medical coordinator",
            responsibilities: "Monitors condition at shop",
          },
          {
            name: "Bin",
            role: "Backup support",
            responsibilities: "Daily porridge preparation",
          },
        ],
      },
      notes:
        "Comprehensive medical history imported from family health records. Patient showing significant improvement after implementation of strict dietary control and environmental adjustments on December 10, 2025.",
      created_at: "2025-12-11T00:00:00Z",
    });

    if (diagnosisError) {
      console.error("❌ Error creating diagnosis session:", diagnosisError);
    } else {
      console.log("✅ Diagnosis session created successfully!");
    }

    console.log("\n============================================");
    console.log("✅ Data import complete!");
    console.log("Patient: Yeak Kiew Ai (yeak@gmail.com)");
    console.log("Primary conditions: CKD Stage 4, Cardiovascular, GI, Musculoskeletal");
    console.log("Current status: STABLE & IMPROVING");
    console.log("============================================");
  } catch (err) {
    console.error("❌ Alternative execution error:", err);
  }
}

executeSQL();
