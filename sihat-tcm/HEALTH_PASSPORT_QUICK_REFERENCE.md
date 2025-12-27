# 🚀 Health Passport - Quick Reference Card

## 📦 What Was Delivered

A complete **patient history system** with:

- ✅ Database table + RLS policies
- ✅ Server actions for CRUD operations
- ✅ Patient dashboard with trends
- ✅ History viewer with notes
- ✅ Auto-save integration
- ✅ Guest user CTA banner
- ✅ Full documentation

## 🏗️ New Files Created

```
📁 Database:
   └─ supabase/migrations/20251224_diagnosis_sessions.sql

📁 Backend:
   └─ src/lib/actions.ts (NEW - 6 server actions)

📁 Pages:
   ├─ src/app/patient/dashboard/page.tsx (NEW)
   └─ src/app/patient/history/[id]/page.tsx (NEW)

📁 Components:
   ├─ src/components/patient/HistoryCard.tsx (NEW)
   ├─ src/components/patient/TrendWidget.tsx (NEW)
   └─ src/components/patient/SaveToDashboardBanner.tsx (NEW)

📁 Modified:
   ├─ src/hooks/useDiagnosisWizard.ts (added auto-save)
   └─ src/components/diagnosis/DiagnosisReport.tsx (added banner)

📁 Documentation:
   ├─ HEALTH_PASSPORT_IMPLEMENTATION.md (full technical docs)
   ├─ HEALTH_PASSPORT_SETUP.md (setup instructions)
   ├─ HEALTH_PASSPORT_SUMMARY.md (feature overview)
   └─ HEALTH_PASSPORT_QUICK_REFERENCE.md (this file)
```

## 🎯 Key Routes

| Route                   | Purpose                                    | Auth Required |
| ----------------------- | ------------------------------------------ | ------------- |
| `/patient/dashboard`    | Main dashboard with history                | ✅ Yes        |
| `/patient/history/[id]` | View single session                        | ✅ Yes        |
| `/`                     | Diagnosis wizard (auto-saves if logged in) | ❌ No         |

## 🗄️ Database Table

**Table**: `diagnosis_sessions`

| Column              | Type        | Description            |
| ------------------- | ----------- | ---------------------- |
| `id`                | uuid        | Primary key            |
| `user_id`           | uuid        | FK to auth.users       |
| `primary_diagnosis` | text        | Main TCM diagnosis     |
| `constitution`      | text        | Constitution type      |
| `overall_score`     | int         | Vitality score (0-100) |
| `full_report`       | jsonb       | Complete AI report     |
| `notes`             | text        | User's observations    |
| `created_at`        | timestamptz | Session date           |
| `updated_at`        | timestamptz | Last modified          |

**Indexes**: `user_id`, `created_at`, `primary_diagnosis`

## 🔧 Server Actions API

```typescript
// Save a new diagnosis session
await saveDiagnosis({
  primary_diagnosis: "Yin Deficiency",
  constitution: "Deficient Type",
  overall_score: 65,
  full_report: {
    /* JSONB */
  },
});

// Get user's history (paginated)
await getPatientHistory(limit, offset);

// Get single session
await getSessionById(sessionId);

// Update notes
await updateSessionNotes(sessionId, "Feeling better today!");

// Delete session
await deleteSession(sessionId);

// Get trend statistics
await getHealthTrends(30); // last 30 days
```

All actions return: `{ success: boolean, data?: any, error?: string }`

## 🎨 Component Quick Reference

### HistoryCard

```tsx
<HistoryCard
  session={sessionData}
  onClick={() => router.push(`/patient/history/${id}`)}
  index={0} // for stagger animation
/>
```

### TrendWidget

```tsx
<TrendWidget
  trendData={{
    sessionCount: 5,
    averageScore: 72,
    improvement: 8,
    diagnosisCounts: { 'Qi Deficiency': 3 },
    sessions: [...]
  }}
  loading={false}
/>
```

### SaveToDashboardBanner

```tsx
<SaveToDashboardBanner
  isGuest={!user}
  isSaved={hasSaved}
  onViewDashboard={() => router.push("/patient/dashboard")}
/>
```

## 📊 Score Calculation

