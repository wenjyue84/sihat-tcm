# MEMORY.md — Core Memory

*Essential, durable facts. Loaded every session. Keep it small.*

## Project Facts

- **Sihat TCM** is an AI-powered Traditional Chinese Medicine diagnostic platform
- Uses **4-Examination Model** (四诊合参): Inquiry (问), Visual (望), Audio (闻), Pulse (切)
- **Web app**: Next.js 16, TypeScript strict, Tailwind CSS v4, Supabase, Gemini AI
- **Mobile app**: Expo React Native, JavaScript only (no TypeScript)
- Dev server runs on port **3100**

## Architecture Decisions

- DiagnosisWizard uses **default export** (not named) — critical for imports
- IoT device integration supports: pulse, blood pressure, oxygen, temperature, HRV, stress
- Session drafts saved to Supabase for recovery
- AI model routing based on case complexity (Master/Expert/Physician tiers)

## Code Conventions

- Web: Double quotes, 100 char width, trailing comma es5, semicolons required
- Mobile: StyleSheet.create() required, no inline styles, FlatList over .map()
- Both: Functional components only, no class components

## Decisions

<Add important decisions here as they are made>

## Preferences

<Add learned preferences here>

---

**Last updated**: 2026-01-30
