/**
 * Run Doctor Approval Migration
 *
 * Adds is_approved column to profiles table
 * Run with: node run-migration.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("   You need the service role key to run migrations.");
  console.error("   Find it in Supabase → Project Settings → API → service_role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log("🔄 Running Doctor Approval Migration...\n");

  // Step 1: Check if column exists by trying to query it
  console.log("1️⃣ Checking if is_approved column exists...");

  const { data: testData, error: testError } = await supabase
    .from("profiles")
    .select("id, is_approved")
    .limit(1);

  if (testError && testError.message.includes("is_approved")) {
    console.log("   Column does not exist. Adding it now...\n");

    // Column doesn't exist - we need to add it via Supabase Dashboard SQL Editor
    console.log("⚠️  Cannot add column directly via Supabase client.");
    console.log("   Please run this SQL in Supabase Dashboard → SQL Editor:\n");
    console.log("   ─────────────────────────────────────────────────────");
    console.log("   ALTER TABLE public.profiles");
    console.log("   ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;");
    console.log("   ─────────────────────────────────────────────────────\n");

    console.log("   Then run this script again to set approvals.");
    return;
  }

  console.log("   ✅ Column exists or was just added.\n");

  // Step 2: Set all existing doctors as approved
  console.log("2️⃣ Setting all existing doctors as approved...");

  const { data: doctors, error: fetchError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_approved")
    .eq("role", "doctor");

  if (fetchError) {
    console.error("   ❌ Error fetching doctors:", fetchError.message);
    return;
  }

  console.log(`   Found ${doctors?.length || 0} doctor(s)\n`);

  if (doctors && doctors.length > 0) {
    for (const doc of doctors) {
      if (!doc.is_approved) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_approved: true })
          .eq("id", doc.id);

        if (updateError) {
          console.log(`   ❌ Failed to approve ${doc.full_name}: ${updateError.message}`);
        } else {
          console.log(`   ✅ Approved: ${doc.full_name || doc.id}`);
        }
      } else {
        console.log(`   ⏭️  Already approved: ${doc.full_name || doc.id}`);
      }
    }
  }

  console.log("\n========================================");
  console.log("🎉 Migration Complete!");
  console.log("========================================");
}

runMigration().catch(console.error);
