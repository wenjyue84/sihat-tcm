# Sihat TCM — Story

**Sihat TCM** (中医 / Traditional Chinese Medicine) is Jay's AI-powered TCM diagnosis platform — combining the classic 4-Examination Model 四诊合参 (望 Observation, 闻 Listening, 问 Inquiry, 切 Palpation) with Gemini AI to deliver personalized, trilingual (EN/ZH/BM) health consultations.

## What it is

- **sihat-tcm-web/** — Next.js 16 (App Router, TypeScript strict, Tailwind v4, Radix UI, Supabase, Gemini 2.0 Flash via AI SDK). Dev server: `localhost:3100`.
- **sihat-tcm-mobile/** — Expo React Native (JavaScript only, no TS), same Supabase backend.
- Features: Four Pillars diagnosis, personalized TCM reports, constitution-based AI meal planner (7-day), snore/sleep-sound analysis, Meridian Organ Clock + 24 Solar Terms vitality guidance.

## History / Provenance

- Canonical repo: **GitHub `wenjyue84/sihat-tcm`** (private), last active ~2026-02-07.
- Local working copy re-cloned to `2-areas/Software Projects/sihat-tcm/` on **2026-07-19** (previous local copies were archived: `4-archive/empty-stubs/Sihat-TCM-from-swp-20260523/`, `4-archive/housekeeping-2026-03-26/Sihat-TCM-obsidian/` notes, `sihat-tcm-mobile-old/`).

## Agent notes

- Follow repo `.claude/rules/`; DiagnosisWizard uses **default export**.
- Web = TypeScript strict, zero `any`; Mobile = JavaScript only.
- Docs: `sihat-tcm-web/docs/DEVELOPER_GUIDE.md`, `sihat-tcm-mobile/docs/APK_DEPLOYMENT.md`.

Keywords: tcm, sihat, chinese medicine, 中医, diagnosis, four pillars, meal planner, gemini, supabase, expo
