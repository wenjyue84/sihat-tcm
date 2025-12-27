# Sihat TCM - Documentation

This directory contains comprehensive documentation for the Sihat TCM web application.

## 📁 Directory Structure

### Core Documentation
- **`DEVELOPER_MANUAL.md`** - Complete developer guide with architecture, APIs, and workflows
- **`SYSTEM_DESCRIPTION.md`** - System overview and product intent
- **`USER_MANUAL.md`** - End-user documentation and guides
- **`API_DOCUMENTATION.md`** - API endpoints and usage
- **`DATA_MODELS.md`** - Database schema and data models
- **`SYSTEM_ARCHITECTURE.md`** - System architecture and design patterns
- **`DEVELOPER_DOCUMENTATION.md`** - Additional developer resources
- **`INLINE_CODE_DOCUMENTATION_GUIDE.md`** - Code documentation standards

### Testing
- **`COMPREHENSIVE_TESTING_GUIDE.md`** - Complete testing guide
- **`TESTING_QUICK_REFERENCE.md`** - Quick testing reference
- **`ACCESSIBILITY_TESTING_GUIDE.md`** - Accessibility testing guidelines
- **`testing/`** - Feature-specific testing guides
  - `QUICK_TEST_GUIDE.md`
  - `USER_TESTING_GUIDE.md`
  - `HEALTH_PASSPORT_TESTING_GUIDE.md`

### Implementation Phases
- **`implementation/`** - Phase-by-phase implementation summaries
  - `PHASE1_IMPLEMENTATION_SUMMARY.md` - Database Schema Enhancement
  - `PHASE2_IMPLEMENTATION_SUMMARY.md`
  - `PHASE3_IMPLEMENTATION_SUMMARY.md` + `PHASE3_RISK_ASSESSMENT.md`
  - `PHASE5_IMPLEMENTATION_SUMMARY.md`
  - `PHASE8_*` - Phase 8 implementation docs (Complete, Summary, Quick Start, Visual Guide)

### Features
- **`features/`** - Feature-specific documentation
  - **Health Passport**: `HEALTH_PASSPORT_*.md` (Implementation, Setup, Summary, Checklist, Quick Reference)
  - **Meal Planner**: `MEAL_PLANNER_*.md` (Implementation Summary, Complete, Quick Start)
  - **Dashboard**: `DASHBOARD_*.md` (Integration Analysis, Merge Complete)
  - **Diagnosis**: `DIAGNOSIS_DATA_RECORDING_*.md` (Plan, Testing Guide)
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
  - `MIGRATION_INSTRUCTIONS_GUEST_SESSIONS.md`
  - `RUN_MIGRATION_NOW.md`

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
- **`refactoring/`** - Refactoring documentation
  - `REFACTORING_PLAN.md`
  - `REFACTORING_SUMMARY.md`
  - `REFACTORING_EXAMPLE.md`

### Architecture Decision Records (ADR)
- **`adr/`** - Architecture decision records
  - `0000-template.md` - ADR template
  - `0001-nextjs-app-router.md` - Next.js App Router decision

### User Guides
- **`USER_GUIDES.md`** - Consolidated user guides

### System Health
- **`SYSTEM_HEALTH_MONITORING.md`** - System monitoring and health checks

## 🔍 Quick Navigation

- **Getting Started**: See `SETUP_TUTORIAL.md` in `setup/`
- **Development**: Start with `DEVELOPER_MANUAL.md`
- **Testing**: See `COMPREHENSIVE_TESTING_GUIDE.md` or `testing/` folder
- **Features**: Browse `features/` for specific feature documentation
- **Troubleshooting**: Check `fixes/` for known issues and solutions
- **Architecture**: See `SYSTEM_ARCHITECTURE.md` and `adr/` for design decisions

## 📝 Notes

- `README.md` in the root of `sihat-tcm-web/` contains project overview and quick start
- Some documentation may reference files that have been moved - update paths as needed
- For mobile app documentation, see `../sihat-tcm-mobile/docs/`
- For project-wide AI integration docs, see `../../docs/ai-integration/`

