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
const MOCK_AUDIO_BASE64 =
  "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh4CBAR9DtnUBAAAA";

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
    `.trim(),
};

// Mock medicine entries (as if manually entered)
const MOCK_MEDICINES = [
  {
    name: "Vitamin_D3_Supplement.txt",
    type: "text/plain",
    data: "",
    extractedText:
      "Vitamin D3 2000 IU - Take 1 capsule daily with food. For bone health and immune support.",
  },
  {
    name: "Omega_3_Fish_Oil.txt",
    type: "text/plain",
    data: "",
    extractedText:
      "Omega-3 Fish Oil 1000mg - Take 2 softgels daily. EPA 360mg, DHA 240mg. Heart and brain health.",
  },
  {
    name: "Multivitamin_Complex.txt",
    type: "text/plain",
    data: "",
    extractedText:
      "Daily Multivitamin - Take 1 tablet daily in the morning. Contains essential vitamins A, B-complex, C, E, and minerals.",
  },
];

// Generate random BPM between 60-100
export function generateRandomBPM(): number {
  return Math.floor(Math.random() * (100 - 60 + 1)) + 60;
}

// Generate random pulse qualities based on BPM
export function generatePulseQualities(bpm: number) {
  const qualities = [];

  if (bpm < 70) {
    qualities.push({ id: "chi", nameZh: "迟脉", nameEn: "Slow (Chi)" });
  } else if (bpm > 85) {
    qualities.push({ id: "shuo", nameZh: "数脉", nameEn: "Rapid (Shuo)" });
  } else {
    qualities.push({ id: "ping", nameZh: "平脉", nameEn: "Normal (Ping)" });
  }

  // Add a secondary quality randomly
  const secondaryQualities = [
    { id: "hua", nameZh: "滑脉", nameEn: "Slippery (Hua)" },
    { id: "xian", nameZh: "弦脉", nameEn: "Wiry (Xian)" },
    { id: "xi", nameZh: "细脉", nameEn: "Thin (Xi)" },
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
      name: "张伟",
      age: "35",
      gender: "male",
      weight: "72",
      height: "175",
      symptoms: "头痛，疲劳，过去一周感觉疲倦和头晕",
      mainComplaint: "头痛",
      otherSymptoms: "疲劳，过去一周感觉疲倦和头晕",
      symptomDuration: "1-2-weeks",
    },

    // Inquiry Step (reports, medicines, chat)
    wen_inquiry: {
      summary:
        "患者表现为过去一周反复头痛和全身疲劳。报告称偶尔感到头晕，尤其是早上。睡眠质量差。无重大病史。目前正在服用复合维生素和欧米茄-3补充剂。血液检查结果在正常范围内，低密度脂蛋白（LDL）轻微升高。",
      chatHistory: [
        {
          role: "assistant",
          content: "您好！我看您有头痛和疲劳的症状。能详细告诉我这些症状是什么时候开始的吗？",
        },
        { role: "user", content: "大约一周前开始的。头痛主要在额头部位，下午会加重。" },
        { role: "assistant", content: "明白了。您最近的睡眠质量如何？" },
        { role: "user", content: "不太好。我晚上会醒来2-3次，即使睡了7-8小时还是感觉很累。" },
        { role: "assistant", content: "通过。您还有其他症状吗，比如颈部僵硬、恶心或对光敏感？" },
        { role: "user", content: "颈部有些紧张，但没有恶心。不过我确实感觉对亮屏幕比较敏感。" },
      ],
      reportFiles: [MOCK_PDF_REPORT],
      medicineFiles: MOCK_MEDICINES,
      files: [],
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
            "可在医师指导下考虑使用黄芪等补气药材。",
          ],
        },
        {
          title: "Teeth Marks",
          title_cn: "齿痕舌",
          category: "脾气虚 · 益气固表",
          confidence: 91.3,
          description: "舌边有牙齿压痕，提示脾气虚弱，伴有水液代谢问题。",
          recommendations: [
            "按时进食温热餐点，支持脾胃功能。",
            "避免过度思虑和担忧，这会进一步耗伤脾气。",
          ],
        },
        {
          title: "Pale Tongue",
          title_cn: "淡白舌",
          category: "血虚 · 养血",
          confidence: 87.2,
          description: "舌色淡白，提示气血不足，常伴有疲劳和手脚冰凉。",
          recommendations: [
            "饮食中加入菠菜、红枣和枸杞等富含铁质的食物。",
            "避免过度劳累，保证充足的休息。",
          ],
        },
      ],
    },

    // Face Analysis (Enhanced with analysis_tags - consistent with tongue analysis)
    wang_face: {
      image: MOCK_FACE_IMAGE,
      observation:
        "面色略显苍白，缺乏光泽。眼下有明显黑眼圈，伴有眼袋。印堂区域略显暗淡。颧骨处微红，嘴唇颜色偏淡。整体面相提示脾胃虚弱、肝肾不足，伴有心血亏虚的征象。",
      potential_issues: ["脾胃虚弱", "肝肾不足", "心血亏虚", "气血不畅"],
      analysis_tags: [
        {
          title: "Pale Complexion",
          title_cn: "面色苍白",
          category: "气血虚 · 补血养气",
          confidence: 92.3,
          description:
            "面色苍白无华，提示气血两虚，常伴有疲劳、头晕、心悸等症状。此证多见于久病体虚或失血过多者。",
          recommendations: [
            "多食用红枣、桂圆、当归等补血食材，增强气血生成。",
            "避免过度劳累，保证每日7-8小时的充足睡眠。",
          ],
        },
        {
          title: "Dark Eye Circles",
          title_cn: "眼圈发黑",
          category: "肾虚 · 滋肾养肝",
          confidence: 89.7,
          description: "眼周发黑，提示肾精不足，水液代谢失调。常见于熬夜、睡眠不足或肾虚体质者。",
          recommendations: [
            "建议晚上11点前入睡，养成规律作息习惯。",
            "可适量食用黑芝麻、核桃、山药等滋补肾阴的食物。",
          ],
        },
        {
          title: "Dull Forehead",
          title_cn: "印堂暗淡",
          category: "心气虚 · 安神定志",
          confidence: 85.4,
          description:
            "印堂区域暗淡无光，提示心气不足，精神不振。患者可能伴有心慌、多梦、健忘等症状。",
          recommendations: [
            "保持心情舒畅，避免过度焦虑和思虑过度。",
            "可饮用莲子心茶或酸枣仁汤来安神养心。",
          ],
        },
        {
          title: "Pale Lips",
          title_cn: "唇色淡白",
          category: "脾虚血弱 · 健脾益气",
          confidence: 87.1,
          description:
            "嘴唇颜色偏淡，提示脾胃功能虚弱，气血生化不足。常伴有食欲不振、腹胀、大便溏薄。",
          recommendations: [
            "饮食宜温热易消化，忌食生冷油腻之品。",
            "建议多食用山药、莲子、白扁豆等健脾食材。",
          ],
        },
      ],
    },

    // Body Part Analysis (neck/shoulder area for headache patient - Enhanced with analysis_tags)
    wang_part: {
      image: MOCK_BODY_IMAGE,
      observation:
        "颈肩部区域斜方肌明显紧张，触之有条索状结节。肩井穴处压痛明显。颈部活动受限，右侧为甚。局部皮肤温度正常，无明显红肿。整体表现提示经络气血瘀滞，与肝胆经、膀胱经循行区域相关，与患者主诉的头痛症状高度吻合。",
      potential_issues: ["气血瘀滞", "肝胆经不通", "膀胱经阻滞", "筋膜紧张"],
      analysis_tags: [
        {
          title: "Trapezius Tension",
          title_cn: "斜方肌紧张",
          category: "经络阻滞 · 疏通经脉",
          confidence: 93.8,
          description:
            "斜方肌区域明显紧张僵硬，常因久坐、姿势不良或情志不畅导致气血运行不畅，经络阻滞。",
          recommendations: [
            "建议每工作1小时起身活动颈肩，做颈部拉伸运动。",
            "可配合热敷或艾灸肩井穴（GB21）、天柱穴（BL10）以舒筋活络。",
          ],
        },
        {
          title: "Gallbladder Meridian Block",
          title_cn: "胆经阻滞",
          category: "肝胆不和 · 疏肝利胆",
          confidence: 88.5,
          description:
            "胆经循行于颈侧及肩部，经络阻滞可导致偏头痛、颈肩酸痛。常与情志郁结、肝气不舒有关。",
          recommendations: [
            "保持情绪稳定，避免生气、焦虑等负面情绪。",
            "可按揉风池穴（GB20）、肩井穴（GB21）、阳陵泉（GB34）以疏通胆经。",
          ],
        },
        {
          title: "Nodular Formation",
          title_cn: "条索结节",
          category: "气滞血瘀 · 活血化瘀",
          confidence: 86.2,
          description:
            "肌肉层可触及条索状结节，提示局部气血瘀滞日久，形成有形之结。需要活血化瘀、软坚散结。",
          recommendations: [
            "可配合推拿按摩，重点揉散结节部位。",
            "适量运动如游泳、太极拳有助于促进气血流通。",
          ],
        },
        {
          title: "Bladder Meridian Stagnation",
          title_cn: "膀胱经不畅",
          category: "太阳经证 · 温经散寒",
          confidence: 84.9,
          description:
            "膀胱经循行于背部脊柱两侧，经气不畅可导致背部僵硬、头痛、颈部不适。常与受寒或长期劳损有关。",
          recommendations: [
            "注意颈肩部保暖，避免空调直吹或冷风侵袭。",
            "可艾灸大椎穴（GV14）、风门穴（BL12）以温经散寒。",
          ],
        },
      ],
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
          tcm_indicators: ["气虚", "可能的肺气虚弱"],
        },
        breathing_patterns: {
          observation: "呼吸节奏正常，略显浅促",
          indicators: ["轻度气虚"],
        },
        speech_patterns: {
          observation: "语音清晰度正常，语调中略带疲劳",
          indicators: ["疲劳", "压力"],
        },
        cough_sounds: {
          observation: "未检测到咳嗽",
          indicators: [],
        },
        pattern_suggestions: ["补气", "健脾益肺"],
        recommendations: ["呼吸练习", "充足休息", "温热饮食"],
        confidence: "高",
        notes: "语音分析提示轻度气虚，与报告的疲劳症状一致。",
        status: "success",
      },
    },

    // Pulse Check (with random BPM)
    qie: {
      bpm: randomBPM,
      pulseQualities: pulseQualities,
      notes: `脉率: ${randomBPM} BPM。${randomBPM < 70 ? "脉率稍慢，提示可能的阳虚。" : randomBPM > 85 ? "脉率稍快，可能提示体内有热或压力。" : "脉率正常，在健康范围内。"}`,
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
        provider: "Apple Health",
        steps: 6842,
        sleepHours: 6.8,
        heartRate: randomBPM,
        calories: 2150,
        lastUpdated: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      },
    },
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
  medicines: MOCK_MEDICINES,
};
