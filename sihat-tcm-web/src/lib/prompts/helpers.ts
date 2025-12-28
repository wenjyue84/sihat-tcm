/**
 * Prompt Helper Functions
 *
 * Utility functions for working with system prompts.
 *
 * @module prompts/helpers
 */

/**
 * Get a summary of each prompt for display purposes
 */
export function getPromptSummaries() {
    return {
        chat: {
            title: "问诊 Interactive Chat Prompt",
            description:
                "Guides patient inquiry using Ten Questions (十问歌) methodology",
            keyPoints: [
                "One question at a time - absolutely mandatory",
                "Automatic language matching (Chinese/English/Malay)",
                "Ten Questions (十问歌) framework for systematic inquiry",
                "Safety protocols for emergency symptoms",
                "Clear conversation ending guidance",
            ],
            usedIn: "/api/chat - Step 2 Patient Inquiry",
        },
        image: {
            title: "望诊 Image Analysis Prompt",
            description:
                "Analyzes tongue, face, and body images for diagnostic indicators",
            keyPoints: [
                "Comprehensive tongue diagnosis (舌诊) with all parameters",
                "Face diagnosis (面诊) with five-organ zone mapping",
                "Body area analysis for skin and visible conditions",
                "Structured JSON output with pattern suggestions",
                "Both Chinese and English terminology",
            ],
            usedIn: "/api/analyze-image - Visual Inspection",
        },
        listening: {
            title: "闻诊 Listening Analysis Prompt",
            description:
                "Analyzes voice, breathing, and other sounds for diagnostic indicators",
            keyPoints: [
                "Voice quality analysis (声诊) - strength, pitch, clarity",
                "Breathing pattern assessment (呼吸诊) - rhythm, depth, abnormalities",
                "Cough sound diagnosis (咳嗽诊) - type, quality, timing",
                "Speech pattern evaluation - emotional state, fluency",
                "Structured JSON output with pattern suggestions",
            ],
            usedIn: "/api/analyze-audio - Listening Diagnosis",
        },
        inquiry_summary: {
            title: "问诊总结 Inquiry Summary Prompt",
            description:
                "Summarizes the patient inquiry conversation into a structured clinical summary",
            keyPoints: [
                "Comprehensive symptom extraction with duration and severity",
                "Ten Questions (十问) summary format",
                "Medical history and medication extraction",
                "Automatic language matching (Chinese/English/Malay)",
                "Clinical and professional formatting",
            ],
            usedIn: "/api/summarize-inquiry - Inquiry Summary",
        },
        final: {
            title: "综合诊断 Final Analysis Prompt",
            description:
                "Synthesizes all Four Examinations data for comprehensive TCM diagnosis",
            keyPoints: [
                "Four Examinations combined analysis (四诊合参)",
                "Eight Principles differentiation (八纲辨证)",
                "Organ pattern differentiation (脏腑辨证)",
                "Nine Constitution types assessment (九种体质)",
                "Personalized food therapy and lifestyle recommendations",
                "Acupoint self-care guidance",
            ],
            usedIn: "/api/consult - Final Diagnosis",
        },
        western_doctor: {
            title: "西医第二意见 Western Doctor Second Opinion",
            description:
                "Provides complementary Western medicine perspective after TCM diagnosis",
            keyPoints: [
                "Complementary second opinion without contradicting TCM",
                "Red flag identification for emergency symptoms",
                "Recommended diagnostic tests",
                "Integrative care perspective",
            ],
            usedIn: "/api/western-opinion - Second Opinion Chat",
        },
        heart_companion: {
            title: "心伴 Heart Companion",
            description:
                "Emotional wellness support through TCM perspective on mental health",
            keyPoints: [
                "Warm, empathetic AI companion",
                "Five Emotions and organ connections (五志)",
                "Heart-Shen connection for emotional wellbeing",
                "Gentle mindfulness and lifestyle suggestions",
                "Safety protocols for crisis situations",
            ],
            usedIn: "/api/heart-companion - Emotional Support Chat",
        },
        meal_planner: {
            title: "食疗 Meal Planner",
            description:
                "Personalized 7-day TCM meal planning based on constitution",
            keyPoints: [
                "Five Flavors balance across meals",
                "Constitution-appropriate food selection",
                "Thermal nature consideration",
                "Complete shopping lists",
            ],
            usedIn: "/api/meal-planner - Dietary Therapy",
        },
    };
}
