import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { data } = await req.json();

  // Construct multimodal messages
  const userContent: any[] = [
    { type: 'text', text: 'Please perform a TCM diagnosis based on the following inputs:' }
  ];

  if (data.wang_tongue?.image) {
    userContent.push({ type: 'text', text: '\n1. Wang (Inspection) - Tongue:' });
    userContent.push({ type: 'image', image: data.wang_tongue.image });
  } else if (data.wang?.image) {
    // Fallback for legacy data structure if any
    userContent.push({ type: 'text', text: '\n1. Wang (Inspection) - Tongue:' });
    userContent.push({ type: 'image', image: data.wang.image });
  }

  if (data.wang_face?.image) {
    userContent.push({ type: 'text', text: '\n2. Wang (Inspection) - Face:' });
    userContent.push({ type: 'image', image: data.wang_face.image });
  }

  if (data.wang_part?.image) {
    userContent.push({ type: 'text', text: '\n3. Wang (Inspection) - Specific Area (e.g., Skin/Injury):' });
    userContent.push({ type: 'image', image: data.wang_part.image });
  }

  if (data.wen_audio?.audio) {
    // data.wen_audio.audio is a base64 string
    const audioBase64 = data.wen_audio.audio.split(',')[1];
    userContent.push({ type: 'text', text: '\n4. Wen (Listening) - Audio:' });
    userContent.push({
      type: 'file',
      data: audioBase64,
      mimeType: 'audio/webm'
    });
  }

  const chatHistory = data.wen_chat?.chat?.map((m: any) => `${m.role}: ${m.content}`).join('\n') || 'No chat history';
  userContent.push({ type: 'text', text: `\n5. Wen (Inquiry) - Chat History:\n${chatHistory}` });

  const pulseInfo = data.qie ? `Pulse BPM: ${data.qie.bpm}` : 'Pulse not measured';
  userContent.push({ type: 'text', text: `\n6. Qie (Palpation) - Pulse:\n${pulseInfo}` });

  const { basic_info } = data;
  const prompt = `
      You are a highly experienced Traditional Chinese Medicine (TCM) practitioner.
      Analyze the following patient data and provide a diagnosis, body constitution analysis, and food recommendations.

      Patient Profile:
      - Name: ${basic_info?.name || 'Unknown'}
      - Age: ${basic_info?.age || 'Unknown'}
      - Gender: ${basic_info?.gender || 'Unknown'}
      - Reported Symptoms: ${basic_info?.symptoms || 'None'}

      The user has provided the following inputs (images, audio, chat, pulse).
      Please analyze ALL provided modalities.
      
      For the images:
      - Analyze the Tongue for color, coating, shape, and moisture.
      - Analyze the Face for complexion and sheen (Shen).
      - Analyze any Specific Area images if provided (e.g., for skin conditions or injuries).

      CRITICAL: You MUST return the result as a VALID JSON object. Do not include any markdown formatting (like \`\`\`json) or additional text outside the JSON object.

    The JSON structure must be exactly as follows:
      {
        "diagnosis": "Main TCM diagnosis (e.g., Qi Deficiency)",
        "constitution": "Body Constitution Type",
        "analysis": "A comprehensive and meaningful analysis of the patient's condition, explaining how the symptoms and signs (Wang, Wen, Wen, Qie) lead to the diagnosis. Use professional yet accessible language.",
        "recommendations": {
          "food": ["List of 3-5 specific recommended foods"],
          "avoid": ["List of 3-5 specific foods to avoid"],
          "lifestyle": ["List of 3-5 specific lifestyle recommendations"]
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
