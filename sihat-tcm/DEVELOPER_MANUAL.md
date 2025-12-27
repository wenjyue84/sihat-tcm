# Sihat TCM Developer Manual

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Key Components](#key-components)
6. [API Routes](#api-routes)
7. [Database Schema](#database-schema)
8. [Authentication & Authorization](#authentication--authorization)
9. [Development Workflow](#development-workflow)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

Sihat TCM is a comprehensive Traditional Chinese Medicine (TCM) diagnostic and patient management system. The platform consists of:

- **Web Application**: Next.js-based web platform for practitioners and administrators
- **Mobile Application**: React Native/Expo mobile app for patients
- **Backend**: Next.js API routes with Supabase integration
- **AI Integration**: Gemini AI for diagnostic assistance and report generation

### Key Features

**Core Features:**

- Patient onboarding and medical history collection
- TCM diagnostic workflows (Four Examinations: pulse, tongue, face, body)
- AI-powered diagnostic assistance using Gemini AI
- Medical report generation and management
- Multi-language support (English, Malay, Chinese)
- Role-based access control (Guest, Patient, Doctor, Admin)
- Real-time chat with AI for medical inquiries

**Patient Portal Features:**

- **Health Journey Dashboard**: Unified patient portal with health trends and diagnostics
- **AI Meal Planner**: Personalized 7-day TCM meal plans with shopping lists
- **TCM Food Checker**: Evaluate food suitability based on diagnosis
- **Qi Dose (Baduanjin)**: Guided TCM exercises with gamified "Qi Garden"
- **Vitality Rhythm**: Constitution tracker, seasonal alerts, and meridian clock
- **Snore Analysis**: AI-powered TCM-based sleep and fatigue assessment
- **Circle of Health**: Anonymous community support groups
- **Family Health Management**: Manage family member health profiles
- **Western Doctor Chat**: AI-powered second opinion consultation
- **Digital Twin**: Visual health organ mapping
- **Herb Shop**: TCM herb and product recommendations
- **Infographics Generator**: AI-generated personalized health infographics
- **Health Data Import**: Connect wearables and health devices (IoT integration)

---

## Architecture

### Technology Stack

**Web Application:**

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui, Framer Motion, Sonner
- **State Management**: React Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini API via Vercel AI SDK (Core & React)
- **Content Management**: Tina CMS (Git-backed)
- **PDF Generation**: html2canvas, jspdf

**Mobile Application:**

- **Framework**: React Native with Expo
- **Language**: JavaScript
- **State Management**: React Context API
- **Backend Integration**: REST API calls to web application

### System Architecture Diagram

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼─────────────────────────┐
│  Web Application (Next.js)       │
│  ┌─────────────────────────────┐ │
│  │  API Routes                 │ │
│  │  - /api/auth                │ │
│  │  - /api/diagnosis           │ │
│  │  - /api/reports             │ │
│  │  - /api/gemini              │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │  Pages & Components         │ │
│  │  - Patient Dashboard        │ │
│  │  - Doctor Dashboard         │ │
│  │  - Admin Panel              │ │
│  │  - Diagnosis Wizard         │ │
│  └─────────────────────────────┘ │
└────────┬─────────────────────────┘
         │
         │ Supabase Client
         │
┌────────▼────────┐
│   Supabase      │
│  - PostgreSQL   │
│  - Auth         │
│  - Storage      │
└─────────────────┘
         │
┌────────▼────────┐
│  Gemini API     │
│  (AI Services)  │
└─────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL (via Supabase)
- Supabase account and project
- Supabase CLI (via npx - no installation required)
- Google Gemini API key (for AI features)
- Git

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd "Sihat TCM/sihat-tcm"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Variables**

   Create a `.env.local` file in the `sihat-tcm` directory:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Gemini API
   GEMINI_API_KEY=your_gemini_api_key

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3100
   ```

4. **Database Setup**

   The Supabase CLI can be used via `npx` without global installation:

   ```bash
   # Login to Supabase
   npx supabase login

   # Link to your remote project
   npx supabase link --project-ref <your-project-ref>

   # Pull the remote schema (optional, to sync with existing project)
   npx supabase db pull
   ```

   **Alternative: Manual SQL Execution**

   If you prefer to run SQL files directly via Supabase Dashboard or psql:

   ```bash
   # 1. Main schema
   psql -h <supabase-host> -U postgres -d postgres -f schema.sql

   # 2. Additional setup
   psql -h <supabase-host> -U postgres -d postgres -f practitioners_setup.sql
   psql -h <supabase-host> -U postgres -d postgres -f add_medical_history_column.sql
   psql -h <supabase-host> -U postgres -d postgres -f update_schema.sql
   ```

   **Using Supabase CLI for Migrations**

   ```bash
   # Initialize Supabase in your project (creates supabase/ directory)
   npx supabase init

   # Start local Supabase (requires Docker)
   npx supabase start

   # Create a new migration
   npx supabase migration new <migration-name>

   # Apply migrations to local database
   npx supabase db reset

   # Push migrations to remote database
   npx supabase db push

   # Generate TypeScript types from your database
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

   **Common Supabase CLI Commands**

   ```bash
   # View help
   npx supabase --help

   # Check CLI version
   npx supabase --version

   # Stop local Supabase
   npx supabase stop

   # View database status
   npx supabase status
   ```

   **Note**: The first time you run any `npx supabase` command, it will download and cache the package. Subsequent runs will be faster.

5. **Run the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3100`

6. **Blog Management (Tina CMS)**

   To manage blog content, use the specialized Tina dev command:

   ```bash
   npm run dev:tina
   ```

   The editor will be available at `http://localhost:3100/tina-admin/index.html`

7. **Troubleshooting Hot Reload Issues**

   If you experience hot reload problems (changes not reflecting, slow updates), try these solutions in order:

   **Quick Fix - Clear Next.js Cache:**

   ```bash
   npm run dev:clear
   # Or manually:
   rm -rf .next && npm run dev
   ```

   **Full Reset - Clear node_modules (if cache clearing doesn't help):**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

   **Test with Turbopack (experimental, faster bundler):**

   ```bash
   npm run dev:turbo
   ```

   Note: Turbopack is experimental and may have compatibility issues with some plugins. Test thoroughly before using in production.

   **Increase Node.js Memory (if you see "out of memory" errors):**
   - Windows (PowerShell): `$env:NODE_OPTIONS="--max-old-space-size=8192"; npm run dev`
   - Windows (CMD): `set NODE_OPTIONS=--max-old-space-size=8192 && npm run dev`
   - Linux/Mac: `NODE_OPTIONS="--max-old-space-size=8192" npm run dev`

### Mobile App Setup

1. **Navigate to mobile directory**

   ```bash
   cd ../sihat-tcm-mobile
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API endpoint**

   Update `lib/apiConfig.js` with your web application URL:

   ```javascript
   export const API_BASE_URL = "http://localhost:3100";
   ```

4. **Run the mobile app**
   ```bash
   npx expo start
   ```

---

## Project Structure

### Web Application Structure

```
sihat-tcm/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── actions/            # Server Actions
│   │   │   └── meal-planner.ts # AI meal planning actions
│   │   ├── api/                # API routes
│   │   │   ├── admin/          # Admin management endpoints
│   │   │   ├── analyze-audio/  # Audio/voice analysis
│   │   │   ├── analyze-image/  # Image analysis (tongue, face, body)
│   │   │   ├── analyze-snore/  # Snore audio analysis
│   │   │   ├── ask-dietary-advice/ # Dietary consultation
│   │   │   ├── chat/           # TCM inquiry chat
│   │   │   ├── consult/        # Consultation endpoints
│   │   │   ├── extract-text/   # OCR text extraction
│   │   │   ├── generate-infographic/ # AI infographic generation
│   │   │   ├── health/         # Health data endpoints
│   │   │   ├── report-chat/    # Chat with diagnosis report
│   │   │   ├── summarize-inquiry/ # Inquiry summary generation
│   │   │   ├── validate-medicine/ # Medicine validation
│   │   │   └── western-chat/   # Western doctor AI chat
│   │   ├── admin/              # Admin dashboard
│   │   ├── doctor/             # Doctor dashboard
│   │   ├── patient/            # Patient portal
│   │   │   └── history/        # Diagnosis history pages
│   │   ├── blog/               # Blog pages (Tina CMS)
│   │   ├── login/              # Authentication pages
│   │   └── test-*/             # Test/development pages
│   ├── components/             # React components
│   │   ├── admin/              # Admin-specific components
│   │   ├── blog/               # Blog components
│   │   ├── diagnosis/          # Diagnosis workflow components
│   │   │   ├── basic-info/     # Basic information forms
│   │   │   ├── pulse/          # Pulse examination
│   │   │   ├── report/         # Report generation & display
│   │   │   ├── summary/        # Diagnosis summary
│   │   │   └── wizard/         # Wizard navigation
│   │   ├── meal-planner/       # AI Meal Planner components
│   │   │   ├── DietaryPreferencesForm.tsx
│   │   │   ├── MealCard.tsx
│   │   │   ├── MealPlanWizard.tsx
│   │   │   ├── RecipeModal.tsx
│   │   │   ├── ShoppingListWidget.tsx
│   │   │   ├── TCMFoodChecker.tsx
│   │   │   └── WeeklyCalendarView.tsx
│   │   ├── patient/            # Patient portal components
│   │   │   ├── CircleOfHealth.tsx      # Community feature
│   │   │   ├── DigitalTwin.tsx         # Health organ visualization
│   │   │   ├── DocumentViewerModal.tsx # Medical document viewer
│   │   │   ├── FamilyManagement.tsx    # Family profiles
│   │   │   ├── HistoryCard.tsx         # Diagnosis history cards
│   │   │   ├── TrendWidget.tsx         # Health trends dashboard
│   │   │   ├── UnifiedDashboard.tsx    # Main patient portal
│   │   │   ├── VitalityRhythmTab.tsx   # Meridian clock & constitution
│   │   │   └── snore-analysis/         # Snore analysis components
│   │   ├── qi-dose/            # Baduanjin exercise components
│   │   │   ├── QiDose.tsx      # Exercise interface
│   │   │   └── QiGarden.tsx    # Gamified garden feature
│   │   ├── onboarding/         # Patient onboarding components
│   │   ├── landing/            # Landing page components
│   │   ├── seo/                # SEO components
│   │   └── ui/                 # Reusable UI components (shadcn/ui)
│   ├── content/                # Tina CMS content (MDX blog posts)
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── DeveloperContext.tsx # Developer mode state
│   │   ├── DiagnosisProgressContext.tsx  # Diagnosis workflow state
│   │   ├── DoctorContext.tsx   # Doctor/model selection state
│   │   ├── LanguageContext.tsx # Multi-language support
│   │   └── OnboardingContext.tsx # Onboarding state
│   ├── hooks/                  # Custom React hooks
│   │   ├── useCameraHeartRate.ts    # Heart rate via camera
│   │   ├── useDiagnosisPersistence.ts
│   │   ├── useDiagnosisWizard.ts
│   │   └── useLanguageSync.ts       # Language synchronization
│   ├── lib/                    # Utility libraries
│   │   ├── actions.ts          # Server actions (health passport)
│   │   ├── herbShopData.ts     # Herb shop product data
│   │   ├── mockMedicalReports.ts # Demo medical reports
│   │   ├── rateLimit.ts        # API rate limiting
│   │   ├── settings.ts         # App settings
│   │   ├── supabase/           # Supabase client (server/client)
│   │   ├── systemPrompts.ts    # AI system prompts (COStar)
│   │   ├── tcm-utils.ts        # TCM utility functions
│   │   ├── translations/       # Translation files (en, zh, ms)
│   │   └── utils.ts            # General utilities
│   └── middleware.ts           # Next.js middleware (auth, routing)
├── public/                     # Static assets
├── tina/                       # Tina CMS configuration
├── scripts/                    # Utility scripts
│   ├── admin-db.js             # Database admin utilities
│   └── auto-confirm.js         # Auto-confirmation script
├── schema.sql                  # Main database schema
├── practitioners_setup.sql     # Practitioner setup
└── package.json
```

### Mobile Application Structure

```
sihat-tcm-mobile/
├── screens/                    # Screen components
│   ├── dashboard/              # Dashboard screens
│   ├── diagnosis/              # Diagnosis workflow screens
│   ├── OnboardingScreen.js     # Patient onboarding
│   └── ViewReportScreen.js     # Report viewing
├── components/                 # Reusable components
│   ├── ui/                     # UI components
│   └── [feature components]    # Feature-specific components
├── contexts/                   # React Context providers
│   ├── LanguageContext.js
│   └── ThemeContext.js
├── lib/                        # Utilities
│   ├── supabase.js             # Supabase client
│   ├── apiConfig.js            # API configuration
│   ├── pdfGenerator.js         # PDF generation
│   └── translations/           # Translation files
└── constants/                  # Constants and configs
    ├── SystemPrompts.js
    └── themes.js
```

---

## Key Components

### Authentication System

**Location**: `src/contexts/AuthContext.tsx`, `src/app/api/auth/`

The authentication system uses Supabase Auth with role-based access control:

- **Roles**: Patient, Doctor, Admin
- **Middleware**: `src/middleware.ts` handles route protection
- **Context**: `AuthContext` provides authentication state throughout the app

### Unified Patient Portal

**Location**: `src/components/patient/UnifiedDashboard.tsx`

The core of the patient experience, integrating multiple health modules into a single "Health Journey" view:

- **Health Trends**: Visualizes diagnostic scores over time
- **Documents**: Manages medical reports with OCR capabilities
- **Modules**: Pluggable architecture supports Vitality Rhythm, Qi Dose, and more

### AI Service Modules

The system now employs specialized AI modules for different health aspects:

1. **AI Meal Planner** (`src/components/meal-planner/`)
   - Generates 7-day TCM-compliant meal plans
   - "Food Checker" validates food suitability against diagnosis
   - Generates shopping lists organized by category

2. **Snore Analysis** (`src/components/patient/snore-analysis/`)
   - Analyzes audio recordings for sleep patterns
   - Correlates snoring with TCM fatigue syndromes (Qi Deficiency, Phlegm-Dampness)

3. **Western Doctor Chat** (`src/components/diagnosis/report/WesternDoctorChat.tsx`)
   - Provides an AI-simulated "Second Opinion"
   - Contextualizes TCM findings in Western medical terms

4. **Infographics Generator** (`src/components/diagnosis/report/InfographicsGenerator.tsx`)
   - Creates personalized, shareable health cards
   - Visualizes constitution and dietary advice

### Gamified Health (Qi Dose)

**Location**: `src/components/qi-dose/`

Encourages user engagement through gamification:

- **Qi Garden**: Visual metaphor for health status (plants grow with healthy actions)
- **Baduanjin**: Guided exercise routines with progress tracking

### Diagnosis Workflow

**Location**: `src/components/diagnosis/`, `src/hooks/useDiagnosisWizard.ts`

The diagnosis workflow has been expanded to include:

1. **Patient Information Collection**
2. **Pulse Examination** - Pulse pattern analysis via camera (PPG)
3. **Tongue & Face Examination** - Image analysis
4. **Body Examination** - Body constitution assessment
5. **Symptom Collection** - Patient-reported symptoms
6. **Smart Connect** - Integration with wearable devices
7. **AI Analysis** - Gemini AI processes all collected data
8. **Report Generation** - Final medical report with comprehensive TCM insights

**Key Components:**

- `DiagnosisProgressContext` - Tracks progress through workflow
- `useDiagnosisWizard` - Hook for navigation and state management
- `useDiagnosisPersistence` - Saves progress to database

### Multi-language Support

**Location**: `src/lib/translations/`, `src/contexts/LanguageContext.tsx`

Supported languages:

- English (en)
- Malay (ms)
- Chinese (zh)

Translation files are organized by feature area (common, diagnosis, dashboard, etc.) and loaded dynamically.

---

### Server Actions

**Location**: `src/lib/actions.ts`, `src/app/actions/`

Data mutations and retrieval are now primarily handled by Next.js Server Actions for better performance and type safety:

- **Health Passport** (`src/lib/actions.ts`):
  - `saveDiagnosis`: Save new diagnosis session
  - `getPatientHistory`: Retrieve diagnosis history
  - `saveMedicalReport`: Save uploaded report metadata

- **Meal Planner** (`src/app/actions/meal-planner.ts`):
  - `generateMealPlan`: Generate AI meal plan
  - `swapMeal`: Replace a specific meal
  - `checkFoodSuitability`: Analyze food against patient diagnosis

### API Routes (AI Services)

**Location**: `src/app/api/`

API routes are now dedicated to AI services and specialized computations:

- **Diagnostic AI**:
  - `POST /api/analyze-image`: Analyze tongue/face images
  - `POST /api/analyze-audio`: Analyze voice/breath sounds
  - `POST /api/analyze-snore`: Analyze sleep audio for fatigue patterns
  - `POST /api/chat`: General TCM inquiry chat

- **Consultation & Reports**:
  - `POST /api/consult`: Main diagnosis synthesis endpoint
  - `POST /api/report-chat`: Chat Q&A with specific medical reports
  - `POST /api/western-chat`: Western medicine "second opinion" chat
  - `POST /api/generate-infographic`: Generate health summary cards
  - `POST /api/summarize-inquiry`: Summarize chat for final diagnosis
  - `POST /api/extract-text`: OCR for medical documents

- **Utilities**:
  - `POST /api/validate-medicine`: Validate TCM herbal formulas
  - `POST /api/ask-dietary-advice`: Specific dietary queries
  - `GET /api/health`: System health check

- **Admin**:
  - `/api/admin/*`: System administration endpoints

---

## Database Schema

### Core Tables

**users** - User accounts (extends Supabase auth.users)

- `id` (UUID, primary key)
- `email`
- `role` (patient, doctor, admin)
- `created_at`, `updated_at`

**patients** - Patient-specific information

- `id` (UUID, primary key, references users)
- `name`, `date_of_birth`, `gender`
- `medical_history` (JSONB)
- `created_at`, `updated_at`

**practitioners** - Doctor/practitioner information

- `id` (UUID, primary key, references users)
- `name`, `license_number`
- `specialization`, `level`
- `created_at`, `updated_at`

**diagnosis_sessions** - Diagnosis sessions (formerly 'diagnoses')

- `id` (UUID, primary key)
- `patient_id` (references patients)
- `practitioner_id` (references practitioners)
- `status` (in_progress, completed, cancelled)
- `data` (JSONB) - All collected diagnostic data
- `overall_score` (numeric) - Derived health score
- `created_at`, `updated_at`, `completed_at`

**medical_reports** - Generated medical reports

- `id` (UUID, primary key)
- `diagnosis_id` (references diagnosis_sessions)
- `patient_id` (references patients)
- `practitioner_id` (references practitioners)
- `content` (JSONB) - Report content
- `pdf_url` (text) - Link to PDF if generated
- `created_at`, `updated_at`

**meal_plans** - AI-generated meal plans

- `id` (UUID, primary key)
- `user_id` (references users)
- `weekly_plan` (JSONB) - 7-day meal plan
- `shopping_list` (JSONB)
- `status` (active, archived)
- `created_at`, `updated_at`

**dietary_preferences** - User dietary settings

- `user_id` (references users, primary key)
- `allergies` (text[])
- `dietary_type` (text)
- `disliked_foods` (text[])
- `serving_size` (numeric)

### Database Setup Scripts

1. **schema.sql** - Main schema with all tables, indexes, and RLS policies
2. **practitioners_setup.sql** - Initial practitioner data
3. **add_medical_history_column.sql** - Adds medical_history to patients table
4. **update_schema.sql** - Schema updates and migrations

---

## Authentication & Authorization

### Role-Based Access Control (RBAC)

The system implements three roles:

1. **Patient**
   - Access: Own dashboard, own reports, diagnosis workflow
   - Restrictions: Cannot view other patients' data

2. **Doctor/Practitioner**
   - Access: Patient dashboard, diagnosis workflow, assigned reports
   - Restrictions: Cannot access admin functions

3. **Admin**
   - Access: Full system access, user management, system statistics
   - Restrictions: None

### Row Level Security (RLS)

Supabase RLS policies enforce data access:

- Patients can only see their own data
- Doctors can see data for their assigned patients
- Admins can see all data

### Middleware Protection

`src/middleware.ts` protects routes based on authentication status and role:

```typescript
// Example route protection
if (pathname.startsWith("/admin") && user.role !== "admin") {
  return NextResponse.redirect("/login");
}
```

---

## Development Workflow

### Code Organization

1. **Components**: Keep components focused and reusable
2. **Contexts**: Use Context API for global state (auth, language, etc.)
3. **Hooks**: Extract reusable logic into custom hooks
4. **API Routes**: Keep API routes thin, delegate to service functions
5. **Types**: Define TypeScript interfaces for all data structures

### Git Workflow

1. Create feature branch from `main`
2. Make changes and commit with descriptive messages
3. Test locally
4. Create pull request
5. Code review and merge

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration (see `eslint.config.mjs`)
- Format code with Prettier (if configured)
- Write self-documenting code with clear variable names

### Adding New Features

1. **Database Changes**
   - Create migration SQL file
   - Update schema documentation
   - Test migration on development database

2. **API Endpoints**
   - Create route in `src/app/api/[feature]/`
   - Add error handling and validation
   - Update API documentation

3. **UI Components**
   - Create component in appropriate directory
   - Add to component library if reusable
   - Update translations if needed

4. **Testing**
   - Test manually in development
   - Add unit tests for complex logic
   - Test with different user roles

---

## Testing

### Manual Testing

The application includes several test pages for development:

- `/test-basic-info` - Test basic information collection
- `/test-chat` - Test AI chat functionality
- `/test-gemini` - Test Gemini API integration
- `/test-pulse` - Test pulse examination UI
- `/test-report` - Test report generation
- `/test-inquiry` - Test medical inquiry flow

### Test Configuration

- **Vitest**: Configured in `vitest.config.mts`
- **Test Utilities**: `src/test-utils.tsx` provides testing helpers
- **Setup**: `src/setupTests.ts` configures test environment

### Running Tests

```bash
npm run test
```

---

## Deployment

### Web Application Deployment

#### Vercel (Recommended)

1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Manual Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start production server:

```bash
   npm start
```

### Environment Variables for Production

Ensure all environment variables are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (production URL)

### Mobile App Deployment

#### Expo Build

1. Configure `app.json` and `eas.json`
2. Build with EAS:

   ```bash
   eas build --platform android
   eas build --platform ios
   ```

3. Submit to app stores:

```bash
   eas submit --platform android
   eas submit --platform ios
```

### Database Migrations

Before deploying:

1. Backup production database
2. Test migrations on staging environment
3. Apply migrations in order
4. Verify data integrity

---

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Errors

**Problem**: Cannot connect to Supabase

**Solutions**:

- Verify environment variables are set correctly
- Check Supabase project status
- Verify network connectivity
- Check RLS policies if data access is denied

#### 2. Gemini API Errors

**Problem**: AI features not working

**Solutions**:

- Verify `GEMINI_API_KEY` is set
- Check API quota/limits
- Review API error logs in `/api/gemini/` routes
- Ensure API key has correct permissions

#### 3. Authentication Issues

**Problem**: Users cannot log in or access protected routes

**Solutions**:

- Check Supabase Auth configuration
- Verify middleware is correctly protecting routes
- Check user role assignments in database
- Review RLS policies

#### 4. Database Migration Errors

**Problem**: Schema changes not applying

**Solutions**:

- Run migrations in correct order
- Check for conflicting changes
- Verify database user permissions
- Review migration SQL for syntax errors

#### 5. Build Errors

**Problem**: Application fails to build

**Solutions**:

- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`
- Review ESLint errors: `npm run lint`

#### 6. Tina CMS 404 Error

**Problem**: Navigating to `/tina-admin` returns a 404 error.

**Solutions**:

- **Check Server Command**: Ensure you are running `npm run dev:tina` instead of `npm run dev`. Tina needs to build its admin assets and start a GraphQL backend.
- **Check Output Directory**: Verify that `public/tina-admin` contains an `index.html` file. If not, the Tina build process hasn't run.
- **Console Errors**: Check the terminal for "🦙 TinaCMS Dev Server" status. It should say "✅ TinaCMS Dev Server is active".

#### 7. Mobile App Issues

**Problem**: Expo app crashes or styles don't apply.

**Gotchas & Solutions**:

- **Inline Styles**: Avoid `style={{...}}` objects as they cause re-renders. Use `StyleSheet.create()`.
- **Layouts**: Use `SafeAreaView` for all top-level screen containers.
- **Lists**: Use `FlatList` or `ScrollView`, never `.map()` directly in render methods.
- **Circular Imports**: Mobile colors MUST come from `constants/Colors.js`, never import from `App.js` to other components.
- **CORS**: If API calls fail on device but work on simulator, check Tailwind v4 CORS headers for mobile requests.
- **Connection**: If "Blue Screen" or connection errors occur, try restarting the WiFi adapter on the host PC.

### Debugging Tips

1. **Check Browser Console**: Look for client-side errors
2. **Check Server Logs**: Review Next.js server output
3. **Supabase Dashboard**: Check logs and database state
4. **Network Tab**: Inspect API requests/responses
5. **Test Pages**: Use test pages to isolate issues

### Getting Help

- Review existing documentation files:
  - `SETUP_TUTORIAL.md`
  - `USER_TESTING_GUIDE.md`
  - `ONBOARDING_LENE.md`
- Check code comments and inline documentation
- Review git history for context on changes

---

## Additional Resources

### Documentation Files

- `README.md` - Project overview
- `SYSTEM_DESCRIPTION.md` - System architecture details
- `SETUP_TUTORIAL.md` - Detailed setup instructions
- `USER_TESTING_GUIDE.md` - User testing procedures
- `ONBOARDING_LENE.md` - Onboarding process documentation

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [React Native/Expo Documentation](https://docs.expo.dev)
- [shadcn/ui Components](https://ui.shadcn.com)

---

## Contributing

### Before Contributing

1. Read this developer manual
2. Understand the codebase structure
3. Follow the development workflow
4. Write clear commit messages
5. Test your changes thoroughly

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Translations are updated if UI changed
- [ ] Database migrations are included if schema changed
- [ ] Tests pass (if applicable)
- [ ] Documentation is updated

---

**Last Updated**: 2025-12-26
**Version**: 1.2.0
