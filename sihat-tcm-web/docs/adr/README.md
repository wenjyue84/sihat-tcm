# Architecture Decision Records (ADR)

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences. It helps teams:

- **Document why** decisions were made, not just what was decided
- **Preserve context** for future team members
- **Track evolution** of the system architecture
- **Prevent decision fatigue** by referencing past decisions

## When to Write an ADR

Create an ADR when you make a decision that:

1. **Affects the system structure** (e.g., framework choice, database selection)
2. **Has significant cost implications** (e.g., cloud provider, third-party services)
3. **Impacts system quality attributes** (e.g., performance, security, scalability)
4. **Is difficult to reverse** (e.g., programming language, data model)
5. **Requires team alignment** (e.g., coding standards, deployment strategy)

### Examples for Sihat TCM
- ✅ Choosing Next.js vs Remix
- ✅ Using Supabase vs building custom backend
- ✅ Implementing AI streaming with Edge Runtime
- ✅ Selecting Gemini vs Claude for primary AI model
- ❌ Changing button color (too trivial)
- ❌ Fixing a bug (not an architectural decision)

## How to Write an ADR

### Step 1: Copy the Template
```bash
# From the sihat-tcm directory
cp docs/adr/0000-template.md docs/adr/XXXX-your-decision-title.md
```

### Step 2: Number Your ADR
Use sequential numbering: `0001`, `0002`, `0003`, etc.
The number should be the next available number in the directory.

### Step 3: Fill in the Template
See `0000-template.md` for guidance on each section.

**Tips**:
- Write for future you and new team members
- Be specific and concise
- Include diagrams if helpful
- Link to relevant resources and references
- Don't be afraid to list cons and risks

### Step 4: Review and Merge
- Share the ADR with the team for feedback
- Update based on discussions
- Merge when consensus is reached
- Set status to "Accepted"

## ADR Lifecycle

### Status Values

- **Proposed**: Decision is under consideration
- **Accepted**: Decision has been approved and is being implemented
- **Deprecated**: Decision is no longer relevant but kept for historical context
- **Superseded**: Decision has been replaced by a newer ADR (link to new ADR)

### Updating ADRs

ADRs are **immutable** after acceptance. If a decision changes:

1. **Create a new ADR** with the new decision
2. **Update the old ADR** status to "Superseded" and link to the new one
3. **Preserve history** - never delete old ADRs

Example:
```markdown
# In ADR-0001
- **Status**: Superseded by [ADR-0015](./0015-migration-to-remix.md)
```

## Directory Structure

```
docs/adr/
├── README.md                          # This file
├── 0000-template.md                   # Template for new ADRs
├── 0001-nextjs-app-router.md         # Example ADR
├── 0002-supabase-backend.md          # Your ADRs here...
├── 0003-ai-sdk-integration.md
└── ...
```

## Best Practices for Sihat TCM

### Medical Software Considerations

When writing ADRs for medical software, always consider:

1. **Patient Safety**: How does this affect diagnostic accuracy?
2. **Data Privacy**: HIPAA/PDPA compliance implications
3. **Reliability**: Uptime requirements for medical applications
4. **Auditability**: Can we track and explain all decisions?
5. **Regulatory Compliance**: Any regulatory implications?

### Include These Sections

For every ADR:
- ✅ **Testing Strategy**: How will we validate the decision?
- ✅ **Monitoring**: How will we know if it's working?
- ✅ **Risks & Mitigation**: What could go wrong?
- ✅ **Compliance**: Any regulatory considerations?

### Tag Your ADRs

Use consistent tags to make ADRs searchable:
- `architecture` - System structure decisions
- `security` - Security and privacy decisions
- `performance` - Performance optimization decisions
- `ai-ml` - AI/ML model and integration decisions
- `data` - Data storage and modeling decisions
- `ui-ux` - User experience decisions
- `medical` - Medical accuracy and safety decisions
- `deployment` - CI/CD and infrastructure decisions

## Quick Reference Table

| ADR # | Title | Status | Date | Tags |
|-------|-------|--------|------|------|
| [0001](./0001-nextjs-app-router.md) | Use Next.js 16 App Router | Accepted | 2025-12-01 | architecture, frontend |
| 0002 | Your next ADR... | Proposed | | |

## Resources

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)

## Questions?

If you're unsure whether something needs an ADR, ask yourself:
> "Will future me or my teammates wonder why we made this choice?"

If yes → Write an ADR ✅  
If no → Skip it, but document it elsewhere ❌

---

**Maintained by**: Sihat TCM Development Team  
**Last Updated**: 2025-12-26
