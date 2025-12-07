import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { chatHistory, reportFiles, medicineFiles, basicInfo, language = 'en' } = await req.json();

        let prompt = `
You are an expert TCM physician assistant. Your task is to summarize the patient inquiry session into a concise but comprehensive medical summary.
This summary will be used by the lead physician for final diagnosis.

Patient Basic Info:
Name: ${basicInfo?.name}
Age: ${basicInfo?.age}
Gender: ${basicInfo?.gender}
Chief Complaint: ${basicInfo?.symptoms}
Duration: ${basicInfo?.symptomDuration}

Uploaded Reports:
${reportFiles?.map((f: any) => `- ${f.name}: ${f.extractedText?.substring(0, 200)}...`).join('\n') || 'None'}

Uploaded Medicine:
${medicineFiles?.map((f: any) => `- ${f.name}: ${f.extractedText?.substring(0, 200)}...`).join('\n') || 'None'}

Chat History:
${chatHistory?.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Please provide a structured summary in ${language === 'zh' ? 'Chinese (Simplified)' : language === 'ms' ? 'Malay' : 'English'}.
The summary should include:
1. Main Symptoms & Details (duration, severity, triggers)
2. Medical History (from reports or chat)
3. Current Medication (from uploads or chat)
4. Other relevant TCM signs mentioned (sleep, appetite, digestion, etc.)

Keep it professional and clinical.
`;

        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            prompt: prompt,
        });

        return new Response(JSON.stringify({ summary: text }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error generating summary:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
