/**
 * ============================================================================
 * MOCK TEST DATA FOR "FILL" BUTTON
 * ============================================================================
 * This file contains mock data used when the user clicks the "Test/Fill" button
 * in the header. It populates all diagnosis steps with realistic sample data
 * for testing and demonstration purposes.
 * 
 * Data includes:
 * - PDF medical report (extracted text)
 * - Medicine entries (manually entered format)
 * - Tongue diagnosis photo (TCM 舌诊 style)
 * - Face diagnosis photo (TCM 面诊 style)
 * - Body area examination photo
 * - Voice analysis audio
 * - Pulse measurement BPM
 */

// Mock images - using public folder paths
// These are realistic selfie-style photos that simulate patient-taken images for TCM diagnosis
const MOCK_TONGUE_IMAGE = "/mock-tongue.png";
const MOCK_FACE_IMAGE = "/mock-face.png";
const MOCK_BODY_IMAGE = "/mock-body.png";


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
            name: '张伟',
            age: '35',
            gender: 'male',
            weight: '72',
            height: '175',
            symptoms: '头痛，疲劳，过去一周感觉疲倦和头晕',
            mainComplaint: '头痛',
            otherSymptoms: '疲劳，过去一周感觉疲倦和头晕',
            symptomDuration: '1-2-weeks'
        },

        // Inquiry Step (reports, medicines, chat)
        wen_inquiry: {
            summary: "患者表现为过去一周反复头痛和全身疲劳。报告称偶尔感到头晕，尤其是早上。睡眠质量差。无重大病史。目前正在服用复合维生素和欧米茄-3补充剂。血液检查结果在正常范围内，低密度脂蛋白（LDL）轻微升高。",
            chatHistory: [
                { role: 'assistant', content: '您好！我看您有头痛和疲劳的症状。能详细告诉我这些症状是什么时候开始的吗？' },
                { role: 'user', content: '大约一周前开始的。头痛主要在额头部位，下午会加重。' },
                { role: 'assistant', content: '明白了。您最近的睡眠质量如何？' },
                { role: 'user', content: '不太好。我晚上会醒来2-3次，即使睡了7-8小时还是感觉很累。' },
                { role: 'assistant', content: '通过。您还有其他症状吗，比如颈部僵硬、恶心或对光敏感？' },
                { role: 'user', content: '颈部有些紧张，但没有恶心。不过我确实感觉对亮屏幕比较敏感。' }
            ],
            reportFiles: [MOCK_PDF_REPORT],
            medicineFiles: MOCK_MEDICINES,
            files: []
        },

        // Tongue Analysis (Enhanced with analysis_tags - myzencheck.net style)
        wang_tongue: {
            image: MOCK_TONGUE_IMAGE,
            observation: "舌体略胖，舌质淡白，舌边有齿痕。苔薄白分布均匀。整体提示脾气虚弱，湿气内停。",
            potential_issues: ["气虚", "脾虚湿盛", "血虚倾向"],
            analysis_tags: [
                {
                    title: "Swollen Tongue",
                    title_cn: "胖大舌",
                    category: "气虚 · 健脾",
                    confidence: 94.6,
                    description: "舌体胖大，尤其是边缘有齿痕，表明脾气虚弱，水湿运化失常。",
                    recommendations: [
                        "建议少吃生冷食物，多吃易消化、温热的熟食。",
                        "可在医师指导下考虑使用黄芪等补气药材。"
                    ]
                },
                {
                    title: "Teeth Marks",
                    title_cn: "齿痕舌",
                    category: "脾气虚 · 益气固表",
                    confidence: 91.3,
                    description: "舌边有牙齿压痕，提示脾气虚弱，伴有水液代谢问题。",
                    recommendations: [
                        "按时进食温热餐点，支持脾胃功能。",
                        "避免过度思虑和担忧，这会进一步耗伤脾气。"
                    ]
                },
                {
                    title: "Pale Tongue",
                    title_cn: "淡白舌",
                    category: "血虚 · 养血",
                    confidence: 87.2,
                    description: "舌色淡白，提示气血不足，常伴有疲劳和手脚冰凉。",
                    recommendations: [
                        "饮食中加入菠菜、红枣和枸杞等富含铁质的食物。",
                        "避免过度劳累，保证充足的休息。"
                    ]
                }
            ]
        },

        // Face Analysis
        wang_face: {
            image: MOCK_FACE_IMAGE,
            observation: "面色略显苍白，眼下有轻微黑眼圈。皮肤略显暗沉。太阳穴区域显示细微的紧张纹路。整体表现提示疲劳和可能的睡眠不足。",
            potential_issues: ["疲劳迹象", "可能血虚", "眼部疲劳"]
        },

        // Body Part Analysis (neck/shoulder area for headache patient)
        wang_part: {
            image: MOCK_BODY_IMAGE,
            observation: "颈肩部区域显示斜方肌明显紧张。患者可能受益于放松技巧和按压风池穴（GB20）与肩井穴（GB21）。",
            potential_issues: ["肌肉紧张", "胆经阻滞"]
        },

        // Audio Analysis
        wen_audio: {
            audio: MOCK_AUDIO_BASE64,
            duration: 15,
            analysis: {
                overall_observation: "声音清晰但略显底气不足。语速中等。对话中偶尔有叹气声。",
                voice_quality_analysis: {
                    observation: "声音清晰但微弱",
                    severity: "轻度",
                    tcm_indicators: ["气虚", "可能的肺气虚弱"]
                },
                breathing_patterns: {
                    observation: "呼吸节奏正常，略显浅促",
                    indicators: ["轻度气虚"]
                },
                speech_patterns: {
                    observation: "语音清晰度正常，语调中略带疲劳",
                    indicators: ["疲劳", "压力"]
                },
                cough_sounds: {
                    observation: "未检测到咳嗽",
                    indicators: []
                },
                pattern_suggestions: ["补气", "健脾益肺"],
                recommendations: ["呼吸练习", "充足休息", "温热饮食"],
                confidence: "高",
                notes: "语音分析提示轻度气虚，与报告的疲劳症状一致。",
                status: "success"
            }
        },

        // Pulse Check (with random BPM)
        qie: {
            bpm: randomBPM,
            pulseQualities: pulseQualities,
            notes: `脉率: ${randomBPM} BPM。${randomBPM < 70 ? '脉率稍慢，提示可能的阳虚。' : randomBPM > 85 ? '脉率稍快，可能提示体内有热或压力。' : '脉率正常，在健康范围内。'}`
        },

        // Smart Connect Data
        smart_connect: {
            pulseRate: randomBPM,
            bloodPressure: "118/75",
            bloodOxygen: 98,
            bodyTemp: 36.5,
            hrv: 55,
            stressLevel: "中等",
            healthData: {
                provider: 'Apple Health',
                steps: 6842,
                sleepHours: 6.8,
                heartRate: randomBPM,
                calories: 2150,
                lastUpdated: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
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
