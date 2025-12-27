/**
 * Script to run the guest_diagnosis_sessions migration
 * Uses Supabase service role key to execute SQL directly
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  console.error("");
  console.error("Please set these in your .env.local file");
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Read migration file
const migrationPath = join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20250102000001_add_diagnosis_input_data.sql"
);
let migrationSQL;

try {
  migrationSQL = readFileSync(migrationPath, "utf-8");
  console.log("✅ Migration file loaded:", migrationPath);
} catch (error) {
  console.error("❌ Failed to read migration file:", error.message);
  process.exit(1);
}

// Execute migration
async function runMigration() {
  console.log("");
  console.log("🏥 Sihat TCM - Running Guest Diagnosis Sessions Migration");
  console.log("");
  console.log("📊 Executing migration...");
  console.log("");

  try {
    // Split SQL into individual statements (simple approach)
    // Note: This is a basic split - for production, use a proper SQL parser
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length === 0) continue;

      try {
        // Use RPC to execute raw SQL (if available) or use direct query
        // Note: Supabase JS client doesn't support raw SQL execution directly
        // We need to use the REST API or PostgREST
        const { data, error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });

        if (error) {
          // If RPC doesn't exist, try alternative approach
          // For now, we'll use a workaround with the REST API
          console.warn("⚠️  Note: Direct SQL execution via Supabase JS client is limited.");
          console.warn("   Please run this migration via Supabase Dashboard SQL Editor instead.");
          console.warn("   File location:", migrationPath);
          break;
        }

        successCount++;
      } catch (err) {
        errorCount++;
        console.error("❌ Error executing statement:", err.message);
      }
    }

    if (errorCount === 0 && successCount > 0) {
      console.log("");
      console.log(`✅ Migration completed! (${successCount} statements executed)`);
    } else {
      console.log("");
      console.log("⚠️  Migration execution via script is not fully supported.");
      console.log("   Please use one of these alternatives:");
      console.log("");
      console.log("   Option 1: Supabase Dashboard");
      console.log("   1. Go to https://supabase.com/dashboard");
      console.log("   2. Select your project");
      console.log("   3. Go to SQL Editor");
      console.log("   4. Copy contents of:", migrationPath);
      console.log("   5. Paste and run");
      console.log("");
      console.log("   Option 2: PowerShell Script");
      console.log("   Run: .\\run-guest-sessions-migration.ps1");
    }
  } catch (error) {
    console.error("");
    console.error("❌ Migration failed:", error.message);
    console.error("");
    console.error("Please run the migration manually via Supabase Dashboard SQL Editor.");
    process.exit(1);
  }
}

// Verify table exists
async function verifyMigration() {
  console.log("");
  console.log("🔍 Verifying table creation...");

  const { data, error } = await supabase.from("guest_diagnosis_sessions").select("id").limit(1);

  if (error) {
    if (error.code === "PGRST116" || error.message.includes("does not exist")) {
      console.log("❌ Table does not exist yet. Migration may not have completed.");
      return false;
    }
    console.error("⚠️  Verification error:", error.message);
    return false;
  }

  console.log("✅ Table exists! Migration successful.");
  return true;
}

// Main execution
async function main() {
  await runMigration();

  // Wait a bit for the migration to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await verifyMigration();
}

main().catch(console.error);

