---
description: Run SQL migrations on Supabase database
---

# Run SQL Migrations

// turbo-all

This workflow runs SQL migration files against your Supabase database.

## Capability Note

**The service role key is configured in `.env.local`** - you can ask me to run SQL migrations anytime and I will execute them for you using Node.js scripts.

## Steps

1. If SQL needs to be run, create a migration script in `sihat-tcm-web/`:
   ```bash
   # Example: node run-migration.mjs
   cd c:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm-web
   node run-migration.mjs
   ```

2. For custom SQL, create a new `.mjs` file following this pattern:
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   import dotenv from 'dotenv';
   dotenv.config({ path: '.env.local' });
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   );
   
   // Run your queries here
   const { data, error } = await supabase.from('table').select('*');
   ```

3. Run the script:
   ```bash
   node your-migration.mjs
   ```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `run-migration.mjs` | Doctor approval column migration |
| `seed-test-doctors.mjs` | Create test doctor accounts |
| `seed-yeak-data.mjs` | Seed patient test data |

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` ✅
- Scripts use admin privileges - be careful with destructive operations
- Always test on non-production data first when possible
