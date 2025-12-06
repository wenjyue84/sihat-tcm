import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { supabase } from '@/lib/supabase';
import { INTERACTIVE_CHAT_PROMPT } from '@/lib/systemPrompts';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, basicInfo, model = 'gemini-2.5-flash' } = body;

        console.log("[API /api/chat] Request received:", {
            messageCount: messages?.length,
            hasBasicInfo: !!basicInfo,
            firstMsgRole: messages?.[0]?.role,
            model: model
        });

        // Fetch custom system prompt from admin database (uses 'doctor_chat' role)
        // Falls back to INTERACTIVE_CHAT_PROMPT from systemPrompts.ts if not found
        let customPrompt = '';
        try {
            const { data } = await supabase
                .from('system_prompts')
                .select('prompt_text')
                .eq('role', 'doctor_chat')
                .single();
            if (data && data.prompt_text) customPrompt = data.prompt_text;
        } catch (e) {
            console.error("Error fetching chat system prompt", e);
        }

        // Use the database prompt if available, otherwise use the library default
        // This matches what admin's "Reset to Default" button loads
        let systemPrompt = customPrompt || INTERACTIVE_CHAT_PROMPT;

        // Add patient information context
        if (basicInfo) {
            const height = basicInfo.height ? Number(basicInfo.height) : null;
            const weight = basicInfo.weight ? Number(basicInfo.weight) : null;
            const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : null;

            systemPrompt += `

═══════════════════════════════════════════════════════════════════════════════
                          患者信息 PATIENT INFORMATION
═══════════════════════════════════════════════════════════════════════════════

Name: ${basicInfo.name || 'Not provided'}
Age: ${basicInfo.age || 'Not provided'}
Gender: ${basicInfo.gender || 'Not provided'}
Height: ${height ? height + ' cm' : 'Not provided'}
Weight: ${weight ? weight + ' kg' : 'Not provided'}
${bmi ? `BMI: ${bmi}` : ''}
Chief Complaint: ${basicInfo.symptoms || 'Not provided'}
Symptom Duration: ${basicInfo.symptomDuration || 'Not provided'}

**INSTRUCTION:** Use this information as context. Build upon their chief complaint with your first question. Do NOT repeat this information back to the patient.`;
        }

        // Filter out system messages from the messages array (we'll use our own system prompt)
        const filteredMessages = messages?.filter((m: any) => m.role !== 'system') || [];

        console.log("[API /api/chat] Filtered messages count:", filteredMessages.length);
        console.log("[API /api/chat] First filtered message:", filteredMessages[0]);

        // If no messages, create a default initial message
        if (filteredMessages.length === 0) {
            filteredMessages.push({
                role: 'user',
                content: 'Please start the consultation by asking me relevant questions about my symptoms.'
            });
        }

        const result = streamText({
            model: google(model),
            system: systemPrompt,
            messages: filteredMessages,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("[API /api/chat] Error:", error);
        return new Response(JSON.stringify({
            error: error.message || 'Chat API error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
