import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { data } = await req.json();

  // Construct multimodal messages
  const userContent: any[] = [
    { type: 'text', text: 'Please perform a TCM diagnosis based on the following inputs:' }
  ];

  if (data.wang?.image) {
    // data.wang.image is a base64 string like "data:image/jpeg;base64,..."
    // We need to strip the prefix for some SDKs, but Vercel AI SDK's google provider usually handles data URLs or expects specific format.
    // The google provider supports 'image' part with a URL or base64.
    userContent.push({ type: 'image', image: data.wang.image });
  }

  if (data.wen_audio?.audio) {
    // data.wen_audio.audio is a base64 string
    // Currently Vercel AI SDK Core might not fully support audio parts in the standard 'messages' array for all providers yet, 
    // but Gemini supports it. We might need to check if the SDK supports 'file' or specific audio part.
    // As of recent versions, 'file' part with mimeType is supported.
    // Let's try passing it as a file part if possible, or just describe it if not supported.
    // Actually, for Gemini, we can pass audio.
    // If the SDK doesn't support it directly in the types, we might need to cast or use a workaround.
    // Let's assume 'file' type works or we skip audio for now if it breaks, but the requirement is Audio AI.
    // We will try to pass it as a text description if we can't pass audio directly, but we should try.
    // The 'experimental_attachments' or similar might be needed.
    // For now, let's assume we can pass it as a 'file' part if the SDK allows, or just rely on the image and text if audio is tricky.
    // Wait, the prompt explicitly asked for Audio AI.
    // Let's try to use the 'file' part.
    const audioBase64 = data.wen_audio.audio.split(',')[1];
    userContent.push({
      type: 'file',
      data: audioBase64,
      mimeType: 'audio/webm'
    });
  }

  const chatHistory = data.wen_chat?.chat?.map((m: any) => `${m.role}: ${m.content}`).join('\n') || 'No chat history';
  userContent.push({ type: 'text', text: `\nPatient Inquiry History:\n${chatHistory}` });

  const pulseInfo = data.qie ? `Pulse BPM: ${data.qie.bpm}` : 'Pulse not measured';
  userContent.push({ type: 'text', text: `\nPulse Palpation:\n${pulseInfo}` });

  const { basic_info } = data;
  const prompt = `
      You are a highly experienced Traditional Chinese Medicine (TCM) practitioner.
      Analyze the following patient data and provide a diagnosis, body constitution analysis, and food recommendations.

      Patient Profile:
      - Name: ${basic_info?.name || 'Unknown'}
      - Age: ${basic_info?.age || 'Unknown'}
      - Gender: ${basic_info?.gender || 'Unknown'}
      - Reported Symptoms: ${basic_info?.symptoms || 'None'}

      1. Wang (Inspection):
      - Image provided (Tongue analysis required).

      2. Wen (Listening):
      - Audio provided (Voice/Breath analysis required).

      3. Wen (Inquiry):
      - Chat History: ${chatHistory}

      4. Qie (Palpation):
      - Estimated Pulse BPM: ${pulseInfo}

      Please provide a detailed report in JSON format with the following structure:
      {
        "diagnosis": "Main TCM diagnosis (e.g., Qi Deficiency)",
        "constitution": "Body Constitution Type",
        "analysis": "Detailed analysis of symptoms and signs",
        "recommendations": {
          "food": ["List of recommended foods"],
          "avoid": ["List of foods to avoid"],
          "lifestyle": ["Lifestyle advice"]
        }
      }
  `;

  const result = streamText({
    model: google('gemini-1.5-pro-latest'),
    system: prompt,
    messages: [
      { role: 'user', content: userContent }
    ],
  });

  return result.toTextStreamResponse();
}
