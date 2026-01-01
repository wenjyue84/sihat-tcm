# Lib Directory Organization Progress

**Date**: January 2025  
**Status**: In Progress

## ✅ Completed

### 1. Data Files Organization
- ✅ Created `lib/data/herbShop.ts` - Re-export from herbShopData
- ✅ Created `lib/data/dailyTips.ts` - Re-export from daily-tips
- ✅ Created `lib/data/solarTerms.ts` - Re-export from solar-terms
- ✅ Updated `lib/data/index.ts` - Barrel export for all data files

**Impact**: Cleaner import paths - `import { ... } from '@/lib/data'`

### 2. Constants Organization
- ✅ Created `lib/constants/ai-models.ts` - AI model constants (moved from constants.ts)
- ✅ Updated `lib/constants/index.ts` - Barrel export
- ✅ Updated `lib/constants.ts` - Legacy re-export for backward compatibility

**Impact**: Better organization of constants, backward compatible

### 3. Documentation Organization
- ✅ Moved `lib/swagger.ts` → `lib/docs/swagger.ts`
- ✅ Updated import in `api/doc/route.ts`

---

## 📋 Remaining Organization Opportunities

### Files Still in Root Lib Directory

#### Constants/Config Files
- `doctorLevels.ts` (39 lines) - Could move to `constants/doctor-levels.ts`
- `systemPrompts.ts` (15 lines) - Could move to `constants/system-prompts.ts`

#### Utility Files
- `errorUtils.ts` - Could move to `utils/error-utils.ts`
- `validations.ts` - Could move to `utils/validations.ts`
- `tcm-utils.ts` - Could move to `tcm/utils.ts` or `utils/tcm-utils.ts`

#### Logger Files
- `logger.ts` - Could organize into `logging/` subdirectory
- `errorLogger.ts` - Could organize into `logging/` subdirectory
- `systemLogger.ts` - Could organize into `logging/` subdirectory
- `systemLogger.client.ts` - Could organize into `logging/` subdirectory
- `clientLogger.ts` - Could organize into `logging/` subdirectory

#### Provider Files
- `googleProvider.ts` - Could move to `providers/google.ts`

#### Legacy Wrapper Files (Deprecated but kept for compatibility)
- `voiceCommandHandler.ts` - Legacy wrapper (deprecated)
- `webNotificationManager.ts` - Legacy wrapper (deprecated)
- `enhancedAIDiagnosticEngine.ts` - Legacy wrapper (deprecated)
- `personalizationEngine.ts` - Legacy wrapper (deprecated)
- `aiModelRouter.ts` - Legacy wrapper (deprecated)

**Note**: Legacy wrappers are intentionally kept for backward compatibility.

---

## 📊 Impact

- **Files Organized**: 3 data files, 1 constants file, 1 docs file
- **Import Paths Improved**: Cleaner imports via barrel exports
- **Backward Compatibility**: Maintained through re-exports

---

## Next Steps

1. Organize remaining constants files
2. Organize utility files
3. Consider organizing logger files
4. Review provider files organization


