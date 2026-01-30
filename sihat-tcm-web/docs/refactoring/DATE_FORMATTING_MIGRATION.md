# Date Formatting Migration Guide

**Date**: January 2025  
**Status**: In Progress

## Overview

Extracted duplicate `formatDate` functions from multiple components into a shared utility.

## Components Updated

1. ✅ `HistoryCard.tsx` - Updated to use shared utility
2. ✅ `FamilyManagement.tsx` - Import added, local function removed
3. ⏳ `TimelineSessionCard.tsx` - Needs import and usage update
4. ⏳ `UnifiedDashboard.tsx` - Import added, local function removed (needs usage verification)

## Shared Utility

**Location**: `src/lib/utils/date-formatting.ts`

**Functions**:
- `formatDate()` - Main formatting function with language support
- `formatRelativeDate()` - Relative time formatting
- `formatDateRange()` - Date range formatting
- `formatDateForFilename()` - Filename-safe date format

## Usage Examples

```typescript
import { formatDate } from "@/lib/utils/date-formatting";

// Basic usage
formatDate("2024-01-15") // "Jan 15, 2024"

// With language
formatDate("2024-01-15", { language: "zh" }) // Uses Chinese locale

// Full format
formatDate("2024-01-15", { format: "full" }) // "January 15, 2024"

// With time
formatDate("2024-01-15T10:30:00", { includeTime: true })
```

## Remaining Work

- [ ] Verify all `formatDate()` calls in UnifiedDashboard work correctly
- [ ] Update TimelineSessionCard to use new API
- [ ] Test date formatting in all languages (en, zh, ms)
- [ ] Remove any remaining local formatDate implementations

---

**Status**: 75% Complete



