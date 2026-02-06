import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, hasCustomApiKey } from "@/lib/settings";
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

/**
 * API Endpoint: GET /api/config/gemini-key
 *
 * Returns the Gemini API key for the mobile app to use.
 * SECURITY: Requires X-App-Token header for authentication.
 *
 * Set MOBILE_APP_TOKEN in .env.local and configure it in mobile app.
 */

// App-specific token for mobile app authentication
const MOBILE_APP_TOKEN = process.env.MOBILE_APP_TOKEN;

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require app token for API key access
    const appToken = request.headers.get("x-app-token");

    if (!MOBILE_APP_TOKEN) {
      console.error("[Gemini Key API] MOBILE_APP_TOKEN not configured");
      return NextResponse.json(
        {
          success: false,
          error: "API key endpoint not configured. Set MOBILE_APP_TOKEN in environment.",
        },
        { status: 503 }
      );
    }

    if (!appToken || appToken !== MOBILE_APP_TOKEN) {
      console.warn("[Gemini Key API] Invalid or missing app token");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Valid app token required.",
        },
        { status: 401 }
      );
    }

    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "No API key configured. Please set one in the admin dashboard.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey: apiKey,
      source: hasCustomApiKey() ? "admin_dashboard" : "environment_variable",
    });
  } catch (error: unknown) {
    const errorResponse = createErrorResponse(error, "API/config/gemini-key");
    const errorBody = await errorResponse.json();
    return NextResponse.json(
      {
        success: false,
        ...errorBody,
      },
      { status: errorResponse.status }
    );
  }
}
