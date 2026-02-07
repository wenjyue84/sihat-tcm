# Telegram notifications — context and purpose

Use this as context when implementing or extending Telegram notifications in Sihat TCM.

---

## Context

- **App:** Sihat TCM — AI-powered TCM diagnostic platform (Next.js in `sihat-tcm-web/`).
- **Feature:** The app sends information to a designated Telegram chat using a Telegram Bot API bot. Notifications are **fire-and-forget**: failures are logged and never block the main flow.
- **Config (required in env):**
  - `TELEGRAM_BOT_TOKEN` — Bot token from [@BotFather](https://t.me/BotFather).
  - `TELEGRAM_CHAT_ID` — Target chat ID (e.g. your user or group) where messages are delivered.

---

## Purpose

**Send information through the Telegram bot to the designated chat ID.**

Use this when:
- Adding a new event that should notify you (e.g. “user completed X”, “report generated”, “error spike”).
- Changing what is sent (message format, payload, or when it is triggered).
- Debugging or testing Telegram delivery.

---

## Current implementation

| What | Where | Trigger |
|------|--------|--------|
| **Diagnosis saved** | `lib/telegram.ts` → `sendDiagnosisNotification(reportData, sessionData, isGuest)` | Called from `lib/actions/diagnosis.ts` after saving a diagnosis (guest or authenticated). Sends patient name, diagnosis, constitution, score, symptoms, summary, link to report. |
| **Report first viewed** | `lib/telegram.ts` → `sendReportViewedNotification({ isGuest })` | Called from `POST /api/notifications/report-viewed`. Client calls this when the user first sees the Comprehensive TCM Report at the end of the wizard. Sends a short “User/Guest just opened the report” message with timestamp. |

**API:** Telegram Bot API base: `https://api.telegram.org/bot`. Messages are sent via `POST …/sendMessage` with `parse_mode: "HTML"`. See `lib/telegram.ts` for `esc()` and message building.

**Adding a new notification:**
1. In `lib/telegram.ts`, add a function that reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, builds the message (use `esc()` for user content in HTML), and calls `fetch(…/sendMessage)`.
2. Call it fire-and-forget (e.g. `.catch(() => {})`) from the right place (server action, API route, or cron).
3. Optionally add an API route (e.g. under `app/api/notifications/`) if the trigger is from the client.

---

## Prompt (copy-paste for AI or briefs)

**Short:**

> The Sihat TCM app sends information through a Telegram bot to a designated chat ID. Config: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Logic lives in `sihat-tcm-web/src/lib/telegram.ts`; send messages via the Telegram Bot API `sendMessage` endpoint. Notifications are fire-and-forget and must not block the main flow.

**Full:**

> **Context:** Sihat TCM is an AI-powered TCM diagnostic web app (Next.js). It uses a Telegram bot to send notifications to a single designated chat (config: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` in env).  
> **Purpose:** Send information through the Telegram bot to that chat ID (e.g. “diagnosis saved”, “report viewed”, alerts).  
> **Implementation:** All sending logic is in `sihat-tcm-web/src/lib/telegram.ts`. Use the existing helpers (e.g. `esc()` for HTML), add new exported functions for new event types, and call them fire-and-forget from server code or from API routes if triggered by the client. Use `parse_mode: "HTML"` and the Bot API `sendMessage` endpoint. Do not block the main app flow on Telegram success or failure.
