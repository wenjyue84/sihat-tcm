import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🔄 Starting patient type redistribution...\n");

  try {
    // Step 1: Check and add 'guest' to enum using raw SQL
    console.log("Step 1: Adding 'guest' to patient_type enum...");
    const { data: enumCheck, error: enumError } = await supabase.rpc("exec_sql", {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'guest' 
                AND enumtypid = 'patient_type'::regtype
            ) THEN
                ALTER TYPE patient_type ADD VALUE 'guest';
                RAISE NOTICE 'Added guest to patient_type enum';
            ELSE
                RAISE NOTICE 'guest already exists in patient_type enum';
            END IF;
        END $$;
      `,
    });

    // If RPC doesn't work, use direct update approach
    // Step 2: Get all patients
    const { data: patients, error: fetchError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, type")
      .order("created_at", { ascending: true });

    if (fetchError) {
      throw new Error(`Error fetching patients: ${fetchError.message}`);
    }

    if (!patients || patients.length === 0) {
      console.log("⚠️  No patients found in database");
      return;
    }

    console.log(`\n📊 Found ${patients.length} patients\n`);

    // Step 3: Update patient types in batches
    console.log("Step 2: Redistributing patient types...\n");

    const updates = [];
    let managedCount = 0;
    let registeredCount = 0;
    let guestCount = 0;

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      let newType;

      if (i < 40) {
        newType = "managed";
        managedCount++;
      } else if (i < 75) {
        newType = "registered";
        registeredCount++;
      } else {
        newType = "guest";
        guestCount++;
      }

      const updateData = { type: newType };

      // Guests typically don't have emails
      if (newType === "guest") {
        updateData.email = null;
      }

      const { error: updateError } = await supabase
        .from("patients")
        .update(updateData)
        .eq("id", patient.id);

      if (updateError) {
        console.error(
          `❌ Error updating ${patient.first_name} ${patient.last_name}: ${updateError.message}`
        );
      } else {
        process.stdout.write(`✓ Updated ${patient.first_name} ${patient.last_name} → ${newType}\r`);
      }
    }

    console.log("\n\n✅ Update complete!\n");
    console.log("📈 New Distribution:");
    console.log(
      `   🏥 Managed:    ${managedCount} (${((managedCount / patients.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `   👤 Registered: ${registeredCount} (${((registeredCount / patients.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `   🎫 Guest:      ${guestCount} (${((guestCount / patients.length) * 100).toFixed(1)}%)`
    );
    console.log(`   📊 Total:      ${patients.length}\n`);

    // Verify
    console.log("🔍 Verifying distribution...");
    const { data: verification, error: verifyError } = await supabase
      .from("patients")
      .select("type");

    if (!verifyError && verification) {
      const counts = {
        managed: verification.filter((p) => p.type === "managed").length,
        registered: verification.filter((p) => p.type === "registered").length,
        guest: verification.filter((p) => p.type === "guest").length,
      };

      console.log("\n✓ Verified:");
      console.log(`   Managed:    ${counts.managed}`);
      console.log(`   Registered: ${counts.registered}`);
      console.log(`   Guest:      ${counts.guest}`);
      console.log(`   Total:      ${counts.managed + counts.registered + counts.guest}`);
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
  }
}

main();
