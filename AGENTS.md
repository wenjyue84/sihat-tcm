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
