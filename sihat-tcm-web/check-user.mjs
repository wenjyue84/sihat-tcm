import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log("Checking user 013999b4-4923-4fc5-b3ce-3d6c27455251...");

  // We can't query auth.users directly easily via client without specific permissions or admin API.
  // But profiles table mimics users.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", "013999b4-4923-4fc5-b3ce-3d6c27455251")
    .single();

  if (profile) {
    console.log("Profile found:", profile);
  } else {
    console.log("Profile not found via ID.");
  }

  console.log("\nChecking all inquiries for this user:");
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("id, created_at, symptoms")
    .eq("user_id", "013999b4-4923-4fc5-b3ce-3d6c27455251")
    .order("created_at", { ascending: false });

  console.log(inquiries);
}

checkUsers();
