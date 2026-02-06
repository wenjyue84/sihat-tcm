# UnifiedDashboard Refactoring Plan

**File**: `src/components/patient/UnifiedDashboard.tsx`  
**Original Size**: 1367 lines  
**Target**: Split into ~15 focused modules

## Refactoring Strategy

### Phase 1: Extract Custom Hooks ✅ (Completed)

Created three custom hooks to manage state:

1. **`hooks/usePatientDashboardState.ts`** - Dashboard state management
   - Health journey state (sessions, trends)
   - View & sort preferences
   - Active section management
   - Auto-syncs with profile preferences

2. **`hooks/useProfileManagement.ts`** - Profile operations
   - Profile data state
   - Edit mode management
   - Save/update operations
   - Auto-save functionality

3. **`hooks/useDocumentManagement.ts`** - Document/report management
   - Reports state
   - Upload/delete operations
   - File input handling

### Phase 2: Extract UI Components ✅ (In Progress)

1. **`sections/DashboardSidebar.tsx`** ✅ - Sidebar navigation
   - All navigation groups
   - Mobile menu handling
   - Active section highlighting

2. **`sections/DashboardContent.tsx`** ✅ - Content router
   - Renders appropriate section based on activeSection
   - Passes props to section components

3. **`sections/HealthJourneySection.tsx`** ⏳ - Health journey view
4. **`sections/ProfileSection.tsx`** ⏳ - Profile management view
5. **`sections/DocumentsSection.tsx`** ⏳ - Documents view
6. **`sections/MealPlannerSection.tsx`** ⏳ - Meal planner view
7. **`sections/SettingsSection.tsx`** ⏳ - Settings view

### Phase 3: Extract Utilities

1. **`utils/dashboardUtils.ts`** - Helper functions
   - `getScoreBadge()` - Score badge calculation
   - `getSectionTitle()` - Section title mapping
   - `sortSessions()` - Session sorting logic

### Phase 4: Refactor Main Component

Update `UnifiedDashboard.tsx` to:

- Use custom hooks
- Use extracted components
- Focus on orchestration only
- Target: ~200-300 lines

## File Structure

```
src/components/patient/
├── UnifiedDashboard.tsx (main, ~200-300 lines)
├── hooks/
│   ├── usePatientDashboardState.ts ✅
│   ├── useProfileManagement.ts ✅
│   └── useDocumentManagement.ts ✅
├── sections/
│   ├── DashboardSidebar.tsx ✅
│   ├── DashboardContent.tsx ✅
│   ├── HealthJourneySection.tsx ⏳
│   ├── ProfileSection.tsx ⏳
│   ├── DocumentsSection.tsx ⏳
│   ├── MealPlannerSection.tsx ⏳
│   └── SettingsSection.tsx ⏳
└── utils/
    └── dashboardUtils.ts ⏳
```

## Benefits

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Hooks and components can be tested independently
3. **Reusability**: Hooks can be reused in other components
4. **Readability**: Main component is much easier to understand
5. **Performance**: Better code splitting opportunities

## Migration Steps

1. ✅ Create custom hooks
2. ✅ Create sidebar component
3. ✅ Create content router
4. ⏳ Create section components (extract from main file)
5. ⏳ Extract utility functions
6. ⏳ Update main UnifiedDashboard to use new structure
7. ⏳ Test all sections work correctly
8. ⏳ Update imports across codebase if needed

## Notes

- All existing functionality must be preserved
- No breaking changes to props or behavior
- Maintain backward compatibility
- Test each section after extraction
