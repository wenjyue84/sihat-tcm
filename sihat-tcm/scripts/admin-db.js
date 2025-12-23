const { Client } = require('pg');

// USER: REPLACE [YOUR-PASSWORD] WITH YOUR ACTUAL SUPABASE DATABASE PASSWORD
const connectionString = "postgresql://postgres.jvokcruuowmvpthubjqh:[REDACTED]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runAdminCommand() {
    try {
        await client.connect();
        console.log('Connected to database with Admin rights.');

        // SQL to add the config column and update the doctor prompt
        const sql = `
      -- Add a config column to system_prompts to store additional settings like model selection
      ALTER TABLE system_prompts 
      ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

      -- Update the existing doctor prompt to have some default config
      UPDATE system_prompts 
      SET config = '{"default_level": "Expert", "model": "gemini-1.5-flash"}'::jsonb
      WHERE role = 'doctor';
    `;

        await client.query(sql);
        console.log('Schema updated successfully! You can now use the Admin Dashboard.');
    } catch (err) {
        console.error('Error executing script:', err);
    } finally {
        await client.end();
    }
}

runAdminCommand();
