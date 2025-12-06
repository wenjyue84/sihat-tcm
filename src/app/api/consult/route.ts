import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { FINAL_ANALYSIS_PROMPT } from '@/lib/systemPrompts';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[consult] Request started');

  try {
    const body = await req.json();
    const { data, prompt, model = 'gemini-2.5-flash' } = body;

    console.log('[consult] Received prompt:', prompt?.substring(0, 50));
    console.log('[consult] Patient name:', data?.basic_info?.name);
    console.log('[consult] Using model:', model);

    // Fetch custom final analysis prompt from admin (if exists)
    let customPrompt = '';
    try {
      const { data: promptData } = await supabase
        .from('system_prompts')
        .select('prompt_text')
        .eq('role', 'doctor_final')
        .single();
      if (promptData && promptData.prompt_text) customPrompt = promptData.prompt_text;
    } catch (e) {
      console.error("Error fetching final analysis prompt", e);
    }

    // Use custom prompt if set, otherwise use default from library
    const systemPrompt = customPrompt || FINAL_ANALYSIS_PROMPT;

    // Build a comprehensive text summary of all the data
    const { basic_info } = data;

    let diagnosisInfo = `
═══════════════════════════════════════════════════════════════════════════════
                           患者资料 PATIENT PROFILE
═══════════════════════════════════════════════════════════════════════════════

Name: ${basic_info?.name || 'Unknown'}
Age: ${basic_info?.age || 'Unknown'}
Gender: ${basic_info?.gender || 'Unknown'}
Weight: ${basic_info?.weight || 'Unknown'} kg
Height: ${basic_info?.height || 'Unknown'} cm
${basic_info?.height && basic_info?.weight ? `BMI: ${(basic_info.weight / ((basic_info.height / 100) ** 2)).toFixed(1)}` : ''}
Reported Symptoms: ${basic_info?.symptoms || 'None'}
Symptom Duration: ${basic_info?.symptomDuration || 'Not specified'}

═══════════════════════════════════════════════════════════════════════════════
                           问诊数据 INQUIRY DATA
═══════════════════════════════════════════════════════════════════════════════
`;

    if (data.wen_inquiry?.inquiryText) {
      diagnosisInfo += `Detailed Notes: ${data.wen_inquiry.inquiryText}\n`;
    }

    if (data.wen_chat?.chat && Array.isArray(data.wen_chat.chat)) {
      const chatHistory = data.wen_chat.chat.map((m: any) => `${m.role}: ${m.content}`).join('\n');
      diagnosisInfo += `\nChat History (问诊记录):\n${chatHistory}\n`;
    } else {
      diagnosisInfo += `Chat History: No chat recorded\n`;
    }

    diagnosisInfo += `
═══════════════════════════════════════════════════════════════════════════════
                           切诊数据 PULSE DATA (切診)
═══════════════════════════════════════════════════════════════════════════════
`;
    diagnosisInfo += data.qie ? `Pulse BPM: ${data.qie.bpm}` : 'Pulse not measured';

    diagnosisInfo += `

═══════════════════════════════════════════════════════════════════════════════
                           望诊数据 VISUAL OBSERVATIONS (望診)
═══════════════════════════════════════════════════════════════════════════════
`;

    // Include tongue observation if available
    if (data.wang_tongue?.observation) {
      diagnosisInfo += `\n舌诊 Tongue Observation:\n${data.wang_tongue.observation}\n`;
      if (data.wang_tongue.potential_issues?.length) {
        diagnosisInfo += `Tongue Indications: ${data.wang_tongue.potential_issues.join(', ')}\n`;
      }
    } else {
      diagnosisInfo += 'Tongue: No observation recorded\n';
    }

    // Include face observation if available
    if (data.wang_face?.observation) {
      diagnosisInfo += `\n面诊 Face Observation:\n${data.wang_face.observation}\n`;
      if (data.wang_face.potential_issues?.length) {
        diagnosisInfo += `Face Indications: ${data.wang_face.potential_issues.join(', ')}\n`;
      }
    } else {
      diagnosisInfo += 'Face: No observation recorded\n';
    }

    // Include body part observation if available (skin rashes, specific areas of concern)
    if (data.wang_part?.observation) {
      diagnosisInfo += `\n体部诊 Body Part Observation:\n${data.wang_part.observation}\n`;
      if (data.wang_part.potential_issues?.length) {
        diagnosisInfo += `Body Part Indications: ${data.wang_part.potential_issues.join(', ')}\n`;
      }
    }

    diagnosisInfo += `

═══════════════════════════════════════════════════════════════════════════════
                           闻诊数据 LISTENING/SMELLING DATA (聞診)
═══════════════════════════════════════════════════════════════════════════════
`;
    // Include audio/voice observation if available
    if (data.wen_audio?.audio) {
      diagnosisInfo += `Voice Recording: ✓ Provided\n`;
      // If there's any transcription or analysis results, include them
      if (data.wen_audio.transcription) {
        diagnosisInfo += `Voice Transcription: ${data.wen_audio.transcription}\n`;
      }
      if (data.wen_audio.observation) {
        diagnosisInfo += `Voice Analysis: ${data.wen_audio.observation}\n`;
      }
      // Note: The actual audio file would need separate processing for full analysis
      diagnosisInfo += `Note: Voice quality, breathing patterns, and cough sounds should be considered if audio was provided.\n`;
    } else {
      diagnosisInfo += `Voice Recording: Not provided\n`;
    }

    // Note image availability
    diagnosisInfo += `\n═══════════════════════════════════════════════════════════════════════════════
                           诊断资料汇总 DIAGNOSTIC DATA SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Data Availability Status:\n`;
    diagnosisInfo += data.wang_tongue?.image ? '✓ Tongue image provided\n' : '✗ No tongue image\n';
    diagnosisInfo += data.wang_face?.image ? '✓ Face image provided\n' : '✗ No face image\n';
    diagnosisInfo += data.wang_part?.image ? '✓ Body area image provided\n' : '✗ No body area image\n';
    diagnosisInfo += data.wen_audio?.audio ? '✓ Voice recording provided\n' : '✗ No voice recording\n';
    diagnosisInfo += data.qie?.bpm ? '✓ Pulse measurement taken\n' : '✗ No pulse measurement\n';

    diagnosisInfo += `

═══════════════════════════════════════════════════════════════════════════════
                     请根据以上资料进行综合诊断
         Please provide a comprehensive diagnosis based on the above data
═══════════════════════════════════════════════════════════════════════════════
`;

    console.log('[consult] Calling Gemini streamText...');

    const result = streamText({
      model: google(model),
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

