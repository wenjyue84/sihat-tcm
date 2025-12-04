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

  const systemPrompt = `
    You are a highly experienced Traditional Chinese Medicine (TCM) practitioner.
    Your task is to perform the "Four Examinations" based on the provided multimodal data.

    1. Wang (Inspection): Analyze the tongue image for color, coating, and shape.
    2. Wen (Listening): Analyze the voice audio for tonality (weak/strong) and breath patterns.
    3. Wen (Inquiry): Consider the user's chat responses.
    4. Qie (Palpation): Consider the estimated pulse BPM and regularity.

    Output a JSON object with the following structure:
    {
      "diagnosis": {
        "tongue_analysis": "...",
        "voice_analysis": "...",
        "pulse_analysis": "...",
        "symptoms_summary": "..."
      },
      "constitution": "...",
      "recommendations": {
        "food": ["..."],
        "lifestyle": ["..."]
      }
    }
    Ensure the tone is empathetic and professional.
    Disclaimer: This is for wellness advice only, not a medical diagnosis.
  `;

  const result = streamText({
    model: google('gemini-1.5-pro-latest'),
    system: systemPrompt,
    messages: [
      { role: 'user', content: userContent }
    ],
  });

  return result.toDataStreamResponse();
}
