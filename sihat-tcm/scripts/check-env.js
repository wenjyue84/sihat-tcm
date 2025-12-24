// Check environment variables for Supabase configuration
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Checking Supabase Environment Variables...\n');

let allGood = true;

if (SUPABASE_URL) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL);
} else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL: NOT SET');
    allGood = false;
}

if (!SUPABASE_ANON_KEY) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NOT SET');
    allGood = false;
} else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY: NOT SET');
    console.log('\n📝 To fix this:');
    console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Settings → API');
    console.log('   4. Copy the "service_role" key (secret)');
    console.log('   5. Add it to your .env.local file:');
    console.log('      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    console.log('   6. Restart your Next.js dev server\n');
    allGood = false;
} else {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
}

if (allGood) {
    console.log('\n✅ All environment variables are set!\n');
} else {
    console.log('\n⚠️  Some environment variables are missing. Please set them in .env.local\n');
    process.exit(1);
}

