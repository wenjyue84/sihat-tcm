# AGENTS.md — Workspace Operating Rules

> **Purpose:** Onboard the agent each session. This file is loaded into every conversation; keep it short and universally applicable.

## WHAT — Map of this repo

- **Identity:** `.claude/agents/identity/` (SOUL.md, USER.md, MEMORY.md, MEMORY/, Bank/)
- **Structure:**
  - `sihat-tcm-web/` — Next.js 16 web app (TypeScript, Tailwind CSS v4)
  - `sihat-tcm-mobile/` — Expo React Native app (JavaScript)
  - `docs/` — Project documentation
  - `.claude/rules/` — Domain-specific rules (diagnosis, react, typescript)
- **Tech:** TypeScript/JavaScript, npm, Vitest (web), Jest (mobile), Supabase, Gemini AI

## WHY — Purpose

- **Sihat TCM**: AI-powered Traditional Chinese Medicine diagnostic platform implementing the 4-Examination Model (四诊合参)
- Maintain strict typing on web, consistent patterns across both platforms

## HOW — How to work here

1. **Every session:** Read AGENTS.md (this file) -> SOUL.md -> USER.md -> memory (today + yesterday). Don't ask permission to follow this file.
2. **Before coding:** Read foundation files, search codebase, understand existing patterns. Prefer pointers over pasting.
3. **Verify changes:**
   - Web: `cd sihat-tcm-web && npm run lint && npm run type-check && npm run test:run`
   - Mobile: `cd sihat-tcm-mobile && npm test`
4. **Memory:** Write it down. MEMORY.md = essential facts; MEMORY/YYYY-MM-DD.md = daily log; Bank/ = typed pages.
5. **Safety:** Don't exfiltrate data. Don't run destructive commands without asking. Archive instead of delete.
6. **Code style:** Follow `.claude/rules/` and `.cursor/rules/`. Use project's linter and formatter.

## Progressive disclosure — Read when relevant

| Doc or skill | When to read |
|--------------|--------------|
| `.claude/rules/diagnosis.md` | Diagnosis flow changes |
| `.claude/rules/react.md` | React component patterns |
| `.claude/rules/typescript.md` | TypeScript conventions |
| `.claude/CLAUDE.md` | Full project context |
| meta-skill | Governance, structure |

## Summary

Onboard: WHAT (repo map), WHY (TCM platform), HOW (scan order, verify via tests, memory, safety, linter). Progressive disclosure for domain-specific rules.
