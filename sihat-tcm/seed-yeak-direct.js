const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Strategy 1: Connection Pooling (Port 6543)
// Note: User format is strictly 'postgres.project_ref'
const poolerUrl = "postgresql://postgres.kixqmquwqzvcvdvfnfar:Jackjack1!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

// Strategy 2: Direct Connection (Port 5432)
// Uses the direct DB host
const directUrl = "postgresql://postgres:Jackjack1!@db.kixqmquwqzvcvdvfnfar.supabase.co:5432/postgres";

async function populateData() {
    const sqlPath = path.join(__dirname, 'supabase', 'seed_yeak_patient_data.sql');
    console.log(`📖 Reading SQL file...`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('\n🔄 Attempting Strategy 1: Connection Pooler...');
    const success = await tryConnection(poolerUrl, sqlContent);

    if (!success) {
        console.log('\n⚠️ Pooler connection failed. Switching to Strategy 2...');
        console.log('🔄 Attempting Strategy 2: Direct Connection...');
        await tryConnection(directUrl, sqlContent);
    }
}

async function tryConnection(connectionString, sqlContent) {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000 // 10s timeout
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        console.log('🚀 Executing SQL...');

        await client.query(sqlContent);

        console.log('\n============================================');
        console.log('✅ POPULATION COMPLETE');
        console.log('============================================');
        console.log('Successfully inserted data for Yeak Kiew Ai!');
        return true;

    } catch (err) {
        if (err.message.includes('User yeak@gmail.com not found')) {
            console.error('\n❌ ERROR: User Missing');
            console.error('The user "yeak@gmail.com" needs to be created in Supabase Auth first.');
            return true; // Stop trying other connections, this is a logic error not connection error
        }

        console.error(`❌ Connection failed: ${err.message}`);
        if (err.code) console.error(`   Code: ${err.code}`);
        return false;
    } finally {
        // Clean up client if connected
        try { await client.end(); } catch (e) { }
    }
}

populateData();
