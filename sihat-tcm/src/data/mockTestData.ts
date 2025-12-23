/**
 * ============================================================================
 * MOCK TEST DATA FOR "FILL" BUTTON
 * ============================================================================
 * This file contains mock data used when the user clicks the "Test/Fill" button
 * in the header. It populates all diagnosis steps with realistic sample data
 * for testing and demonstration purposes.
 * 
 * Data includes:
 * - PDF medical report (base64 placeholder)
 * - Medicine entries (manually entered format)
 * - Tongue diagnosis photo
 * - Face diagnosis photo
 * - Body area examination photo
 * - Voice analysis audio
 * - Pulse measurement BPM
 */

// Small placeholder image (1x1 green pixel that represents "captured" state)
// In production, you'd use real sample images
const MOCK_TONGUE_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M+wnYGBgZGBATEAABz8A/l4XLjBAAAAAElFTkSuQmCC";
const MOCK_FACE_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8DwHwYYGBgYCDIDABdoA/l5FpnhAAAAAElFTkSuQmCC";
const MOCK_BODY_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+P+fgZGBgYGRgQAxAADeGAP5VzGDgQAAAABJRU5ErkJggg==";

// Minimal valid audio file (WebM format placeholder)
const MOCK_AUDIO_BASE64 = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh4CBAR9DtnUBAAAA";

// Mock PDF report data (represents actual file upload)
const MOCK_PDF_REPORT = {
    name: "Blood_Test_Report_2024.pdf",
    type: "application/pdf",
    data: "", // PDFs don't need base64 preview
    extractedText: `
MEDICAL LABORATORY REPORT
Patient: John Doe
Date: December 2024

COMPLETE BLOOD COUNT (CBC):
- Hemoglobin: 14.2 g/dL (Normal: 12-16)
- White Blood Cells: 7,500 /μL (Normal: 4,500-11,000)
- Platelets: 250,000 /μL (Normal: 150,000-400,000)

METABOLIC PANEL:
- Glucose (Fasting): 95 mg/dL (Normal: 70-100)
- Creatinine: 0.9 mg/dL (Normal: 0.7-1.3)
- ALT: 25 U/L (Normal: 7-56)
- AST: 22 U/L (Normal: 10-40)

LIPID PROFILE:
- Total Cholesterol: 185 mg/dL (Desirable: <200)
- LDL: 110 mg/dL (Optimal: <100)
- HDL: 55 mg/dL (Good: >40)
- Triglycerides: 120 mg/dL (Normal: <150)

IMPRESSION: Results within normal limits. Mild elevation in LDL cholesterol. 
Recommend dietary modifications and follow-up in 3 months.
    `.trim()
};

// Mock medicine entries (as if manually entered)
const MOCK_MEDICINES = [
    {
        name: "Vitamin_D3_Supplement.txt",
        type: "text/plain",
        data: "",
        extractedText: "Vitamin D3 2000 IU - Take 1 capsule daily with food. For bone health and immune support."
    },
    {
        name: "Omega_3_Fish_Oil.txt",
        type: "text/plain",
        data: "",
        extractedText: "Omega-3 Fish Oil 1000mg - Take 2 softgels daily. EPA 360mg, DHA 240mg. Heart and brain health."
    },
    {
        name: "Multivitamin_Complex.txt",
        type: "text/plain",
        data: "",
        extractedText: "Daily Multivitamin - Take 1 tablet daily in the morning. Contains essential vitamins A, B-complex, C, E, and minerals."
    }
];

// Generate random BPM between 60-100
export function generateRandomBPM(): number {
    return Math.floor(Math.random() * (100 - 60 + 1)) + 60;
}

// Generate random pulse qualities based on BPM
export function generatePulseQualities(bpm: number) {
    const qualities = [];

    if (bpm < 70) {
        qualities.push({ id: 'chi', nameZh: '迟脉', nameEn: 'Slow (Chi)' });
    } else if (bpm > 85) {
        qualities.push({ id: 'shuo', nameZh: '数脉', nameEn: 'Rapid (Shuo)' });
    } else {
        qualities.push({ id: 'ping', nameZh: '平脉', nameEn: 'Normal (Ping)' });
    }

    // Add a secondary quality randomly
    const secondaryQualities = [
        { id: 'hua', nameZh: '滑脉', nameEn: 'Slippery (Hua)' },
        { id: 'xian', nameZh: '弦脉', nameEn: 'Wiry (Xian)' },
        { id: 'xi', nameZh: '细脉', nameEn: 'Thin (Xi)' }
    ];
    const randomSecondary = secondaryQualities[Math.floor(Math.random() * secondaryQualities.length)];
    qualities.push(randomSecondary);

    return qualities;
}

/**
 * Generate complete mock data for all diagnosis steps
 * Called when user clicks the "Fill" button
 */
