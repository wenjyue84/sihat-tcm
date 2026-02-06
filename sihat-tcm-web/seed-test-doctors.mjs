/**
 * Seed Test Doctor Accounts
 *
 * Run with: node seed-test-doctors.mjs
 *
 * Creates 4 test doctor accounts:
 * - 2 approved doctors (visible in verification modal)
 * - 2 pending doctors (not visible until admin approves)
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables. Please check .env.local");
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testDoctors = [
  {
    email: "dr.wong@sihat.com",
    password: "password123",
    fullName: "Dr. Wong Wei Lin",
    isApproved: true,
    specialty: "TCM Internal Medicine",
  },
  {
    email: "dr.chen@sihat.com",
    password: "password123",
    fullName: "Dr. Chen Mei Ling",
    isApproved: true,
    specialty: "Acupuncture & Moxibustion",
  },
  {
    email: "dr.tan@sihat.com",
    password: "password123",
    fullName: "Dr. Tan Boon Keat",
    isApproved: false,
    specialty: "Herbal Medicine",
  },
  {
    email: "dr.lim@sihat.com",
    password: "password123",
    fullName: "Dr. Lim Siew Hui",
    isApproved: false,
    specialty: "TCM Pediatrics",
  },
];

async function seedDoctors() {
  console.log("🏥 Seeding Test Doctor Accounts...\n");

  // First, add is_approved column if it doesn't exist
  console.log("📊 Ensuring is_approved column exists...");
  try {
    // This will fail silently if column already exists
    await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;",
    });
  } catch (e) {
    // Column might already exist, continue
    console.log("   Column check complete (may already exist)");
  }

  // Update existing Master Doctor to be approved
  const { error: masterError } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("role", "doctor");

  if (masterError) {
    console.log("⚠️ Could not update Master Doctor (column may not exist yet)");
    console.log("   Run the SQL migration first: sql/add_doctor_approval.sql");
  } else {
    console.log("✅ Master Doctor(s) set as approved");
  }

  console.log("\n");

  for (const doctor of testDoctors) {
    console.log(`👤 Processing: ${doctor.fullName}`);

    // 1. Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const existing = existingUser?.users?.find((u) => u.email === doctor.email);

    let userId;

    if (existing) {
      console.log(`   ⏭️ User already exists, updating profile...`);
      userId = existing.id;
    } else {
      // 2. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: doctor.email,
        password: doctor.password,
        email_confirm: true,
        user_metadata: {
          full_name: doctor.fullName,
          role: "doctor",
        },
      });

      if (authError) {
        console.error(`   ❌ Failed to create auth user: ${authError.message}`);
        continue;
      }

      userId = authData.user.id;
      console.log(`   ✅ Auth user created: ${userId}`);
    }

    // 3. Upsert profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      role: "doctor",
      full_name: doctor.fullName,
      is_approved: doctor.isApproved,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error(`   ❌ Failed to upsert profile: ${profileError.message}`);
      continue;
    }

    const status = doctor.isApproved ? "✅ APPROVED" : "⏳ PENDING";
    console.log(`   ${status} - Profile updated\n`);
  }

  console.log("\n========================================");
  console.log("🎉 Seeding Complete!");
  console.log("========================================");
  console.log("\nTest Accounts Created:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  testDoctors.forEach((d) => {
    const icon = d.isApproved ? "✅" : "⏳";
    console.log(`${icon} ${d.email} | ${d.fullName}`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nPassword for all accounts: password123");
}

seedDoctors().catch(console.error);
