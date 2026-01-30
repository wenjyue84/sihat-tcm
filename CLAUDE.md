# CLAUDE.md — Claude / IDE Global Instructions

> **Purpose:** Onboard Claude into this codebase each session.

## WHAT — Map

- **Repo:** Sihat TCM — AI-powered TCM diagnostic platform
  - `sihat-tcm-web/` — Next.js 16 web app (TypeScript)
  - `sihat-tcm-mobile/` — Expo React Native mobile app (JavaScript)
  - `docs/` — Documentation
- **Tech:** TypeScript (web), JavaScript (mobile), npm, Supabase, Gemini AI
- **Platform:** Windows 11, PowerShell
- **Relative paths only;** forward slashes even on Windows.

## WHY — Purpose

- Sihat TCM provides AI-powered TCM diagnostics using the 4-Examination Model (四诊合参)
- Maintain strict typing on web, consistent patterns across both platforms

## HOW — How to work

1. **Follow AGENTS.md** in the workspace (scan order, memory, safety). Read it first each session.
2. **Full project context:** See `.claude/CLAUDE.md` for detailed architecture, commands, and code conventions.
3. **Verify changes:**
   - Web: `npm run lint && npm run type-check && npm run test:run`
   - Mobile: `npm test`
4. **File ops:** Read before editing. Prefer move over delete; archive if uncertain.
5. **Memory:** "Remember this" -> MEMORY.md or MEMORY/YYYY-MM-DD.md.

## Progressive disclosure — Read when relevant

| Doc or skill | When to read |
|--------------|--------------|
| AGENTS.md (this workspace) | Always first |
| `.claude/CLAUDE.md` | Full project context, dev commands, conventions |
| `.claude/rules/*` | Domain-specific rules |
| meta-skill | Governance, structure |

## Summary

Onboard: WHAT (repo map, tech), WHY (TCM platform), HOW (AGENTS.md first, verify via tests, linter for style, memory). Full details in `.claude/CLAUDE.md`.
