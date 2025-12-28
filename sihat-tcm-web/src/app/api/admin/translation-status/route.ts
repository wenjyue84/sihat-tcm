import { NextResponse } from "next/server";
import { checkMissingTranslations } from "@/lib/content/blog";
import { en as enTranslations } from "@/lib/translations/en";
import { ms as msTranslations } from "@/lib/translations/ms";
import { zh as zhTranslations } from "@/lib/translations/zh";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Required system prompt roles for the AI to function correctly
const REQUIRED_PROMPT_ROLES = [
  "doctor_chat",
  "doctor_tongue",
  "doctor_face",
  "doctor_body",
  "doctor_listening",
  "doctor_inquiry_summary",
  "doctor_final",
];

interface SystemAlert {
  id: string; // Unique ID for tracking acknowledgment
  category: "translation" | "content" | "database" | "config";
  severity: "warning" | "error" | "info";
  message: string;
  solution: string; // How to fix the issue
}

// Helper: Generate a stable ID for an alert
function generateAlertId(category: string, message: string): string {
  // Create a simple hash from category + message
  const str = `${category}:${message}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `alert_${Math.abs(hash).toString(16)}`;
}

// Helper: Recursively get all keys from a nested object
function getAllKeys(obj: any, prefix = ""): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

// Check 1: Blog Translation Coverage
function checkBlogTranslations(): SystemAlert[] {
  const missing = checkMissingTranslations();
  return missing.map((msg) => {
    const id = generateAlertId("translation", msg);
    return {
      id,
      category: "translation",
      severity: "warning",
      message: `Blog: ${msg}`,
      solution: `Create the missing translation file in src/content/blog/. Copy the English .mdx file and translate its content.`,
    };
  });
}

// Check 2: UI Translation Coverage
function checkUITranslations(): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  const enKeys = new Set(getAllKeys(enTranslations));
  const msKeys = new Set(getAllKeys(msTranslations));
  const zhKeys = new Set(getAllKeys(zhTranslations));

  // Find keys missing in Malay
  const missingInMs: string[] = [];
  enKeys.forEach((key) => {
    if (!msKeys.has(key)) {
      missingInMs.push(key);
    }
  });

  // Find keys missing in Chinese
  const missingInZh: string[] = [];
  enKeys.forEach((key) => {
    if (!zhKeys.has(key)) {
      missingInZh.push(key);
    }
  });

  if (missingInMs.length > 0) {
    const displayKeys = missingInMs.slice(0, 5).join(", ");
    const moreCount = missingInMs.length > 5 ? ` (+${missingInMs.length - 5} more)` : "";
    const message = `UI (ms.ts): Missing ${missingInMs.length} keys: ${displayKeys}${moreCount}`;
    alerts.push({
      id: generateAlertId("translation", "ms_ui_" + missingInMs.length),
      category: "translation",
      severity: "warning",
      message,
      solution: `Open src/lib/translations/ms.ts and add the missing keys. Copy the structure from en.ts and translate the values. Missing: ${missingInMs.join(", ")}`,
    });
  }

  if (missingInZh.length > 0) {
    const displayKeys = missingInZh.slice(0, 5).join(", ");
    const moreCount = missingInZh.length > 5 ? ` (+${missingInZh.length - 5} more)` : "";
    const message = `UI (zh.ts): Missing ${missingInZh.length} keys: ${displayKeys}${moreCount}`;
    alerts.push({
      id: generateAlertId("translation", "zh_ui_" + missingInZh.length),
      category: "translation",
      severity: "warning",
      message,
      solution: `Open src/lib/translations/zh.ts and add the missing keys. Copy the structure from en.ts and translate the values. Missing: ${missingInZh.join(", ")}`,
    });
  }

  return alerts;
}

// Check 3: Missing Blog Images
function checkBlogImages(): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  const postsDirectory = path.join(process.cwd(), "src/content/blog");
  const publicDirectory = path.join(process.cwd(), "public");

  if (!fs.existsSync(postsDirectory)) {
    return alerts;
  }

  const files = fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".mdx") && !f.includes(".ms.") && !f.includes(".zh."));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(postsDirectory, file), "utf8");
      const coverImageMatch = content.match(/coverImage:\s*['"]([^'"]+)['"]/);

      if (coverImageMatch) {
        const imagePath = coverImageMatch[1];
        if (!imagePath.startsWith("http")) {
          const fullImagePath = path.join(publicDirectory, imagePath);
          if (!fs.existsSync(fullImagePath)) {
            const slug = file.replace(".mdx", "");
            const message = `Blog "${slug}": Missing cover image at ${imagePath}`;
            alerts.push({
              id: generateAlertId("content", slug + "_image"),
              category: "content",
              severity: "warning",
              message,
              solution: `Either: 1) Add the image file to public${imagePath}, or 2) Update the coverImage path in ${file} to point to an existing image, or 3) Remove the coverImage field to use the default placeholder.`,
            });
          }
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  return alerts;
}

// Check 4: Environment Variables
function checkEnvironmentVariables(): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  const criticalVars = [
    {
      name: "GOOGLE_GENERATIVE_AI_API_KEY",
      alias: "Gemini API Key",
      solution:
        "Get an API key from https://aistudio.google.com/app/apikey and add it to your .env.local file.",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      alias: "Supabase URL",
      solution:
        "Get your Supabase project URL from https://supabase.com/dashboard and add it to .env.local.",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      alias: "Supabase Anon Key",
      solution: "Get your Supabase anon key from the project settings and add it to .env.local.",
    },
  ];

  for (const envVar of criticalVars) {
    if (!process.env[envVar.name]) {
      const message = `Environment: ${envVar.alias} (${envVar.name}) is not set`;
      alerts.push({
        id: generateAlertId("config", envVar.name),
        category: "config",
        severity: "error",
        message,
        solution: envVar.solution,
      });
    }
  }

  return alerts;
}

// Check 5: Database connectivity and system prompts
async function checkDatabase(): Promise<SystemAlert[]> {
  const alerts: SystemAlert[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return alerts;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: prompts, error: promptsError } = await supabase
      .from("system_prompts")
      .select("role, prompt_text")
      .in("role", REQUIRED_PROMPT_ROLES);

    if (promptsError) {
      const message = `Database: Failed to query system_prompts - ${promptsError.message}`;
      alerts.push({
        id: generateAlertId("database", "query_error"),
        category: "database",
        severity: "error",
        message,
        solution:
          "Check your Supabase connection and ensure the system_prompts table exists with the correct schema.",
      });
      return alerts;
    }

    const existingRoles = new Set(prompts?.map((p) => p.role) || []);

    for (const role of REQUIRED_PROMPT_ROLES) {
      if (!existingRoles.has(role)) {
        const message = `System Prompts: "${role}" not customized (using default)`;
        alerts.push({
          id: generateAlertId("database", role),
          category: "database",
          severity: "info",
          message,
          solution: `This is informational only. The system uses default prompts. To customize, go to Admin > Prompts tab and edit the "${role}" prompt.`,
        });
      }
    }
  } catch (error) {
    const message = `Database: Connection failed - ${error instanceof Error ? error.message : "Unknown error"}`;
    alerts.push({
      id: generateAlertId("database", "connection"),
      category: "database",
      severity: "error",
      message,
      solution: "Verify your Supabase URL and API keys in .env.local are correct.",
    });
  }

  return alerts;
}

// Get acknowledged alert IDs from database
async function getAcknowledgedAlerts(): Promise<Set<string>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Set();
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from("admin_settings").select("acknowledged_alerts").single();

    if (data?.acknowledged_alerts) {
      return new Set(data.acknowledged_alerts);
    }
  } catch (error) {
    // Table might not exist or no data
  }

  return new Set();
}

export async function GET() {
  try {
    const allAlerts: SystemAlert[] = [];

    // Run all checks
    allAlerts.push(...checkBlogTranslations());
    allAlerts.push(...checkUITranslations());
    allAlerts.push(...checkBlogImages());
    allAlerts.push(...checkEnvironmentVariables());

    const dbAlerts = await checkDatabase();
    allAlerts.push(...dbAlerts);

    // Get acknowledged alerts
    const acknowledged = await getAcknowledgedAlerts();

    // Filter out acknowledged alerts
    const alerts = allAlerts.filter((a) => !acknowledged.has(a.id));

    // Sort by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({
      alerts,
      acknowledgedCount: acknowledged.size,
      summary: {
        total: alerts.length,
        errors: alerts.filter((a) => a.severity === "error").length,
        warnings: alerts.filter((a) => a.severity === "warning").length,
        info: alerts.filter((a) => a.severity === "info").length,
      },
    });
  } catch (error) {
    console.error("System health check error:", error);
    return NextResponse.json(
      {
        alerts: [
          {
            id: "error_main",
            category: "config",
            severity: "error",
            message: "Failed to run system health checks",
            solution: "Check the server console for detailed error messages.",
          },
        ],
        summary: { total: 1, errors: 1, warnings: 0, info: 0 },
      },
      { status: 500 }
    );
  }
}

// POST to acknowledge an alert
export async function POST(request: Request) {
  try {
    const { alertId, action } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current acknowledged alerts
    const { data: current } = await supabase
      .from("admin_settings")
      .select("acknowledged_alerts")
      .single();

    let acknowledgedAlerts: string[] = current?.acknowledged_alerts || [];

    if (action === "acknowledge") {
      if (!acknowledgedAlerts.includes(alertId)) {
        acknowledgedAlerts.push(alertId);
      }
    } else if (action === "unacknowledge") {
      acknowledgedAlerts = acknowledgedAlerts.filter((id) => id !== alertId);
    } else if (action === "reset_all") {
      acknowledgedAlerts = [];
    }

    // Upsert the acknowledged alerts
    const { error } = await supabase.from("admin_settings").upsert({
      id: 1, // Single settings row
      acknowledged_alerts: acknowledgedAlerts,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to save acknowledged alerts:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true, acknowledgedAlerts });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
