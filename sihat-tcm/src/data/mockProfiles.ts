
const MOCK_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const MOCK_AUDIO = "data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export const MOCK_PROFILES = [
    {
        id: 'profile1',
        name: 'Elderly Woman (Kidney Disease)',
        description: '72yo female, chronic kidney disease, lower back pain, edema.',
        data: {
            basic_info: {
                name: "Zhang Wei",
                age: "72",
                gender: "female",
                height: "160",
                weight: "55",
                symptoms: "Lower back pain, fatigue, swelling in ankles, frequent urination at night.",
                symptomDuration: "chronic"
            },
            wen_inquiry: {
                summary: "Patient reports chronic lower back pain and fatigue. Experiences edema in lower extremities and nocturia. Tongue diagnosis suggests Kidney Yang deficiency.",
                chatHistory: [
                    { role: 'assistant', content: 'Hello, I see you are experiencing lower back pain. Can you tell me more about it?' },
                    { role: 'user', content: 'It hurts mostly at night and feels cold.' },
                    { role: 'assistant', content: 'Do you have any other symptoms like frequent urination?' },
                    { role: 'user', content: 'Yes, I wake up 3-4 times a night.' }
                ],
                reportFiles: [
                    { name: "Blood_Test_2023.pdf", type: "application/pdf", data: "", extractedText: "Kidney function test shows slightly elevated creatinine." }
                ],
                medicineFiles: [
                    { name: "Blood_Pressure_Meds.jpg", type: "image/jpeg", data: MOCK_IMAGE, extractedText: "Amlodipine 5mg" }
                ],
                files: []
            },
            wang_tongue: {
                observation: "Pale, swollen tongue with tooth marks. White, slippery coating.",
                potential_issues: ["Kidney Yang Deficiency", "Dampness accumulation"],
                image: MOCK_IMAGE
            },
            wang_face: {
                observation: "Pale complexion, dark circles under eyes, puffiness.",
                potential_issues: ["Kidney Deficiency"],
                image: MOCK_IMAGE
            },
            wang_part: {
                observation: "Swelling in ankles (Edema).",
                potential_issues: ["Water retention"],
                image: MOCK_IMAGE
            },
            wen_audio: {
                audio: MOCK_AUDIO,
                analysis: {
                    overall_observation: "Low, weak voice.",
                    voice_quality_analysis: { observation: "Weak", severity: "warning", tcm_indicators: ["Qi Deficiency"] },
                    confidence: "high",
                    status: "success"
                }
            },
            qie: {
                bpm: 62,
                pulseQualities: [
                    { id: 'chen', nameZh: '沉脉', nameEn: 'Deep (Chen)' },
                    { id: 'ruo', nameZh: '弱脉', nameEn: 'Weak (Ruo)' },
                    { id: 'chi', nameZh: '迟脉', nameEn: 'Slow (Chi)' }
                ]
            },
            smart_connect: {
                pulseRate: 62,
                bloodPressure: "140/90",
                bloodOxygen: 96,
                bodyTemp: 36.2,
                hrv: 35,
                stressLevel: "High",
                healthData: {
                    provider: 'Apple Health',
                    steps: 5432,
                    sleepHours: 6.5,
                    heartRate: 62,
                    calories: 1850,
                    lastUpdated: "10:30 AM"
                }
            }
        }
    },
    {
        id: 'profile2',
        name: 'Woman 30+ (Stomach Issues)',
        description: '34yo female, persistent stomachache, bloating, stress.',
        data: {
            basic_info: {
                name: "Li Na",
                age: "34",
                gender: "female",
                height: "165",
                weight: "58",
                symptoms: "Stomach pain, bloating, acid reflux, worse when stressed.",
                symptomDuration: "1-3-months"
            },
            wen_inquiry: {
                summary: "Patient complains of epigastric pain and distension, aggravated by emotional stress. Reports acid regurgitation.",
                chatHistory: [
                    { role: 'assistant', content: 'When does the stomach pain usually occur?' },
                    { role: 'user', content: 'Usually after eating or when I am stressed at work.' }
                ],
                reportFiles: [],
                medicineFiles: [
                    { name: "Gastric_Relief.jpg", type: "image/jpeg", data: MOCK_IMAGE, extractedText: "Omeprazole 20mg" }
                ],
                files: []
            },
            wang_tongue: {
                observation: "Red sides, thin white or yellow coating.",
                potential_issues: ["Liver Qi Stagnation", "Stomach Heat"],
                image: MOCK_IMAGE
            },
            wang_face: {
                observation: "Sallow complexion.",
                potential_issues: ["Spleen Deficiency"],
                image: MOCK_IMAGE
            },
            wang_part: {
                observation: "Abdominal tenderness.",
                potential_issues: ["Qi Stagnation"],
                image: MOCK_IMAGE
            },
            wen_audio: {
                audio: MOCK_AUDIO,
                analysis: {
                    overall_observation: "Normal voice, frequent sighing.",
                    voice_quality_analysis: { observation: "Sighing", severity: "normal", tcm_indicators: ["Liver Qi Stagnation"] },
                    confidence: "high",
                    status: "success"
                }
            },
            qie: {
                bpm: 78,
                pulseQualities: [
                    { id: 'xian', nameZh: '弦脉', nameEn: 'Wiry (Xian)' }
                ]
            },
            smart_connect: {
                pulseRate: 78,
                bloodPressure: "110/70",
                bloodOxygen: 98,
                bodyTemp: 36.6,
                hrv: 65,
                stressLevel: "Moderate",
                healthData: {
                    provider: 'Samsung Health',
                    steps: 8500,
                    sleepHours: 7.2,
                    heartRate: 78,
                    calories: 2100,
                    lastUpdated: "09:15 AM"
                }
            }
        }
    },
    {
        id: 'profile3',
        name: 'Elderly Man (Stroke/Hypertension)',
        description: '68yo male, recent stroke, high blood pressure, dizziness.',
        data: {
            basic_info: {
                name: "Wang Qiang",
                age: "68",
                gender: "male",
                height: "172",
                weight: "75",
                symptoms: "Dizziness, numbness in right arm, difficulty speaking clearly, history of hypertension.",
                symptomDuration: "1-2-weeks"
            },
            wen_inquiry: {
                summary: "Patient recovering from recent stroke. Reports dizziness and hemiparesthesia. History of hypertension.",
                chatHistory: [
                    { role: 'assistant', content: 'How long have you had high blood pressure?' },
                    { role: 'user', content: 'For about 10 years.' }
                ],
                reportFiles: [
                    { name: "Hospital_Discharge.pdf", type: "application/pdf", data: "", extractedText: "Ischemic stroke, hypertension stage 2." }
                ],
                medicineFiles: [
                    { name: "Aspirin.jpg", type: "image/jpeg", data: MOCK_IMAGE, extractedText: "Aspirin 100mg" }
                ],
                files: []
            },
            wang_tongue: {
                observation: "Deviated, purple spots, greasy coating.",
                potential_issues: ["Blood Stasis", "Wind-Phlegm"],
                image: MOCK_IMAGE
            },
            wang_face: {
                observation: "Red face, facial asymmetry.",
                potential_issues: ["Liver Yang Rising", "Wind Stroke"],
                image: MOCK_IMAGE
            },
            wang_part: {
                observation: "Numbness in limbs.",
                potential_issues: ["Meridian blockage"],
                image: MOCK_IMAGE
            },
            wen_audio: {
                audio: MOCK_AUDIO,
                analysis: {
                    overall_observation: "Slurred speech.",
                    voice_quality_analysis: { observation: "Slurred", severity: "high", tcm_indicators: ["Wind-Phlegm blocking orifices"] },
                    confidence: "high",
                    status: "success"
                }
            },
            qie: {
                bpm: 85,
                pulseQualities: [
                    { id: 'xian', nameZh: '弦脉', nameEn: 'Wiry (Xian)' },
                    { id: 'hua', nameZh: '滑脉', nameEn: 'Slippery (Hua)' }
                ]
            },
            smart_connect: {
                pulseRate: 85,
                bloodPressure: "150/95",
                bloodOxygen: 95,
                bodyTemp: 36.8,
                hrv: 40,
                stressLevel: "High",
                healthData: {
                    provider: 'Google Fit',
                    steps: 3200,
                    sleepHours: 5.5,
                    heartRate: 85,
                    calories: 1400,
                    lastUpdated: "11:45 AM"
                }
            }
        }
    }
]
