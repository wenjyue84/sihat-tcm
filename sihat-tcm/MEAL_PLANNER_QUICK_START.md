# 🍜 TCM AI Meal Planner - Quick Start Guide

## ⚡ Get Started in 3 Steps

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

## 📋 What You Get

- **🗓️ 7-Day Meal Plan**: Breakfast, lunch, dinner, and snack for each day
- **🌿 TCM-Aligned**: Respects your constitution, syndrome, and food restrictions
- **📝 Full Recipes**: Step-by-step instructions with ingredients
- **🛒 Shopping List**: Auto-generated, categorized, with checkboxes
- **📊 Progress Tracking**: Mark days as complete
- **♻️ Regenerate Anytime**: Create new plans whenever you want

---

## 🎯 Key Features

### For Patients
✅ Personalized meal plans based on TCM diagnosis  
✅ Beautiful, mobile-responsive interface  
✅ Interactive shopping list with checkboxes  
✅ Full recipe details with TCM benefits  
✅ Progress tracking (X/7 days completed)  
✅ One-click regeneration  

### For Developers
✅ Zod-validated AI output  
✅ Row Level Security (RLS) enabled  
✅ Server Actions for data fetching  
✅ Framer Motion animations  
✅ Clean, modular component structure  
✅ TypeScript throughout  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  UnifiedDashboard (Patient Dashboard)      │
│  ├─ Health Journey Tab                     │
│  ├─ Meal Planner Tab ⭐ NEW                 │
│  │  └─ MealPlanWizard                      │
│  │     ├─ Empty State (Generate CTA)       │
│  │     └─ Active Plan → WeeklyCalendarView │
│  │        ├─ Day Selector (1-7)            │
│  │        ├─ MealCard × 4 (per day)        │
│  │        │  └─ RecipeModal (on click)     │
│  │        └─ ShoppingListWidget (modal)    │
│  ├─ Profile Tab                            │
│  └─ Documents Tab                          │
└─────────────────────────────────────────────┘

Server Actions (meal-planner.ts):
  - generateMealPlan() → Gemini AI + Supabase
  - getActiveMealPlan()
  - updateMealPlanProgress()
  - deactivateMealPlan()

Database (meal_plans table):
  - plan_json (JSONB)
  - constitution, syndrome
  - is_active, completed_days
  - RLS policies for user isolation
```

---

## 🗂️ Files Created

### Database
- `supabase/migrations/20251224_meal_plans_table.sql`

### Server Actions
- `src/app/actions/meal-planner.ts`

### Components
- `src/components/meal-planner/MealPlanWizard.tsx`
- `src/components/meal-planner/WeeklyCalendarView.tsx`
- `src/components/meal-planner/MealCard.tsx`
- `src/components/meal-planner/RecipeModal.tsx`
- `src/components/meal-planner/ShoppingListWidget.tsx`

### Prompts
- `src/lib/systemPrompts.ts` (added `MEAL_PLANNER_PROMPT`)

### Integration
- `src/components/patient/UnifiedDashboard.tsx` (added "Meal Planner" tab)

### Documentation
- `MEAL_PLANNER_COMPLETE.md` (full implementation details)
- `MEAL_PLANNER_QUICK_START.md` (this file)

---

## 🧪 Quick Test

```bash
# 1. Ensure Supabase is running
npx supabase status

# 2. Push migration
npx supabase db push

# 3. Start dev server
npm run dev

# 4. Visit http://localhost:3000/patient
# 5. Click "Meal Planner" tab
# 6. Click "Generate My Meal Plan"
```

---

## 🎨 UI Preview

### Generation Screen
```
┌──────────────────────────────────────────┐
│   🍜 TCM AI Meal Planner                 │
│                                          │
│   Get a personalized 7-day meal plan... │
│                                          │
│   [🌿 TCM] [🍲 28 Recipes] [🛒 List]     │
│                                          │
│   [ ✨ Generate My Meal Plan ]           │
└──────────────────────────────────────────┘
```

### Weekly View
```
┌──────────────────────────────────────────┐
│  Your 7-Day TCM Meal Plan               │
│  Constitution: Yin Deficiency • 3/7 ✓   │
│  [Shopping List] [New Plan]             │
├──────────────────────────────────────────┤
│  🌿 TCM Dietary Principles...           │
├──────────────────────────────────────────┤
│  [<] [Day 1] [Day 2] [Day 3✓] ... [>]   │
├──────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐         │
│  │ ☕ BREAKFAST│  │ ☀️ LUNCH   │         │
│  │ Meal Name  │  │ Meal Name  │         │
│  │ 🌿 Benefit │  │ 🌿 Benefit │         │
│  └────────────┘  └────────────┘         │
│  ┌────────────┐  ┌────────────┐         │
│  │ 🌙 DINNER  │  │ 🍵 SNACK   │         │
│  │ Meal Name  │  │ Herbal Tea │         │
│  │ 🌿 Benefit │  │ 🌿 Benefit │         │
│  └────────────┘  └────────────┘         │
│                                          │
│  [ Mark Complete ]                      │
└──────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

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

## 🎉 You're All Set!

The TCM AI Meal Planner is now live in your Patient Dashboard. Enjoy generating personalized, TCM-aligned meal plans! 🍜✨

**Questions?** Check `MEAL_PLANNER_COMPLETE.md` for full technical details.


