# 🧪 Health Passport - Step-by-Step Testing Guide

## 📋 Pre-Testing Checklist

### 1. Database Setup

- [ ] Run the migration SQL
- [ ] Verify table exists
- [ ] Check RLS policies

### 2. Dependencies

- [ ] `@supabase/ssr` installed
- [ ] No build errors
- [ ] Dev server starts

### 3. Test Accounts

You'll need:

- [ ] A test patient account (or create one)
- [ ] Access to Supabase dashboard (to verify data)

---

## 🎯 Test Plan Overview

We'll test these user flows:

1. **Guest User Flow** - Complete diagnosis without login
2. **Sign-In CTA Flow** - Guest sees banner and signs in
3. **Logged-In User Flow** - Auto-save and dashboard access
4. **Dashboard Flow** - View history and trends
5. **History Viewer Flow** - View report, edit notes, delete
6. **Security Flow** - Verify RLS policies work

---

## 🚀 STEP 1: Initial Setup

### 1.1 Run the Database Migration

**Open your terminal:**

```bash
cd "Desktop/Projects/Sihat TCM/sihat-tcm-web"
```

**Option A: Using psql (if you have it installed)**

```bash
psql YOUR_DATABASE_URL < supabase/migrations/20251224_diagnosis_sessions.sql
```

**Option B: Using Supabase Dashboard**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open `sihat-tcm-web/supabase/migrations/20251224_diagnosis_sessions.sql`
6. Copy the entire contents
7. Paste into the SQL Editor
8. Click **Run** (or press Ctrl/Cmd + Enter)

**Expected Result:**

- ✅ "Success. No rows returned" message
- ✅ No errors

**Verify the table was created:**

```sql
SELECT * FROM diagnosis_sessions LIMIT 1;
```

**Expected Result:**

