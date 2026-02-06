# Contributing to Sihat TCM

Welcome! This guide explains our professional git workflow and atomic commit practices.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up git commit template (one-time)
npm run git:setup

# 3. Create a feature branch
git checkout -b feat/your-feature-name

# 4. Make your changes and commit atomically
git add <files>
npm run git:scope  # Get scope suggestions
git commit         # Opens template in your editor

# 5. Push and create PR
git push -u origin feat/your-feature-name
```

## Atomic Commits Explained

**What is an atomic commit?**
- ✅ Represents **one logical change**
- ✅ Complete and functional on its own
- ✅ Can be reverted independently
- ✅ Easy to review and understand

**Examples:**

```bash
# ❌ BAD - Multiple unrelated changes
git commit -m "fix bugs, add feature, update docs"

# ✅ GOOD - Separate atomic commits
git commit -m "fix(diagnosis): resolve infinite loop in wizard navigation"
git commit -m "feat(doctor): add patient filtering by status"
git commit -m "docs(readme): update installation instructions"
```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Types

| Type | Use for | Semantic Versioning |
|------|---------|---------------------|
| `feat` | New features | MINOR version bump |
| `fix` | Bug fixes | PATCH version bump |
| `docs` | Documentation only | No version bump |
| `style` | Formatting, whitespace | No version bump |
| `refactor` | Code restructuring (no behavior change) | No version bump |
| `perf` | Performance improvements | PATCH version bump |
| `test` | Adding or updating tests | No version bump |
| `chore` | Maintenance, dependencies | No version bump |
| `ci` | CI/CD changes | No version bump |
| `build` | Build system changes | No version bump |

### Scopes

Use **npm run git:scope** to get suggestions based on your staged files.

Common scopes:
- `diagnosis` - Diagnosis wizard, 4-Examination Model
- `doctor` - Doctor portal, dashboard, reports
- `patient` - Patient dashboard, communication
- `auth` - Authentication, login, sessions
- `api` - API routes, endpoints
- `db` - Database, migrations, schema
- `ui` - UI components, design system
- `iot` - IoT device integration
- `hooks` - Git hooks, Husky configuration
- `config` - Configuration files
- `deps` - Dependencies

### Subject Line Rules

- Use **imperative mood**: "add" not "added" or "adds"
- **Lowercase** first letter (unless proper noun)
- **No period** at the end
- **Max 72 characters**

```bash
# ✅ GOOD
fix(auth): resolve token refresh on session timeout

# ❌ BAD
Fixed the auth token refreshing bug.  # Wrong mood, wrong case, period
```

### Body (Optional but Recommended)

Explain **WHY** the change was made, not WHAT was changed (code shows that).

```bash
git commit -m "feat(diagnosis): add pulse waveform visualization

Previously, pulse data was only shown as a number. Doctors requested
visual waveform to assess rhythm quality more effectively.

Implements Canvas-based real-time rendering with 60fps smoothing."
```

### Footer

Reference issues and breaking changes:

```bash
# Reference issue
Fixes: #123
Refs: #456

