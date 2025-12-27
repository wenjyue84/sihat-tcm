import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleProvider } from "@/lib/googleProvider";
import { devLog } from "@/lib/systemLogger";
import path from "path";
import fs from "fs";

// File to store admin settings (in production, use database)
const SETTINGS_FILE = path.join(process.cwd(), "admin-settings.json");

// Default prompt if file not found
const DEFAULT_PROMPT = `You are a TCM dietary expert capable of advising patients on what foods to eat or avoid based on their diagnosis.

Context:
Patient Profile: {profile}
Latest Diagnosis: {diagnosis}
Latest Dietary Advice: {advice}

User Question: {question}

Please answer the user's question based on the above context.
If the food is beneficial, explain why in TCM terms (e.g., tonifies Qi, clears heat).
If the food should be avoided, explain why (e.g., adds dampness, too cold).
If it depends, explain the conditions.
Keep the answer concise and helpful.`;

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    devLog("error", "API/ask-dietary-advice", "Error reading settings file", { error });
  }
  return {};
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, profile, diagnosis, advice } = body;

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Get system prompt from settings
    const settings = getSettings();
    let promptTemplate = settings.dietaryAdvicePrompt || DEFAULT_PROMPT;

    // Replace placeholders
    const filledPrompt = promptTemplate
      .replace("{profile}", JSON.stringify(profile || "Not provided"))
      .replace("{diagnosis}", JSON.stringify(diagnosis || "Not provided"))
      .replace("{advice}", JSON.stringify(advice || "Not provided"))
      .replace("{question}", question);

    devLog("info", "API/ask-dietary-advice", "Generating response...");

    const google = getGoogleProvider();
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: filledPrompt,
    });

    return NextResponse.json({ answer: text, prompt: filledPrompt }); // Return prompt for debug/transparency if needed
  } catch (error: any) {
    devLog("error", "API/ask-dietary-advice", "Error generating dietary advice", { error });
    return NextResponse.json(
      { error: error.message || "Failed to generate dietary advice" },
      { status: 500 }
    );
  }
}
