/**
 * POST /api/notifications/report-viewed
 *
 * Notifies (e.g. via Telegram) when a user first sees the Comprehensive TCM Report
 * at the end of the diagnosis flow. Called once per report view from the client.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendReportViewedNotification } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const isGuest = typeof body?.isGuest === "boolean" ? body.isGuest : undefined;

    // Check if environment variables are set
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json({
        ok: false,
        sent: false,
        message: "Telegram credentials not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in environment variables)"
      });
    }

    await sendReportViewedNotification({ isGuest });

    return NextResponse.json({
      ok: true,
      sent: true,
      message: "Report notification sent to professional doctor via P2P encrypted Telegram"
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      sent: false,
      message: `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
