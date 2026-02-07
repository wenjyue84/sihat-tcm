/**
 * Telegram Notification Utility
 *
 * Sends diagnosis report notifications via Telegram bot.
 * Fire-and-forget: failures are logged but never block the save flow.
 *
 * @module lib/telegram
 */

import { devLog } from "@/lib/systemLogger";
import type { SaveDiagnosisInput, DiagnosisSession, GuestDiagnosisSession } from "@/types/database";

const TELEGRAM_API = "https://api.telegram.org/bot";

/** Malaysia timezone (UTC+8). */
const MALAYSIA_TZ = "Asia/Kuala_Lumpur";

/**
 * Format a date in Malaysia time for display in Telegram messages.
 */
function formatMalaysiaTime(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: MALAYSIA_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

interface TelegramSendResult {
  ok: boolean;
  description?: string;
}

/**
 * Extract a display name from the report data.
 * Guest sessions use guest_name; authenticated use patient_summary.
 */
function extractPatientName(reportData: SaveDiagnosisInput, isGuest: boolean): string {
  if (isGuest && reportData.guest_name) {
    return reportData.guest_name;
  }
  const report = reportData.full_report;
  if (typeof report === "object" && report?.patient_summary?.name) {
    return report.patient_summary.name;
  }
  return "Unknown";
}

/**
 * Escape HTML special characters for Telegram HTML parse mode.
 */
function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Build an HTML-formatted Telegram message from diagnosis data.
 * Uses HTML parse mode which is more forgiving than MarkdownV2.
 */
function buildMessage(
  reportData: SaveDiagnosisInput,
  sessionData: DiagnosisSession | GuestDiagnosisSession,
  isGuest: boolean
): string {
  const name = extractPatientName(reportData, isGuest);
  const report = reportData.full_report;
  const patientSummary = typeof report === "object" ? report?.patient_summary : undefined;
  const analysis = typeof report === "object" ? report?.analysis : undefined;

  const typeBadge = isGuest ? "Guest" : "Patient";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  const reportLink = `${appUrl}/patient/history/${sessionData.id}`;

  const lines: string[] = [];

  lines.push(`<b>New Diagnosis Report</b> [${typeBadge}]`);
  lines.push("");

  // Patient info
  const infoParts: string[] = [`<b>Name:</b> ${esc(name)}`];
  if (patientSummary?.age) infoParts.push(`<b>Age:</b> ${patientSummary.age}`);
  if (patientSummary?.gender) infoParts.push(`<b>Gender:</b> ${esc(patientSummary.gender)}`);
  if (patientSummary?.height || patientSummary?.weight) {
    const hw: string[] = [];
    if (patientSummary.height) hw.push(`${patientSummary.height}cm`);
    if (patientSummary.weight) hw.push(`${patientSummary.weight}kg`);
    infoParts.push(`<b>Body:</b> ${hw.join(" / ")}`);
  }
  lines.push(infoParts.join(" | "));
  lines.push("");

  // Diagnosis
  if (reportData.primary_diagnosis) {
    lines.push(`<b>Diagnosis:</b> ${esc(reportData.primary_diagnosis)}`);
  }
  if (reportData.constitution) {
    lines.push(`<b>Constitution:</b> ${esc(reportData.constitution)}`);
  }
  if (reportData.overall_score != null) {
    lines.push(`<b>Score:</b> ${reportData.overall_score}/100`);
  }
  lines.push("");

  // Symptoms
  if (reportData.symptoms && reportData.symptoms.length > 0) {
    const symptomList = reportData.symptoms.slice(0, 8).map((s) => esc(s));
    const suffix = reportData.symptoms.length > 8 ? ` +${reportData.symptoms.length - 8} more` : "";
    lines.push(`<b>Symptoms:</b> ${symptomList.join(", ")}${suffix}`);
    lines.push("");
  }

  // Analysis summary
  if (analysis?.summary) {
    const truncated =
      analysis.summary.length > 300 ? analysis.summary.slice(0, 300) + "..." : analysis.summary;
    lines.push(`<b>Summary:</b> ${esc(truncated)}`);
    lines.push("");
  }

  // Report link
  lines.push(`<a href="${reportLink}">View Report</a>`);

  return lines.join("\n");
}

/**
 * Send a Telegram notification for a completed diagnosis session.
 *
 * This function is designed to be called fire-and-forget:
 * ```ts
 * sendDiagnosisNotification(reportData, data, true).catch(() => {});
 * ```
 *
 * It will never throw in normal operation — errors are caught and logged.
 */
export async function sendDiagnosisNotification(
  reportData: SaveDiagnosisInput,
  sessionData: DiagnosisSession | GuestDiagnosisSession,
  isGuest: boolean
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    devLog(
      "warn",
      "Telegram",
      "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping notification"
    );
    return;
  }

  try {
    const message = buildMessage(reportData, sessionData, isGuest);

    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const result = (await response.json()) as TelegramSendResult;

    if (!result.ok) {
      devLog("error", "Telegram", "Failed to send notification", {
        status: response.status,
        description: result.description,
      });
    } else {
      devLog("info", "Telegram", "Diagnosis notification sent", { sessionId: sessionData.id });
    }
  } catch (error: unknown) {
    devLog("error", "Telegram", "Notification error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Send a Telegram notification when a user first sees the Comprehensive TCM Report
 * (e.g. at the end of the diagnosis wizard). Uses TELEGRAM_CHAT_ID as set in env.
 *
 * Fire-and-forget; errors are logged only.
 */
export async function sendReportViewedNotification(options?: {
  isGuest?: boolean;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    devLog(
      "warn",
      "Telegram",
      "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping report-viewed notification"
    );
    return;
  }

  try {
    const typeLabel = options?.isGuest === true ? "Guest" : "User";
    const text = `📋 <b>Comprehensive TCM Report viewed</b>\n\nA ${typeLabel} just opened the report at the end of the diagnosis flow.\n\n<code>${formatMalaysiaTime(new Date())} (MYT)</code>`;

    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const result = (await response.json()) as TelegramSendResult;

    if (!result.ok) {
      devLog("error", "Telegram", "Report-viewed notification failed", {
        status: response.status,
        description: result.description,
      });
    } else {
      devLog("info", "Telegram", "Report-viewed notification sent");
    }
  } catch (error: unknown) {
    devLog("error", "Telegram", "Report-viewed notification error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
