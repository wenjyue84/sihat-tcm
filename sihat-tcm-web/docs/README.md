# Sihat TCM - Documentation

This directory contains comprehensive documentation for the Sihat TCM web application.

## 📁 Directory Structure

### Core Documentation
- **`DEVELOPER_GUIDE.md`** - Comprehensive developer guide (consolidated from DEVELOPER_MANUAL + DEVELOPER_DOCUMENTATION)
- **`USER_GUIDE.md`** - Complete user documentation (consolidated from USER_MANUAL + USER_GUIDES)
- **`SYSTEM_DESCRIPTION.md`** - System overview and product intent
- **`API_DOCUMENTATION.md`** - API endpoints and usage
- **`DATA_MODELS.md`** - Database schema and data models
- **`SYSTEM_ARCHITECTURE.md`** - System architecture and design patterns
- **`INLINE_CODE_DOCUMENTATION_GUIDE.md`** - Code documentation standards

### Testing
- **`COMPREHENSIVE_TESTING_GUIDE.md`** - Complete testing guide
- **`ACCESSIBILITY_TESTING_GUIDE.md`** - Accessibility testing guidelines
- **`testing/`** - Feature-specific testing guides
  - `TESTING_QUICK_REFERENCE.md` - Quick testing reference
  - `USER_TESTING_GUIDE.md` - User testing procedures
  - `HEALTH_PASSPORT_TESTING_GUIDE.md` - Health Passport testing

### Implementation
- **`implementation/`** - Implementation guides
  - `PHASE8_QUALITY_GATES.md` - Development workflow and quality gates (consolidated)
  - Historical phase summaries (PHASE1, PHASE2, PHASE3, PHASE5)

### Features
- **`features/`** - Feature-specific documentation
  - **`DOCTOR_PORTAL.md`** - Doctor Portal navigation and features (consolidated)
  - **Health Passport**: `HEALTH_PASSPORT.md`
  - **Meal Planner**: `MEAL_PLANNER.md`
  - **Dashboard**: `DASHBOARD.md`
  - **Diagnosis**: `DIAGNOSIS_DATA_RECORDING_PLAN.md`, `DIAGNOSIS_DATA_RECORDING_TESTING_GUIDE.md`
  - **Five Elements Radar**: `FIVE_ELEMENTS_RADAR_INTEGRATION.md`
  - **Soundscape**: `SOUNDSCAPE_AUDIO_FILES.md`

### Fixes & Troubleshooting
- **`fixes/`** - Bug fixes and troubleshooting guides
  - `FIX_MIGRATION_ERROR.md`
  - `FIX_MEDICINES_COLUMN.md`
  - `MIGRATION_FIX.md`
  - `MEAL_PLANNER_FIX.md`
  - `HEALTH_PASSPORT_BUILD_FIX.md`
  - `FACE_API_TEST_FIX.md`

### Setup & Configuration
- **`setup/`** - Setup guides and configuration
  - `SETUP_TUTORIAL.md` - Initial setup guide
  - `GIT_HOOK_SETUP.md` - Git hooks configuration
  - `ONBOARDING_LENE.md` - Onboarding documentation
  - `IMPORT_INSTRUCTIONS.md` - Data import guide
  - `YEAK_DATA_IMPORT_GUIDE.md` - YEAK data import
  - `PORT_3100_NOTES.md` - Port configuration notes

### Migrations
- **`migrations/`** - Database migration guides
  - `MIGRATION_GUIDE.md` - Database migration instructions (consolidated)

### UI/UX
- **`ui-ux/`** - Design and user experience documentation
  - `UI_UX_DESIGN_GUIDELINES.md`
  - `MOBILE_LAYOUT_OPTIMIZATION_PLAN.md`
  - `MOBILE_READABILITY_RECOMMENDATIONS.md`

### Guidelines
- **`guidelines/`** - Code quality and security guidelines
  - `CODE_REVIEW_GUIDELINES.md`
  - `API_KEY_SECURITY.md`
  - `REDIS_CACHING_RISK_ASSESSMENT.md`

### Refactoring
- **`REFACTORING_GUIDE.md`** - Comprehensive refactoring guide (consolidated)

### Architecture Decision Records (ADR)
- **`adr/`** - Architecture decision records
  - `0000-template.md` - ADR template
  - `0001-nextjs-app-router.md` - Next.js App Router decision

### System Health
- **`SYSTEM_HEALTH_MONITORING.md`** - System monitoring and health checks

## 🔍 Quick Navigation

- **Getting Started**: See `setup/SETUP_TUTORIAL.md`
- **Development**: Start with `DEVELOPER_GUIDE.md` for comprehensive developer documentation
- **Users**: See `USER_GUIDE.md` for complete end-user documentation
- **Testing**: See `COMPREHENSIVE_TESTING_GUIDE.md` or `testing/` folder
- **Features**: Browse `features/` for specific feature documentation
- **Troubleshooting**: Check `fixes/` for known issues and solutions
- **Migrations**: See `migrations/MIGRATION_GUIDE.md` for database migrations
- **Refactoring**: See `REFACTORING_GUIDE.md` for code refactoring plans
- **Architecture**: See `SYSTEM_ARCHITECTURE.md` and `adr/` for design decisions

## 📝 Notes

- `README.md` in the root of `sihat-tcm-web/` contains project overview and quick start
- SQL files have been organized into `supabase/scripts/` and `supabase/scripts/seeds/`
- Some documentation has been consolidated for easier navigation:
  - Developer docs → `DEVELOPER_GUIDE.md` (consolidated from DEVELOPER_MANUAL + DEVELOPER_DOCUMENTATION)
  - User docs → `USER_GUIDE.md` (consolidated from USER_MANUAL + USER_GUIDES)
  - Doctor Portal Navigation files → `features/DOCTOR_PORTAL.md`
  - Phase 8 files → `implementation/PHASE8_QUALITY_GATES.md`
  - Refactoring files → `REFACTORING_GUIDE.md`
  - Migration files → `migrations/MIGRATION_GUIDE.md`
- Original files have been archived in `archive/` for reference
- For mobile app documentation, see `../sihat-tcm-mobile/docs/`
- For project-wide AI integration docs, see `../../docs/ai-integration/`

