import { NextRequest, NextResponse } from "next/server";
import { getAdminSettings, DEFAULT_SETTINGS, AdminSettings } from "@/lib/settings";
import { saveSettingsWithFallback } from "@/lib/settingsStorage";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

// Create a Supabase client for verifying user tokens
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to get authenticated user from request
async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get token from Authorization header (sent by frontend)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (!error && user) return user;
    }

    // Fallback: try to get from cookies
    const cookies = request.cookies.getAll();
    const authCookie = cookies.find(
      (c) => c.name.includes("auth-token") && c.name.startsWith("sb-")
    );

    if (authCookie) {
      try {
        const cookieData = JSON.parse(authCookie.value);
        const accessToken = cookieData.access_token || cookieData.accessToken;
        if (accessToken) {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser(accessToken);
          if (!error && user) return user;
        }
      } catch {
        // Try cookie value as direct token
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(authCookie.value);
        if (!error && user) return user;
      }
    }

    return null;
  } catch (error) {
    console.error("[Admin Settings] Error getting authenticated user:", error);
    return null;
  }
}

// Helper to verify user is admin using service role key (bypasses RLS)
async function verifyAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error("[Admin Settings] Service role key not available for admin verification");
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("[Admin Settings] Error verifying admin:", error);
      return false;
    }
    return data.role === "admin";
  } catch (error) {
    console.error("[Admin Settings] Error verifying admin:", error);
    return false;
  }
}

// GET - Retrieve settings
export async function GET(request: NextRequest) {
  try {
    const settings = await getAdminSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[Admin Settings GET] Error:", error);
    return NextResponse.json({ error: "Failed to retrieve settings" }, { status: 500 });
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in and try again." },
        { status: 401 }
      );
    }

    // Try to verify admin (but don't fail if Supabase is unavailable)
    let isAdmin = false;
    if (supabaseAdmin) {
      isAdmin = await verifyAdmin(user.id);
    } else {
      // If Supabase is not available, allow saving to file (for development/testing)
      console.warn("[Admin Settings PUT] Supabase not available, allowing file-based save");
      isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();

    // Prepare settings object (camelCase)
    const settingsToSave: Partial<AdminSettings> = {};
    if (body.geminiApiKey !== undefined) settingsToSave.geminiApiKey = body.geminiApiKey;
    if (body.medicalHistorySummaryPrompt !== undefined)
      settingsToSave.medicalHistorySummaryPrompt = body.medicalHistorySummaryPrompt;
    if (body.dietaryAdvicePrompt !== undefined)
      settingsToSave.dietaryAdvicePrompt = body.dietaryAdvicePrompt;
    if (body.backgroundMusicEnabled !== undefined)
      settingsToSave.backgroundMusicEnabled = body.backgroundMusicEnabled;
    if (body.backgroundMusicUrl !== undefined)
      settingsToSave.backgroundMusicUrl = body.backgroundMusicUrl;
    if (body.backgroundMusicVolume !== undefined)
      settingsToSave.backgroundMusicVolume = body.backgroundMusicVolume;

    // Save with fallback (Supabase + file)
    const result = await saveSettingsWithFallback(settingsToSave);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to save settings" },
        { status: 500 }
      );
    }

    // Return the updated settings by fetching them back
    const updatedSettings = await getAdminSettings();

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error: unknown) {
    const errorResponse = createErrorResponse(error, "API/admin/settings");
    const errorBody = await errorResponse.json();
    return NextResponse.json(errorBody, { status: errorResponse.status });
  }
}
