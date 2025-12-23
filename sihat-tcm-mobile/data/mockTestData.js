const MOCK_TONGUE_IMAGE = require('../assets/mock-tongue.png');
const MOCK_FACE_IMAGE = require('../assets/mock-face.png');
const MOCK_BODY_IMAGE = require('../assets/mock-body.png');

const MOCK_AUDIO_BASE64 = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh4CBAR9DtnUBAAAA";

const MOCK_PDF_REPORT = {
    uri: 'mock-report.pdf',
    name: "Blood_Test_Report_2024.pdf",
    type: "application/pdf",
    size: 1024 * 50,
    extractedText: `MEDICAL LABORATORY REPORT
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
Recommend dietary modifications and follow-up in 3 months.`
};

const MOCK_MEDICINES = [
    {
        id: 'mock-med-1',
        name: "Vitamin_D3_Supplement.txt",
        type: "text",
        content: "Vitamin D3 2000 IU - Take 1 capsule daily with food. For bone health and immune support.",
        extractedText: "Vitamin D3 2000 IU - Take 1 capsule daily with food. For bone health and immune support."
    },
    {
        id: 'mock-med-2',
        name: "Omega_3_Fish_Oil.txt",
        type: "text",
        content: "Omega-3 Fish Oil 1000mg - Take 2 softgels daily. EPA 360mg, DHA 240mg. Heart and brain health.",
        extractedText: "Omega-3 Fish Oil 1000mg - Take 2 softgels daily. EPA 360mg, DHA 240mg. Heart and brain health."
    },
    {
        id: 'mock-med-3',
        name: "Multivitamin_Complex.txt",
        type: "text",
        content: "Daily Multivitamin - Take 1 tablet daily in the morning. Contains essential vitamins A, B-complex, C, E, and minerals.",
        extractedText: "Daily Multivitamin - Take 1 tablet daily in the morning. Contains essential vitamins A, B-complex, C, E, and minerals."
    }
];

const MOCK_AUDIO_ANALYSIS = {
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
};

export const getMockFormData = () => {
    return {
        name: 'John Doe',
        age: '35',
        gender: 'male',
        height: '175',
        weight: '72',
        mainConcern: 'headache',
        symptoms: ['insomnia', 'fatigue'],
        symptomDetails: 'I have been feeling a persistent headache for the last few days.',
        duration: 'few_days',

        tongueImage: MOCK_TONGUE_IMAGE,
        faceImage: MOCK_FACE_IMAGE,

        audioRecording: MOCK_AUDIO_BASE64,
        audioAnalysis: MOCK_AUDIO_ANALYSIS,

        bpm: '75',

        medicines: MOCK_MEDICINES,
        files: [MOCK_PDF_REPORT],

        smartConnectData: {
            heartRate: 75,
            steps: 6842,
            sleepHours: 6.8,
            calories: 2150,
            stressLevel: "Moderate",
            provider: 'Apple Health',
            lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
    };
};
