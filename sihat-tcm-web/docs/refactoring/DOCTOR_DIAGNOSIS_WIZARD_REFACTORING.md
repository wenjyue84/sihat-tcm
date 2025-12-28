# DoctorDiagnosisWizard Refactoring Plan

**File**: `src/components/doctor/DoctorDiagnosisWizard.tsx`  
**Original Size**: 955 lines  
**Target**: Split into ~10 focused modules

## Refactoring Strategy

### Phase 1: Extract Custom Hooks ✅ (In Progress)

1. **`hooks/useDoctorDiagnosisWizard.ts`** ✅ - State management
   - Expanded sections state
   - Camera visibility state
   - File extraction state
   - Medicine input state

2. **`hooks/useDoctorDiagnosisHandlers.ts`** ✅ - Event handlers
   - Test data filling
   - Clear data
   - File upload/extraction
   - Medicine management
   - Completion calculation

### Phase 2: Extract Utilities ✅ (In Progress)

1. **`utils/doctorDiagnosisUtils.ts`** ✅ - Constants and helpers
   - Common symptoms list
   - Sections configuration
   - Completion calculation function

### Phase 3: Extract Section Components ⏳ (Next)

1. **`sections/PatientInfoSection.tsx`** - Patient information form
2. **`sections/SymptomsSection.tsx`** - Symptoms selection
3. **`sections/TongueAnalysisSection.tsx`** - Tongue image capture
4. **`sections/FaceAnalysisSection.tsx`** - Face image capture
5. **`sections/TCMInquirySection.tsx`** - TCM inquiry form
6. **`sections/ReportsSection.tsx`** - Report upload/management
7. **`sections/MedicinesSection.tsx`** - Medicine management
8. **`sections/ClinicalNotesSection.tsx`** - Clinical notes and treatment

### Phase 4: Refactor Main Component ⏳

Update `DoctorDiagnosisWizard.tsx` to:
- Use custom hooks
- Use extracted section components
- Focus on orchestration only
- Target: ~200-300 lines

## File Structure

```
src/components/doctor/
├── DoctorDiagnosisWizard.tsx (main, ~200-300 lines)
├── hooks/
│   ├── useDoctorDiagnosisWizard.ts ✅
│   └── useDoctorDiagnosisHandlers.ts ✅
├── sections/
│   ├── PatientInfoSection.tsx ⏳
│   ├── SymptomsSection.tsx ⏳
│   ├── TongueAnalysisSection.tsx ⏳
│   ├── FaceAnalysisSection.tsx ⏳
│   ├── TCMInquirySection.tsx ⏳
│   ├── ReportsSection.tsx ⏳
│   ├── MedicinesSection.tsx ⏳
│   └── ClinicalNotesSection.tsx ⏳
└── utils/
    └── doctorDiagnosisUtils.ts ✅
```

## Benefits

1. **Maintainability**: Each section is independent and focused
2. **Testability**: Hooks and components can be tested separately
3. **Reusability**: Section components can be reused elsewhere
4. **Readability**: Main component is much cleaner
5. **Performance**: Better code splitting opportunities

## Migration Steps

1. ✅ Create custom hooks
2. ✅ Create utility functions
3. ⏳ Extract section components
4. ⏳ Update main component to use new structure
5. ⏳ Test all functionality
6. ⏳ Update imports if needed

## Notes

- All existing functionality must be preserved
- No breaking changes to props or behavior
- Maintain backward compatibility
- Test each section after extraction

