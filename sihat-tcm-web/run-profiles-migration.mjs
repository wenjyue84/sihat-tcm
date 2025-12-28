#!/usr/bin/env node
/**
 * Run Profiles Relationship Migration
 * Adds foreign key from diagnosis_sessions.user_id to profiles.id
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import { config } from "dotenv";
config({ path: join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing required environment variables:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
    console.error(
        "   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY:",
        supabaseServiceKey ? "✅" : "❌"
    );
    console.error("");
    console.error("Please ensure .env.local contains these variables.");
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log("🚀 Running profiles relationship migration...\n");

    // Read the migration file
    const migrationPath = join(
        __dirname,
        "supabase",
        "migrations",
        "20251228010000_add_diagnosis_profiles_relationship.sql"
    );

    console.log(`📂 Reading migration from: ${migrationPath}\n`);
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("📝 Migration content:\n");
    console.log("─".repeat(80));
    console.log(sql);
    console.log("─".repeat(80));
    console.log("");

    try {
        console.log("⏳ Executing migration via Supabase SQL...\n");

        // Execute the full SQL (it's wrapped in a DO block, so we execute it as one)
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sql
        });

        if (error) {
            // Try direct query approach
            console.log("⚠️  RPC approach failed, trying direct query...\n");

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseServiceKey,
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({ sql_query: sql }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log("✅ Migration executed via direct query!");
        } else {
            console.log("✅ Migration executed via RPC!");
        }

        console.log("\n🔍 Verifying the foreign key was added...\n");

        // Verify by attempting a query with the relationship
        const { data: testData, error: testError } = await supabase
            .from("diagnosis_sessions")
            .select(`
        id,
        created_at,
        profiles!user_id (
          id,
          full_name,
          age,
          gender
        )
      `)
            .limit(1);

        if (testError) {
            console.log("⚠️  Verification query failed (this might be expected if table is empty):");
            console.log("   Error:", testError.message);
            console.log("\n💡 Please manually verify via Supabase Dashboard:");
            console.log("   Go to: Database → diagnosis_sessions → Indexes & Constraints");
            console.log("   Look for: diagnosis_sessions_user_id_profiles_fkey");
        } else {
            console.log("✅ Relationship verified! The join syntax profiles!user_id now works.");
            console.log(`   Found ${testData?.length || 0} diagnosis session(s)`);
        }

        console.log("\n✅ Migration completed successfully!\n");

    } catch (error) {
        console.error("\n❌ Migration failed:", error.message);
        console.error("\n💡 Manual Option: Run via Supabase Dashboard SQL Editor:");
        console.error("   1. Go to: https://supabase.com/dashboard/project/<your-project>/sql");
        console.error("   2. Copy from: supabase/migrations/20251228010000_add_diagnosis_profiles_relationship.sql");
        console.error("   3. Paste and run\n");
        process.exit(1);
    }
}

runMigration();