# Breaking change
BREAKING CHANGE: API endpoint /api/v1/diagnose renamed to /api/v2/analyze
```

## Using Git Tools

### 1. Commit Template (Interactive)

When you run `git commit` (without `-m`), your editor opens with a helpful template:

```bash
git add src/features/diagnosis/hooks/useDiagnosisWizard.ts
git commit  # Opens editor with template
```

The template includes:
- ✅ Format examples
- ✅ Atomic commit checklist
- ✅ Type and scope reference
- ✅ Best practices

### 2. Scope Suggestions

Before committing, get AI-powered scope suggestions:

```bash
git add src/components/doctor/*.tsx
npm run git:scope

# Output:
# 🎯 Suggested scopes:
#   1. doctor (5 files) - Doctor portal and dashboard
#   2. ui     (1 file)  - Shared UI components
#
# Example: feat(doctor): add new feature
```

### 3. Pre-Push Validation

Before pushing to `main`, `master`, or `production` branches, our pre-push hook automatically runs:
- ✅ TypeScript type check
- ✅ Full test suite

For feature branches, you'll get a reminder to run these before creating a PR.

```bash
# Automatic on: git push origin main
# Manual check: npm run type-check && npm run test:run
```

## Workflow Example

### Scenario: Fix a bug in the diagnosis wizard

```bash
# 1. Create feature branch
git checkout -b fix/diagnosis-infinite-loop

# 2. Fix the bug (edit files)
# ... make changes to useDiagnosisWizard.ts ...

# 3. Stage only the fix
git add src/features/diagnosis/hooks/useDiagnosisWizard.ts

# 4. Check suggested scope
npm run git:scope
# Output: diagnosis (1 file)

# 5. Commit with template
git commit
# Editor opens with template, fill in:
# fix(diagnosis): resolve infinite loop from unstable callbacks
#
# Arrow functions in useEffect created new references every render,
# triggering infinite re-renders when passed to Zustand store.
#
# Solution: Use refs + useCallback for stable navigation handlers
#
# Fixes: #342
#
# Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

# 6. If you also updated documentation, create separate commit
git add .claude/notes/patterns/react-hooks.md
git commit -m "docs(notes): document useEffect infinite loop pattern

Captures learnings from diagnosis wizard fix to prevent
future occurrences."

# 7. Push and create PR
git push -u origin fix/diagnosis-infinite-loop
```

## Pre-Commit Hooks (Automatic)

Every commit automatically runs:

1. **lint-staged** - Prettier + ESLint on staged files
2. **type-check** - Full TypeScript validation
3. **commitlint** - Validates commit message format

These hooks ensure quality before commits even enter history.

## Code Quality Standards

Before creating a PR, verify:

```bash
# Type check
npm run type-check

# Linting
npm run lint

# Tests
npm run test:run

# Test coverage (optional)
npm run test:coverage

# All at once
npm run type-check && npm run lint && npm run test:run
```

## Pull Request Process

1. **Branch naming**: `<type>/<short-description>`
   - Examples: `feat/pulse-waveform`, `fix/auth-timeout`, `refactor/iot-connection`

2. **Create PR** against `main` branch

3. **Fill out PR template** (auto-loaded)
   - Describe changes
   - Check atomic commits
   - Verify tests pass
   - Note breaking changes

4. **Request review** from maintainers

5. **Address feedback** with new atomic commits (don't squash until merge)

6. **Merge** using "Squash and merge" for feature branches, or "Rebase and merge" for already-atomic commits

## Breaking Changes

If your change breaks backwards compatibility:

1. Add `BREAKING CHANGE:` to commit footer
2. Clearly explain the migration path
3. Update documentation
4. Major version bump will be automatic

```bash
git commit -m "feat(api)!: change diagnosis endpoint format

BREAKING CHANGE: /api/diagnose now expects `patientId` instead of `userId`

Migration:
- Replace `userId` with `patientId` in API calls
- Update client SDKs to v2.0.0+"
```

## Tips for Success

### ✅ DO
- Commit early and often (atomic commits)
- Write clear, descriptive messages
- Run tests before pushing
- Use the commit template for guidance
- Reference issues in commit messages
- Keep commits focused and small

### ❌ DON'T
- Mix multiple unrelated changes in one commit
- Use vague messages like "fix bug" or "update code"
- Skip the pre-commit hooks (`--no-verify`)
- Force push to shared branches
- Commit broken code (even WIP)
- Forget to credit Claude with Co-Authored-By

## Git Commit Template Setup

If you haven't run `npm run git:setup` yet:

```bash
# One-time setup
npm run git:setup

# Verify
git config --local commit.template
# Output: .gitmessage
```

Now `git commit` (without `-m`) opens your editor with the helpful template!

## Questions?

- **Atomic commits**: See `.gitmessage` template
- **Scope suggestions**: Run `npm run git:scope`
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Project docs**: See `.claude/CLAUDE.md`

## Additional Resources

- [Git Best Practices](https://git-scm.com/book/en/v2)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Writing Good Commit Messages](https://cbea.ms/git-commit/)

---

**Welcome to the team!** 🎉 We maintain high standards to ensure quality, but these tools make it easy. Happy coding!
