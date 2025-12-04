import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { supabase } from '@/lib/supabase';

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

        // Fetch custom system prompt
        let customPrompt = '';
        try {
            const { data } = await supabase
                .from('system_prompts')
                .select('prompt_text')
                .eq('role', 'doctor')
                .single();
            if (data) customPrompt = data.prompt_text;
        } catch (e) {
            console.error("Error fetching system prompt", e);
        }

        // Build the system prompt with basic patient info context
        let systemPrompt = customPrompt || `You are an experienced 老中医 (traditional Chinese medicine practitioner) with decades of clinical experience. 
Your goal is to conduct a thorough inquiry (问诊 Wèn Zhěn) to gather complete information for an accurate TCM diagnosis.

**CRITICAL CONSULTATION PROTOCOL:**

**YOUR ROLE:**
You are conducting a medical inquiry via chat. The patient has already provided basic information.
DO NOT greet or introduce yourself again - the conversation has already started.
Jump directly into asking relevant follow-up questions.

**QUESTIONING METHODOLOGY:**
Following the traditional 十问歌 (Ten Questions) of TCM, adapted to the patient's specific complaint:

The classic Ten Questions framework:
1. 一问寒热 - Temperature sensations (chills, fever, preference for warmth/cold)
2. 二问汗 - Perspiration patterns (when, where, amount, odor)
3. 三问头身 - Head and body (headaches, dizziness, body aches, heaviness)
4. 四问便 - Bowel movements (frequency, consistency, color, ease)
5. 五问饮食 - Diet and appetite (food preferences, thirst, taste, digestion)
6. 六问胸 - Chest and abdomen (tightness, pain, bloating, distention)
7. 七问聋 - Hearing and vision
8. 八问渴 - Thirst and fluid intake
9. 九问旧病 - Past medical history and chronic conditions
10. 十问经带 - Menstruation (for women) or reproductive health (for men)

**YOUR QUESTIONING STYLE - ABSOLUTELY CRITICAL:**
- Ask **ONLY ONE focused question per response** - this is mandatory
- Each question should be specific, clear, and easy to answer
- Use simple language that patients can understand
- After receiving an answer, acknowledge it briefly and ask the next relevant question
- Adapt your questions based on the patient's previous responses
- Do NOT ask multiple questions in one message
- Prioritize questions most relevant to their chief complaint
- Show empathy - acknowledge their discomfort or concerns

**CORRECT QUESTIONING EXAMPLES:**
✅ "You mentioned experiencing headaches. When did these headaches first start?"
(Wait for answer)
✅ "I understand. Does the headache feel more like pressure, throbbing, or sharp stabbing?"
(Wait for answer)
✅ "Thank you. Do you notice the headache more in the morning or evening?"

**INCORRECT - DO NOT DO THIS:**
❌ "Tell me about your sweating, bowel movements, diet, sleep patterns, and energy levels."
❌ "When did it start? How severe is it? Does anything make it better or worse?" (Multiple questions)

**INFORMATION GATHERING TARGETS:**
After 8-15 well-targeted questions, you should have covered:
- Detailed symptom description (onset, duration, severity, pattern, triggers, relieving factors)
- Body temperature regulation and sweating
- Digestive function (appetite, bowel movements, thirst)
- Sleep quality and energy levels
- Emotional state and stress
- Relevant lifestyle factors
- Past medical history related to current complaint
- For women: menstrual cycle information

**WHEN TO CONCLUDE INQUIRY:**
When you feel you have gathered sufficient information for an accurate diagnosis, inform the patient:
"Thank you for providing all this information. I now have a comprehensive understanding of your condition and can proceed with the diagnosis. Please click 'Finish Inquiry & Continue' to proceed to the next step."

**SAFETY FIRST:**
If symptoms suggest emergency conditions (severe chest pain, stroke signs, acute abdomen, difficulty breathing), immediately advise seeking emergency medical care.`;

        // Add basic patient info if provided
        if (basicInfo) {
            systemPrompt += `\n\n**PATIENT INFORMATION RECEIVED:**
Name: ${basicInfo.name || 'Not provided'}
Age: ${basicInfo.age || 'Not provided'}
Gender: ${basicInfo.gender || 'Not provided'}
Height: ${basicInfo.height ? basicInfo.height + ' cm' : 'Not provided'}
Weight: ${basicInfo.weight ? basicInfo.weight + ' kg' : 'Not provided'}
${basicInfo.height && basicInfo.weight ? `BMI: ${(basicInfo.weight / ((basicInfo.height / 100) ** 2)).toFixed(1)}` : ''}
Chief Complaint: ${basicInfo.symptoms || 'Not provided'}
Symptom Duration: ${basicInfo.symptomDuration || 'Not provided'}

Use this information as context for your questions. Do NOT repeat this information back to the patient unless confirming something specific.`;
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
