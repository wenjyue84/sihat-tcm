/**
 * Simple script to run the guest_diagnosis_sessions migration
 * Uses Supabase Management API to execute SQL
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
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

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error("❌ Could not extract project reference from SUPABASE_URL");
  process.exit(1);
}

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
  console.log("✅ Migration file loaded");
} catch (error) {
  console.error("❌ Failed to read migration file:", error.message);
  process.exit(1);
}

// Execute migration using Supabase Management API
async function runMigration() {
  console.log("");
  console.log("🏥 Sihat TCM - Running Guest Diagnosis Sessions Migration");
  console.log("");
  console.log("📊 Executing migration via Supabase Management API...");
  console.log("");

  try {
    // Use Supabase Management API to execute SQL
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: migrationSQL,
        }),
      }
    );

    if (!response.ok) {
      // Management API might not be available, try alternative
      const errorText = await response.text();
      console.warn("⚠️  Management API not available or requires different authentication");
      console.warn("   Error:", errorText);
      console.log("");
      console.log("📋 Please run this migration manually:");
      console.log("");
      console.log("   Option 1: Supabase Dashboard (Recommended)");
      console.log("   1. Go to https://supabase.com/dashboard");
      console.log("   2. Select your project");
      console.log("   3. Go to SQL Editor");
      console.log("   4. Copy contents of:", migrationPath);
      console.log("   5. Paste and run");
      console.log("");
      console.log("   Option 2: PowerShell Script");
      console.log("   Run: .\\run-guest-sessions-migration.ps1");
      return;
    }

    const result = await response.json();
    console.log("✅ Migration completed successfully!");
    console.log("   Result:", result);
  } catch (error) {
    console.error("");
    console.error("❌ Migration execution failed:", error.message);
    console.error("");
    console.error("📋 Please run this migration manually via Supabase Dashboard:");
    console.error("   1. Go to https://supabase.com/dashboard");
    console.error("   2. Select your project");
    console.error("   3. Go to SQL Editor");
    console.error("   4. Copy contents of:", migrationPath);
    console.error("   5. Paste and run");
  }
}

runMigration().catch(console.error);

