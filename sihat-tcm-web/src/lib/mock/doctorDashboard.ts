/**
 * Mock data for Doctor Dashboard and Reports pages
 * Used when Supabase has no records or during development/demo mode
 */

import type { PatientFlag } from "@/types/database";

export interface MockPatientProfile {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  flag?: PatientFlag;
}

export interface MockDiagnosisReport {
  summary: string;
  tcmPattern: string;
  recommendations: string[];
  tongueObservation: string;
  pulseObservation: string;
  patient_profile?: {
    name: string;
    age: number;
    gender: string;
  };
}

export interface Inquiry {
  id: string;
  created_at: string;
  symptoms: string;
  diagnosis_report: MockDiagnosisReport | null;
  profiles: MockPatientProfile | MockPatientProfile[] | null;
  patients?: MockPatientProfile | MockPatientProfile[] | null;
}

// Mock data for demonstration when Supabase has no records
export const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "mock-1",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Persistent headache, fatigue, and dizziness for the past week. Difficulty concentrating at work.",
    diagnosis_report: {
      summary: "Qi Deficiency with Blood Stasis",
      tcmPattern: "气虚血瘀证",
      recommendations: [
        "Rest adequately",
        "Acupuncture for Zusanli (ST36)",
        "Herbal formula: Bu Zhong Yi Qi Tang",
      ],
      tongueObservation: "Pale tongue with thin white coating",
      pulseObservation: "Weak and thready pulse",
    },
    profiles: {
      id: "p1",
      full_name: "Ahmad bin Hassan",
      age: 45,
      gender: "Male",
      flag: "Critical",
    },
  },
  {
    id: "mock-2",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Insomnia, heart palpitations, anxiety, and night sweats. Feeling restless especially at night.",
    diagnosis_report: {
      summary: "Heart Yin Deficiency with Empty Heat",
      tcmPattern: "心阴虚证",
      recommendations: [
        "Avoid spicy foods",
        "Meditation and relaxation",
        "Herbal formula: Tian Wang Bu Xin Dan",
      ],
      tongueObservation: "Red tongue tip with little coating",
      pulseObservation: "Rapid and thin pulse",
    },
    profiles: {
      id: "p2",
      full_name: "Siti Nurhaliza",
      age: 38,
      gender: "Female",
      flag: "High Priority",
    },
  },
  {
    id: "mock-3",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Lower back pain, knee weakness, frequent urination especially at night. Cold extremities.",
    diagnosis_report: {
      summary: "Kidney Yang Deficiency",
      tcmPattern: "肾阳虚证",
      recommendations: [
        "Avoid cold foods",
        "Keep lower back warm",
        "Herbal formula: Jin Gui Shen Qi Wan",
      ],
      tongueObservation: "Pale, puffy tongue with tooth marks",
      pulseObservation: "Deep and slow pulse",
    },
    profiles: { id: "p3", full_name: "Tan Wei Ming", age: 52, gender: "Male" },
  },
  {
    id: "mock-4",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Digestive issues, bloating after meals, loose stools, lack of appetite, and general weakness.",
    diagnosis_report: {
      summary: "Spleen Qi Deficiency with Dampness",
      tcmPattern: "脾气虚湿困证",
      recommendations: [
        "Eat warm, cooked foods",
        "Avoid dairy and raw foods",
        "Herbal formula: Shen Ling Bai Zhu San",
      ],
      tongueObservation: "Swollen tongue with thick greasy coating",
      pulseObservation: "Soggy and slippery pulse",
    },
    profiles: { id: "p4", full_name: "Priya Devi", age: 29, gender: "Female" },
  },
  {
    id: "mock-5",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Chronic cough with white phlegm, shortness of breath, catches cold easily, spontaneous sweating.",
    diagnosis_report: {
      summary: "Lung Qi Deficiency",
      tcmPattern: "肺气虚证",
      recommendations: [
        "Deep breathing exercises",
        "Avoid cold and windy weather",
        "Herbal formula: Yu Ping Feng San",
      ],
      tongueObservation: "Pale tongue with white coating",
      pulseObservation: "Weak and floating pulse",
    },
    profiles: { id: "p5", full_name: "Lee Mei Ling", age: 62, gender: "Female" },
  },
  {
    id: "mock-6",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Irritability, red eyes, headache on the sides, bitter taste in mouth, anger outbursts.",
    diagnosis_report: {
      summary: "Liver Fire Rising",
      tcmPattern: "肝火上炎证",
      recommendations: [
        "Stress management",
        "Avoid alcohol and spicy foods",
        "Herbal formula: Long Dan Xie Gan Tang",
      ],
      tongueObservation: "Red tongue with yellow coating on sides",
      pulseObservation: "Wiry and rapid pulse",
    },
    profiles: { id: "p6", full_name: "Raj Kumar", age: 41, gender: "Male" },
  },
  {
    id: "mock-7",
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Menstrual irregularities, breast tenderness before period, mood swings, sighing frequently.",
    diagnosis_report: {
      summary: "Liver Qi Stagnation",
      tcmPattern: "肝气郁结证",
      recommendations: ["Regular exercise", "Emotional expression", "Herbal formula: Xiao Yao San"],
      tongueObservation: "Normal color with thin coating",
      pulseObservation: "Wiry pulse especially on left side",
    },
    profiles: { id: "p7", full_name: "Fatimah binti Abdullah", age: 34, gender: "Female" },
  },
  {
    id: "mock-8",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms: "Joint pain worse in cold and damp weather, stiffness in the morning, heavy limbs.",
    diagnosis_report: {
      summary: "Wind-Cold-Damp Bi Syndrome",
      tcmPattern: "风寒湿痹证",
      recommendations: [
        "Keep joints warm",
        "Gentle movement exercises",
        "Herbal formula: Du Huo Ji Sheng Tang",
      ],
      tongueObservation: "Pale tongue with white greasy coating",
      pulseObservation: "Tight and slippery pulse",
    },
    profiles: { id: "p8", full_name: "Lim Ah Kow", age: 68, gender: "Male" },
  },
];

// Common symptom tags for quick filtering
export const SYMPTOM_TAGS = [
  "Headache",
  "Fatigue",
  "Insomnia",
  "Pain",
  "Digestive",
  "Cough",
  "Anxiety",
];
