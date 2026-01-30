# Sihat TCM - Project Rules

> **Description**: AI-powered Traditional Chinese Medicine (TCM) diagnostic platform with a Next.js 16 web app and Expo/React Native mobile app. Maintain strict typing on web, consistent patterns across both platforms, and cohesive UX for the diagnosis flow.

---

## Web App Rules

> **Globs**: `sihat-tcm/**/*.tsx`, `sihat-tcm/**/*.ts`

### Tech Stack
- Next.js 16 (App Router), TypeScript strict mode, Tailwind CSS v4, Radix UI, Framer Motion, Supabase
- AI SDK: `@ai-sdk/google` with `gemini-2.0-flash`
- Path alias: `@/*` → `./src/*`

### Code Standards
- Use `interface` over `type` for object shapes
- Functional components only; use named exports
- Explicit return types on all exported functions
- Derive types from backend/API responses when possible

### Architecture
- **Data fetching**: Server Components or `@/lib/supabase/server` for SSR; client hooks for mutations
- **Business logic**: Keep in `lib/` or custom hooks, never inline in JSX
- **API routes**: `src/app/api/[route]/route.ts` with Edge Runtime when possible
- **State**: Local state for ephemeral UI; Supabase for persistent data

### UI Patterns
- Use Radix UI primitives for accessibility (Dialog, Select, Tabs, etc.)
- Framer Motion for all complex animations—no CSS transitions for multi-step UI
- Tailwind v4 only; do not mix with custom CSS unless absolutely necessary

### Deprecated (do NOT use)
- ❌ Class components
- ❌ `any` type (use `unknown` + type guards if needed)
- ❌ Default exports for components
- ❌ Inline `fetch()` in components—use centralized API handlers
- ❌ Custom CSS files for component styling

### Example: API Route
```typescript
// src/app/api/analyze-image/route.ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

export async function POST(req: Request) {
  const { imageBase64, analysisType } = await req.json();
  const model = google('gemini-2.0-flash');
  // ... analysis logic
  return Response.json({ observations, confidence });
}
```

### Example: Component
```tsx
// src/components/diagnosis/DiagnosisCard.tsx
'use client';
import { motion } from 'framer-motion';

interface DiagnosisCardProps {
  title: string;
  observations: string[];
}

export function DiagnosisCard({ title, observations }: DiagnosisCardProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3>{title}</h3>
      <ul>{observations.map((o, i) => <li key={i}>{o}</li>)}</ul>
    </motion.div>
  );
}
```

---

## Mobile App Rules

> **Globs**: `sihat-tcm-mobile/**/*.js`

### Tech Stack
- Expo SDK 54, React Native 0.81, JavaScript (no TypeScript)
- AI: `@google/generative-ai` (direct client, not AI SDK)
- Auth/DB: `@supabase/supabase-js`
- Media: expo-image-picker, expo-av, expo-haptics, expo-blur

### Code Standards
- Always use `StyleSheet.create()`—NEVER inline style objects
- Import colors from `constants/Colors.js` to avoid circular deps
- Use `SafeAreaView` for all screen containers
- Use `FlatList` or `ScrollView` for lists—never `.map()` directly in render

### Architecture
- **Screens**: `screens/` folder, one file per screen or step
- **Shared logic**: `lib/` for API calls, Supabase, AI integration
- **Constants**: `constants/` for Colors, config, etc.
- **Navigation**: Managed in `App.js` with conditional rendering

### Deprecated (do NOT use)
- ❌ Inline style objects: `style={{ flex: 1 }}` (causes re-renders)
- ❌ Importing from `App.js` in other files (circular import risk)
- ❌ Class components
- ❌ `console.log` in production—use conditional debug flags

### Example: Screen Component
```javascript
// screens/diagnosis/TongueAnalysisStep.js
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TongueAnalysisStep({ onNext, onBack, formData, setFormData }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tongue Analysis</Text>
      {/* Camera/image picker UI */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
});
```

