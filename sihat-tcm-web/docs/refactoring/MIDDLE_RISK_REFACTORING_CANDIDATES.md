# Middle Risk Refactoring Candidates

**Date**: January 2025  
**Status**: Identified - Ready for Review

## Overview

This document identifies **middle-risk files** (300-800 lines) that would benefit from refactoring. These files are not critical (like the 1000+ line files), but they have enough complexity to warrant improvement.

**Risk Level**: Medium  
**Effort**: 2-6 hours per file  
**Impact**: Improved maintainability, testability, and code organization

---

## Component Files (300-800 lines)

### 1. `src/components/diagnosis/DiagnosisSummary.tsx` - **699 lines**

**Issues**:

- Multiple responsibilities: summary display, options management, wizard navigation
- Complex state management with many useState hooks
- Large component with nested conditionals
- Mixed concerns: UI rendering, state management, and data transformation

**Refactoring Opportunities**:

- Extract options management into `useReportOptions` hook
- Split into sub-components:
  - `SummaryObservationsSection.tsx`
  - `SummaryInquirySection.tsx`
  - `SummaryOptionsSection.tsx`
- Extract data transformation logic into utility functions
- Simplify state management with useReducer

**Estimated Effort**: 4-5 hours

---

### 2. `src/components/diagnosis/BasicInfoForm.tsx` - **540 lines**

**Issues**:

- Multi-step wizard with complex state transitions
- Profile completeness check logic mixed with form logic
- Auto-fill logic embedded in component
- Multiple useEffect hooks with complex dependencies

**Refactoring Opportunities**:

- Extract profile completeness check into `useProfileCompleteness` hook
- Extract auto-fill logic into `useAutoFillFormData` hook
- Simplify step navigation with a dedicated hook
- Move validation logic to separate utility functions

**Estimated Effort**: 3-4 hours

---

### 3. `src/components/diagnosis/DiagnosisWizard.tsx` - **658 lines**

**Issues**:

- Orchestrates multiple wizard steps
- Complex conditional rendering based on step state
- Test data filling logic embedded
- Multiple concerns: routing, state management, UI rendering

**Refactoring Opportunities**:

- Extract step rendering logic into `WizardStepRenderer` component
- Move test data logic to a separate utility or hook
- Simplify step transitions with a state machine pattern
- Extract developer mode logic into separate component

**Estimated Effort**: 4-5 hours

---

### 4. `src/components/patient/PatientCommunication.tsx` - **297 lines**

**Issues**:

- Mixes data fetching, state management, and UI rendering
- Direct Supabase calls in component
- Message handling logic could be extracted
- No separation of concerns between data layer and UI

**Refactoring Opportunities**:

- Extract data fetching into `usePatientCommunication` hook
- Move Supabase operations to server actions or API routes
- Extract message sending logic into separate function
- Create reusable `MessageList` and `MessageInput` components

**Estimated Effort**: 2-3 hours

---

## API Route Files (200-700 lines)

### 5. `src/app/api/consult/route.ts` - **678 lines**

**Issues**:

- Very large API route with extensive documentation
- Complex prompt building logic
- Multiple responsibilities: validation, prompt construction, streaming
- Error handling could use the existing middleware

**Refactoring Opportunities**:

- Extract prompt building into `buildConsultationPrompt()` utility
- Use existing `createErrorResponse` middleware (currently uses `catch (error: any)`)
- Split validation logic into separate function
- Extract response formatting logic

**Estimated Effort**: 3-4 hours

**Note**: This file is listed in the high-priority API refactoring list but is manageable enough to be middle-risk.

---

## Library Files

### 6. `src/lib/actions.ts` - **2035 lines** ⚠️

**Note**: This file is actually **high-risk** (over 2000 lines), but it's worth mentioning here as it's a critical refactoring target.

**Issues**:

- Massive file with many server actions
- Multiple concerns mixed together
- Hard to navigate and maintain
- Difficult to test individual functions

**Refactoring Opportunities**:

- Split into feature-based modules:
  - `actions/diagnosis.ts`
  - `actions/patient.ts`
  - `actions/medical-reports.ts`
  - `actions/family.ts`
- Create index file for clean exports
- Extract helper functions to utilities

**Estimated Effort**: 6-8 hours

---

## Additional Candidates (Slightly Over Threshold)

### 7. `src/components/doctor/DoctorDiagnosisWizard.tsx` - **1049 lines**

**Note**: Just over 1000 lines, but still manageable.

**Issues**:

- Very large component with multiple sections
- Complex state management
- File upload and extraction logic embedded
- Multiple responsibilities

**Refactoring Opportunities**:

- Split into section-based components:
  - `PatientInfoSection.tsx`
  - `SymptomsSection.tsx`
  - `TongueAnalysisSection.tsx`
  - `FaceAnalysisSection.tsx`
  - `TCMInquirySection.tsx`
  - `ReportsSection.tsx`
  - `MedicinesSection.tsx`
  - `ClinicalNotesSection.tsx`
- Extract file handling into `useFileUpload` hook
- Extract form submission logic into separate function

**Estimated Effort**: 5-6 hours

---

## Refactoring Priority

### High Priority (Do First)

1. **DiagnosisSummary.tsx** - Most complex, most benefit
2. **BasicInfoForm.tsx** - Frequently used, affects user experience
3. **consult/route.ts** - Can use existing middleware, quick win

### Medium Priority

4. **DiagnosisWizard.tsx** - Good refactoring opportunity
5. **PatientCommunication.tsx** - Simpler, good practice

### Lower Priority (But Still Important)

6. **actions.ts** - Large but critical, needs careful planning
7. **DoctorDiagnosisWizard.tsx** - Large but less frequently used

---

