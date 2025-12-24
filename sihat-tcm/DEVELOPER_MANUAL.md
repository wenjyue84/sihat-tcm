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

- Patient onboarding and medical history collection
- TCM diagnostic workflows (pulse, tongue, body examination)
- AI-powered diagnostic assistance
- Medical report generation and management
- Multi-language support (English, Malay, Chinese)
- Role-based access control (Patient, Doctor, Admin)
- Real-time chat with AI for medical inquiries

---

## Architecture

### Technology Stack

**Web Application:**
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini API

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
   NEXT_PUBLIC_APP_URL=http://localhost:3000
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

   The application will be available at `http://localhost:3000`

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
   export const API_BASE_URL = 'http://localhost:3000';
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
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── diagnosis/      # Diagnosis-related endpoints
│   │   │   ├── reports/        # Medical report endpoints
│   │   │   └── gemini/         # AI integration endpoints
│   │   ├── admin/              # Admin dashboard
│   │   ├── doctor/             # Doctor dashboard
│   │   ├── patient/            # Patient dashboard
│   │   ├── login/              # Login page
│   │   └── test-*/             # Test/development pages
│   ├── components/             # React components
│   │   ├── admin/              # Admin-specific components
│   │   ├── diagnosis/          # Diagnosis workflow components
│   │   ├── onboarding/         # Patient onboarding components
│   │   ├── landing/            # Landing page components
│   │   └── ui/                 # Reusable UI components (shadcn/ui)
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── DoctorContext.tsx   # Doctor-specific state
│   │   ├── DiagnosisProgressContext.tsx  # Diagnosis workflow state
│   │   ├── LanguageContext.tsx # Multi-language support
│   │   └── OnboardingContext.tsx # Onboarding state
│   ├── hooks/                  # Custom React hooks
│   │   ├── useDiagnosisPersistence.ts
│   │   └── useDiagnosisWizard.ts
│   ├── lib/                    # Utility libraries
│   │   ├── supabase.ts         # Supabase client
│   │   ├── systemPrompts.ts    # AI system prompts
│   │   ├── utils.ts            # General utilities
│   │   └── translations/       # Translation files
│   └── middleware.ts           # Next.js middleware
├── public/                     # Static assets
├── scripts/                     # Utility scripts
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

### Diagnosis Workflow

**Location**: `src/components/diagnosis/`, `src/hooks/useDiagnosisWizard.ts`

The diagnosis workflow is a multi-step process:

1. **Patient Information Collection**
2. **Pulse Examination** - Pulse pattern analysis
3. **Tongue Examination** - Tongue image and analysis
4. **Body Examination** - Body constitution assessment
5. **Symptom Collection** - Patient-reported symptoms
6. **AI Analysis** - Gemini AI processes all collected data
7. **Report Generation** - Final medical report creation

**Key Components:**
- `DiagnosisProgressContext` - Tracks progress through workflow
- `useDiagnosisWizard` - Hook for navigation and state management
- `useDiagnosisPersistence` - Saves progress to database

### AI Integration

**Location**: `src/app/api/gemini/`, `src/lib/systemPrompts.ts`

The system integrates with Google Gemini API for:

- Diagnostic analysis
- Report generation
- Medical inquiry chat
- Symptom interpretation

**System Prompts** are defined in `src/lib/systemPrompts.ts` and provide context to the AI about TCM principles and diagnostic criteria.

### Multi-language Support

**Location**: `src/lib/translations/`, `src/contexts/LanguageContext.tsx`

Supported languages:
- English (en)
- Malay (ms)
- Chinese (zh)

Translation files are organized by feature area and loaded dynamically based on user preference.

---

## API Routes

### Authentication Routes

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Diagnosis Routes

- `POST /api/diagnosis/create` - Create new diagnosis session
- `GET /api/diagnosis/[id]` - Get diagnosis by ID
- `PUT /api/diagnosis/[id]` - Update diagnosis
- `POST /api/diagnosis/[id]/complete` - Complete diagnosis and generate report

### Report Routes

- `GET /api/reports` - List reports (filtered by user role)
- `GET /api/reports/[id]` - Get report by ID
- `POST /api/reports/[id]/chat` - Chat with AI about report
- `GET /api/reports/[id]/pdf` - Generate PDF report

### Gemini AI Routes

- `POST /api/gemini/analyze` - Analyze diagnostic data
- `POST /api/gemini/chat` - Chat with AI assistant
- `POST /api/gemini/generate-report` - Generate medical report

### Admin Routes

- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/[id]` - Update user
- `GET /api/admin/stats` - System statistics

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

**diagnoses** - Diagnosis sessions
- `id` (UUID, primary key)
- `patient_id` (references patients)
- `practitioner_id` (references practitioners)
- `status` (in_progress, completed, cancelled)
- `data` (JSONB) - All collected diagnostic data
- `created_at`, `updated_at`, `completed_at`

**medical_reports** - Generated medical reports
- `id` (UUID, primary key)
- `diagnosis_id` (references diagnoses)
- `patient_id` (references patients)
- `practitioner_id` (references practitioners)
- `content` (JSONB) - Report content
- `pdf_url` (text) - Link to PDF if generated
- `created_at`, `updated_at`

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
if (pathname.startsWith('/admin') && user.role !== 'admin') {
  return NextResponse.redirect('/login');
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

**Last Updated**: [Current Date]
**Version**: 1.0.0
