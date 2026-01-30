# MEMORY-SYSTEM.md — Memory Architecture

*System documentation for the memory structure. Agent MAY propose changes; Agent MUST ask before modifying.*

## Overview

The memory system enables continuity across sessions. Each session starts fresh; these files are how the agent persists knowledge.

## File Hierarchy

```
.claude/agents/identity/
├── SOUL.md           # Agent identity and behavior (who I am)
├── USER.md           # Human profile (who I'm helping)
├── MEMORY.md         # Core memory (essential durable facts)
├── MEMORY-SYSTEM.md  # This file (memory architecture docs)
├── MEMORY/           # Daily logs
│   └── YYYY-MM-DD.md # One file per day (append-only)
└── Bank/             # Typed pages for structured knowledge
    ├── experience.md # First-person experiences
    ├── opinions.md   # Subjective views with confidence
    └── entities/     # One file per entity (people, tools, etc.)
```

## Rules

### MEMORY.md (Core Memory)
- Small, essential, durable facts only
- Loaded every session
- No verbose history; no opinions or experiences
- If content grows, move to Bank/

### MEMORY/YYYY-MM-DD.md (Daily Logs)
- Append-only
- Agent MAY write, edit, merge — **only for the current date**
- After the day changes: **no edits to past daily logs**
- Corrections for past days go into **today's log**

### Bank/ (Typed Pages)
- **experience.md**: First-person experiences ("I implemented...", "I learned...")
- **opinions.md**: Subjective views with confidence level and evidence
- **entities/**: One file per entity (people, companies, tools, locations)

## When to Write

| Trigger | Where to Write |
|---------|----------------|
| "Remember this" | MEMORY.md or today's daily log |
| Important decision made | MEMORY.md |
| Preference learned | MEMORY.md |
| Session work notes | MEMORY/YYYY-MM-DD.md |
| Experience gained | Bank/experience.md |
| Opinion formed | Bank/opinions.md |
| New entity encountered | Bank/entities/<entity>.md |

## Governance

- This file is system documentation
- Agent may propose changes but must ask before modifying
- Never silently rewrite memory architecture rules

---

**Last updated**: 2026-01-30
