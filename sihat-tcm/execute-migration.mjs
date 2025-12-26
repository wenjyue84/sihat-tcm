/**
 * Execute migration directly via Supabase connection
 * Uses the linked project's connection
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read migration file
const migrationPath = join(__dirname, 'supabase', 'migrations', '20250102000001_add_diagnosis_input_data.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('🚀 Executing migration via Supabase CLI...\n');

try {
  // Use Supabase CLI to execute SQL via psql
  // First, get the database connection string
  const projectRef = 'jvokcruuowmvpthubjqh'; // From projects list
  
  // Try to execute using Supabase CLI's internal connection
  // We'll use the db execute approach via the Management API
  console.log('📝 Reading migration file...');
  console.log('📊 Migration file size:', sql.length, 'characters\n');
  
  // Since direct SQL execution via CLI is limited, we'll provide instructions
  // But first, let's try using the Supabase REST API if we have credentials
  console.log('⚠️  Direct SQL execution via CLI requires database credentials.');
  console.log('📋 Please run this migration using one of these methods:\n');
  console.log('Method 1: Supabase Dashboard (Easiest)');
  console.log('  1. Go to https://supabase.com/dashboard');
  console.log('  2. Select project: sihat-tcm');
  console.log('  3. Go to SQL Editor');
  console.log('  4. Copy contents of:', migrationPath);
  console.log('  5. Paste and click Run\n');
  
  console.log('Method 2: PowerShell Script');
  console.log('  Run: .\\run-guest-sessions-migration.ps1\n');
  
  console.log('Method 3: Manual psql (if you have connection string)');
  console.log('  psql $DATABASE_URL <', migrationPath, '\n');
  
  // Try to use Supabase CLI to get connection info and execute
  try {
    console.log('🔍 Attempting to execute via Supabase CLI...\n');
    
    // Create a temporary SQL file with just our migration
    const tempFile = join(__dirname, 'temp_migration.sql');
    require('fs').writeFileSync(tempFile, sql);
    
    // Try to use db push with only this file
    // But Supabase CLI doesn't support selective migration push
    
    console.log('💡 Since Supabase CLI db push requires all migrations,');
    console.log('   the easiest method is Supabase Dashboard (Method 1 above).\n');
    
    // Clean up
    require('fs').unlinkSync(tempFile);
    
  } catch (error) {
    console.log('⚠️  CLI execution not available. Use Method 1 (Dashboard) instead.\n');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n📋 Please use Supabase Dashboard to run the migration manually.');
}

