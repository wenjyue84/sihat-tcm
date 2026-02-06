# TCM AI Meal Planner - Complete Documentation

> A premium feature that generates personalized 7-day meal plans based on patient TCM diagnosis.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Future Enhancements](#future-enhancements)

---

## Overview

### What Was Built

Successfully implemented a premium **TCM AI Meal Planner** feature that generates personalized 7-day meal plans based on patient TCM diagnosis.

**Key Features:**

- ✅ **7-Day Meal Plan**: Breakfast, lunch, dinner, and snack for each day
- ✅ **TCM-Aligned**: Respects your constitution, syndrome, and food restrictions
- ✅ **Full Recipes**: Step-by-step instructions with ingredients
- ✅ **Shopping List**: Auto-generated, categorized, with checkboxes
- ✅ **Progress Tracking**: Mark days as complete (X/7 days)
- ✅ **Regenerate Anytime**: Create new plans whenever you want

---

## Quick Start

### Step 1: Run Database Migration

```bash
cd sihat-tcm
npx supabase db push
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Test the Feature

1. Go to `http://localhost:3000`
2. **Complete a TCM diagnosis** (or use an existing account with diagnosis history)
3. Navigate to **Patient Dashboard** (`/patient`)
4. Click the **"Meal Planner"** tab
5. Click **"Generate My Meal Plan"**
6. Wait ~10-15 seconds ✨
7. Explore your personalized 7-day meal plan!

---

## Architecture

### 1. Database Layer (`meal_plans` table)

**File**: `supabase/migrations/20251224_meal_plans_table.sql`

**Schema**:

```sql
- id (UUID, primary key)
- user_id (UUID, references auth.users)
- diagnosis_session_id (UUID, references diagnosis_sessions)
- plan_json (JSONB) — The entire AI-generated meal plan
- constitution (TEXT) — e.g., "Yin Deficiency", "Damp Heat"
- syndrome (TEXT) — Primary TCM syndrome pattern
- is_active (BOOLEAN) — Only one active plan per user
- completed_days (INTEGER) — Progress tracking (0-7)
- created_at, updated_at, expires_at (TIMESTAMP)
```

**Features**:

- Row Level Security (RLS) enabled
- Automatic expiration after 30 days
- Indexed for performance
- Includes helper functions and views
- Doctor oversight policy included

### 2. Server Actions

**File**: `src/app/actions/meal-planner.ts`

**Functions**:

1. **`generateMealPlan({ diagnosisReport, sessionId })`**
   - Uses Gemini 2.0 Flash to generate structured meal plans
   - Validates output with Zod schemas
   - Prevents duplicate active plans
   - Saves plan to database

2. **`getActiveMealPlan()`**
   - Fetches the user's current active meal plan

3. **`updateMealPlanProgress(planId, completedDays)`**
   - Tracks daily completion progress (0-7)

4. **`deactivateMealPlan(planId)`**
   - Deactivates current plan to allow regeneration

### 3. AI Prompt Engineering

**File**: `src/lib/systemPrompts.ts`

Added **`MEAL_PLANNER_PROMPT`** with:

- COStar-style structured prompting
- Constitution-specific guidance
- Syndrome-specific adaptations
- Food avoidance enforcement
- Beneficial food prioritization
- Herbal tea recommendations
- Multilingual support readiness

### 4. Frontend Components

#### a) **MealPlanWizard** (`src/components/meal-planner/MealPlanWizard.tsx`)

- Entry point component
- Handles generation flow with animated loading states
- Shows empty state vs. active plan
- Displays rotating generation messages (6 stages)
- Premium feel with food emoji decorations

#### b) **WeeklyCalendarView** (`src/components/meal-planner/WeeklyCalendarView.tsx`)

- 7-day calendar navigation
- Day completion tracking with visual checkmarks
- TCM principles display
- Shopping list toggle
- Regenerate plan button
- Progress indicator (X/7 days completed)

#### c) **MealCard** (`src/components/meal-planner/MealCard.tsx`)

- Displays individual meals (breakfast, lunch, dinner, snack)
- Color-coded by meal type
- Shows TCM benefit badges
- Temperature indicators (Warming/Neutral/Cooling)
- Prep & cook time display
- Ingredient preview
- Click to open recipe modal

#### d) **RecipeModal** (`src/components/meal-planner/RecipeModal.tsx`)

- Full-screen modal with recipe details
- Step-by-step numbered instructions
- Complete ingredient list (grid layout)
- TCM notes section
- Temperature & time metadata
- Printable layout
- Animated entrance/exit

#### e) **ShoppingListWidget** (`src/components/meal-planner/ShoppingListWidget.tsx`)

- Categorized shopping list (Produce, Proteins, Spices, etc.)
- Interactive checkboxes with progress tracking
- Category emojis for visual navigation
- Print-friendly design
- Progress bar showing checked items
- Category completion counters

### 5. Integration into Unified Dashboard

**File**: `src/components/patient/UnifiedDashboard.tsx`

**Changes**:

- Added new "Meal Planner" tab
- Imported `MealPlanWizard` component
- Connected to latest diagnosis session
- Mobile-responsive tab navigation
- Seamless integration with existing dashboard flow

---

## Implementation Details

### File Structure

```
sihat-tcm-web/
├── supabase/migrations/
│   └── 20251224_meal_plans_table.sql
├── src/
│   ├── app/actions/
│   │   └── meal-planner.ts
│   ├── components/meal-planner/
│   │   ├── MealPlanWizard.tsx
│   │   ├── WeeklyCalendarView.tsx
│   │   ├── MealCard.tsx
│   │   ├── RecipeModal.tsx
│   │   └── ShoppingListWidget.tsx
│   ├── lib/
│   │   └── systemPrompts.ts (added MEAL_PLANNER_PROMPT)
│   └── components/patient/
│       └── UnifiedDashboard.tsx (integrated meal planner tab)
```

### Design & UX

#### Visual Style

- **Gradient palette**: Amber, Orange, Emerald, Teal
- **Glassmorphism**: Frosted glass cards with backdrop blur
- **Food emojis**: Decorative elements (🍜, 🥘, 🥗, 🍵)
- **Animations**: Framer Motion for smooth transitions
- **Temperature indicators**: 🔥 Warming, ⚖️ Neutral, ❄️ Cooling

#### User Flow

1. User completes TCM diagnosis
2. Navigates to "Meal Planner" tab in dashboard
3. Clicks "Generate My Meal Plan"
4. Watches animated generation (10-15 seconds)
5. Views 7-day calendar with Day 1 selected
6. Clicks on meal cards to see full recipes
7. Marks days as complete
8. Opens shopping list widget
9. Checks off items as they shop
10. Can regenerate plan anytime

### Data Flow

```
User clicks "Generate Plan"
         ↓
Check if diagnosis exists
         ↓
Call generateMealPlan()
         ↓
AI generates 7-day plan
         ↓
Save to meal_plans table
         ↓
Display WeeklyCalendarView
         ↓
User clicks day → shows 4 meals
         ↓
User clicks meal → opens RecipeModal
         ↓
User checks shopping list
```

### Key Features

#### Cost Optimization

- Plans cached for 30 days
- Won't regenerate if active plan exists
- User can deactivate to create new plan

#### TCM Authenticity

- Based on Five Element theory
- Temperature balance (warming/cooling foods)
- Syndrome-specific recommendations
- Traditional cooking methods

#### User Experience

- One-click generation
- Beautiful visual meal cards
- Interactive shopping list
- Progress tracking (days completed)

---

## Testing

### Prerequisites

- [ ] Run Supabase migration: `npx supabase db push`
- [ ] User must be logged in
- [ ] User must have at least one completed diagnosis session

### Test Cases

#### 1. Generation Flow

- [ ] Click "Generate My Meal Plan" shows loading animation
- [ ] Loading messages rotate every 2.5 seconds
- [ ] Plan generates successfully in ~10-15 seconds
- [ ] Success state shows WeeklyCalendarView

#### 2. Calendar Navigation

- [ ] All 7 days are visible
- [ ] Clicking a day changes the displayed meals
- [ ] Arrow buttons work correctly
- [ ] First/last day disables prev/next arrows
- [ ] Completed days show checkmark badge

#### 3. Meal Cards

- [ ] All 4 meal types display (breakfast, lunch, dinner, snack)
- [ ] TCM benefit badges are visible
- [ ] Temperature indicators show (if present)
- [ ] Ingredient preview truncates correctly
- [ ] Hover effect works

#### 4. Recipe Modal

- [ ] Clicking meal card opens modal
- [ ] Modal displays full recipe details
- [ ] Instructions are numbered
- [ ] Ingredients are in grid layout
- [ ] Close button works
- [ ] Backdrop click closes modal

#### 5. Shopping List

- [ ] "Shopping List" button opens widget
- [ ] All categories display with emojis
- [ ] Checkboxes work
- [ ] Progress bar updates
- [ ] Category counters update
- [ ] Print button works
- [ ] Close button works

#### 6. Day Completion

- [ ] "Mark Complete" button toggles state
- [ ] Completed days show green checkmark
- [ ] Progress counter updates (X/7)
- [ ] Completion persists on refresh

#### 7. Regeneration

- [ ] "New Plan" button shows confirmation
- [ ] Confirmation deactivates old plan
- [ ] User returns to generation screen
- [ ] Can generate new plan successfully

#### 8. Edge Cases

- [ ] No diagnosis sessions: Shows "Complete diagnosis first" message
- [ ] Loading states work correctly
- [ ] Error handling displays user-friendly messages
- [ ] Mobile responsive design works

#### 9. Database

- [ ] Plan saves to `meal_plans` table
- [ ] `is_active` flag works (only one active plan)
- [ ] `completed_days` updates correctly
- [ ] RLS policies work (users only see own plans)
- [ ] Plan expires after 30 days (if using auto-expiration)

---

## Troubleshooting

### "User not authenticated"

- Make sure you're logged in
- Check `useAuth()` context is working

### "Complete a TCM diagnosis first"

- User needs at least one diagnosis session in `diagnosis_sessions` table
- Go to `/` and complete a diagnosis

### "Failed to generate meal plan"

- Check Gemini API key is set (`GOOGLE_GENERATIVE_AI_API_KEY`)
- Check Supabase connection
- Look at browser console and server logs

### Migration fails

- Make sure `diagnosis_sessions` table exists first
- Run previous migrations: `npx supabase db push`
- Check Supabase project is running: `npx supabase status`

---

## Security & Compliance

✅ **Row Level Security (RLS)** enabled on `meal_plans` table  
✅ **User isolation** — Users can only see/modify their own plans  
✅ **Doctor oversight** — Doctors can view all plans for clinical review  
✅ **No PII logging** — Patient data stays in Supabase with RLS  
✅ **Authentication required** — All actions check user auth  
✅ **Validation** — Zod schemas validate AI output structure

---

## Future Enhancements

1. **Export to PDF** — Generate printable meal plan PDF
2. **Recipe adjustments** — Allow users to swap meals
3. **Favorites** — Save favorite recipes
4. **Nutrition facts** — Add calorie/macro information
5. **Grocery delivery** — Integrate with delivery services
6. **Meal prep mode** — Batch cooking instructions
7. **Recipe ratings** — User feedback on meals
8. **Multilingual** — Support zh/ms languages
9. **Voice instructions** — Audio recipe guidance
10. **Photo gallery** — Add meal photos

---

## Summary

The TCM AI Meal Planner is now **fully integrated** into the Sihat TCM platform! 🍜

**Key Achievements**:

- ✅ Database schema with RLS
- ✅ AI-powered generation (Gemini 2.0 Flash)
- ✅ 5 beautiful, responsive components
- ✅ Interactive shopping list
- ✅ Progress tracking
- ✅ Seamless dashboard integration
- ✅ Premium UX with animations

**Next Steps**:

1. Run the database migration
2. Test the complete flow
3. Gather user feedback
4. Consider future enhancements

---

**Built with** ❤️ using Next.js 16, Gemini AI, Supabase, Framer Motion, and shadcn/ui.
