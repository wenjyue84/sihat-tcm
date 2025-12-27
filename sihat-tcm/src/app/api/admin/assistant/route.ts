import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemContext = `
    You are the 'Admin Assistant' for the Sihat TCM platform. You help administrators manage the application.
    
    Current System Context:
    - Platform: Sihat TCM (AI-powered Traditional Chinese Medicine diagnosis)
    - Admin Capabilities: 
      1. User Management (Roles: admin, doctor, user, developer)
      2. Practitioner Directory (Manage doctor profiles)
      3. System Prompts (Configure AI personas for diagnosis steps: Inquiry, Tongue, Face, Listen, Final)
      4. Security Settings (Audit logs, password policies)
      5. CMS (Manage blog content in English/Malay/Chinese)
    - AI Models Used: Gemini 2.0 Flash (Physician), Gemini 2.5 Pro (Expert), Gemini 3.0 Preview (Master)
    
    Your Role:
    - Explain how to use the admin dashboard features.
    - Troubleshoot configuration issues (e.g., "Why is the tongue analysis failing?").
    - Suggest improvements for system prompts.
    - Be concise, professional, and helpful. 
    
    If asked about specific user data, remind the admin to check the "User Management" tab directly as you don't have real-time DB access in this chat.
  `;

  // Prepend system context to the conversation
  const coreMessages = [{ role: "system", content: systemContext }, ...messages];

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return new Response("Missing API Key", { status: 500 });
    }

    const result = streamText({
      model: google("gemini-2.0-flash-thinking-exp-01-21"),
      messages: coreMessages as any,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Stream Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
