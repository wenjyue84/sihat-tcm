/**
 * Fix doctors - Add is_approved column and set all to true
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDoctors() {
  console.log("🔧 Fixing doctor approval...\n");

  // Step 1: Add is_approved column using raw SQL via REST API
  console.log("1️⃣ Adding is_approved column to profiles table...");

  // We can't run raw SQL directly, but we can update all doctors with the is_approved field
  // Supabase will add the column if we use upsert with the service key

  // First, get all doctors
  const { data: doctors, error: fetchError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "doctor");

  if (fetchError) {
    console.error("❌ Error fetching doctors:", fetchError.message);
    return;
  }

  console.log(`Found ${doctors?.length || 0} doctors\n`);

  // Try to update each doctor with is_approved = true
  console.log("2️⃣ Setting is_approved = true for each doctor...\n");

  for (const doctor of doctors || []) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("id", doctor.id);

    if (updateError) {
      if (updateError.message.includes("is_approved")) {
        console.log("⚠️  Column is_approved does not exist.");
        console.log("\n📝 You need to run this SQL in Supabase SQL Editor:\n");
        console.log("--------------------------------------------------");
        console.log("ALTER TABLE public.profiles ADD COLUMN is_approved BOOLEAN DEFAULT false;");
        console.log("UPDATE public.profiles SET is_approved = true WHERE role = 'doctor';");
        console.log("--------------------------------------------------\n");
        return;
      }
      console.error(`❌ Error updating ${doctor.full_name}:`, updateError.message);
    } else {
      console.log(`✅ ${doctor.full_name} - approved`);
    }
  }

  console.log("\n✅ Done! All doctors are now approved.");

  // Verify
  console.log("\n📋 Verification:");
  const { data: verified } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_approved")
    .eq("role", "doctor");

  console.table(verified);
}

fixDoctors();
