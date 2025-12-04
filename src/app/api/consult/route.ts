import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[consult] Request started');

  try {
    const body = await req.json();
    const { data, prompt } = body;

    console.log('[consult] Received prompt:', prompt?.substring(0, 50));
    console.log('[consult] Patient name:', data?.basic_info?.name);

    // Build a comprehensive text summary of all the data
    const { basic_info } = data;

    let diagnosisInfo = `
=== PATIENT PROFILE ===
Name: ${basic_info?.name || 'Unknown'}
Age: ${basic_info?.age || 'Unknown'}
Gender: ${basic_info?.gender || 'Unknown'}
Weight: ${basic_info?.weight || 'Unknown'} kg
Height: ${basic_info?.height || 'Unknown'} cm
Reported Symptoms: ${basic_info?.symptoms || 'None'}
Symptom Duration: ${basic_info?.symptomDuration || 'Not specified'}

=== INQUIRY DATA ===
`;

    if (data.wen_inquiry?.inquiryText) {
      diagnosisInfo += `Detailed Notes: ${data.wen_inquiry.inquiryText}\n`;
    }

    if (data.wen_chat?.chat && Array.isArray(data.wen_chat.chat)) {
      const chatHistory = data.wen_chat.chat.map((m: any) => `${m.role}: ${m.content}`).join('\n');
      diagnosisInfo += `Chat History:\n${chatHistory}\n`;
    } else {
      diagnosisInfo += `Chat History: No chat recorded\n`;
    }

    diagnosisInfo += `\n=== PULSE DATA ===\n`;
    diagnosisInfo += data.qie ? `Pulse BPM: ${data.qie.bpm}` : 'Pulse not measured';

    diagnosisInfo += `\n\n=== OBSERVATION NOTES ===\n`;
    diagnosisInfo += data.wang_tongue?.image ? 'Tongue image provided\n' : 'No tongue image\n';
    diagnosisInfo += data.wang_face?.image ? 'Face image provided\n' : 'No face image\n';
    diagnosisInfo += data.wen_audio?.audio ? 'Voice recording provided\n' : 'No voice recording\n';

    const systemPrompt = `You are a highly experienced Traditional Chinese Medicine (TCM) practitioner.
Analyze the patient data and provide a diagnosis.

CRITICAL: Return ONLY a valid JSON object with NO additional text or markdown formatting.

JSON structure:
{
  "diagnosis": "Primary TCM Pattern diagnosis",
  "constitution": "Body constitution type",
  "analysis": "Detailed analysis using TCM principles",
  "recommendations": {
    "food": ["food recommendation 1", "food recommendation 2", "food recommendation 3"],
    "avoid": ["avoid item 1", "avoid item 2", "avoid item 3"],
    "lifestyle": ["lifestyle tip 1", "lifestyle tip 2", "lifestyle tip 3"]
  }
}`;

    console.log('[consult] Calling Gemini streamText...');

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      prompt: diagnosisInfo,
    });

    const duration = Date.now() - startTime;
    console.log(`[consult] Returning stream response after ${duration}ms setup`);

    return result.toTextStreamResponse();
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[consult] FAILED after ${duration}ms:`, error.message);

    // Return a valid JSON response even on error
    const errorResponse = {
      diagnosis: "Analysis Error",
      constitution: "Unable to determine",
      analysis: `An error occurred: ${error.message}. Please try again.`,
      recommendations: {
        food: ["Please retry the analysis"],
        avoid: ["N/A"],
        lifestyle: ["Please try again with the diagnosis"]
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
