/**
 * Check doctors in the database
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDoctors() {
  console.log("🔍 Checking doctors in profiles table...\n");

  // Get all doctors - don't include columns that might not exist
  const { data: doctors, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "doctor");

  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  console.log(`Found ${doctors?.length || 0} doctor(s):\n`);
  if (doctors && doctors.length > 0) {
    console.table(doctors);
  } else {
    console.log("No doctors found in the profiles table!");
  }

  // Also check all profiles
  console.log("\n📋 All profiles:");
  const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, role");

  if (allProfiles && allProfiles.length > 0) {
    console.table(allProfiles);
  } else {
    console.log("No profiles at all!");
  }
}

checkDoctors();
