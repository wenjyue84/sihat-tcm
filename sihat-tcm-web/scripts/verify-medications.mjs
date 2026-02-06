import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

dotenv.config({ path: join(rootDir, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  // Get user ID from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .ilike("full_name", "%Yeak Kiew Ai%")
    .single();

  if (!profile) {
    console.log("❌ Profile not found");
    return;
  }

  console.log(`✅ Found profile: ${profile.full_name} (${profile.id})`);

  // Get medicines count
  const { data: medicines, error } = await supabase
    .from("patient_medicines")
    .select("name, chinese_name, is_active, purpose")
    .eq("user_id", profile.id);

  if (error) {
    console.log("❌ Error fetching medicines:", error.message);
    return;
  }

  console.log(`\n📊 Found ${medicines?.length || 0} medicines:\n`);
  medicines?.forEach((m, i) => {
    console.log(
      `  ${i + 1}. ${m.name} (${m.chinese_name || "N/A"}) - ${m.is_active ? "Active" : "Stopped"}`
    );
    if (m.purpose) console.log(`     Purpose: ${m.purpose}`);
  });
}

verify();
