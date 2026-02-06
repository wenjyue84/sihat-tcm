# Sihat TCM - Task Notes Index

> **Purpose:** Living documentation of task-specific learnings, mistakes, and patterns.
> Updated after each PR with new insights.

## Quick Links

- [Common Mistakes](#common-mistakes)
- [By Feature Area](#by-feature-area)
- [By Pattern](#by-pattern)

## Common Mistakes

| Mistake | Where | Last Seen | Fix Note |
|---------|-------|-----------|----------|
| DiagnosisWizard import error | Web | 2026-01-15 | [Link](diagnosis/iot-connection-wizard.md#import-error) |
| Missing platform detection for IoT | Mobile | 2026-02-01 | [Link](diagnosis/iot-connection-wizard.md#platform-detection) |
| Type safety violations | Web | 2026-01-20 | [Link](patterns/type-safety.md#any-types) |

## By Feature Area

### Diagnosis System
- [IoT Connection Wizard](diagnosis/iot-connection-wizard.md) - Device connection patterns, common pitfalls
- [Session Recovery](diagnosis/session-recovery.md) - Draft management, edge cases
- [4-Examination Flow](diagnosis/4-examination-flow.md) - Wizard navigation, state management

### Mobile App
- [Biometric Auth](mobile/biometric-auth.md) - Platform-specific authentication
- [Offline Sync](mobile/offline-sync.md) - Data persistence patterns

### Deployment
- [Vercel Builds](deployment/vercel-builds.md) - Type errors, build failures
- [Supabase Migrations](deployment/supabase-migrations.md) - Schema changes, data integrity

## By Pattern

- [Error Handling](patterns/error-handling.md) - AppError system, boundary patterns
- [Type Safety](patterns/type-safety.md) - Zero `any` enforcement, strict mode
- [Testing](patterns/testing.md) - Vitest, property-based testing

## How to Use This System

1. **Before starting a task:** Check relevant notes for common mistakes
2. **After fixing a bug:** Update the corresponding note with the mistake/fix
3. **After refactoring:** Document patterns learned in patterns/ notes
4. **After PR merge:** Review changes and update notes with learnings

## Update Process

```bash
# Quick update
npm run notes:update

# Create new note
npm run notes:create

# Rebuild index
npm run notes:index
```

## Note Categories

- **Active** - Currently relevant, frequently referenced
- **Archived** - Historical value, less frequently needed
- **Deprecated** - Superseded by new patterns, kept for reference

## Cross-References

Notes link to:
- **Source files** - Direct links to implementation
- **Domain rules** - Links to `.claude/rules/`
- **Related notes** - Knowledge graph structure
- **Documentation** - Links to `docs/` when applicable
