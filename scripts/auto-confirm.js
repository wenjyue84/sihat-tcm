const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("\n=== Auto-Confirm Users Fix ===\n");
console.log("This script will disable the need for email confirmation by auto-confirming all users.");
console.log("Please enter your Supabase Database Connection String.");
console.log("Format: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres");
console.log("Find it here: Supabase Dashboard -> Project Settings -> Database -> Connection String -> Node.js\n");

rl.question('Enter Connection String: ', (connectionString) => {
    if (!connectionString) {
        console.error('Connection string is required.');
        rl.close();
        return;
    }

    // Handle potential quotes around the string
    const cleanString = connectionString.replace(/['"]/g, '').trim();

    const client = new Client({
        connectionString: cleanString,
    });

    client.connect()
        .then(async () => {
            console.log('\nConnected to database. Applying fix...');

            // 1. Confirm existing users
            const res = await client.query(`UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL`);
            console.log(`Confirmed ${res.rowCount} existing users.`);

            // 2. Create trigger for future users
            // We need to create the function in public schema but it acts on auth schema
            await client.query(`
        CREATE OR REPLACE FUNCTION public.handle_new_user_confirmation()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE auth.users
          SET email_confirmed_at = now()
          WHERE id = NEW.id;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
            console.log('Created confirmation function.');

            // Drop trigger if exists to avoid duplicates
            await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users`);

            // Create the trigger
            await client.query(`
        CREATE TRIGGER on_auth_user_created_confirm
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_confirmation();
      `);

            console.log('Auto-confirm trigger created successfully!');
            console.log('\nSUCCESS! You can now login without email confirmation.');
        })
        .catch(err => {
            console.error('\nERROR:', err.message);
            console.error('Please check your connection string and password.');
        })
        .finally(() => {
            client.end();
            rl.close();
        });
});
