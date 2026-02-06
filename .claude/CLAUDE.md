# Sihat TCM Project

## Overview
AI-powered Traditional Chinese Medicine (TCM) diagnostic platform implementing the 4-Examination Model (四诊合参) with IoT device integration.

## Architecture

### Web Application (`sihat-tcm-web/`)
- **Framework**: Next.js 16.1.1 with TypeScript 5, App Router
- **Build Tool**: Turbopack (experimental)
- **Styling**: Tailwind CSS 4, Radix UI components
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini (mapped to Claude models)
- **Testing**: Vitest with property-based testing (fast-check)

### Mobile Application (`sihat-tcm-mobile/`)
- **Framework**: Expo React Native (0.81.5)
- **React**: 19.1.0
- **Storage**: AsyncStorage, SecureStore
- **Auth**: Biometric + Supabase

## Key Directories

```
sihat-tcm-web/
├── src/app/          # Next.js App Router pages
├── src/components/   # React components by feature
│   └── diagnosis/    # DiagnosisWizard, IoTConnectionWizard, SessionRecoveryModal
├── src/lib/          # Utilities, AI routing, constants
├── src/types/        # TypeScript interfaces
└── src/app/api/      # API routes

sihat-tcm-mobile/
├── screens/          # App screens
├── components/       # Reusable UI
├── lib/              # Device integration
└── contexts/         # Theme, Language providers
```

## Development Commands

### Web App
```bash
npm run dev           # Dev server on :3100 (Turbopack)
npm run build         # Production build
npm run lint          # ESLint check
npm run type-check    # TypeScript validation
npm run test          # Vitest watch mode
npm run test:run      # Single test run
npm run format        # Prettier format
```

### Mobile App
```bash
npm start             # Expo dev server
npm run android       # Android development
npm run ios           # iOS development
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Target: ES2017
- Path aliases: `@/*`, `@/api/*`, `@/diagnosis/*`, `@/patient/*`
- Zero `any` types in production code

### React Patterns
- Server Components with "use client" directives
- Custom hooks for state management
- Component composition over inheritance
- Props typing with TypeScript interfaces

### Formatting (Prettier)
- Double quotes (not single)
- Print width: 100 characters
- Trailing comma: es5
- Tab width: 2 spaces
- Semicolons: required

### Git Commit Conventions (Atomic Commits)

**Enforced via git hooks (Husky + commitlint)**

Each commit must be:
- **Self-contained** — one logical change per commit
- **Complete** — codebase works after each commit
- **Focused** — no mixing unrelated changes

**Commit message format (Conventional Commits):**
```
<type>(<scope>): <subject>

[optional body]
```

**Types:**
| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no new feature or fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |
| `build` | Build system changes |

**Examples:**
```bash
git commit -m "feat(diagnosis): add pulse waveform visualization"
git commit -m "fix(auth): resolve token refresh on session timeout"
git commit -m "refactor(iot): extract device connection logic"
```

**Pre-commit checks (automatic):**
1. `lint-staged` — Prettier + ESLint on staged files
2. `type-check` — Full TypeScript validation
3. `commitlint` — Validates commit message format

## Key Components

### Diagnosis System (4-Examination Model)
Steps: Basic Info → Inquiry (WEN) → Visual Analysis (WANG) → Audio (WEN) → Pulse (QIE) → IoT Smart Connect → Analysis → Results

**Critical Components:**
- `DiagnosisWizard` - **Default export** (not named export)
- `IoTConnectionWizard` - Manual device input with validation
- `SessionRecoveryModal` - Resume incomplete sessions
- `useInquiryWizardState` - State management hook

### IoT Devices
Supported types: pulse, blood pressure, oxygen, temperature, HRV, stress

### Session Recovery
- Drafts saved to Supabase
- `PendingResumeState` tracks completion percentage
- Allows resume/delete operations

## Type Definitions (`src/types/diagnosis.ts`)

```typescript
BasicInfo           // Patient demographics
InquiryData         // Chat history, summaries, medical reports
VisualAnalysisData  // Images with TCM analysis tags
AudioAnalysisData   // Voice recordings with observations
PulseData           // BPM, quality, rhythm, strength
SmartConnectData    // IoT device data
DiagnosisWizardData // Complete wizard state
PendingResumeState  // Draft session for recovery
```

## AI Model Router

Strategy pattern with complexity analysis:
- Master → Claude 3.5 Sonnet (complex cases)
- Expert → Claude 3.5 Haiku (standard)
- Physician → Claude 3-Haiku (simple)

Core API routes: `/api/chat`, `/api/consult`, `/api/analyze-image`, `/api/analyze-audio`

## Error Handling

- Centralized `AppError` system with context tracking
- Error Boundary component with user-friendly messages
- Type-safe error patterns throughout

## Constants

Centralized in:
- Web: `src/lib/constants/index.ts`
- Mobile: `constants/index.ts`

## Testing

- Vitest with jsdom environment
- Property-based testing with fast-check
- Test files: `src/**/*.test.ts`
- Timeout: 30 seconds for property tests

## Common Issues & Solutions

**See `.claude/notes/INDEX.md` for comprehensive learnings updated after each PR.**

Quick reference:
| Issue | Solution |
|-------|----------|
| DiagnosisWizard import error | Use default import, not named |
| IoT connection fails | Check transport configuration |
| Session recovery not showing | Verify Supabase draft table |
| Type errors in diagnosis | Check `src/types/diagnosis.ts` |

## Do NOT Modify

- `package-lock.json` (auto-generated)
- `.env.production` (sensitive)
- `next-env.d.ts` (auto-generated)
- Database migrations without review

## Recent Refactoring Status

- Constants extraction: 47 magic numbers eliminated
- Error handling: 95% consistency
- Type safety: 98% score, zero `any` types
- Device Integration: 912 lines modularized
