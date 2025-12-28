import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking database connection...\n');
console.log('URL:', SUPABASE_URL?.substring(0, 30) + '...');
console.log('Key:', SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing', '\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
    console.log('📋 Checking for tables...\n');

    // Try patients table
    const { data: patients, error: patientsError, count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

    console.log('patients table:', patientsError ? `❌ ${patientsError.message}` : `✓ Exists (${patientsCount} rows)`);

    // Try profiles table
    const { data: profiles, error: profilesError, count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    console.log('profiles table:', profilesError ? `❌ ${profilesError.message}` : `✓ Exists (${profilesCount} rows)`);

    // Try diagnosis_sessions table
    const { data: sessions, error: sessionsError, count: sessionsCount } = await supabase
        .from('diagnosis_sessions')
        .select('*', { count: 'exact', head: true });

    console.log('diagnosis_sessions table:', sessionsError ? `❌ ${sessionsError.message}` : `✓ Exists (${sessionsCount} rows)`);

    // If patients table exists and has data, show sample
    if (!patientsError && patientsCount > 0) {
        const { data: samplePatients } = await supabase
            .from('patients')
            .select('id, first_name, last_name, type, status')
            .limit(5);

        console.log('\n📊 Sample patients:');
        console.table(samplePatients);
    }

    // If profiles table exists and has data
    if (!profilesError && profilesCount > 0) {
        const { data: sampleProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .limit(5);

        console.log('\n👤 Sample profiles:');
        console.table(sampleProfiles);
    }
}

checkTables();
