#!/usr/bin/env node
/**
 * Medication Update Runner
 * Executes the migration and seed scripts for medication update
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname); // Go up one level from scripts/

// Load environment variables
import { config } from "dotenv";
config({ path: join(rootDir, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing required environment variables.");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Exists" : "Missing");
    console.error("   Key (SERVICE_ROLE or ANON):", supabaseServiceKey ? "Exists" : "Missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSql(sql, description, split = true) {
    console.log(`🚀 Running ${description}...\n`);

    let statements = [sql];
    if (split) {
        statements = sql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith("--"));
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length === 0 || statement.startsWith("--")) continue;

        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        // Try RPC first
        const { error } = await supabase.rpc("exec_sql", {
            sql_query: statement,
        });

        if (error) {
            console.error(`   ❌ Error: ${error.message}`);
            // If RPC fails (maybe not exists), try direct REST RPC call as fallback
            if (error.message.includes("function") && error.message.includes("does not exist")) {
                console.error("   ⚠️ exec_sql function missing. Cannot execute via API.");
                return false;
            }
        } else {
            console.log(`   ✅ Success`);
        }
    }
    return true;
}

async function main() {
    // 1. Run Migration
    const migrationPath = join(rootDir, "supabase/migrations/20251228000002_extend_patient_medicines.sql");
    const migrationSql = readFileSync(migrationPath, "utf-8");
    await runSql(migrationSql, "Migration: Extend patient_medicines", true);

    // 2. Run Seed
    const seedPath = join(rootDir, "supabase/seed_yeak_medications.sql");
    const seedSql = readFileSync(seedPath, "utf-8");
    // Seed is a DO block, do not split
    await runSql(seedSql, "Seed: Yeak Kiew Ai Medications", false);

    console.log("\n✅ Process completed!");
}

main().catch(console.error);
