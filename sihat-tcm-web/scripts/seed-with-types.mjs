import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL in .env.local');
    console.error('Please add your Supabase database connection string');
    process.exit(1);
}

console.log('📌 Using direct database connection\n');

const { Client } = pg;
const client = new Client({
    connectionString: DATABASE_URL,
});

async function addGuestTypeAndSeed() {
    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // Step 1: Add 'guest' to the enum
        console.log('Step 1: Adding \'guest\' to patient_type enum...');
        try {
            await client.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'guest' 
                AND enumtypid = 'patient_type'::regtype
            ) THEN
                ALTER TYPE patient_type ADD VALUE 'guest';
                RAISE NOTICE 'Added guest to patient_type enum';
            END IF;
        END $$;
      `);
            console.log('✓ guest type added/verified\n');
        } catch (err) {
            console.log('⚠️  Note:', err.message, '\n');
        }

        // Step 2: Run the seed SQL
        console.log('Step 2: Seeding 100 patients...');
        const sqlPath = path.join(__dirname, '..', 'seed_patients_mixed_types.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

        const result = await client.query(sqlContent);
        console.log('✓ Seed SQL executed\n');

        // Step 3: Verify
        const countResult = await client.query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM public.patients
      GROUP BY type
      ORDER BY count DESC
    `);

        console.log('📊 Patient Distribution:');
        let total = 0;
        countResult.rows.forEach(row => {
            const icon = row.type === 'managed' ? '🏥' : row.type === 'registered' ? '👤' : '🎫';
            console.log(`   ${icon} ${row.type.padEnd(11)}: ${row.count}`);
            total += parseInt(row.count);
        });
        console.log(`   📊 Total:      ${total}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

addGuestTypeAndSeed();
