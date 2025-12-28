import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, hasCustomApiKey } from "@/lib/settings";
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

/**
 * API Endpoint: GET /api/config/gemini-key
 *
 * Returns the Gemini API key for the mobile app to use.
 * This allows both web and mobile apps to use the same API key
 * configured in the admin dashboard.
 *
 * Security note: This endpoint is intentionally public to allow
 * the mobile app to fetch the key. In production, consider adding
 * authentication or app-specific tokens.
 */
export async function GET(request: NextRequest) {
  try {
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
