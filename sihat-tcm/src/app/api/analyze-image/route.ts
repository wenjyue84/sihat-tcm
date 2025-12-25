import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getImageAnalysisPrompt } from '@/lib/systemPrompts';
import { ENHANCED_TONGUE_USER_PROMPT, ENHANCED_TONGUE_SYSTEM_PROMPT } from '@/lib/enhancedTonguePrompt';
import { supabase } from '@/lib/supabase';

export const maxDuration = 120;

// Models ordered from most advanced to least advanced
const MODEL_FALLBACK_ORDER = [
    'gemini-3-pro-preview',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
];

// Friendly names for status updates (without mentioning Gemini)
const MODEL_STATUS: Record<string, string> = {
    'gemini-3-pro-preview': 'Using master-level comprehensive analysis...',
    'gemini-2.5-pro': 'Using expert-level analysis...',
    'gemini-2.0-flash': 'Using rapid analysis...',
};

function isValidObservation(text: string): boolean {
    if (!text || text.trim().length < 50) return false;
    const invalidPatterns = [
        'cannot analyze',
        'unable to analyze',
        'no observation',
        'unclear image',
        'cannot see',
        'not visible',
        'I cannot',
        'I\'m unable',
        'sorry',
    ];
    const lowerText = text.toLowerCase();
    return !invalidPatterns.some(pattern => lowerText.includes(pattern));
}

export async function POST(req: Request) {
    try {
        const { image, type, symptoms, mainComplaint } = await req.json();

        if (!image) {
            return new Response(JSON.stringify({
                observation: 'No image was provided. Please take a photo.',
                potential_issues: [],
                modelUsed: 0,
                status: 'error'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch custom image analysis prompt from admin (if exists)
        let customPrompt = '';
        try {
            const { data } = await supabase
                .from('system_prompts')
                .select('prompt_text')
                .eq('role', 'doctor_image')
                .single();
            if (data && data.prompt_text) customPrompt = data.prompt_text;
        } catch (e) {
            console.error("Error fetching image analysis prompt", e);
        }

        // Get the appropriate prompt based on image type
        const imageType = type === 'tongue' ? 'tongue' : type === 'face' ? 'face' : 'other';
        const { system: defaultSystemPrompt, user: defaultUserPrompt } = getImageAnalysisPrompt(imageType);

        // For tongue analysis, use enhanced prompts (unless custom prompt is set)
        // This ensures we get the analysis_tags format with confidence levels
        let systemPrompt: string;
        let userPrompt: string;

        if (type === 'tongue' && !customPrompt) {
            // Use enhanced prompts for detailed analysis_tags
            systemPrompt = ENHANCED_TONGUE_SYSTEM_PROMPT;
            userPrompt = ENHANCED_TONGUE_USER_PROMPT;
            console.log('[analyze-image] Using ENHANCED tongue prompts for analysis_tags');
        } else {
            // Use custom prompt if set, otherwise use default from library
            systemPrompt = customPrompt || defaultSystemPrompt;
            userPrompt = defaultUserPrompt;
        }

        // Add patient context to user prompt if available
        if (symptoms || mainComplaint) {
            userPrompt += `\n\nPATIENT CONTEXT:\nMain Complaint: ${mainComplaint || 'Not provided'}\nSymptoms: ${symptoms || 'Not provided'}`;
        }

        // Try each model in order until we get a valid result
        for (let i = 0; i < MODEL_FALLBACK_ORDER.length; i++) {
            const modelId = MODEL_FALLBACK_ORDER[i];
            console.log(`[analyze-image] Trying model ${i + 1}/${MODEL_FALLBACK_ORDER.length}: ${modelId}`);

            try {
                const result = await generateText({
                    model: google(modelId),
                    system: systemPrompt,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: userPrompt },
                                { type: 'image', image: image },
                            ],
                        },
                    ],
                });

                const text = result.text;
                console.log(`[analyze-image] Model ${modelId} response:`, text?.substring(0, 200));

                if (!text || text.trim() === '') {
                    console.log(`[analyze-image] Model ${modelId} returned empty response, trying next...`);
                    continue;
                }

                // Clean up and parse
                const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();

                try {
                    const data = JSON.parse(cleanJson);

                    // Check for confidence-based validation
                    const confidence = data.confidence ?? 100; // Default to 100 for backward compatibility
                    const isValidImage = data.is_valid_image ?? true;
                    const imageDescription = data.image_description || '';

                    console.log(`[analyze-image] Model ${modelId} confidence: ${confidence}, valid: ${isValidImage}, desc: ${imageDescription}`);

                    // If confidence is too low or image is invalid, return appropriate response
                    if (!isValidImage || confidence < 60) {
                        console.log(`[analyze-image] Image not valid for ${type} analysis. Confidence: ${confidence}%`);
                        return new Response(JSON.stringify({
                            observation: '',
                            potential_issues: [],
                            modelUsed: i + 1,
                            status: 'invalid_image',
                            confidence: confidence,
                            image_description: imageDescription,
                            message: `This image does not appear to contain a ${type}. Detected: ${imageDescription || 'unrecognized content'}`
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    const observation = data.observation || data.analysis || data.description || text;

                    // Log analysis_tags for debugging
                    console.log(`[analyze-image] analysis_tags found: ${data.analysis_tags?.length || 0}`,
                        data.analysis_tags ? JSON.stringify(data.analysis_tags[0]?.title) : 'none');

                    if (isValidObservation(observation)) {
                        return new Response(JSON.stringify({
                            observation,
                            potential_issues: data.potential_issues || data.issues || data.indications || data.pattern_suggestions || [],
                            modelUsed: i + 1,
                            status: MODEL_STATUS[modelId] || 'Analysis complete',
                            confidence: confidence,
                            image_description: imageDescription,
                            // Enhanced tongue analysis fields
                            analysis_tags: data.analysis_tags || [],
                            tcm_indicators: data.tcm_indicators || [],
                            pattern_suggestions: data.pattern_suggestions || [],
                            notes: data.notes || ''
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    console.log(`[analyze-image] Model ${modelId} returned invalid observation, trying next...`);
                } catch {
                    // JSON parse failed, check if raw text is valid
                    if (isValidObservation(text)) {
                        return new Response(JSON.stringify({
                            observation: text,
                            potential_issues: [],
                            modelUsed: i + 1,
                            status: MODEL_STATUS[modelId] || 'Analysis complete',
                            confidence: 100 // Assume high confidence for raw text responses
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            } catch (modelError: any) {
                console.error(`[analyze-image] Model ${modelId} failed:`, modelError.message);
                // Continue to next model
            }
        }

        // All models failed
        return new Response(JSON.stringify({
            observation: 'Unable to analyze the image at this time. The visual inspection results will be reviewed manually.',
            potential_issues: [],
            modelUsed: 0,
            status: 'Analysis pending'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[analyze-image] Critical error:', error);
        return new Response(JSON.stringify({
            observation: `Analysis encountered an issue. Please continue and we'll review the image later.`,
            potential_issues: [],
            modelUsed: 0,
            status: 'error',
            error: error.message
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