```typescript
// Base: 70
// Severe: -15 | Mild: +10
// Per organ: -5 (max -20)
// Balanced: +15 | Deficient: -10
// Range: 0-100

calculateOverallScore(reportData); // → int
```

## 🔐 Security Checklist

- ✅ RLS enabled on table
- ✅ User can only see own sessions
- ✅ Doctors can view all (role check)
- ✅ Server actions verify auth
- ✅ Client redirects if not authenticated
- ✅ JSONB encrypted at rest

## 🧪 Testing Commands

```bash
# Database test
psql $DATABASE_URL -c "SELECT COUNT(*) FROM diagnosis_sessions;"

# Dev server
npm run dev

# Check RLS
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'diagnosis_sessions';"

# View sessions for user
psql $DATABASE_URL -c "SELECT id, primary_diagnosis, overall_score FROM diagnosis_sessions WHERE user_id = 'USER_ID';"
```

## 🐛 Common Fixes

| Issue              | Solution                    |
| ------------------ | --------------------------- |
| Table not found    | Run migration SQL           |
| Permission denied  | Check RLS policies          |
| Not redirecting    | Verify `useAuth()` working  |
| Score always 70    | Check AI response structure |
| Banner not showing | Clear browser cache         |

## 📈 Monitoring Queries

```sql
-- Total sessions
SELECT COUNT(*) FROM diagnosis_sessions;

-- Sessions per user
SELECT user_id, COUNT(*)
FROM diagnosis_sessions
GROUP BY user_id;

-- Average scores
SELECT AVG(overall_score) as avg_score
FROM diagnosis_sessions
WHERE overall_score IS NOT NULL;

-- Top diagnoses
SELECT primary_diagnosis, COUNT(*) as count
FROM diagnosis_sessions
GROUP BY primary_diagnosis
ORDER BY count DESC
LIMIT 5;
```

## 🎯 User Flow Diagram

```
GUEST USER:
Diagnosis → Banner ("Sign in to save") → Login → Dashboard

LOGGED-IN USER:
Diagnosis → Auto-save → Banner ("Saved!") → Dashboard
                                                  ↓
                                    Click Session → History Viewer
                                                  ↓
                                          Edit Notes / Delete
```

## 🚢 Deployment Steps

1. ✅ Commit all files to repo
2. ✅ Run migration in production DB (staging first!)
3. ✅ Deploy to Vercel/hosting
4. ✅ Test guest flow
5. ✅ Test logged-in flow
6. ✅ Monitor error logs
7. ✅ Check performance metrics

## 📚 Documentation Links

- **Full Implementation**: `HEALTH_PASSPORT_IMPLEMENTATION.md`
- **Setup Guide**: `HEALTH_PASSPORT_SETUP.md`
- **Feature Summary**: `HEALTH_PASSPORT_SUMMARY.md`
- **This Reference**: `HEALTH_PASSPORT_QUICK_REFERENCE.md`

## 🎓 Code Patterns Used

- **Server Actions**: Next.js 14 `'use server'`
- **Auth**: Supabase `auth.getUser()`
- **RLS**: Database-level security
- **Animations**: Framer Motion
- **Styling**: Tailwind + Glassmorphism
- **State**: React hooks + Context
- **Error Handling**: Success/error objects

## ⚡ Performance Tips

- Use pagination (default 50 sessions)
- Indexes already created
- JSONB efficient for full reports
- Cache trend data on client
- Lazy load session details

## 🎉 Feature Highlights

**What makes this special:**

1. 📊 **Trend tracking** - Users see progress over time
2. 🎨 **Beautiful design** - Glassmorphism + animations
3. 🔒 **Secure** - RLS at database level
4. 📱 **Responsive** - Works on mobile
5. ♿ **Accessible** - Semantic HTML + labels
6. 🚀 **Fast** - Indexed queries + pagination
7. 📝 **Personal** - User notes for context
8. 🎣 **Engaging** - Guest CTA banner
9. 🔗 **Integrated** - Auto-saves seamlessly
10. 📚 **Documented** - 4 comprehensive docs

---

**Status**: ✅ **PRODUCTION READY**

_Need help? Check the full docs or console logs._ 🛠️
