# AGENTS.md — Workspace Operating Rules

> **Purpose:** Onboard the agent each session. Keep short and universally applicable.

<critical-context>
## Inherited Rules
- **File ops:** Read before edit. Archive instead of delete.
- **Verify:** Lint + type-check + test before committing.
- **Memory:** Only today's log editable.
</critical-context>

<what-map>
## WHAT — Map of this repo

- **Identity:** `.claude/agents/identity/` (SOUL.md, USER.md, MEMORY.md, MEMORY/, Bank/)
- **Structure:**
  - `sihat-tcm-web/` — Next.js 16 (TypeScript, Tailwind CSS v4)
  - `sihat-tcm-mobile/` — Expo React Native (JavaScript)
  - `docs/` — Documentation
  - `.claude/rules/` — Domain rules (diagnosis, react, typescript)
- **Tech:** TypeScript/JavaScript, npm, Vitest (web), Jest (mobile), Supabase, Gemini AI
</what-map>

<why-purpose>
## WHY — Purpose

**Sihat TCM:** AI-powered TCM diagnostic platform implementing the 4-Examination Model (四诊合参). Strict typing on web, consistent patterns across platforms.
</why-purpose>

<how-work>
## HOW — How to work here

1. **Every session:** AGENTS.md → SOUL.md → USER.md → memory (today + yesterday).
2. **Before coding:** Read foundation files, search codebase, understand patterns. Prefer pointers.
3. **Verify:**
   - Web: `cd sihat-tcm-web && npm run lint && npm run type-check && npm run test:run`
   - Mobile: `cd sihat-tcm-mobile && npm test`
4. **Memory:** MEMORY.md = essential facts; MEMORY/YYYY-MM-DD.md = daily; Bank/ = typed pages.
5. **Safety:** No data exfiltration. No destructive commands without asking. Archive instead of delete.
6. **Code style:** Follow `.claude/rules/` and `.cursor/rules/`. Use linter and formatter.
</how-work>

<progressive-disclosure>
## Progressive disclosure

| Doc/skill | When |
|-----------|------|
| `.claude/rules/diagnosis.md` | Diagnosis flow |
| `.claude/rules/react.md` | React patterns |
| `.claude/rules/typescript.md` | TypeScript conventions |
| `.claude/CLAUDE.md` | Full project context |
| meta-skill | Governance, structure |
</progressive-disclosure>

<summary>
## Summary

WHAT (repo map), WHY (TCM platform), HOW (scan order, verify via tests, memory, safety). Progressive disclosure for domain rules.
</summary>

## Cursor Cloud specific instructions

### Services overview

| Service | Directory | Dev command | Port |
|---------|-----------|-------------|------|
| Web app (Next.js 16 + Turbopack) | `sihat-tcm-web/` | `npm run dev` | 3100 |
| Mobile app (Expo RN) | `sihat-tcm-mobile/` | `npx expo start` | 8081 |

The web app is the primary service. The mobile app is optional and connects to the web API.

### Environment variables

The web app needs a `.env.local` in `sihat-tcm-web/` with at minimum:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public anon keys; same values are hardcoded in `sihat-tcm-mobile/lib/supabase.js`)
- `GOOGLE_GENERATIVE_AI_API_KEY` — required for AI diagnosis features; without it the app loads but AI routes fail

### Verification commands

See `CLAUDE.md` and the HOW section above. The standard verification commands are:
- Web: `cd sihat-tcm-web && npm run lint && npm run type-check && npm run test:run`
- Mobile: `cd sihat-tcm-mobile && npm test`

### Known pre-existing issues (as of setup)

- **Lint**: ~954 errors, mostly `@typescript-eslint/no-explicit-any` in generated TinaCMS files, test pages, and scripts. These are pre-existing.
- **Type-check**: ~200+ errors across accessibility, voice, translations, and test files. Pre-existing.
- **Web tests (Vitest)**: 12/29 suites pass, 244/315 tests pass. Failures are pre-existing (missing modules, stale mocks).
- **Mobile tests (Jest)**: All 3 suites fail due to `jest.setup.js` referencing `react-native/Libraries/Animated/NativeAnimatedHelper` which doesn't exist in RN 0.81.x. Pre-existing.
- The Supabase client in `src/lib/supabase/client.ts` gracefully falls back to placeholder values when env vars are missing.

### Gotchas

- Husky hooks run from `sihat-tcm-web/`, not the repo root. The `prepare` script in `package.json` handles this, but `git commit` from the repo root may fail if the working directory isn't `sihat-tcm-web/`.
- The dev server uses Turbopack (`--turbopack` flag). First page load compiles on demand and may take several seconds.
