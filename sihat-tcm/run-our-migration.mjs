/**
 * Execute ONLY the diagnosis input data migration
 * Bypasses the failing earlier migration
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Project ref from earlier check
const PROJECT_REF = 'jvokcruuowmvpthubjqh';

console.log('🚀 Running diagnosis input data migration...\n');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables.');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Alternative: Run via Supabase Dashboard:');
  console.error('   1. Go to https://supabase.com/dashboard');
  console.error('   2. Select project: sihat-tcm');
  console.error('   3. SQL Editor → New Query');
  console.error('   4. Copy/paste: supabase/migrations/20250102000001_add_diagnosis_input_data.sql');
  console.error('   5. Click Run\n');
  process.exit(1);
}

// Read migration file
const migrationPath = join(__dirname, 'supabase', 'migrations', '20250102000001_add_diagnosis_input_data.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('📝 Migration file loaded:', migrationPath);
console.log('📊 SQL length:', sql.length, 'characters\n');

// Execute via Supabase Management API
async function executeMigration() {
  try {
    console.log('🔗 Connecting to Supabase Management API...');
    
    // Use Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          query: sql
        })
      }
    );

    const responseText = await response.text();
    
    if (!response.ok) {
      // Management API might not support direct SQL execution
      // Try alternative: use Supabase REST API with PostgREST
      console.log('⚠️  Management API approach not available.');
      console.log('📋 Please run the migration via Supabase Dashboard:\n');
      console.log('   1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF);
      console.log('   2. Click: SQL Editor (left sidebar)');
      console.log('   3. Click: New Query');
      console.log('   4. Copy ALL contents from:', migrationPath);
      console.log('   5. Paste into SQL Editor');
      console.log('   6. Click: Run (or press Ctrl+Enter)');
      console.log('\n✅ This will create the guest_diagnosis_sessions table and add new columns.\n');
      return;
    }

    const result = JSON.parse(responseText);
    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error executing migration:', error.message);
    console.error('\n📋 Please run manually via Supabase Dashboard:');
    console.error('   1. https://supabase.com/dashboard/project/' + PROJECT_REF);
    console.error('   2. SQL Editor → New Query');
    console.error('   3. Copy/paste migration file contents');
    console.error('   4. Click Run\n');
  }
}

executeMigration();

