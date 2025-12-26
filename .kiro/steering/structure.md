# Project Structure & Organization

## Repository Layout

This is a monorepo containing both web and mobile applications:

```
/
├── sihat-tcm/                    # Main web application (Next.js)
├── sihat-tcm-mobile/             # Mobile application (Expo/React Native)
├── tools/                        # Development tools and utilities
└── .kiro/                        # Kiro configuration and steering files
```

## Web Application Structure (`sihat-tcm/`)

### Core Directories

```
sihat-tcm/
├── src/
│   ├── app/                      # Next.js App Router pages and API routes
│   │   ├── (auth)/              # Authentication route group
│   │   ├── (dashboard)/         # Main application routes
│   │   ├── api/                 # API route handlers
│   │   │   ├── v1/             # Legacy API endpoints
│   │   │   ├── v2/             # Enhanced API endpoints
│   │   │   ├── admin/          # Admin-specific endpoints
│   │   │   ├── consult/        # Consultation endpoints
│   │   │   └── monitoring/     # Health monitoring endpoints
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout component
│   │   └── page.tsx            # Home page
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Base UI components (buttons, inputs, etc.)
│   │   ├── diagnosis/          # Diagnosis-specific components
│   │   ├── patient/            # Patient management components
│   │   ├── admin/              # Admin interface components
│   │   ├── settings/           # Settings and preferences
│   │   └── meal-planner/       # Meal planning components
│   ├── contexts/               # React Context providers
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Core business logic and utilities
│   │   ├── accessibility/      # Accessibility utilities
│   │   ├── monitoring/         # Performance and health monitoring
│   │   ├── supabase/          # Database utilities
│   │   ├── testing/           # Testing utilities and frameworks
│   │   └── translations/      # Internationalization
│   ├── styles/                # CSS files and styling utilities
│   └── types/                 # TypeScript type definitions
├── public/                     # Static assets
├── docs/                       # Project documentation
├── scripts/                    # Build and deployment scripts
├── supabase/                   # Database migrations and configuration
└── migrations/                 # Database migration files
```

### Key Configuration Files

- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `vitest.config.mts` - Testing configuration
- `eslint.config.mjs` - Linting configuration

## Mobile Application Structure (`sihat-tcm-mobile/`)

```
sihat-tcm-mobile/
├── screens/                    # Screen components
│   ├── dashboard/             # Dashboard screens
│   └── diagnosis/             # Diagnosis workflow screens
├── components/                # Reusable components
│   ├── ui/                   # Base UI components
│   ├── diagnosis/            # Diagnosis-specific components
│   └── settings/             # Settings components
├── lib/                       # Core utilities and services
├── contexts/                  # React Context providers
├── constants/                 # App constants and configuration
├── assets/                    # Images, fonts, and other assets
└── docs/                      # Mobile-specific documentation
```

## Core Library Organization (`src/lib/`)

### AI & Diagnostic Engine
- `enhancedAIDiagnosticEngine.ts` - Main diagnostic orchestrator
- `aiModelRouter.ts` - Intelligent AI model selection
- `medicalSafetyValidator.ts` - Safety validation for recommendations
- `personalizationEngine.ts` - User preference learning and adaptation

### Data & Database
- `supabase.ts` - Database client configuration
- `supabaseAdmin.ts` - Admin database operations
- `actions.ts` - Server actions for data mutations

### Utilities & Helpers
- `utils.ts` - General utility functions
- `validations.ts` - Input validation schemas
- `tcm-utils.ts` - TCM-specific calculations and logic
- `chinese-font.ts` - Chinese typography utilities

### Testing Framework
- `testing/propertyTestFramework.ts` - Property-based testing utilities
- `testing/medicalDataGenerators.ts` - Test data generators
- `testing/testResultAnalysis.ts` - Test result analysis tools

## Component Architecture Patterns

### UI Components (`src/components/ui/`)
- Follow Radix UI patterns for accessibility
- Use compound component patterns for complex interactions
- Implement responsive design with Tailwind CSS
- Include TypeScript interfaces for all props

### Feature Components
- Group by feature domain (diagnosis, patient, admin)
- Use custom hooks for business logic
- Implement error boundaries for fault tolerance
- Follow React Server Component patterns where applicable

## API Route Organization (`src/app/api/`)

### Versioning Strategy
- `v1/` - Legacy endpoints (maintain for backward compatibility)
- `v2/` - Enhanced endpoints with improved features
- Use semantic versioning for breaking changes

### Route Grouping
- Group by feature domain (admin, consult, monitoring)
- Use consistent naming conventions
- Implement proper HTTP status codes
- Include comprehensive error handling

## Database Schema (`supabase/migrations/`)

### Migration Naming Convention
- Format: `YYYYMMDDHHMMSS_description.sql`
- Use descriptive names for migration purposes
- Include rollback instructions in comments
- Test migrations on staging before production

### Table Organization
- Core tables: users, patients, practitioners
- Feature tables: diagnosis_sessions, medical_reports
- Tracking tables: health_time_series, system_logs
- Configuration tables: admin_settings, preferences

## Documentation Structure (`docs/`)

- `API_DOCUMENTATION.md` - API endpoint documentation
- `DEVELOPER_DOCUMENTATION.md` - Development setup and guidelines
- `SYSTEM_ARCHITECTURE.md` - Technical architecture overview
- `USER_GUIDES.md` - End-user documentation
- `DATA_MODELS.md` - Database schema documentation

## File Naming Conventions

### Components
- PascalCase for component files: `DiagnosisWizard.tsx`
- camelCase for utility files: `tcmUtils.ts`
- kebab-case for CSS files: `platform-adaptive.css`

### API Routes
- kebab-case for route segments: `/api/v2/enhanced-diagnosis`
- Use `route.ts` for API route handlers
- Group related endpoints in folders

### Database
- snake_case for table and column names
- Descriptive migration file names
- Use consistent prefixes for related tables

## Import Path Conventions

Use TypeScript path mapping with `@/` prefix:
```typescript
// Correct
import { Button } from '@/components/ui/Button'
import { validateInput } from '@/lib/validations'

// Avoid relative imports for src/ files
import { Button } from '../../../components/ui/Button'
```

## Environment Configuration

### Development
- Use `.env.local` for local development
- Never commit sensitive environment variables
- Use `.env.example` files as templates

### Production
- Configure environment variables in deployment platform
- Use different configurations for staging and production
- Validate required environment variables at startup