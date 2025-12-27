// Simple migration script using existing Supabase setup
import { createClient } from "@supabase/supabase-js";

// Get credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials");
  console.error(
    "Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  console.log("🚀 Running background music migration...\n");

  try {
    // First, check if a row exists
    console.log("📝 Checking existing settings...");
    const { data: existing, error: fetchError } = await supabase
      .from("admin_settings")
      .select("*")
      .limit(1)
      .single();

    let data, error;

    if (existing) {
      // Update existing row
      console.log("📝 Updating existing settings...");
      const result = await supabase
        .from("admin_settings")
        .update({
          background_music_enabled: true,
          background_music_url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3",
          background_music_volume: 0.3,
        })
        .eq("id", existing.id)
        .select();

      data = result.data;
      error = result.error;
    } else {
      // Insert new row
      console.log("📝 Creating new settings row...");
      const result = await supabase
        .from("admin_settings")
        .insert({
          background_music_enabled: true,
          background_music_url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3",
          background_music_volume: 0.3,
        })
        .select();

      data = result.data;
      error = result.error;
    }

    if (error) {
      if (error.message.includes("column") || error.code === "42703") {
        console.error("\n❌ Database columns do not exist yet!\n");
        console.log("Please run this SQL in Supabase Dashboard → SQL Editor:\n");
        console.log("─".repeat(70));
        console.log(`
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS background_music_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_music_url TEXT,
ADD COLUMN IF NOT EXISTS background_music_volume FLOAT DEFAULT 0.5;

INSERT INTO admin_settings (
  id, 
  background_music_enabled, 
  background_music_url, 
  background_music_volume
)
VALUES (
  1, 
  true, 
  'https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3', 
  0.3
)
ON CONFLICT (id) DO UPDATE SET
  background_music_enabled = EXCLUDED.background_music_enabled,
  background_music_url = EXCLUDED.background_music_url,
  background_music_volume = EXCLUDED.background_music_volume;
        `);
        console.log("─".repeat(70));
        console.log("\nThen run this script again.\n");
        process.exit(1);
      }
      throw error;
    }

    console.log("✅ Settings saved successfully!");
    console.log("\n📊 Current configuration:");
    console.log("   - Music enabled: ✓");
    console.log("   - URL: https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3");
    console.log("   - Volume: 30%");

    console.log("\n🎉 Migration complete! Refresh your app to hear the music.\n");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
