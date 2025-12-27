/**
 * Script to seed symptoms data for testing "Import Previous Symptoms" feature
 *
 * Usage:
 *   node scripts/seed-symptoms.js
 *
 * This script:
 * 1. Updates existing diagnosis sessions with symptoms based on their diagnosis patterns
 * 2. Creates new mock diagnosis sessions with diverse symptoms
 *
 * Prerequisites:
 * - Must have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Must have at least one user with diagnosis sessions
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Symptom mappings based on diagnosis patterns
const symptomMappings = {
  "Yin Deficiency": [
    "Night sweats",
    "Insomnia",
    "Dry mouth",
    "Hot palms and soles",
    "Restlessness",
  ],
  "Yang Deficiency": [
    "Cold extremities",
    "Lower back pain",
    "Fatigue",
    "Frequent urination",
    "Weakness",
  ],
  "Qi Deficiency": [
    "Fatigue",
    "Shortness of breath",
    "Weak voice",
    "Spontaneous sweating",
    "Poor appetite",
  ],
  "Qi Stagnation": ["Chest tightness", "Irritability", "Bloating", "Sighing", "Mood swings"],
  "Liver Qi": ["Chest tightness", "Irritability", "Bloating", "Sighing", "Mood swings"],
  "Blood Deficiency": ["Dizziness", "Palpitations", "Poor memory", "Pale complexion", "Dry skin"],
  "Damp Heat": [
    "Heavy feeling",
    "Sticky mouth",
    "Yellow discharge",
    "Bitter taste",
    "Urinary discomfort",
  ],
  "Wind-Cold": ["Chills", "Runny nose", "Body aches", "Headache", "No sweating"],
  Phlegm: ["Chest oppression", "Cough with phlegm", "Heaviness", "Foggy thinking", "Nausea"],
  Damp: ["Chest oppression", "Cough with phlegm", "Heaviness", "Foggy thinking", "Nausea"],
  default: ["Fatigue", "General discomfort", "Sleep issues", "Digestive problems"],
};

function getSymptomsForDiagnosis(diagnosis) {
  if (!diagnosis) return symptomMappings.default;

  const diagnosisLower = diagnosis.toLowerCase();

  for (const [key, symptoms] of Object.entries(symptomMappings)) {
    if (key === "default") continue;
    if (diagnosisLower.includes(key.toLowerCase())) {
      return symptoms;
    }
  }

  return symptomMappings.default;
}

async function updateExistingSessions() {
  console.log("Updating existing diagnosis sessions with symptoms...");

  // Get all sessions without symptoms
  const { data: sessions, error: fetchError } = await supabase
    .from("diagnosis_sessions")
    .select("id, primary_diagnosis")
    .or("symptoms.is.null,array_length(symptoms,1).is.null");

  if (fetchError) {
    console.error("Error fetching sessions:", fetchError);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log("No sessions found without symptoms.");
    return;
  }

  console.log(`Found ${sessions.length} sessions to update.`);

  // Update each session
  let updated = 0;
  for (const session of sessions) {
    const symptoms = getSymptomsForDiagnosis(session.primary_diagnosis);

    const { error: updateError } = await supabase
      .from("diagnosis_sessions")
      .update({ symptoms })
      .eq("id", session.id);

    if (updateError) {
      console.error(`Error updating session ${session.id}:`, updateError);
    } else {
      updated++;
    }
  }

  console.log(`Updated ${updated} sessions with symptoms.`);
}

async function createMockSessions() {
  console.log("Creating new mock diagnosis sessions...");

  // Get a user who has existing sessions
  const { data: userData } = await supabase
    .from("diagnosis_sessions")
    .select("user_id")
    .limit(1)
    .single();

  if (!userData) {
    console.log("No existing sessions found. Skipping mock session creation.");
    return;
  }

  const userId = userData.user_id;

  const mockSessions = [
    {
      user_id: userId,
      primary_diagnosis: "Headache with Liver Yang Rising",
      constitution: "Yang Excess Constitution",
      overall_score: 65,
      symptoms: ["Severe headache", "Dizziness", "Irritability", "Red eyes", "Tinnitus"],
      medicines: ["Tian Ma Gou Teng Yin"],
      full_report: {
        diagnosis: {
          primary_pattern: "Liver Yang Rising",
          affected_organs: ["Liver", "Head"],
        },
        constitution: { type: "Yang Excess" },
        patient_profile: { name: "Test Patient" },
      },
      notes: "Stress-related headaches getting worse in the afternoon.",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: userId,
      primary_diagnosis: "Chronic Fatigue Syndrome",
      constitution: "Qi Deficiency Constitution",
      overall_score: 58,
      symptoms: [
        "Extreme fatigue",
        "Brain fog",
        "Muscle weakness",
        "Sleep disturbances",
        "Poor concentration",
      ],
      medicines: ["Bu Zhong Yi Qi Tang", "Ginseng Extract"],
      full_report: {
        diagnosis: {
          primary_pattern: "Qi and Blood Deficiency",
          affected_organs: ["Spleen", "Heart", "Kidney"],
        },
        constitution: { type: "Qi Deficiency" },
        patient_profile: { name: "Test Patient" },
      },
      notes: "Feeling exhausted all the time, even after sleeping 10 hours.",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: userId,
      primary_diagnosis: "Digestive Issues with Spleen Dampness",
      constitution: "Damp Constitution",
      overall_score: 62,
      symptoms: [
        "Bloating after meals",
        "Loose stools",
        "Feeling of heaviness",
        "Poor digestion",
        "Loss of appetite",
      ],
      medicines: ["Xiang Sha Liu Jun Zi Tang"],
      full_report: {
        diagnosis: {
          primary_pattern: "Spleen Dampness",
          affected_organs: ["Spleen", "Stomach"],
        },
        constitution: { type: "Damp" },
        patient_profile: { name: "Test Patient" },
      },
      notes: "Digestive problems worsened after eating too much greasy food.",
      created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  let created = 0;
  for (const session of mockSessions) {
    // Check if session already exists
    const { data: existing } = await supabase
      .from("diagnosis_sessions")
      .select("id")
      .eq("user_id", session.user_id)
      .eq("primary_diagnosis", session.primary_diagnosis)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .single();

    if (existing) {
      console.log(`Session "${session.primary_diagnosis}" already exists. Skipping.`);
      continue;
    }

    const { error: insertError } = await supabase.from("diagnosis_sessions").insert(session);

    if (insertError) {
      console.error(`Error creating session "${session.primary_diagnosis}":`, insertError);
    } else {
      created++;
      console.log(`Created session: "${session.primary_diagnosis}"`);
    }
  }

  console.log(`Created ${created} new mock sessions.`);
}

async function main() {
  console.log("Starting symptoms seeding...\n");

  try {
    await updateExistingSessions();
    console.log("");
    await createMockSessions();
    console.log("");

    // Verify results
    const { data: sessions, error } = await supabase
      .from("diagnosis_sessions")
      .select("id, primary_diagnosis, symptoms, created_at")
      .not("symptoms", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error verifying results:", error);
    } else {
      console.log("\nVerification: Sessions with symptoms:");
      sessions?.forEach((session) => {
        console.log(`  - ${session.primary_diagnosis}: ${session.symptoms?.length || 0} symptoms`);
      });
    }

    console.log("\n✅ Symptoms seeding completed!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
