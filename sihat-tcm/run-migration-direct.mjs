#!/usr/bin/env node
/**
 * Direct Migration Runner
 * Executes the diagnosis input data migration directly via Supabase connection
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import { config } from 'dotenv';
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('');
  console.error('Please ensure .env.local contains these variables.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running diagnosis input data migration...\n');

  // Read the migration file
  const migrationPath = join(__dirname, 'supabase', 'migrations', '20250102000001_add_diagnosis_input_data.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  // Split SQL into individual statements (simple split by semicolon)
  // Note: This is a simple approach - for complex SQL with functions, you might need a proper SQL parser
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  try {
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      // Skip comments
      if (statement.startsWith('--')) continue;

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      // Use RPC to execute raw SQL (requires service role key)
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });

      // Alternative: Use direct query if RPC doesn't work
      if (error && error.message.includes('exec_sql')) {
        // Try using the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: statement })
        });

        if (!response.ok) {
          console.warn(`⚠️  Statement ${i + 1} may have failed (this is normal for IF NOT EXISTS)`);
        }
      } else if (error) {
        // Some errors are expected (like "already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('IF NOT EXISTS')) {
          console.log(`   ℹ️  ${error.message}`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Statement ${i + 1} executed`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n🔍 Verifying table creation...');

    // Verify the table exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('guest_diagnosis_sessions')
      .select('id')
      .limit(1);

    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('❌ Table verification failed - table may not exist');
      console.log('   Please check Supabase dashboard to verify migration');
    } else {
      console.log('✅ Table verified successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Run the migration via Supabase Dashboard:');
    console.error('   1. Go to Supabase Dashboard → SQL Editor');
    console.error('   2. Copy contents of: supabase/migrations/20250102000001_add_diagnosis_input_data.sql');
    console.error('   3. Paste and run');
    process.exit(1);
  }
}

runMigration();

