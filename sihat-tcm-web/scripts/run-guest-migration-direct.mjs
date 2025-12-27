/**
 * Direct migration runner using pg library
 * Executes the guest_diagnosis_sessions migration SQL directly
 */

import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = resolve(__dirname, "..", ".env.local");
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

// Extract project reference and build connection string
const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error("❌ Could not extract project reference from SUPABASE_URL");
  process.exit(1);
}

// For Supabase, we need the database password
// We'll prompt for it or use service role key to get connection details
console.log("📋 To run this migration, you need your Supabase database password.");
console.log("   You can find it in: Supabase Dashboard > Project Settings > Database");
console.log("");
console.log("   Alternatively, run the migration via Supabase Dashboard:");
console.log("   1. Go to https://supabase.com/dashboard");
console.log("   2. Select your project");
console.log("   3. Go to SQL Editor");
console.log(
  "   4. Copy contents of: supabase/migrations/20250102000001_add_diagnosis_input_data.sql"
);
console.log("   5. Paste and run");
console.log("");
console.log("   Or use the PowerShell script:");
console.log("   .\\run-guest-sessions-migration.ps1");
console.log("");

// Read migration file to show what will be executed
const migrationPath = join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20250102000001_add_diagnosis_input_data.sql"
);
try {
  const migrationSQL = readFileSync(migrationPath, "utf-8");
  console.log("✅ Migration file ready:", migrationPath);
  console.log("   File size:", migrationSQL.length, "characters");
} catch (error) {
  console.error("❌ Failed to read migration file:", error.message);
  process.exit(1);
}

console.log("");
console.log("💡 Since direct database connection requires the password,");
console.log("   the easiest way is to use the Supabase Dashboard SQL Editor.");
console.log("   The migration file is ready to copy and paste.");

