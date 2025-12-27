const MOCK_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const MOCK_AUDIO =
  "data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export const MOCK_PROFILES = [
  {
    id: "profile1",
    name: "Elderly Woman (Kidney Disease)",
    description: "72yo female, chronic kidney disease, lower back pain, edema.",
    data: {
      basic_info: {
        name: "Zhang Wei",
        age: 72,
        gender: "female",
        height: 160,
        weight: 55,
        symptoms: "Lower back pain, fatigue, swelling in ankles, frequent urination at night.",
        symptomDuration: "chronic",
      },
      wen_inquiry: {
        summary:
          "Patient reports chronic lower back pain and fatigue. Experiences edema in lower extremities and nocturia. Tongue diagnosis suggests Kidney Yang deficiency.",
        chat: [
          {
            id: "1",
            role: "assistant" as const,
            content:
              "Hello, I see you are experiencing lower back pain. Can you tell me more about it?",
          },
          { id: "2", role: "user" as const, content: "It hurts mostly at night and feels cold." },
          {
            id: "3",
            role: "assistant" as const,
            content: "Do you have any other symptoms like frequent urination?",
          },
          { id: "4", role: "user" as const, content: "Yes, I wake up 3-4 times a night." },
        ],
        notes: "",
      },
      wen_chat: [
        {
          id: "1",
          role: "assistant" as const,
          content:
            "Hello, I see you are experiencing lower back pain. Can you tell me more about it?",
        },
        { id: "2", role: "user" as const, content: "It hurts mostly at night and feels cold." },
        {
          id: "3",
          role: "assistant" as const,
          content: "Do you have any other symptoms like frequent urination?",
        },
        { id: "4", role: "user" as const, content: "Yes, I wake up 3-4 times a night." },
      ],
      wang_tongue: {
        observation: "Pale, swollen tongue with tooth marks. White, slippery coating.",
        potential_issues: ["Kidney Yang Deficiency", "Dampness accumulation"],
        image: MOCK_IMAGE,
      },
      wang_face: {
        observation: "Pale complexion, dark circles under eyes, puffiness.",
        potential_issues: ["Kidney Deficiency"],
        image: MOCK_IMAGE,
      },
      wang_part: {
        observation: "Swelling in ankles (Edema).",
        potential_issues: ["Water retention"],
        image: MOCK_IMAGE,
      },
      wen_audio: {
        audio: MOCK_AUDIO,
        observation: "Low, weak voice.",
      },
      qie: {
        bpm: 62,
        quality: "Deep (Chen), Weak (Ruo), Slow (Chi)",
      },
      smart_connect: {
        connected: true,
        device_type: "Apple Watch",
        data: {
          pulseRate: 62,
          bloodPressure: "140/90",
          bloodOxygen: 96,
          bodyTemp: 36.2,
          hrv: 35,
          stressLevel: "High",
          healthData: {
            provider: "Apple Health",
            steps: 5432,
            sleepHours: 6.5,
            heartRate: 62,
            calories: 1850,
            lastUpdated: "10:30 AM",
          },
        },
      },
    },
  },
  {
    id: "profile2",
    name: "Woman 30+ (Stomach Issues)",
    description: "34yo female, persistent stomachache, bloating, stress.",
    data: {
      basic_info: {
        name: "Li Na",
        age: 34,
        gender: "female",
        height: 165,
        weight: 58,
        symptoms: "Stomach pain, bloating, acid reflux, worse when stressed.",
        symptomDuration: "1-3-months",
      },
      wen_inquiry: {
        summary:
          "Patient complains of epigastric pain and distension, aggravated by emotional stress. Reports acid regurgitation.",
        chat: [
          {
            id: "5",
            role: "assistant" as const,
            content: "When does the stomach pain usually occur?",
          },
          {
            id: "6",
            role: "user" as const,
            content: "Usually after eating or when I am stressed at work.",
          },
        ],
        notes: "",
      },
      wen_chat: [
        {
          id: "5",
          role: "assistant" as const,
          content: "When does the stomach pain usually occur?",
        },
        {
          id: "6",
          role: "user" as const,
          content: "Usually after eating or when I am stressed at work.",
        },
      ],
      wang_tongue: {
        observation: "Red sides, thin white or yellow coating.",
        potential_issues: ["Liver Qi Stagnation", "Stomach Heat"],
        image: MOCK_IMAGE,
      },
      wang_face: {
        observation: "Sallow complexion.",
        potential_issues: ["Spleen Deficiency"],
        image: MOCK_IMAGE,
      },
      wang_part: {
        observation: "Abdominal tenderness.",
        potential_issues: ["Qi Stagnation"],
        image: MOCK_IMAGE,
      },
      wen_audio: {
        audio: MOCK_AUDIO,
        observation: "Normal voice, frequent sighing.",
      },
      qie: {
        bpm: 78,
        quality: "Wiry (Xian)",
      },
      smart_connect: {
        connected: true,
        device_type: "Samsung Health",
        data: {
          pulseRate: 78,
          bloodPressure: "110/70",
          bloodOxygen: 98,
          bodyTemp: 36.6,
          hrv: 65,
          stressLevel: "Moderate",
          healthData: {
            provider: "Samsung Health",
            steps: 8500,
            sleepHours: 7.2,
            heartRate: 78,
            calories: 2100,
            lastUpdated: "09:15 AM",
          },
        },
      },
    },
  },
  {
    id: "profile3",
    name: "Elderly Man (Stroke/Hypertension)",
    description: "68yo male, recent stroke, high blood pressure, dizziness.",
    data: {
      basic_info: {
        name: "Wang Qiang",
        age: 68,
        gender: "male",
        height: 172,
        weight: 75,
        symptoms:
          "Dizziness, numbness in right arm, difficulty speaking clearly, history of hypertension.",
        symptomDuration: "1-2-weeks",
      },
      wen_inquiry: {
        summary:
          "Patient recovering from recent stroke. Reports dizziness and hemiparesthesia. History of hypertension.",
        chat: [
          {
            id: "7",
            role: "assistant" as const,
            content: "How long have you had high blood pressure?",
          },
          { id: "8", role: "user" as const, content: "For about 10 years." },
        ],
        notes: "",
      },
      wen_chat: [
        {
          id: "7",
          role: "assistant" as const,
          content: "How long have you had high blood pressure?",
        },
        { id: "8", role: "user" as const, content: "For about 10 years." },
      ],
      wang_tongue: {
        observation: "Deviated, purple spots, greasy coating.",
        potential_issues: ["Blood Stasis", "Wind-Phlegm"],
        image: MOCK_IMAGE,
      },
      wang_face: {
        observation: "Red face, facial asymmetry.",
        potential_issues: ["Liver Yang Rising", "Wind Stroke"],
        image: MOCK_IMAGE,
      },
      wang_part: {
        observation: "Numbness in limbs.",
        potential_issues: ["Meridian blockage"],
        image: MOCK_IMAGE,
      },
      wen_audio: {
        audio: MOCK_AUDIO,
        observation: "Slurred speech.",
      },
      qie: {
        bpm: 85,
        quality: "Wiry (Xian), Slippery (Hua)",
      },
      smart_connect: {
        connected: true,
        device_type: "Google Fit",
        data: {
          pulseRate: 85,
          bloodPressure: "150/95",
          bloodOxygen: 95,
          bodyTemp: 36.8,
          hrv: 40,
          stressLevel: "High",
          healthData: {
            provider: "Google Fit",
            steps: 3200,
            sleepHours: 5.5,
            heartRate: 85,
            calories: 1400,
            lastUpdated: "11:45 AM",
          },
        },
      },
    },
  },
];
