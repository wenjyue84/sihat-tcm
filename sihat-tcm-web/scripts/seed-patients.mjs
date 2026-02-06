import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedPatients() {
  try {
    console.log("🌱 Starting patient database seed...\n");

    // Read the SQL file
    const sqlPath = path.join(__dirname, "..", "seed_patients_mixed_types.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // Note: Supabase client doesn't directly support executing arbitrary SQL
    // We'll need to create patients via insertions instead

    console.log("📦 Creating 100 patients with proper type distribution...\n");

    // Name arrays
    const cnFirstNames = [
      "Wei",
      "Jun",
      "Ying",
      "Mei",
      "Hui",
      "Xin",
      "Yee",
      "Kang",
      "Ming",
      "Siew",
      "Chee",
      "Boon",
      "Kian",
      "Kah",
      "Mun",
      "Ah",
      "Kok",
      "Siong",
      "Pei",
      "Li",
      "Jia",
      "Yi",
      "Zhi",
      "Xue",
    ];
    const cnLastNames = [
      "Tan",
      "Lee",
      "Wong",
      "Lim",
      "Chong",
      "Ng",
      "Chin",
      "Liew",
      "Chan",
      "Low",
      "Teoh",
      "Seow",
      "Ong",
      "Goh",
      "Chua",
      "Khoo",
      "Loh",
      "Yeoh",
      "Ewe",
      "Sim",
      "Ang",
      "Teo",
      "Koh",
      "Phua",
    ];
    const myFirstNames = [
      "Ahmad",
      "Muhammad",
      "Siti",
      "Nur",
      "Farah",
      "Amir",
      "Zainal",
      "Aishah",
      "Ismail",
      "Fatimah",
      "Syahir",
      "Izzat",
      "Haris",
      "Haziq",
      "Nurul",
      "Puteri",
      "Adam",
      "Amina",
    ];
    const myLastNames = [
      "Abdullah",
      "Ibrahim",
      "Yusof",
      "Rahman",
      "Hassan",
      "Aziz",
      "Zakaria",
      "Mohamad",
      "Ali",
      "Omar",
      "Othman",
      "Razak",
      "Bakar",
    ];
    const inFirstNames = [
      "Ravi",
      "Priya",
      "Kumar",
      "Anjali",
      "Sanjay",
      "Devi",
      "Vijay",
      "Geetha",
      "Muthu",
      "Kavita",
      "Suresh",
      "Deepa",
      "Balan",
      "Meena",
      "Vikram",
      "Lakshmi",
    ];
    const inLastNames = [
      "Subramaniam",
      "Krishnan",
      "Raman",
      "Menon",
      "Pillai",
      "Rao",
      "Singh",
      "Kaur",
      "Govindasamy",
      "Rajagopal",
      "Manickam",
      "Fernandes",
      "Nair",
    ];
    const genders = ["male", "female"];

    const patients = [];

    for (let i = 1; i <= 100; i++) {
      const ethnicityRoll = Math.random();
      let firstName, lastName;

      if (ethnicityRoll < 0.6) {
        // Chinese
        firstName = cnFirstNames[Math.floor(Math.random() * cnFirstNames.length)];
        lastName = cnLastNames[Math.floor(Math.random() * cnLastNames.length)];
      } else if (ethnicityRoll < 0.85) {
        // Malay
        firstName = myFirstNames[Math.floor(Math.random() * myFirstNames.length)];
        lastName = myLastNames[Math.floor(Math.random() * myLastNames.length)];
      } else {
        // Indian
        firstName = inFirstNames[Math.floor(Math.random() * inFirstNames.length)];
        lastName = inLastNames[Math.floor(Math.random() * inLastNames.length)];
      }

      // Determine type
      let type, email;
      if (i <= 40) {
        type = "managed";
        email = `patient_${i}_${Math.floor(Math.random() * 10000)}@example.com`;
      } else if (i <= 75) {
        type = "registered";
        email = `patient_${i}_${Math.floor(Math.random() * 10000)}@example.com`;
      } else {
        type = "guest";
        email = null;
      }

      const patient = {
        first_name: firstName,
        last_name: lastName,
        ic_no: String(Math.floor(Math.random() * 1000000000000)).padStart(12, "0"),
        email: email,
        phone: `+601${Math.floor(Math.random() * 90000000 + 10000000)}`,
        birth_date: new Date(Date.now() - Math.random() * 365.25 * 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        gender: genders[Math.floor(Math.random() * genders.length)],
        status: "active",
        type: type,
        clinical_summary: { summary: "Auto-generated mock patient summary." },
      };

      patients.push(patient);
    }

    // Insert in batches
    const batchSize = 10;
    let inserted = 0;

    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize);
      const { data, error } = await supabase.from("patients").insert(batch).select();

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      } else {
        inserted += batch.length;
        process.stdout.write(`✓ Inserted ${inserted}/100 patients\r`);
      }
    }

    console.log("\n\n✅ Seed complete!");

    // Verify
    const { data: verification, error: verifyError } = await supabase
      .from("patients")
      .select("type");

    if (!verifyError && verification) {
      const counts = {
        managed: verification.filter((p) => p.type === "managed").length,
        registered: verification.filter((p) => p.type === "registered").length,
        guest: verification.filter((p) => p.type === "guest").length,
      };

      console.log("\n📊 Patient Distribution:");
      console.log(`   🏥 Managed:    ${counts.managed}`);
      console.log(`   👤 Registered: ${counts.registered}`);
      console.log(`   🎫 Guest:      ${counts.guest}`);
      console.log(`   📊 Total:      ${verification.length}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedPatients();
