/**
 * Fix RLS policy for inquiries table
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixRLS() {
    console.log('🔍 Checking inquiries table...\n');

    // Try to insert a test record with service role (bypasses RLS)
    const testData = {
        user_id: null,
        symptoms: 'RLS Test - Delete Me',
        diagnosis_report: { type: 'test' },
        notes: 'Testing RLS policy'
    };

    const { data, error } = await supabase
        .from('inquiries')
        .insert([testData])
        .select();

    if (error) {
        console.error('❌ Even service role failed:', error.message);
    } else {
        console.log('✅ Service role insert works:', data);
        // Clean up test
        if (data?.[0]?.id) {
            await supabase.from('inquiries').delete().eq('id', data[0].id);
            console.log('🗑️ Cleaned up test record');
        }
    }

    // The issue is client-side RLS. Let me check what policies exist.
    console.log('\n📝 To fix RLS, you need to run this SQL in Supabase SQL Editor:\n');
    console.log('='.repeat(70));
    console.log(`
-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.inquiries;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.inquiries;

-- Create a permissive insert policy for verification requests
-- This allows both authenticated and anonymous users to create inquiries
CREATE POLICY "Allow all users to insert inquiries" 
ON public.inquiries
FOR INSERT 
TO public
WITH CHECK (true);

-- Also ensure users can read their own inquiries
DROP POLICY IF EXISTS "Users can view their own inquiries" ON public.inquiries;
CREATE POLICY "Users can view their own inquiries"
ON public.inquiries
FOR SELECT
TO public
USING (
    user_id IS NULL 
    OR user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'doctor'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
`);
    console.log('='.repeat(70));
    console.log('\n👆 Copy and run this in Supabase Dashboard → SQL Editor');
}

checkAndFixRLS();
