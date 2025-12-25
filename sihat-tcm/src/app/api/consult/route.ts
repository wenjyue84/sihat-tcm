import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { devLog } from '@/lib/systemLogger';
import { getSystemPrompt } from '@/lib/promptLoader';
import {
  prependLanguageInstruction,
  getLanguageInstruction,
  normalizeLanguage,
} from '@/lib/translations/languageInstructions';
import { parseApiError } from '@/lib/modelFallback';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = Date.now();
  devLog('info', 'API/consult', 'Request started');

  try {
    const body = await req.json();
    const { data, prompt, model = 'gemini-1.5-pro', language: rawLanguage = 'en' } = body;
    const language = normalizeLanguage(rawLanguage);

    devLog('info', 'API/consult', 'Request params', {
      promptPreview: prompt?.substring(0, 50),
      patientName: data?.basic_info?.name,
      model,
      language
    });

    // Fetch system prompt using centralized loader
    let systemPrompt = await getSystemPrompt('doctor_final');

    // Add language instructions using centralized utility
    systemPrompt = prependLanguageInstruction(systemPrompt, 'strict', language);

    // Build a comprehensive text summary of all the data
    const { basic_info } = data;

    // Build diagnosis info with bilingual headers for AI context
    let diagnosisInfo = `
═══════════════════════════════════════════════════════════════════════════════
                           患者资料 PATIENT PROFILE
═══════════════════════════════════════════════════════════════════════════════
`;

    if (data.verified_summaries?.basic_info) {
      diagnosisInfo += `${data.verified_summaries.basic_info}\n`;
    } else {
      diagnosisInfo += `
Name: ${basic_info?.name || 'Unknown'}
Age: ${basic_info?.age || 'Unknown'}
Gender: ${basic_info?.gender || 'Unknown'}
Weight: ${basic_info?.weight || 'Unknown'} kg
Height: ${basic_info?.height || 'Unknown'} cm
${basic_info?.height && basic_info?.weight ? `BMI: ${(basic_info.weight / ((basic_info.height / 100) ** 2)).toFixed(1)}` : ''}
Reported Symptoms: ${basic_info?.symptoms || 'None'}
Symptom Duration: ${basic_info?.symptomDuration || 'Not specified'}
`;
    }

    diagnosisInfo += `
═══════════════════════════════════════════════════════════════════════════════
                           问诊数据 INQUIRY DATA
═══════════════════════════════════════════════════════════════════════════════
`;

    if (data.verified_summaries?.wen_inquiry) {
      diagnosisInfo += `${data.verified_summaries.wen_inquiry}\n`;
    } else {
      // If we have a structured summary from the InquiryWizard, use it and SKIP the full chat history
      // to avoid context limit issues and redundancy.
      if (data.wen_inquiry?.inquiryText && data.wen_inquiry.inquiryText.length > 50) {
        diagnosisInfo += `Inquiry Summary: ${data.wen_inquiry.inquiryText}\n`;
        diagnosisInfo += `(Full chat history omitted as summary is provided)\n`;
      } else {
        // Fallback to chat history if no summary or summary is too short
        if (data.wen_inquiry?.inquiryText) {
          diagnosisInfo += `Notes: ${data.wen_inquiry.inquiryText}\n`;
        }

        if (data.wen_chat?.chat && Array.isArray(data.wen_chat.chat)) {
          const chatHistory = data.wen_chat.chat.map((m: any) => `${m.role}: ${m.content}`).join('\n');
          diagnosisInfo += `\nChat History (问诊记录):\n${chatHistory}\n`;
        } else {
          diagnosisInfo += `Chat History: No chat recorded\n`;
        }
      }
    }

    diagnosisInfo += `
═══════════════════════════════════════════════════════════════════════════════
                           切诊数据 PULSE DATA (切診)
═══════════════════════════════════════════════════════════════════════════════
`;
    if (data.verified_summaries?.qie) {
      diagnosisInfo += `${data.verified_summaries.qie}\n`;
    } else {
      diagnosisInfo += data.qie ? `Pulse BPM: ${data.qie.bpm}` : 'Pulse not measured';
    }

    diagnosisInfo += `

═══════════════════════════════════════════════════════════════════════════════
                           望诊数据 VISUAL OBSERVATIONS (望診)
═══════════════════════════════════════════════════════════════════════════════
`;

    // Tongue
    if (data.verified_summaries?.wang_tongue) {
      diagnosisInfo += `\n舌诊 Tongue Observation:\n${data.verified_summaries.wang_tongue}\n`;
    } else if (data.wang_tongue?.observation) {
      diagnosisInfo += `\n舌诊 Tongue Observation:\n${data.wang_tongue.observation}\n`;
      if (data.wang_tongue.potential_issues?.length) {
        diagnosisInfo += `Tongue Indications: ${data.wang_tongue.potential_issues.join(', ')}\n`;
      }
    } else {
      diagnosisInfo += 'Tongue: No observation recorded\n';
    }

    // Face
    if (data.verified_summaries?.wang_face) {
      diagnosisInfo += `\n面诊 Face Observation:\n${data.verified_summaries.wang_face}\n`;
    } else if (data.wang_face?.observation) {
      diagnosisInfo += `\n面诊 Face Observation:\n${data.wang_face.observation}\n`;
      if (data.wang_face.potential_issues?.length) {
        diagnosisInfo += `Face Indications: ${data.wang_face.potential_issues.join(', ')}\n`;
      }
    } else {
      diagnosisInfo += 'Face: No observation recorded\n';
    }

    // Body Part
    if (data.verified_summaries?.wang_part) {
      diagnosisInfo += `\n体部诊 Body Part Observation:\n${data.verified_summaries.wang_part}\n`;
    } else if (data.wang_part?.observation) {
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
    if (data.verified_summaries?.wen_audio) {
      diagnosisInfo += `${data.verified_summaries.wen_audio}\n`;
    } else {
      // Include audio/voice observation if available
      if (data.wen_audio?.audio) {
        diagnosisInfo += `Voice Recording: ✓ Provided\n`;

        // Handle structured analysis from AudioRecorder
        if (data.wen_audio.analysis) {
          const analysis = data.wen_audio.analysis;
          diagnosisInfo += `\n--- AUDIO ANALYSIS RESULTS ---\n`;
          diagnosisInfo += `Overall Observation: ${analysis.overall_observation || 'N/A'}\n`;

          if (analysis.voice_quality_analysis) {
            diagnosisInfo += `Voice Quality: ${analysis.voice_quality_analysis.observation} (Severity: ${analysis.voice_quality_analysis.severity})\n`;
          }

          if (analysis.breathing_patterns) {
            diagnosisInfo += `Breathing: ${analysis.breathing_patterns.observation} (Severity: ${analysis.breathing_patterns.severity})\n`;
          }

          if (analysis.speech_patterns) {
            diagnosisInfo += `Speech: ${analysis.speech_patterns.observation} (Severity: ${analysis.speech_patterns.severity})\n`;
          }

          if (analysis.cough_sounds) {
            diagnosisInfo += `Cough: ${analysis.cough_sounds.observation} (Severity: ${analysis.cough_sounds.severity})\n`;
          }

          if (analysis.pattern_suggestions && analysis.pattern_suggestions.length > 0) {
            diagnosisInfo += `Audio-suggested Patterns: ${analysis.pattern_suggestions.join(', ')}\n`;
          }
        } else if (data.wen_audio.observation) {
          // Fallback for legacy format
          diagnosisInfo += `Voice Analysis: ${data.wen_audio.observation}\n`;
        }

        if (data.wen_audio.transcription) {
          diagnosisInfo += `Voice Transcription: ${data.wen_audio.transcription}\n`;
        }
      } else {
        diagnosisInfo += `Voice Recording: Not provided\n`;
      }
    }

    // Smart Connect Health Data
    if (data.smart_connect) {
      diagnosisInfo += `
═══════════════════════════════════════════════════════════════════════════════
                           智能设备数据 SMART HEALTH DEVICE DATA
═══════════════════════════════════════════════════════════════════════════════
`;
      if (data.verified_summaries?.smart_connect) {
        diagnosisInfo += `${data.verified_summaries.smart_connect}\n`;
      } else {
        const sc = data.smart_connect;
        if (sc.pulseRate) diagnosisInfo += `Pulse Rate (Heart Rate): ${sc.pulseRate} BPM\n`;
        if (sc.bloodPressure) diagnosisInfo += `Blood Pressure: ${sc.bloodPressure} mmHg\n`;
        if (sc.bloodOxygen) diagnosisInfo += `Blood Oxygen (SpO2): ${sc.bloodOxygen}%\n`;
        if (sc.bodyTemp) diagnosisInfo += `Body Temperature: ${sc.bodyTemp}°C\n`;
        if (sc.hrv) diagnosisInfo += `Heart Rate Variability (HRV): ${sc.hrv} ms\n`;
        if (sc.stressLevel) diagnosisInfo += `Stress Level: ${sc.stressLevel}\n`;
      }
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
    diagnosisInfo += data.smart_connect ? '✓ Smart health device data connected\n' : '✗ No smart device data\n';

    // Add Report Options - Comprehensive dynamic prompt based on user selections
    if (data.report_options) {
      const opts = data.report_options;
      diagnosisInfo += `
═══════════════════════════════════════════════════════════════════════════════
                           REPORT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
IMPORTANT: Generate the report following EXACTLY these user-selected options.

=== SECTIONS TO INCLUDE ===
`;
      // Patient Information
      diagnosisInfo += `\n【Patient Information Section】\n`;
      diagnosisInfo += opts.includePatientName ? `✓ Include patient name\n` : `✗ OMIT patient name\n`;
      diagnosisInfo += opts.includePatientAge ? `✓ Include patient age\n` : `✗ OMIT patient age\n`;
      diagnosisInfo += opts.includePatientGender ? `✓ Include patient gender\n` : `✗ OMIT patient gender\n`;
      diagnosisInfo += opts.includePatientContact ? `✓ Include contact information\n` : ``;
      diagnosisInfo += opts.includePatientAddress ? `✓ Include patient address\n` : ``;
      diagnosisInfo += opts.includeEmergencyContact ? `✓ Include emergency contact\n` : ``;

      // Vital Signs & Measurements
      diagnosisInfo += `\n【Vital Signs & Measurements Section】\n`;
      diagnosisInfo += opts.includeVitalSigns ? `✓ Include vital signs (BP, HR, Temperature)\n` : `✗ OMIT vital signs\n`;
      diagnosisInfo += opts.includeBMI ? `✓ Include BMI & body measurements\n` : `✗ OMIT BMI\n`;
      diagnosisInfo += opts.includeSmartConnectData ? `✓ Include smart device health data\n` : `✗ OMIT smart device data\n`;

      // Medical History
      diagnosisInfo += `\n【Medical History Section】\n`;
      diagnosisInfo += opts.includeMedicalHistory ? `✓ Include past medical history\n` : ``;
      diagnosisInfo += opts.includeAllergies ? `✓ Include known allergies\n` : ``;
      diagnosisInfo += opts.includeCurrentMedications ? `✓ Include current medications\n` : ``;
      diagnosisInfo += opts.includePastDiagnoses ? `✓ Include past TCM diagnoses\n` : ``;
      diagnosisInfo += opts.includeFamilyHistory ? `✓ Include family medical history\n` : ``;

      // TCM Recommendations
      diagnosisInfo += `\n【TCM Recommendations Section】REQUIRED\n`;
      diagnosisInfo += opts.suggestMedicine ? `✓ MUST suggest herbal medicine formulas with detailed prescriptions\n` : `✗ DO NOT suggest specific herbal medicines\n`;
      diagnosisInfo += opts.suggestDoctor ? `✓ MUST recommend consulting a nearby TCM doctor\n` : `✗ DO NOT suggest consulting doctors\n`;
      diagnosisInfo += opts.includeDietary ? `✓ MUST include comprehensive dietary advice (食疗) with specific foods and recipes\n` : `✗ OMIT dietary advice\n`;
      diagnosisInfo += opts.includeLifestyle ? `✓ MUST include lifestyle recommendations (养生)\n` : `✗ OMIT lifestyle advice\n`;
      diagnosisInfo += opts.includeAcupuncture ? `✓ MUST include acupuncture points (穴位) with locations and self-massage techniques\n` : `✗ OMIT acupuncture points\n`;
      diagnosisInfo += opts.includeExercise ? `✓ MUST include exercise recommendations (运动建议)\n` : `✗ OMIT exercise advice\n`;
      diagnosisInfo += opts.includeSleepAdvice ? `✓ MUST include sleep and rest guidance\n` : `✗ OMIT sleep advice\n`;
      diagnosisInfo += opts.includeEmotionalWellness ? `✓ MUST include emotional wellness guidance (情志调养)\n` : `✗ OMIT emotional wellness\n`;

      // Report Extras
      diagnosisInfo += `\n【Report Format & Extras】\n`;
      diagnosisInfo += opts.includePrecautions ? `✓ MUST include precautions and warning signs\n` : `✗ OMIT precautions\n`;
      diagnosisInfo += opts.includeFollowUp ? `✓ MUST include follow-up guidance with timeline\n` : `✗ OMIT follow-up guidance\n`;
      diagnosisInfo += opts.includeTimestamp ? `✓ Include report timestamp\n` : ``;
      diagnosisInfo += opts.includeQRCode ? `✓ Include QR code reference\n` : ``;
      diagnosisInfo += opts.includeDoctorSignature ? `✓ Include doctor signature placeholder\n` : ``;

      diagnosisInfo += `
=== JSON STRUCTURE REQUIREMENTS ===
Your response MUST include these fields based on the above options:
{
  "patient_summary": {
    "name": "${opts.includePatientName ? 'string' : 'null'}",
    "age": "${opts.includePatientAge ? 'number' : 'null'}",
    "gender": "${opts.includePatientGender ? 'string' : 'null'}"${opts.includeVitalSigns || opts.includeBMI ? `,
    "vital_signs": {
      "bmi": "number or null",
      "blood_pressure": "string or null",
      "heart_rate": "number or null",
      "temperature": "number or null"
    }` : ''}
  },
  "diagnosis": {
    "primary_pattern": "Primary TCM syndrome (辨证)",
    "secondary_patterns": ["array of additional patterns"],
    "affected_organs": ["organs involved"],
    "pathomechanism": "explanation of disease mechanism"
  },
  "constitution": {
    "type": "Constitution type (体质类型)",
    "description": "Description of this constitution"
  },
  "analysis": {
    "summary": "Comprehensive analysis text",
    "key_findings": {
      "from_inquiry": "findings from conversation",
      "from_visual": "findings from tongue/face",
      "from_pulse": "findings from pulse if available"
    }
  },
  "recommendations": {
    ${opts.includeDietary ? `"food_therapy": {
      "beneficial": ["5+ foods with specific reasons"],
      "recipes": ["2+ therapeutic recipes with preparation"],
      "avoid": ["3+ foods to avoid with reasons"]
    },` : ''}
    ${opts.includeLifestyle ? `"lifestyle": ["4+ specific lifestyle recommendations"],` : ''}
    ${opts.includeAcupuncture ? `"acupoints": ["3+ acupoints with locations and techniques"],` : ''}
    ${opts.includeExercise ? `"exercise": ["2+ exercise types with frequency/duration"],` : ''}
    ${opts.includeSleepAdvice ? `"sleep_guidance": "Specific sleep recommendations",` : ''}
    ${opts.includeEmotionalWellness ? `"emotional_care": "Emotional wellness guidance",` : ''}
    ${opts.suggestMedicine ? `"herbal_formulas": [
      {
        "name": "Formula name (Chinese & English)",
        "ingredients": ["list of herbs"],
        "dosage": "dosage instructions",
        "purpose": "what it treats"
      }
    ],` : ''}
    ${opts.suggestDoctor ? `"doctor_consultation": "Recommendation to see a TCM practitioner",` : ''}
    "general": ["any additional recommendations"]
  }${opts.includePrecautions ? `,
  "precautions": {
    "warning_signs": ["symptoms requiring immediate attention"],
    "contraindications": ["things to avoid"],
    "special_notes": "important notes"
  }` : ''}${opts.includeFollowUp ? `,
  "follow_up": {
    "timeline": "when to reassess",
    "expected_improvement": "what to expect",
    "next_steps": "recommended next steps"
  }` : '},'}
  "disclaimer": "Standard medical disclaimer"${opts.includeTimestamp ? `,
  "timestamp": "${new Date().toISOString()}"` : ''}
}
`;
    } else {
      // Default requirements if no options provided
      diagnosisInfo += `
═══════════════════════════════════════════════════════════════════════════════
                           REPORT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
Include a comprehensive TCM diagnosis with:
- Patient information summary
- Primary diagnosis and constitution assessment
- Detailed analysis with key findings
- Dietary recommendations (foods to eat and avoid)
- Lifestyle suggestions
- Herbal medicine formulas (中药方剂)
- Acupuncture points for self-care
- Precautions and follow-up guidance
`;
    }

    // Add language-specific final instruction using centralized utility
    diagnosisInfo += getLanguageInstruction('final', language);

    devLog('info', 'API/consult', 'Calling Gemini streamText...');

    const result = streamText({
      model: google(model),
      system: systemPrompt,
      messages: [{ role: 'user', content: diagnosisInfo }],
    });

    const duration = Date.now() - startTime;
    devLog('info', 'API/consult', `Returning stream response after ${duration}ms setup`);

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    devLog('error', 'API/consult', `FAILED after ${duration}ms`, { error: errorMessage });

    // Parse error using centralized utility
    const { userFriendlyError, errorCode } = parseApiError(errorMessage);

    // Return a valid JSON response even on error
    const errorResponse = {
      diagnosis: "Analysis Error",
      constitution: "Unable to determine",
      analysis: userFriendlyError,
      error_code: errorCode,
      recommendations: {
        food: ["Please retry the analysis"],
        avoid: ["N/A"],
        lifestyle: ["Please try again with the diagnosis"]
      },
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
