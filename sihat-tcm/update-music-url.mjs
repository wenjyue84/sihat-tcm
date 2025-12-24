// Update music settings with working URL
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateMusicUrl() {
    console.log('🎵 Updating music URL to working source...\n');

    try {
        const { data: existing } = await supabase
            .from('admin_settings')
            .select('*')
            .limit(1)
            .single();

        if (!existing) {
            console.error('❌ No settings found. Run migrate-music.mjs first.');
            process.exit(1);
        }

        const { error } = await supabase
            .from('admin_settings')
            .update({
                background_music_url: 'https://www.bensound.com/bensound-music/bensound-relaxing.mp3'
            })
            .eq('id', existing.id);

        if (error) throw error;

        console.log('✅ Music URL updated successfully!');
        console.log('   New URL: https://www.bensound.com/bensound-music/bensound-relaxing.mp3');
        console.log('\n🎉 Refresh your admin page to see the new URL!\n');

    } catch (err) {
        console.error('\n❌ Update failed:', err.message);
        process.exit(1);
    }
}

updateMusicUrl();
