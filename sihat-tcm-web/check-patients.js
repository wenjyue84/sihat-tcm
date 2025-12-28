const { createClient } = require('@supabase/supabase-js');

// You'll need to set these manually
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Please set SUPABASE credentials in environment');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPatients() {
    const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, type, status')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('\nPatient Data Sample:');
    console.table(data);

    // Count by type
    const { data: allPatients } = await supabase
        .from('patients')
        .select('type');

    const typeCounts = {
        managed: 0,
        registered: 0,
        guest: 0
    };

    allPatients?.forEach(p => {
        if (p.type) typeCounts[p.type]++;
    });

    console.log('\nPatient Type Distribution:');
    console.table(typeCounts);
    console.log('\nTotal patients:', allPatients?.length || 0);
}

checkPatients();
