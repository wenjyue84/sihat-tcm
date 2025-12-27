import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

dotenv.config({ path: join(rootDir, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const medications = [
    { name: 'Duloxetine (Duloxpra)', chinese_name: '神经痛药', dosage: 'As prescribed', frequency: null, start_date: '2025-11-17', stop_date: '2025-12-10', purpose: 'Nerve pain/muscle relaxation', specialty: '疼痛科', is_active: false, edited_by: 'wenjyue lew' },
    { name: 'Remeron SolTab (Mirtazapine)', chinese_name: '安眠抗焦虑药', dosage: '15mg nightly', frequency: 'Nightly', start_date: '2020-01-01', stop_date: null, purpose: 'Mental health / sleep / anxiety (精神科)', specialty: '精神科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Normaten (Atenolol)', chinese_name: '心跳药', dosage: '50mg daily', frequency: 'Daily', start_date: '2020-01-01', stop_date: null, purpose: 'Slow heart rate control (心脏跳慢)', specialty: '心脏科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Lexoton (Bromazepam)', chinese_name: '安眠镇静药', dosage: 'As prescribed', frequency: null, start_date: '2025-11-17', stop_date: null, purpose: 'Anxiety/sleep', specialty: '精神科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Joint supplements (replaced by Mobithron Advance)', chinese_name: '关节保健品', dosage: '1 month course', frequency: null, start_date: null, stop_date: '2025-12-05', purpose: 'Knee arthritis', specialty: '骨科', is_active: false, edited_by: 'wenjyue lew' },
    { name: 'Trajenta (Linagliptin)', chinese_name: '糖尿病药', dosage: '5mg daily', frequency: 'Daily', start_date: '2020-01-01', stop_date: null, purpose: 'Diabetes management (kencing manis/糖尿病)', specialty: '内分泌科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Exforge (Amlodipine/Valsartan)', chinese_name: '降血压护肾药', dosage: '10mg/160mg daily', frequency: 'Daily', start_date: '2020-01-01', stop_date: null, purpose: 'High blood pressure + kidney protection (高血压)', specialty: '肾脏科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Crestor (Rosuvastatin)', chinese_name: '降胆固醇药', dosage: '10mg daily', frequency: 'Daily', start_date: '2020-01-01', stop_date: null, purpose: 'Cholesterol control (降胆固醇)', specialty: '心脏科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Rabeprazole', chinese_name: '胃酸药', dosage: 'As prescribed', frequency: null, start_date: '2025-11-17', stop_date: null, purpose: 'Acid reflux (PPI)', specialty: '胃科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Moxifloxacin (Avelox)', chinese_name: '抗生素', dosage: '400mg once daily', frequency: 'Once daily', start_date: '2025-12-04', stop_date: '2025-12-10', purpose: 'Antibiotic (1 week course)', specialty: '感染科', is_active: false, edited_by: 'wenjyue lew' },
    { name: 'Mobithron Advance (100/10/45mg)', chinese_name: '骨关节药', dosage: '1 capsule once daily', frequency: 'Once daily', start_date: '2025-12-05', stop_date: null, purpose: 'Bone/joint health (collagen, hyaluronic acid, boswellia)', specialty: '骨科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Simethicone (Gascoal)', chinese_name: '消胀气药', dosage: '50mg, 3 times daily', frequency: '3 times daily', start_date: '2025-12-05', stop_date: null, purpose: 'Anti-gas/bloating (胀风)', specialty: '胃科', is_active: true, edited_by: 'wenjyue lew' },
    { name: 'Brintellix (Vortioxetine)', chinese_name: '抗抑郁药', dosage: '10mg, ½ tablet at bedtime', frequency: 'Bedtime', start_date: '2025-12-09', stop_date: null, purpose: 'Antidepressant/anxiety (from Dr. Chan)', specialty: '精神科', is_active: true, edited_by: 'wenjyue lew' }
];

async function seed() {
    console.log("🚀 Starting JS Seeding...");

    try {
        // 1. Find User ID
        // Try to find in profiles first (assuming public read access)
        // Since we provided email, we are looking for 'Yeak Kiew Ai' probably? Or filter by a known property?
        // This is tricky without email in profile.

        // Let's list users from auth.users (requires service role)
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

        let userId;
        if (!authError && users) {
            const user = users.find(u => u.email === 'yeak@gmail.com');
            if (user) userId = user.id;
        }

        if (!userId) {
            console.log("⚠️  Could not find user via auth.admin (missing service role?). Trying to find profile by name...");
            // Fallback: Check public.profiles for name "Yeak Kiew Ai"
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .ilike('full_name', '%Yeak Kiew Ai%')
                .single();

            if (profile) userId = profile.id;
        }

        if (!userId) {
            console.error("❌ Could not find user 'Yeak Kiew Ai' (yeak@gmail.com). Aborting.");
            return;
        }

        console.log(`✅ Found User ID: ${userId}`);

        // 2. Clear existing (optional, but good for idempotency)
        await supabase.from('patient_medicines').delete().eq('user_id', userId);

        // 3. Insert Data
        const rows = medications.map(m => ({
            ...m,
            user_id: userId
        }));

        const { error: insertError } = await supabase.from('patient_medicines').insert(rows);

        if (insertError) {
            console.error("❌ Insert Error:", insertError.message);
            if (insertError.message.includes("column") && insertError.message.includes("does not exist")) {
                console.error("\nCRITICAL: The database schema is missing the new columns.");
                console.error("Please run the migration SQL manually in Supabase Dashboard.");
            }
        } else {
            console.log("✅ Successfully inserted 13 medication records.");
        }

    } catch (e) {
        console.error("Uncaught error:", e);
    }
}

seed();
