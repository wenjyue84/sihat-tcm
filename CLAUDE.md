# CLAUDE.md — Claude / IDE Global Instructions

> **Purpose:** Onboard Claude into this codebase each session.

<critical-context>
## CRITICAL — Must Follow Always
- **File ops:** Read before edit. Archive instead of delete.
- **Verify:** Run `npm run lint && npm run type-check && npm run test:run` (web) or `npm test` (mobile).
- **Types:** Zero `any` in production code. Strict mode enabled.
</critical-context>

<what-map>
## WHAT — Map

- **Repo:** Sihat TCM — AI-powered TCM diagnostic platform
  - `sihat-tcm-web/` — Next.js 16 (TypeScript)
  - `sihat-tcm-mobile/` — Expo React Native (JavaScript)
  - `docs/` — Documentation
- **Tech:** TypeScript (web), JavaScript (mobile), npm, Supabase, Gemini AI
- **Platform:** Windows 11, PowerShell. Relative paths; forward slashes.
</what-map>

<why-purpose>
## WHY — Purpose

Sihat TCM provides AI-powered TCM diagnostics using the 4-Examination Model (四诊合参). Maintain strict typing on web, consistent patterns across platforms.
</why-purpose>

<how-work>
## HOW — How to work

1. **Follow AGENTS.md** first (scan order, memory, safety).
2. **Check learnings:** `.claude/notes/INDEX.md` for task-specific notes (mistakes, patterns, decisions).
3. **Full context:** See `.claude/CLAUDE.md` for architecture, commands, conventions.
4. **Verify:**
   - Web: `cd sihat-tcm-web && npm run lint && npm run type-check && npm run test:run`
   - Mobile: `cd sihat-tcm-mobile && npm test`
5. **Memory:** "Remember this" → MEMORY.md or MEMORY/YYYY-MM-DD.md.
</how-work>

<progressive-disclosure>
## Progressive disclosure

| Doc/skill | When |
|-----------|------|
| AGENTS.md | Always first |
| `.claude/notes/INDEX.md` | Task-specific learnings (updated after PRs) |
| `.claude/CLAUDE.md` | Full project context, dev commands |
| `.claude/rules/*` | Domain-specific rules |
| meta-skill | Governance, structure |
</progressive-disclosure>

<summary>
## Summary

WHAT (repo map, tech), WHY (TCM platform), HOW (AGENTS.md first, verify via tests). Full details in `.claude/CLAUDE.md`.
</summary>

## Tools

Use these before writing an ad-hoc script. Every path below existed on disk when this block was generated (2026-09-11, hub_lint.py HUB-010); regenerate with `uv run …/_tools/hub-lint/hub_lint.py --path <this folder> --fix --rules HUB-010`.

| Kind | Command (run from this folder) | Notes |
|---|---|---|
| ACI | `node sihat-tcm-go/aci.mjs describe|status|query|test` | JSON out; `describe --json` lists suites. Coverage: `1-projects/chief-of-staff/wiki/aci-coverage.md` |
| npm (in `sihat-tcm-mobile/`) | `npm run start`, `npm run android`, `npm run ios`, `npm run web`, `npm run test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:ci` | from `sihat-tcm-mobile/package.json` |
| npm (in `sihat-tcm-web/`) | `npm run dev`, `npm run dev-https`, `npm run dev:tina`, `npm run dev:turbo`, `npm run dev:clear`, `npm run build`, `npm run build:tina`, `npm run start`, `npm run lint`, `npm run type-check`, `npm run test`, `npm run test:run` | from `sihat-tcm-web/package.json` |
| npm (in `tools/command-runner/`) | `npm run dev`, `npm run build`, `npm run preview`, `npm run electron:dev` | from `tools/command-runner/package.json` |
| Go | `go run .` / `go test ./...` in `sihat-tcm-go/` | from `sihat-tcm-go/go.mod` |
| scripts | `uv run sihat-tcm-go/scripts/admin_browser_test.py`, `uv run sihat-tcm-go/scripts/e2e_browser_test.py`, `uv run sihat-tcm-go/scripts/features_browser_test.py` +5 more in `sihat-tcm-go/scripts/` | 8 file(s) |
| scripts | `node sihat-tcm-web/scripts/check-database.mjs`, `pwsh -File sihat-tcm-web/scripts/cleanup-test-pages.ps1`, `pwsh -File sihat-tcm-web/scripts/cleanup-test-routes.ps1` +9 more in `sihat-tcm-web/scripts/` | 12 file(s) |