- ✅ Query runs (may return 0 rows - that's fine)
- ❌ If error "relation does not exist" → migration didn't run

---

### 1.2 Start the Development Server

```bash
npm run dev
```

**Expected Result:**

```
✓ Ready in 2.3s
○ Local:   http://localhost:3000
```

**Open in browser:**

```
http://localhost:3000
```

---

## 🎭 STEP 2: Test Guest User Flow

**Goal:** Complete a diagnosis without logging in and see the sign-in banner.

### 2.1 Start a New Diagnosis

1. **Navigate to:** `http://localhost:3000`
2. **You should see:** The main landing page or wizard
3. **Look for:** "Start Diagnosis" or similar button
4. **Click it**

**Expected:** Diagnosis wizard opens

---

### 2.2 Complete the Basic Info Step

**Fill in the form:**

- **Name:** Test Guest User
- **Age:** 30
- **Gender:** Male/Female (your choice)
- **Height:** 170 cm
- **Weight:** 70 kg
- **Main Complaint:** Feeling tired lately
- **Other Symptoms:** Poor sleep

**Click:** "Next" or "Continue"

**Expected:** Moves to next step (Inquiry)

---

### 2.3 Skip Through Optional Steps

For faster testing, you can skip optional steps:

**Inquiry Step:**

- Click "Skip" or just click "Next" if allowed

**Tongue Analysis:**

- Click "Skip" (or upload a test image if you want)

**Face Analysis:**

- Click "Skip"

**Audio Recording:**

- Click "Skip"

**Pulse Check:**

- Click "Skip"

**Smart Connect:**

- Click "Skip"

**Goal:** Get to the Summary/Processing step as quickly as possible

---

### 2.4 Review Summary & Generate Report

1. **Summary Screen:** Review the information
2. **Click:** "Generate Diagnosis" or "Confirm"
3. **Wait:** You'll see a loading animation (analyzing...)
4. **Expected:** Report appears after 10-30 seconds

---

### 2.5 Check for the Sign-In Banner

**Once the report loads, scroll to the top.**

**You should see a banner with:**

- 🎨 **Gradient background** (emerald → teal → cyan)
- 📢 **Heading:** "Save Your Diagnosis & Track Your Recovery"
- 📝 **Description:** "Create a free account to save this report..."
- ✨ **Features listed:**
  - Track Progress
  - Secure & Private
  - View Anytime
- 🔘 **Button:** "Sign In to Save This Report"

**Visual Check:**

- [ ] Banner is visible
- [ ] Colors are vibrant (gradient)
- [ ] Text is readable
- [ ] Button is clickable
- [ ] X button to dismiss is present

**Try dismissing:**

- Click the **X** button in the top-right
- **Expected:** Banner disappears

**Try clicking the button:**

- Refresh the page to bring the banner back
- Click **"Sign In to Save This Report"**
- **Expected:** Redirects to `/login?redirect=/patient/dashboard`

---

## 🔐 STEP 3: Test Sign-In Flow

### 3.1 Sign In or Create Account

**If you have a test account:**

1. Enter your email and password
2. Click "Sign In"

**If you need to create an account:**

1. Look for "Sign Up" or "Create Account" link
2. Fill in:
   - Email
   - Password
   - Full Name (if required)
3. Click "Create Account"
4. Check your email for verification (if required)
5. Verify your account

**Expected After Sign-In:**

- ✅ Redirected to a page (might be dashboard, home, or back to diagnosis)
- ✅ You see your name or profile indicator in header

---

### 3.2 Navigate to Dashboard

**Option A: If banner redirected you:**

- You should already be at `/patient/dashboard`

**Option B: Manual navigation:**

1. Click on your profile/account menu
2. Look for "Dashboard" or "My Health Passport"
3. **Or directly visit:** `http://localhost:3000/patient/dashboard`

---

## 📊 STEP 4: Test Dashboard (Empty State)

**If this is your first diagnosis**, you should see the **empty state**.

### 4.1 Check Empty State Display

**Expected:**

- 🏥 **Icon:** Large FileHeart icon in a circle
- 📝 **Heading:** "Your journey to wellness begins here"
- 📋 **Description:** "Complete your first TCM diagnosis to start tracking..."
- 🔘 **Button:** "Start Your First Diagnosis"

**Visual Check:**

- [ ] Empty state is centered
- [ ] Icon has gradient background
- [ ] Text is encouraging (not error-like)
- [ ] Button is prominent

**Try the button:**

- Click "Start Your First Diagnosis"
- **Expected:** Redirects to home page (diagnosis wizard)

---

## 🔁 STEP 5: Test Logged-In User Flow

**Goal:** Complete a diagnosis while logged in and verify auto-save.

### 5.1 Complete Another Diagnosis

**Since you're now logged in:**

1. **Start a new diagnosis** (from home or dashboard button)
2. **Fill in basic info** (you can use different data)
   - Name: Test User Session 2
   - Age: 35
   - Main Complaint: Back pain
3. **Skip optional steps** (for speed)
4. **Generate report**

---

### 5.2 Check for "Report Saved!" Banner

**Once the report loads:**

**You should see a different banner:**

- 🎨 **Light gradient** (emerald-50 to teal-50)
- ✅ **Icon:** Green circle with FileHeart
- 📢 **Heading:** "Report Saved to Your Health Passport!"
- 📝 **Description:** "View your diagnosis history and track your wellness journey."
- 🔘 **Button:** "View Dashboard"

**Visual Check:**

- [ ] Banner has lighter colors (not bold gradient)
- [ ] Success checkmark or icon visible
- [ ] Button says "View Dashboard"

**Check the browser console:**

```
Press F12 → Console tab
```

**Look for:**

```
[Wizard] Saved to Health Passport: <some-uuid>
```

**This confirms auto-save worked!**

---

### 5.3 Navigate to Dashboard

**Click:** "View Dashboard" button in the banner

**Expected:** Redirects to `/patient/dashboard`

---

## 🏆 STEP 6: Test Dashboard (With Data)

**Now you should see your saved session!**

### 6.1 Check Trend Widget

**At the top of the page, you should see:**

**Trend Widget:**

- 📊 **Title:** "Your Health Vitality"
- 📈 **Stats displayed:**
  - **Total Sessions:** 1 (or 2 if you did multiple)
  - **Average Score:** Some number 0-100
  - **Progress:** +/- number (if you have 2+ sessions)
  - **Most Common Pattern:** The diagnosis type

**Visual Check:**

- [ ] Widget has glassmorphism effect
- [ ] Numbers are large and readable
- [ ] Icons match the stats (Calendar, Activity, etc.)
- [ ] Colors: emerald/teal gradient background

---

### 6.2 Check History Cards

**Below the trend widget:**

**You should see card(s) with:**

- 🏷️ **Emoji icon** (☯️, 🌀, 💧, etc. based on diagnosis)
- 📝 **Diagnosis name** (e.g., "Qi Deficiency")
- 🧬 **Constitution** (if available)
- 📅 **Date** (formatted nicely, e.g., "Dec 24, 2024")
- 🎯 **Score badge** (colored: green 75+, amber 50-74, red <50)
- 📓 **Notes preview** (if you added notes - probably empty now)
- 🔘 **Button:** "View Full Report"

**Visual Check:**

- [ ] Cards have hover effect (lift up slightly)
- [ ] Score badge has appropriate color
- [ ] Date is readable
- [ ] Cards are in grid layout (3 columns on desktop)

**Try hovering:**

- **Expected:** Card lifts, shows subtle animation
- **Expected:** Bottom accent line appears (gradient)

---

### 6.3 Test Card Click

**Click on a history card**

**Expected:**

- Navigates to `/patient/history/[some-uuid]`
- Page loads with full report

---

## 📖 STEP 7: Test History Viewer

**You should now be viewing a single diagnosis session.**

### 7.1 Check Page Structure

**Top Navigation Bar:**

- [ ] "Back to Dashboard" button (left)
- [ ] "Delete" button (right)

**Session Info Card:**

- [ ] Primary diagnosis displayed
- [ ] Full date (e.g., "Monday, December 24, 2024")
- [ ] Score badge (if available)

**Notes Section:**

- [ ] "Personal Notes" heading with edit icon
- [ ] Current notes text (or placeholder)
- [ ] "Edit" button

**Full Report:**

- [ ] Complete diagnosis report rendered below
- [ ] All sections visible (diagnosis, analysis, recommendations)

---

### 7.2 Test Notes Editing

**Click:** "Edit" button in notes section

**Expected:**

- Textarea appears
- "Cancel" and "Save" buttons replace "Edit" button

**Type some notes:**

```
Feeling better today. Started the dietary recommendations.
Will try the acupuncture points tomorrow.
```

**Click:** "Save" button

**Expected:**

- ⏳ Button shows "Saving..." with spinner
- ✅ After 1-2 seconds, switches back to view mode
- ✅ Your notes are now displayed
- ✅ "Edit" button returns

**Verify persistence:**

1. Click "Back to Dashboard"
2. Click the same session card again
3. **Expected:** Your notes are still there!

---

### 7.3 Test Notes Canceling

**Click:** "Edit" button again

**Change the text:**

```
This text should be discarded
```

**Click:** "Cancel" button

**Expected:**

- ✅ Textarea disappears
- ✅ Original notes remain unchanged
- ✅ No save occurred

---

### 7.4 Test Delete Confirmation

**Click:** "Delete" button in top bar

**Expected:**

- 🔴 Modal appears with warning
- ⚠️ Red alert icon
- 📝 Heading: "Delete This Session?"
- 📋 Warning text about permanence
- 🔘 Two buttons: "Cancel" and "Delete"

**Visual Check:**

- [ ] Modal has backdrop blur
- [ ] Modal is centered
- [ ] Delete button is red
- [ ] Warning is clear

**Click:** "Cancel"

**Expected:**

- Modal closes
- Session remains

---

### 7.5 Test Actual Deletion

⚠️ **Warning:** This will actually delete the session!

**Click:** "Delete" button again

**This time, click:** "Delete" in the modal

**Expected:**

- ⏳ Button shows "Deleting..." with spinner
- ✅ After 1-2 seconds, redirects to dashboard
- ✅ Session no longer appears in history grid

**Verify in dashboard:**

- [ ] The deleted session is gone
- [ ] Session count decreased by 1
- [ ] If you deleted all, empty state returns

---

## 🔄 STEP 8: Test Multiple Sessions

**To test trends properly, create 2-3 more sessions.**

### 8.1 Create Additional Sessions

**For each session:**

1. Click "New Diagnosis" button in dashboard
2. Fill in different data:
   - **Session 2:** Age 40, Main Complaint: "Headaches"
   - **Session 3:** Age 25, Main Complaint: "Digestive issues"
3. Skip optional steps
4. Generate report
5. Return to dashboard

**Expected:**

- Each session appears as a new card
- Newest sessions appear first (top/left)

---

### 8.2 Check Updated Trends

**After creating 2-3 sessions:**

**Trend widget should show:**

- **Session Count:** 2 or 3
- **Average Score:** Updated average
- **Progress:** Shows improvement/decline (compares first to last)
- **Most Common Pattern:** Most frequent diagnosis

**Try the math:**

- If your scores were 65, 70, 75
- Average should be: (65+70+75)/3 = 70
- Progress should be: 75-65 = +10

---

## 🔒 STEP 9: Test Security (RLS Policies)

**Goal:** Verify users can only see their own data.

### 9.1 Check Database Directly

**Open Supabase Dashboard:**

1. Go to **Table Editor** → `diagnosis_sessions`
2. You should see your test sessions
3. Note the `user_id` - it should match your user ID

**Run a query:**

```sql
SELECT id, primary_diagnosis, user_id
FROM diagnosis_sessions
ORDER BY created_at DESC;
```

**Expected:**

- All rows have YOUR user_id
- Other users' data not visible (RLS enforced)

---

### 9.2 Test with Different Account (Optional)

**If you have a second test account:**

1. **Sign out** from current account
2. **Sign in** with different account
3. **Navigate to** `/patient/dashboard`

**Expected:**

- ✅ Empty state (no sessions from first user)
- ✅ Dashboard only shows second user's sessions

**This confirms RLS is working!**

---

## 🎨 STEP 10: Visual & UX Tests

### 10.1 Test Responsive Design

**Resize your browser window:**

**Desktop (1920px):**

- [ ] Dashboard: 3 columns of cards
- [ ] All text readable
- [ ] No horizontal scroll

**Tablet (768px):**

- [ ] Dashboard: 2 columns of cards
- [ ] Trend widget stacks stats vertically
- [ ] Navigation still accessible

**Mobile (375px):**

- [ ] Dashboard: 1 column of cards
- [ ] Trend widget fully responsive
- [ ] Buttons remain tappable
- [ ] No content cutoff

---

### 10.2 Test Animations

**Check these animations:**

**Dashboard:**

- [ ] Cards fade in with stagger (0.05s delay each)
- [ ] Hover: Cards lift and show bottom accent line
- [ ] Trend widget numbers animate in

**Banner:**

- [ ] Appears with slide-down animation
- [ ] Dismisses with slide-up animation

**Modals:**

- [ ] Backdrop fades in
- [ ] Modal scales up (0.95 → 1.0)
- [ ] Closing reverses animation

---

### 10.3 Test Empty States

**Empty Dashboard:**

- [ ] Icon, heading, description all visible
- [ ] Button prominent and clickable
- [ ] Encouraging tone (not error-like)

**No Notes:**

- [ ] Placeholder text: "No notes added yet..."
- [ ] Edit button still available

---

## 🐛 STEP 11: Error Handling Tests

### 11.1 Test Authentication Redirect

**Sign out from your account**

**Try to navigate to:**

```
http://localhost:3000/patient/dashboard
```

**Expected:**

- ✅ Redirects to `/login?redirect=/patient/dashboard`
- ✅ After login, returns to dashboard

---

### 11.2 Test Invalid Session ID

**Navigate to:**

```
http://localhost:3000/patient/history/00000000-0000-0000-0000-000000000000
```

**Expected:**

- ✅ Shows error card: "Session Not Found"
- ✅ Provides "Back to Dashboard" button
- ✅ No crash or blank page

---

### 11.3 Test Network Errors (Advanced)

**Open DevTools:**

1. Press F12
2. Go to **Network** tab
3. Enable **Offline** mode (checkbox at top)

**Try to:**

- Navigate to dashboard
- Edit notes

**Expected:**

- ✅ Error message appears
- ✅ App doesn't crash
- ✅ User can retry after reconnecting

---

## ✅ STEP 12: Final Verification Checklist

### Database

- [ ] Sessions saved to `diagnosis_sessions` table
- [ ] `user_id` correctly set
- [ ] `primary_diagnosis` extracted from AI response
- [ ] `overall_score` calculated (0-100)
- [ ] `full_report` contains complete JSONB
- [ ] `created_at` and `updated_at` timestamps correct

### Guest Flow

- [ ] Can complete diagnosis without login
- [ ] See "Sign in to save" banner
- [ ] Banner dismissible
- [ ] Clicking banner redirects to login

### Logged-In Flow

- [ ] Auto-save works after diagnosis
- [ ] See "Report Saved!" banner
- [ ] Banner links to dashboard
- [ ] Console log confirms save

### Dashboard

- [ ] Redirects if not logged in
- [ ] Shows empty state for new users
- [ ] Displays trend widget with accurate stats
- [ ] Shows history cards in grid
- [ ] Cards have hover effects
- [ ] "New Diagnosis" button works

### History Viewer

- [ ] Full report displays correctly
- [ ] Notes can be added/edited
- [ ] Notes persist after save
- [ ] Cancel button discards changes
- [ ] Delete shows confirmation modal
- [ ] Delete actually removes session

### Trends

- [ ] Session count accurate
- [ ] Average score calculated correctly
- [ ] Progress indicator shows change
- [ ] Most common diagnosis displayed

### Security

- [ ] Users only see own sessions
- [ ] RLS policies enforced
- [ ] Auth required for all pages
- [ ] Invalid session IDs handled gracefully

### UI/UX

- [ ] Glassmorphism effects render
- [ ] Gradients smooth
- [ ] Animations smooth (60fps)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Icons display correctly
- [ ] Colors accessible

---

## 🎉 Success Criteria

**Your Health Passport is working correctly if:**

✅ Diagnoses auto-save for logged-in users  
✅ Dashboard shows all saved sessions  
✅ Trends calculate accurately  
✅ History viewer displays full reports  
✅ Notes can be edited and persisted  
✅ Sessions can be deleted with confirmation  
✅ Guests see sign-in CTA banner  
✅ RLS policies prevent unauthorized access  
✅ UI is beautiful and responsive  
✅ Animations are smooth  
✅ No console errors

---

## 📝 Reporting Issues

**If you find a bug:**

1. **Note the exact steps to reproduce**
2. **Check the browser console** (F12) for errors
3. **Check the Supabase logs** in dashboard
4. **Take a screenshot** if it's visual
5. **Document**:
   - What you expected
   - What actually happened
   - Error messages (if any)

---

## 🚀 Next Steps After Testing

**If all tests pass:**

1. ✅ Mark feature as tested
2. 📝 Document any issues found
3. 🎨 Customize colors/styles if desired
4. 🚢 Deploy to staging
5. 🎉 Deploy to production!

**Testing complete!** 🎊

