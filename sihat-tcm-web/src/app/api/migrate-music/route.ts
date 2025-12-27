import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Migration endpoint to add background music columns
 * DELETE THIS FILE after running the migration once
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("🚀 Running background music migration...");
    }

    // Step 1: Try to insert/update with the new columns
    // If columns don't exist, this will fail with a helpful error
    const { data, error } = await supabaseAdmin
      .from("admin_settings")
      .upsert(
        {
          id: 1,
          background_music_enabled: true,
          background_music_url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4a456e1c6c.mp3",
          background_music_volume: 0.3,
        },
        {
          onConflict: "id",
        }
      )
      .select();

    if (error) {
      console.error("Migration error:", error);

      // Check if it's a column missing error
      if (error.message.includes("column") || error.code === "42703") {
        return NextResponse.json(
          {
            success: false,
            error: "Database columns not found",
            message: "Please run this SQL in Supabase Dashboard → SQL Editor:",
            sql: `
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
                    `.trim(),
          },
          { status: 400 }
        );
      }

      throw error;
    }

    // Step 2: Verify the data was saved
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from("admin_settings")
      .select("background_music_enabled, background_music_url, background_music_volume")
      .eq("id", 1)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("✅ Migration successful!");
      console.log("Settings:", verifyData);
    }

    return NextResponse.json({
      success: true,
      message: "Background music migration completed successfully!",
      settings: verifyData,
    });
  } catch (error: any) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
