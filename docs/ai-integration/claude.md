# Sihat TCM — Claude Integration Guide

> Use this alongside `GEMINI.md`, `SYSTEM_DESCRIPTION.md`, and `DEVELOPER_MANUAL.md`. It maps our existing Gemini-based flows to Anthropic Claude and lists the project touchpoints to update.

## 1) Goals and Scope
- Keep feature parity with Gemini flows: four-examination intake, multi-language (en/zh/ms), doctor-tier model selection, report chat, and multimedia analysis.
- Maintain COStar-style prompting and centralized prompt sources (`src/lib/systemPrompts.ts` on web, `sihat-tcm-mobile/constants/SystemPrompts.js` on mobile).
- Preserve safety: respect medical disclaimers, avoid hard diagnoses, and surface confidence/validation status where available.

## 2) Model Mapping (proposed)
- Master (名医大师): `claude-3.5-sonnet` (depth + cost balance).
- Expert (专家医师): `claude-3.5-haiku` (fast, capable).
- Physician (医师): `claude-3-haiku` (lightweight, default fallback).
- Vision: use the same IDs above; Claude 3.x models accept images and PDF/docs for multimodal flows.
- Streaming: enable `stream`/`delta` responses to mirror Vercel AI SDK streaming UX.

## 3) Web App Touchpoints (Next.js 16, `sihat-tcm/`)
- Model selection: update the mapping in `src/lib/doctorLevels.ts` and `DoctorContext` (`src/contexts/DoctorContext.tsx`) to return Claude IDs per tier.
- Core API routes to adapt:
  - `/api/chat` (inquiry conversation)
  - `/api/consult` (final diagnosis synthesis)
  - `/api/report-chat` (report Q&A)
  - `/api/analyze-image` (tongue/face/body vision)
  - `/api/analyze-audio` (voice analysis)
  - `/api/summarize-inquiry`, `/api/extract-text`, `/api/generate-infographic`, `/api/validate-medicine`
- Prompt sources: `src/lib/systemPrompts.ts` (COStar sections). Keep formats and safety rails; adjust provider-specific tokens only.
- Utils: `repairJSON`, `generateMockReport`, and mock profiles in `DiagnosisWizard` should stay provider-agnostic.

## 4) Mobile App Touchpoints (`sihat-tcm-mobile/`)
- System prompts: `constants/SystemPrompts.js`.
- API wrapper: `lib/apiConfig.js` (base URLs/headers), plus `lib/pdfGenerator.js` and `lib/infographicGenerator.js` if responses change shape.
- Screens that rely on AI responses: diagnosis screens under `screens/diagnosis/` and chat/report modals (e.g., `ReportChatModal.js`, `WesternDoctorChatModal.js`).
- Replace any direct Gemini client usage with the Claude SDK or HTTPS calls routed through the web APIs to keep logic centralized.

## 5) Prompting and Response Shapes
- Keep existing JSON/Markdown shapes from Gemini responses so UI parsing stays stable (see `DEVELOPER_MANUAL.md` API section).
- Enforce concise, clinically careful tone; avoid definitive diagnoses and include "consult a licensed practitioner" language where relevant.
- Maintain multilingual outputs; respect the `language` parameter already passed through API bodies.

## 6) Implementation Steps (suggested order)
1) Add Anthropic client setup (server-side) and env vars (`ANTHROPIC_API_KEY`); keep Gemini keys untouched for fallback during rollout.
2) Update doctor-level model mapping to the Claude IDs above.
3) Swap model calls inside API routes; keep request/response schema identical to avoid UI breakage.
4) Verify streaming handling in `/api/chat` and `/api/report-chat` with Claude’s streaming API.
5) Re-run test pages (`/test-chat`, `/test-report`, `/test-gemini` equivalent) and `test-runner` to confirm JSON shape compatibility.
6) For mobile, route through web APIs first; only use direct Claude SDK calls if latency or media constraints require it.

## 7) Safety and Compliance Checklist
- No PII logging; keep existing Supabase/RLS constraints intact.
- Honour rate limits and add provider-level retries/backoff where Gemini fallback logic existed.
- Surface confidence or validation flags (`is_valid_image`, `modelUsed`, etc.) when available; otherwise, add a generic "analysis confidence not provided" notice.

## 8) Database & Migration Capability

> **AI Assistants can run SQL migrations directly** - The `SUPABASE_SERVICE_ROLE_KEY` is configured in `sihat-tcm-web/.env.local`.

### Running Migrations

When the user asks to run SQL or database migrations:

1. Create a Node.js script (`.mjs`) in `sihat-tcm-web/`:
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   import dotenv from 'dotenv';
   dotenv.config({ path: '.env.local' });
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   );
   // Run queries with admin privileges
   ```

2. Execute with: `node your-migration.mjs`

### Available Scripts
- `run-migration.mjs` - Doctor approval column migration
- `seed-test-doctors.mjs` - Create test doctor accounts
- `seed-yeak-data.mjs` - Seed patient test data

### Workflow
Use `/run-sql-migration` workflow for guided migration steps.

## 9) References
- Web rules and patterns: `GEMINI.md` (project rules), `DEVELOPER_MANUAL.md` (architecture, APIs, prompts), `SYSTEM_DESCRIPTION.md` (product intent).
- Mobile conventions: `AUTH_IMPLEMENTATION.md`, `FEATURE_PROMPTS.md`, and `constants/SystemPrompts.js`.
- Data and schema: `supabase_setup.sql`, `schema.sql`, `update_schema.sql`.

## 9) Rollout Plan (lightweight)
- Phase 0: dual-run Gemini + Claude behind a feature flag (env or query param in `DoctorContext`).
- Phase 1: switch default tiers to Claude; keep Gemini as failover.
- Phase 2: remove Gemini-specific code only after parity tests pass across web and mobile flows.