### Example: Supabase Usage
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true },
});
```

---

## Cross-Platform Patterns

### Supabase Auth
```typescript
// Web: @/lib/supabase/client.ts
import { createClient } from '@/lib/supabase/client';

// Mobile: lib/supabase.js
import { supabase } from '../lib/supabase';
```

### AI Image Analysis
```typescript
// Web: Use AI SDK
import { google } from '@ai-sdk/google';
const model = google('gemini-2.0-flash');

// Mobile: Use @google/generative-ai directly
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

---

## File Naming Conventions
| Type | Web | Mobile |
|------|-----|--------|
| Components | `PascalCase.tsx` | `PascalCase.js` |
| Utilities | `camelCase.ts` | `camelCase.js` |
| API routes | `kebab-case/route.ts` | N/A |
| Hooks | `useHookName.ts` | `useHookName.js` |
| Constants | `SCREAMING_SNAKE` values | `SCREAMING_SNAKE` values |

---

## Dev Commands
```bash
# Web
cd sihat-tcm && npm run dev

# Mobile
cd sihat-tcm-mobile && npx expo start --clear
```

---

## Known Gotchas
1. **Circular imports**: Mobile colors MUST come from `constants/Colors.js`, not `App.js`
2. **Tailwind v4**: Uses CSS-based config, not `tailwind.config.js`
3. **CORS**: API routes need headers for mobile requests on different origins
4. **Image analysis**: Accepts base64 in request body for both platforms
5. **Mobile is JS-only**: No TypeScript in `sihat-tcm-mobile`
6. **Expo Connection Error**: If phone shows "Blue Screen" or "Site can't be reached", restart the TP-Link WiFi Adapter on PC (Disable/Enable).

---

## Supabase Gotchas

> 📚 **Full documentation**: See `SUPABASE_SCHEMA.md` in project root for complete table definitions and query patterns.

### ⚠️ Critical Rules

1. **NO Direct Relationship Joins** - Supabase schema cache doesn't have `profiles!user_id` style relationships. Use manual client-side joins instead:
   ```typescript
   // ❌ WRONG - Will cause "Could not find relationship" error
   .select("*, profiles!user_id(*)")
   
   // ✅ CORRECT - Manual join
   const { data: sessions } = await supabase.from("diagnosis_sessions").select("*");
   const userIds = sessions.map(s => s.user_id).filter(Boolean);
   const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);
   ```

2. **Handle Missing Columns (42703 Error)** - Columns like `flag`, `notes` may not exist. Always add fallback:
   ```typescript
   const { data, error } = await supabase.from("profiles").select("id, full_name, flag");
   if (error?.code === "42703") {
     // Retry without optional column
     return supabase.from("profiles").select("id, full_name");
   }
   ```

3. **User ID Sources**:
   - `diagnosis_sessions.user_id` → Links to `profiles.id` (registered users)
   - `diagnosis_sessions.patient_id` → Links to `patients.id` (doctor-managed patients)
   - Always check BOTH when building patient displays

4. **Types Location**: All database types are in `sihat-tcm-web/src/types/database.ts`

---

## AI Assistant Capabilities

> **SQL migrations can be run directly** - `SUPABASE_SERVICE_ROLE_KEY` is configured in `sihat-tcm-web/.env.local`.

### Running Migrations

When asked to run SQL or database changes:
1. Create a Node.js script (`.mjs`) in `sihat-tcm-web/`
2. Use the Supabase client with service role key for admin access
3. Execute with: `node your-migration.mjs`

### Available Scripts
| Script | Purpose |
|--------|---------|
| `run-migration.mjs` | Doctor approval column migration |
| `seed-test-doctors.mjs` | Create test doctor accounts |

### Workflow
Use `/run-sql-migration` for guided migration execution.


## AI Tooling (MCP)

> **Supercharge your workflow**: Use the Model Context Protocol (MCP) to give Gemini direct access to your tools.

- **Guide**: See `docs/setup/MCP_SETUP.md`
- **Supported Tools**: Supabase, GitHub, PostgreSQL
- **Usage**: Once configured, you can ask Gemini to "Run this SQL query" or "Create a GitHub issue" directly.

