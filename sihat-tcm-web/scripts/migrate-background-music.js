/**
 * Background Music Migration Script
 * Run this with: node scripts/migrate-background-music.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("🚀 Starting background music migration...\n");

  try {
    // Step 1: Add columns
    console.log("📝 Adding background music columns...");
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE admin_settings 
        ADD COLUMN IF NOT EXISTS background_music_enabled BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS background_music_url TEXT,
        ADD COLUMN IF NOT EXISTS background_music_volume FLOAT DEFAULT 0.5;
      `,
    });

    if (alterError) {
      // Try alternative approach using direct SQL
      console.log("⚠️  RPC method not available, using direct table update...");

      // Check if columns exist by trying to select them
      const { data: testData, error: testError } = await supabase
        .from("admin_settings")
        .select("background_music_enabled, background_music_url, background_music_volume")
        .limit(1);

      if (testError && testError.message.includes("column")) {
        console.error("❌ Columns do not exist and cannot be added via Supabase client.");
        console.error("   Please run the SQL manually in Supabase Dashboard → SQL Editor:");
        console.log("\n" + "=".repeat(60));
        console.log(`
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS background_music_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_music_url TEXT,
ADD COLUMN IF NOT EXISTS background_music_volume FLOAT DEFAULT 0.5;

INSERT INTO admin_settings (id, background_music_enabled, background_music_url, background_music_volume)
VALUES (1, true, 'https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3', 0.3)
ON CONFLICT (id) DO UPDATE SET
  background_music_enabled = EXCLUDED.background_music_enabled,
  background_music_url = EXCLUDED.background_music_url,
  background_music_volume = EXCLUDED.background_music_volume;
        `);
        console.log("=".repeat(60) + "\n");
        process.exit(1);
      }

      console.log("✅ Columns already exist!");
    } else {
      console.log("✅ Columns added successfully!");
    }

    // Step 2: Insert/Update default settings
    console.log("\n📝 Setting default background music configuration...");
    const { error: upsertError } = await supabase.from("admin_settings").upsert(
      {
        id: 1,
        background_music_enabled: true,
        background_music_url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3",
        background_music_volume: 0.3,
      },
      {
        onConflict: "id",
      }
    );

    if (upsertError) {
      console.error("❌ Failed to set default configuration:", upsertError.message);
      process.exit(1);
    }

    console.log("✅ Default configuration saved!");
    console.log("   - Music: ENABLED");
    console.log("   - URL: https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3");
    console.log("   - Volume: 30%");

    // Step 3: Verify
    console.log("\n🔍 Verifying configuration...");
    const { data, error: selectError } = await supabase
      .from("admin_settings")
      .select("background_music_enabled, background_music_url, background_music_volume")
      .eq("id", 1)
      .single();

    if (selectError) {
      console.error("❌ Failed to verify:", selectError.message);
      process.exit(1);
    }

    console.log("✅ Verification successful!");
    console.log("   Current settings:", JSON.stringify(data, null, 2));

    console.log("\n🎉 Migration completed successfully!");
    console.log("   You can now refresh your app to hear the background music.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
