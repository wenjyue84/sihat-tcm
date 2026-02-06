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
