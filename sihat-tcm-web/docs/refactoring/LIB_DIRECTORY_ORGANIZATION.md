# Lib Directory Organization Guide

**Date**: January 2025  
**Status**: In Progress - Index Files Created ✅

## Overview

Organizing the `src/lib/` directory into logical subdirectories to improve code discoverability and maintainability.

## Current State

- 68+ files in `src/lib/` root
- Some organization exists (`api/`, `supabase/`, `translations/`, `monitoring/`, `testing/`)
- Many utility files scattered in root

## Target Structure

```
src/lib/
├── api/              ✅ Already organized
│   ├── handlers/
│   └── middleware/
├── supabase/         ✅ Already organized
├── translations/     ✅ Already organized
├── monitoring/       ✅ Already organized
├── testing/          ✅ Already organized
├── accessibility/    ✅ Already organized
├── errors/           ✅ Already organized
├── constants/        ✅ Created with index.ts
│   ├── index.ts
│   ├── doctorLevels.ts (to be moved)
│   ├── systemPrompts.ts (to be moved)
│   ├── daily-tips.ts (to be moved)
│   ├── solar-terms.ts (to be moved)
│   └── herbShopData.ts (to be moved)
├── tcm/              ✅ Created with index.ts
│   ├── index.ts
│   ├── tcm-utils.ts (to be moved)
│   ├── fiveElementsScoreCalculator.ts (to be moved)
│   ├── medicalHistoryParser.ts (to be moved)
│   └── enhancedTonguePrompt.ts (to be moved)
├── ai/               ✅ Created with index.ts
│   ├── index.ts
│   ├── aiModelRouter.ts (to be moved)
│   ├── enhancedAIDiagnosticEngine.ts (to be moved)
│   ├── personalizationEngine.ts (to be moved)
│   ├── medicalSafetyValidator.ts (to be moved)
│   └── modelFallback.ts (to be moved)
└── utils/            ✅ Partially organized
    ├── index.ts
    ├── data-extraction.ts ✅
    ├── date-formatting.ts ✅
    ├── utils.ts (to be moved)
    ├── validations.ts (to be moved)
    ├── errorUtils.ts (to be moved)
    └── healthMetrics.ts (to be moved)
```

## Migration Strategy

### Phase 1: Create Index Files ✅

**Completed**: Created barrel export files for:

- `tcm/index.ts`
- `ai/index.ts`
- `constants/index.ts`
- `utils/index.ts`

### Phase 2: Move Files Incrementally (Next)

**TCM Utilities** (Low risk - few imports):

1. Move `tcm-utils.ts` → `tcm/tcm-utils.ts`
2. Move `fiveElementsScoreCalculator.ts` → `tcm/fiveElementsScoreCalculator.ts`
3. Move `medicalHistoryParser.ts` → `tcm/medicalHistoryParser.ts`
4. Update imports: `@/lib/tcm-utils` → `@/lib/tcm`

**AI Utilities** (Medium risk - more imports):

1. Move AI-related files to `ai/` directory
2. Update imports incrementally
3. Test after each move

**Constants** (Low risk):

1. Move constant files to `constants/` directory
2. Update imports

**General Utils** (Low risk):

1. Move remaining utility files to `utils/` directory
2. Update imports

### Phase 3: Update All Imports

Use find/replace to update imports:

- `@/lib/tcm-utils` → `@/lib/tcm` or `@/lib/tcm/tcm-utils`
- `@/lib/aiModelRouter` → `@/lib/ai` or `@/lib/ai/aiModelRouter`
- `@/lib/doctorLevels` → `@/lib/constants` or `@/lib/constants/doctorLevels`

## Benefits

- ✅ Better code organization
- ✅ Easier to find related files
- ✅ Clearer module boundaries
- ✅ Better tree-shaking with barrel exports
- ✅ Improved developer experience

## Files to Move

### TCM Utilities (4 files)

- [ ] `tcm-utils.ts` → `tcm/tcm-utils.ts`
- [ ] `fiveElementsScoreCalculator.ts` → `tcm/fiveElementsScoreCalculator.ts`
- [ ] `medicalHistoryParser.ts` → `tcm/medicalHistoryParser.ts`
- [ ] `enhancedTonguePrompt.ts` → `tcm/enhancedTonguePrompt.ts`

### AI Utilities (5 files)

- [ ] `aiModelRouter.ts` → `ai/aiModelRouter.ts`
- [ ] `enhancedAIDiagnosticEngine.ts` → `ai/enhancedAIDiagnosticEngine.ts`
- [ ] `personalizationEngine.ts` → `ai/personalizationEngine.ts`
- [ ] `medicalSafetyValidator.ts` → `ai/medicalSafetyValidator.ts`
- [ ] `modelFallback.ts` → `ai/modelFallback.ts`

### Constants (5 files)

- [ ] `doctorLevels.ts` → `constants/doctorLevels.ts`
- [ ] `systemPrompts.ts` → `constants/systemPrompts.ts`
- [ ] `daily-tips.ts` → `constants/daily-tips.ts`
- [ ] `solar-terms.ts` → `constants/solar-terms.ts`
- [ ] `herbShopData.ts` → `constants/herbShopData.ts`

### General Utils (4 files)

- [ ] `utils.ts` → `utils/utils.ts` (already exists, may need to merge)
- [ ] `validations.ts` → `utils/validations.ts`
- [ ] `errorUtils.ts` → `utils/errorUtils.ts`
- [ ] `healthMetrics.ts` → `utils/healthMetrics.ts`

## Testing Strategy

After each file move:

1. Run linter to check for import errors
2. Run type checker: `npm run type-check`
3. Test affected features manually
4. Commit after successful move

## Rollback Plan

If issues arise:

1. Revert file moves
2. Keep index files for future organization
3. Update imports back to original paths

---

**Status**: Phase 1 Complete ✅, Phase 2 Ready to Execute