## Refactoring Guidelines

### For Each File:

1. **Start with Tests** (if they exist)
   - Ensure existing tests pass
   - Add tests for extracted functions/components

2. **Extract Incrementally**
   - Extract one concern at a time
   - Test after each extraction
   - Don't break existing functionality

3. **Follow Existing Patterns**
   - Use existing hooks pattern
   - Follow component structure conventions
   - Maintain type safety

4. **Document Changes**
   - Update component documentation
   - Add JSDoc comments to extracted functions
   - Update related documentation files

---

## Success Metrics

After refactoring, each file should:

- ✅ Be under 400 lines (ideally under 300)
- ✅ Have single responsibility
- ✅ Be easily testable
- ✅ Have clear separation of concerns
- ✅ Follow existing code patterns
- ✅ Maintain backward compatibility

---

## Next Steps

1. **Review** this list with the team
2. **Prioritize** based on current development needs
3. **Start** with one file as a proof of concept
4. **Document** the refactoring process
5. **Share** learnings with the team

---

**Last Updated**: January 2025  
**Status**: Excellent Progress - 6 Files Refactored, 17 Modules Created

---

## Refactoring Progress

### ✅ Completed

1. **`consult/route.ts`** - Refactored to use existing error middleware
   - Replaced manual error handling with `createErrorResponse`
   - Reduced error handling code from ~25 lines to 1 line
   - Improved consistency with other API routes

2. **`DiagnosisSummary.tsx`** - Comprehensive refactoring
   - ✅ Created `summary/utils/summaryDataTransformers.ts` - Extracted data transformation logic (~80 lines)
   - ✅ Created `summary/hooks/useReportOptions.ts` - Extracted report options management (~100 lines)
   - ✅ Created `summary/sections/ObservationsSection.tsx` - Extracted observations step UI
   - ✅ Created `summary/sections/InquirySection.tsx` - Extracted inquiry step UI
   - ✅ Created `summary/sections/OptionsSection.tsx` - Extracted options step UI (~260 lines)
   - ✅ Updated main component to use extracted components
   - **Result**: Reduced main component from 699 lines to ~350 lines (50% reduction!)
   - Improved testability, maintainability, and single responsibility

### ✅ Recently Completed

3. **`BasicInfoForm.tsx`** - Extracted profile completeness and auto-fill logic
   - ✅ Created `basic-info/hooks/useProfileCompleteness.ts` - Profile completeness check and auto-fill
   - ✅ Created `basic-info/hooks/useAutoFillFormData.ts` - Form data management with auto-fill
   - ✅ Updated component to use extracted hooks
   - Reduced component complexity by ~80 lines
   - Improved separation of concerns

### 🔄 In Progress

4. **`DiagnosisWizard.tsx`** - Extracting step rendering logic
   - ✅ Created `wizard/StepRenderer.tsx` - Centralized step rendering
   - ✅ Created `wizard/utils/testDataHelpers.ts` - Test data utilities
   - ⏳ Update main component to use extracted modules

### ✅ Recently Completed

5. **`PatientCommunication.tsx`** - Extracted data layer and split UI components
   - ✅ Created `communication/hooks/usePatientCommunication.ts` - Data fetching and state management
   - ✅ Created `communication/components/RequestList.tsx` - Request list UI
   - ✅ Created `communication/components/ChatArea.tsx` - Chat interface UI
   - ✅ Updated component to use extracted modules
   - Reduced component from 297 lines to ~60 lines (80% reduction!)
   - Improved separation of concerns

### ✅ Recently Completed

6. **`InquiryWizard.tsx`** - Extracted state management and step rendering
   - ✅ Created `inquiry/hooks/useInquiryWizardState.ts` - State and navigation management
   - ✅ Created `inquiry/components/InquiryStepRenderer.tsx` - Step rendering with animations
   - ✅ Updated component to use extracted modules
   - Reduced component from 194 lines to ~70 lines (64% reduction!)
   - Improved separation of concerns

7. **`AudioRecorder.tsx`** - Started extracting hooks
   - ✅ Created `audio/hooks/useAudioRecording.ts` - Recording state management
   - ✅ Created `audio/hooks/useAudioAnalysis.ts` - Analysis state management
   - ⏳ Continue extracting more logic from this large component

8. **`DiagnosisReport.tsx`** - Extracted state, actions, and utilities
   - ✅ Created `report/hooks/useDiagnosisReportState.ts` - State and data fetching
   - ✅ Created `report/hooks/useDiagnosisReportActions.ts` - Action handlers
   - ✅ Created `report/utils/reportDataTransformers.ts` - Data transformation
   - ✅ Created `report/utils/pdfGenerator.ts` - PDF generation
   - ✅ Updated component to use extracted modules
   - Reduced component from 552 lines to ~400 lines (27% reduction)
   - Improved separation of concerns

9. **`DiagnosisWizard.tsx`** - Extracted test handlers, processing step, and utilities
   - ✅ Created `wizard/hooks/useTestDataHandlers.ts` - Test data event handlers
   - ✅ Created `wizard/utils/reportOptions.ts` - Report options utility
   - ✅ Created `wizard/components/ProcessingStep.tsx` - Processing step component
   - ✅ Updated component to use extracted modules
   - Reduced component from 658 lines to ~550 lines (16% reduction)
   - Improved modularity

10. **`IoTConnectionWizard.tsx`** - Extracted device configuration

- ✅ Created `iot/utils/deviceConfig.ts` - Device configuration
- ✅ Updated component to use extracted config
- Improved maintainability

### 📋 Remaining

- Complete `DiagnosisWizard.tsx` refactoring (integration pending)
- Continue `AudioRecorder.tsx` refactoring (hooks created, component update pending)
