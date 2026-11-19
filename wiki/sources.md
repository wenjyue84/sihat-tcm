# Sources — sihat-tcm

> **Last updated:** 2026-09-11

Where facts in this hub come from and how much to trust each. Trust tiers: **T1** = deterministic script / app DB / snapshot · **T2** = first-party document (PDF, statement, export) · **T3** = human claim (WhatsApp, meeting) · **T4** = LLM synthesis.

| Source | Kind (app/db/mcp/script/doc/chat) | Access path | Trust tier | As-of |
|--------|-----------------------------------|-------------|------------|-------|
| sihat-tcm-go app (ACI) | app | `node sihat-tcm-go/aci.mjs status` | T1 | 2026-09-11 |
| sihat-tcm-mobile (npm) | app | `sihat-tcm-mobile/package.json` | T1 | 2026-09-11 |
| sihat-tcm-web (npm) | app | `sihat-tcm-web/package.json` | T1 | 2026-09-11 |
| command-runner (npm) | app | `tools/command-runner/package.json` | T1 | 2026-09-11 |
| sihat-tcm-go (go) | app | `sihat-tcm-go/go.mod` | T1 | 2026-09-11 |
| log.md / wiki | doc | this folder | T4 | 2026-09-11 |