export function generateMockTestData() {
    const randomBPM = generateRandomBPM();
    const pulseQualities = generatePulseQualities(randomBPM);

    return {
        // Basic Info
        basic_info: {
            name: 'John Doe',
            age: '35',
            gender: 'male',
            weight: '72',
            height: '175',
            symptoms: 'Headache, Fatigue, feeling tired and dizzy for the past week',
            mainComplaint: 'Headache',
            otherSymptoms: 'Fatigue, feeling tired and dizzy for the past week',
            symptomDuration: '1-2-weeks'
        },

        // Inquiry Step (reports, medicines, chat)
        wen_inquiry: {
            summary: "Patient presents with recurring headaches and general fatigue over the past week. Reports feeling dizzy occasionally, especially in the morning. Sleep quality has been poor. No significant medical history. Currently taking multivitamins and Omega-3 supplements. Blood test results are within normal limits with mild LDL elevation.",
            chatHistory: [
                { role: 'assistant', content: 'Hello! I can see you are experiencing headaches and fatigue. Can you tell me more about when they started?' },
                { role: 'user', content: 'They started about a week ago. The headaches are mostly in the front of my head and get worse in the afternoon.' },
                { role: 'assistant', content: 'I understand. How would you describe the quality of your sleep recently?' },
                { role: 'user', content: 'Not great. I wake up 2-3 times at night and feel tired even after sleeping 7-8 hours.' },
                { role: 'assistant', content: 'Are you experiencing any other symptoms like neck stiffness, nausea, or sensitivity to light?' },
                { role: 'user', content: 'Some neck tension yes, but no nausea. I do feel a bit more sensitive to bright screens though.' }
            ],
            reportFiles: [MOCK_PDF_REPORT],
            medicineFiles: MOCK_MEDICINES,
            files: []
        },

        // Tongue Analysis
        wang_tongue: {
            image: MOCK_TONGUE_IMAGE,
            observation: "Slightly pale tongue body with thin white coating. Tongue appears slightly swollen with visible tooth marks on the edges. The coating is evenly distributed but thin, suggesting mild Qi deficiency.",
            potential_issues: ["Qi Deficiency", "Mild Spleen Weakness", "Blood stagnation tendency"]
        },

        // Face Analysis
        wang_face: {
            image: MOCK_FACE_IMAGE,
            observation: "Complexion shows slight pallor with mild dark circles under the eyes. Skin appears slightly dull. The temple area shows subtle tension lines. Overall presentation suggests fatigue and possible sleep deficiency.",
            potential_issues: ["Fatigue signs", "Possible blood deficiency", "Eye strain"]
        },

        // Body Part Analysis (neck/shoulder area for headache patient)
        wang_part: {
            image: MOCK_BODY_IMAGE,
            observation: "Neck and shoulder area shown. Visible tension in the trapezius muscles. Patient may benefit from relaxation techniques and acupressure on GB20 (Feng Chi) and GB21 (Jian Jing) points.",
            potential_issues: ["Muscle tension", "Meridian blockage in Gallbladder channel"]
        },

        // Audio Analysis
        wen_audio: {
            audio: MOCK_AUDIO_BASE64,
            duration: 15,
            analysis: {
                overall_observation: "Voice is clear but slightly lacks vitality. Speaking pace is moderate. Occasional sighing noted during conversation.",
                voice_quality_analysis: {
                    observation: "Clear but weak voice",
                    severity: "mild",
                    tcm_indicators: ["Qi Deficiency", "Possible Lung Qi weakness"]
                },
                breathing_patterns: {
                    observation: "Normal breathing rhythm, slightly shallow",
                    indicators: ["Mild Qi deficiency"]
                },
                speech_patterns: {
                    observation: "Normal speech clarity, mild fatigue in tone",
                    indicators: ["Fatigue", "Stress"]
                },
                cough_sounds: {
                    observation: "No cough detected",
                    indicators: []
                },
                pattern_suggestions: ["Tonify Qi", "Support Spleen and Lung"],
                recommendations: ["Breathing exercises", "Adequate rest", "Warm foods"],
                confidence: "high",
                notes: "Voice analysis suggests mild Qi deficiency consistent with reported fatigue symptoms.",
                status: "success"
            }
        },

        // Pulse Check (with random BPM)
        qie: {
            bpm: randomBPM,
            pulseQualities: pulseQualities,
            notes: `Pulse rate: ${randomBPM} BPM. ${randomBPM < 70 ? 'Slightly slow pulse indicating possible Yang deficiency.' : randomBPM > 85 ? 'Slightly rapid pulse may indicate internal heat or stress.' : 'Normal pulse rate within healthy range.'}`
        },

        // Smart Connect Data
        smart_connect: {
            pulseRate: randomBPM,
            bloodPressure: "118/75",
            bloodOxygen: 98,
            bodyTemp: 36.5,
            hrv: 55,
            stressLevel: "Moderate",
            healthData: {
                provider: 'Apple Health',
                steps: 6842,
                sleepHours: 6.8,
                heartRate: randomBPM,
                calories: 2150,
                lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }
        }
    };
}

/**
 * Export individual mock assets for components that need them directly
 */
export const MOCK_ASSETS = {
    tongueImage: MOCK_TONGUE_IMAGE,
    faceImage: MOCK_FACE_IMAGE,
    bodyImage: MOCK_BODY_IMAGE,
    audioBase64: MOCK_AUDIO_BASE64,
    pdfReport: MOCK_PDF_REPORT,
    medicines: MOCK_MEDICINES
};
