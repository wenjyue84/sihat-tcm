import { generateText } from 'ai';
import { getGoogleProvider } from '@/lib/googleProvider';

export const maxDuration = 60;

export async function POST(req: Request) {
    const startTime = Date.now();
    console.log('[summarize-reports] Request started');

    try {
        const { reports, diagnosisHistory, language = 'en' } = await req.json();
        console.log('[summarize-reports] Language:', language);
        console.log('[summarize-reports] Reports count:', reports?.length || 0);
        console.log('[summarize-reports] Diagnosis history count:', diagnosisHistory?.length || 0);

        if ((!reports || reports.length === 0) && (!diagnosisHistory || diagnosisHistory.length === 0)) {
            return new Response(JSON.stringify({
                error: 'No data provided',
                code: 'NO_DATA'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build context from reports and diagnosis history
        let contextText = '';

        if (reports && reports.length > 0) {
            contextText += 'MEDICAL REPORTS:\n\n';
            reports.forEach((report: any, index: number) => {
                contextText += `Report ${index + 1}: ${report.name}\n`;
                contextText += `Date: ${report.date}\n`;
                contextText += `Content:\n${report.extractedText || 'No extracted text available'}\n\n`;
            });
        }

        if (diagnosisHistory && diagnosisHistory.length > 0) {
            contextText += '\nPAST DIAGNOSIS HISTORY:\n\n';
            diagnosisHistory.forEach((diagnosis: any, index: number) => {
                const date = new Date(diagnosis.created_at).toLocaleDateString();
                contextText += `Consultation ${index + 1} (${date}):\n`;
                if (diagnosis.symptoms) {
                    contextText += `Symptoms: ${diagnosis.symptoms}\n`;
                }
                if (diagnosis.diagnosis_report) {
                    const report = diagnosis.diagnosis_report;
                    if (report.mainComplaint) {
                        contextText += `Main Complaint: ${report.mainComplaint}\n`;
                    }
                    if (report.tcmDiagnosis) {
                        contextText += `TCM Diagnosis: ${report.tcmDiagnosis}\n`;
                    }
                    if (report.syndromePattern) {
                        contextText += `Syndrome Pattern: ${report.syndromePattern}\n`;
                    }
                }
                contextText += '\n';
            });
        }

        // Generate summary using AI
        const languageInstruction = language === 'zh'
            ? 'Respond in Simplified Chinese (中文).'
            : language === 'ms'
                ? 'Respond in Bahasa Malaysia.'
                : 'Respond in English.';

        const systemPrompt = `You are a medical assistant helping to summarize a patient's medical history for Traditional Chinese Medicine (TCM) practitioners.

Your task is to create a concise medical history summary that will be helpful for TCM diagnosis.

Guidelines:
1. Keep the summary concise (under 300 words)
2. Focus on information relevant to TCM practice
3. Highlight any patterns or recurring issues
4. Note any medications mentioned
5. Use professional medical terminology
6. Format as clear paragraphs

${languageInstruction}`;

        const userPrompt = `Based on the following information, create a concise medical history summary:

${contextText}

Please provide:
1. A brief overview of the patient's health conditions
2. Key diagnoses and TCM patterns identified
3. Any notable medications or treatments mentioned
4. Important health indicators or test results

Format the response as a clear, paragraph-based summary suitable for medical records.`;

        console.log('[summarize-reports] Calling Gemini API...');
        const generateStartTime = Date.now();

        let text;
        try {
            const google = getGoogleProvider();
            const result = await generateText({
                model: google('gemini-2.0-flash'),
                system: systemPrompt,
                prompt: userPrompt,
            });
            text = result.text;
        } catch (primaryError: any) {
            console.error('[summarize-reports] Primary model failed:', primaryError.message);

            // Fallback
            try {
                const googleFallback = getGoogleProvider();
                const fallbackResult = await generateText({
                    model: googleFallback('gemini-1.5-flash'),
                    system: systemPrompt,
                    prompt: userPrompt,
                });
                text = fallbackResult.text;
                console.log('[summarize-reports] Fallback successful');
            } catch (fallbackError: any) {
                console.error('[summarize-reports] Fallback also failed:', fallbackError.message);
                throw primaryError;
            }
        }

        const generateDuration = Date.now() - generateStartTime;
        console.log(`[summarize-reports] Gemini API responded in ${generateDuration}ms`);

        const totalDuration = Date.now() - startTime;
        console.log(`[summarize-reports] Total request completed in ${totalDuration}ms`);

        return new Response(JSON.stringify({
            summary: text,
            timing: {
                total: totalDuration,
                generation: generateDuration
            }
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[summarize-reports] FAILED after ${duration}ms:`, error.message);

        return new Response(JSON.stringify({
            error: error.message || 'Failed to generate summary',
            code: 'GENERATION_FAILED',
            duration: duration
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
