import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updatePatientTypes() {
    console.log('🔄 Starting patient type redistribution...\n');

    try {
        // Get all patients ordered by creation date
        const { data: patients, error: fetchError } = await supabase
            .from('patients')
            .select('id, first_name, last_name, type')
            .order('created_at', { ascending: true });

        if (fetchError) {
            throw fetchError;
        }

        console.log(`📊 Found ${patients.length} patients\n`);

        // Redistribute types
        const updates = patients.map((patient, index) => {
            let newType;
            if (index < 40) {
                newType = 'managed';
            } else if (index < 75) {
                newType = 'registered';
            } else {
                newType = 'guest';
            }
            return { id: patient.id, type: newType, name: `${patient.first_name} ${patient.last_name}` };
        });

        // Update in batches
        console.log('🔧 Updating patient types...\n');
        let managedCount = 0;
        let registeredCount = 0;
        let guestCount = 0;

        for (const update of updates) {
            const updateData = { type: update.type };

            // Guests typically don't have emails in the system
            if (update.type === 'guest') {
                updateData.email = null;
            }

            const { error } = await supabase
                .from('patients')
                .update(updateData)
                .eq('id', update.id);

            if (error) {
                console.error(`❌ Error updating patient ${update.name}:`, error.message);
            } else {
                if (update.type === 'managed') managedCount++;
                else if (update.type === 'registered') registeredCount++;
                else guestCount++;
            }
        }

        console.log('✅ Update complete!\n');
        console.log('📈 Distribution:');
        console.log(`   🏥 Managed:    ${managedCount} (${((managedCount / patients.length) * 100).toFixed(1)}%)`);
        console.log(`   👤 Registered: ${registeredCount} (${((registeredCount / patients.length) * 100).toFixed(1)}%)`);
        console.log(`   🎫 Guest:      ${guestCount} (${((guestCount / patients.length) * 100).toFixed(1)}%)`);

        // Verify the update
        console.log('\n🔍 Verifying...');
        const { data: verification } = await supabase
            .from('patients')
            .select('type');

        const typeCounts = {
            managed: 0,
            registered: 0,
            guest: 0
        };

        verification?.forEach(p => {
            if (p.type) typeCounts[p.type]++;
        });

        console.log('\n✓ Verified counts:');
        console.log(`   Managed:    ${typeCounts.managed}`);
        console.log(`   Registered: ${typeCounts.registered}`);
        console.log(`   Guest:      ${typeCounts.guest}`);
        console.log(`   Total:      ${typeCounts.managed + typeCounts.registered + typeCounts.guest}`);

    } catch (error) {
        console.error('❌ Error:', error.message || error);
        process.exit(1);
    }
}

updatePatientTypes();
